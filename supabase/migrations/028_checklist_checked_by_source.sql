-- ============================================================================
-- Migration: Add checked_by_source to deal_checklist_items
-- Description: Stores metadata about who/what checked a checklist item.
--              Enables auto-check indicators in the UI showing which automator
--              checked an item vs manual user checks.
-- ============================================================================

-- Add checked_by_source JSONB column
-- Values:
--   NULL = legacy/unknown (treat as manual)
--   { "source": "manual", "user_id": "..." }
--   { "source": "automator", "automator_name": "...", "instance_id": "...", "step_node_id": "..." }
ALTER TABLE deal_checklist_items
    ADD COLUMN IF NOT EXISTS checked_by_source JSONB DEFAULT NULL;

-- ============================================================================
-- Update execute_automator_step to write checked_by_source when checking items
-- ============================================================================

CREATE OR REPLACE FUNCTION execute_automator_step(
    p_instance_id UUID,
    p_node_id TEXT,
    p_response JSONB DEFAULT NULL,
    p_branch_taken TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_instance RECORD;
    v_node JSONB;
    v_node_type TEXT;
    v_node_data JSONB;
    v_step_id UUID;
    v_actions_executed JSONB := '[]'::jsonb;
    v_action JSONB;
    v_action_type TEXT;
    v_action_params JSONB;
    v_action_result JSONB;
    v_resolved_value TEXT;
    v_next_edge JSONB;
    v_next_node_id TEXT;
    v_next_node JSONB;
    v_child_instances JSONB := '[]'::jsonb;
    v_global_actions JSONB;
    v_branch_actions JSONB;
    v_all_actions JSONB := '[]'::jsonb;
    v_target_table TEXT;
    v_target_field TEXT;
    v_child_automator RECORD;
    v_child_instance_id UUID;
    v_child_definition JSONB;
    v_child_start_node JSONB;
    v_child_start_node_id TEXT;
    v_child_first_edge JSONB;
    v_child_first_node_id TEXT;
    v_automator_name TEXT;
BEGIN
    -- ========================================================================
    -- 1. VALIDATE
    -- ========================================================================

    -- Fetch the instance
    SELECT * INTO v_instance
    FROM automator_instances
    WHERE id = p_instance_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Instance not found';
    END IF;

    IF v_instance.status != 'running' THEN
        RAISE EXCEPTION 'Instance is not running (status: %)', v_instance.status;
    END IF;

    IF v_instance.current_node_id != p_node_id THEN
        RAISE EXCEPTION 'Node ID does not match current node (expected: %, got: %)',
            v_instance.current_node_id, p_node_id;
    END IF;

    -- Validate team membership
    IF NOT is_team_member(v_instance.team_id, p_user_id) THEN
        RAISE EXCEPTION 'User is not a member of this team';
    END IF;

    -- ========================================================================
    -- 2. GET NODE DEFINITION
    -- ========================================================================

    SELECT node INTO v_node
    FROM jsonb_array_elements(v_instance.definition_snapshot->'nodes') AS node
    WHERE node->>'id' = p_node_id
    LIMIT 1;

    IF v_node IS NULL THEN
        RAISE EXCEPTION 'Node not found in definition snapshot';
    END IF;

    v_node_data := v_node->'data';
    v_node_type := v_node_data->>'type';

    -- ========================================================================
    -- 3. RECORD THE STEP
    -- ========================================================================

    INSERT INTO automator_instance_steps (
        instance_id, node_id, node_type, branch_taken,
        user_response, completed_by
    ) VALUES (
        p_instance_id, p_node_id, v_node_type, p_branch_taken,
        p_response, p_user_id
    )
    RETURNING id INTO v_step_id;

    -- ========================================================================
    -- 4. COLLECT ACTIONS TO EXECUTE
    -- ========================================================================

    -- Global actions (on all node types)
    v_global_actions := COALESCE(v_node_data->'actions', '[]'::jsonb);

    -- Branch-specific actions (decision nodes only)
    IF v_node_type = 'decision' AND p_branch_taken IS NOT NULL THEN
        v_branch_actions := COALESCE(
            v_node_data->'branch_actions'->p_branch_taken,
            '[]'::jsonb
        );
    ELSE
        v_branch_actions := '[]'::jsonb;
    END IF;

    -- Combine global + branch actions
    v_all_actions := v_global_actions || v_branch_actions;

    -- ========================================================================
    -- 5. EXECUTE BACKEND ACTIONS
    -- ========================================================================

    FOR v_action IN SELECT * FROM jsonb_array_elements(v_all_actions)
    LOOP
        v_action_type := v_action->>'action_type';
        v_action_params := v_action->'params';
        v_action_result := jsonb_build_object('action_type', v_action_type, 'success', true);

        BEGIN
            CASE v_action_type

            WHEN 'set_deal_field' THEN
                v_target_table := v_action_params->>'target_table';
                v_target_field := v_action_params->>'target_field';
                v_resolved_value := resolve_value_source(
                    v_action_params->'value', p_response
                );

                IF v_target_table = 'deals' THEN
                    EXECUTE format(
                        'UPDATE deals SET %I = $1 WHERE id = $2',
                        v_target_field
                    ) USING v_resolved_value, v_instance.deal_id;
                ELSIF v_target_table IN ('deal_contract_facts', 'deal_property_facts', 'deal_facts', 'deal_disposition') THEN
                    EXECUTE format(
                        'INSERT INTO %I (deal_id, %I) VALUES ($1, $2) ON CONFLICT (deal_id) DO UPDATE SET %I = $2',
                        v_target_table, v_target_field, v_target_field
                    ) USING v_instance.deal_id, v_resolved_value;
                END IF;

            WHEN 'set_date_field' THEN
                v_target_table := v_action_params->>'target_table';
                v_target_field := v_action_params->>'target_field';
                v_resolved_value := resolve_value_source(
                    v_action_params->'value', p_response
                );

                IF v_target_table = 'deals' THEN
                    EXECUTE format(
                        'UPDATE deals SET %I = $1::date WHERE id = $2',
                        v_target_field
                    ) USING v_resolved_value, v_instance.deal_id;
                ELSIF v_target_table IN ('deal_contract_facts', 'deal_property_facts', 'deal_facts', 'deal_disposition') THEN
                    EXECUTE format(
                        'INSERT INTO %I (deal_id, %I) VALUES ($1, $2::date) ON CONFLICT (deal_id) DO UPDATE SET %I = $2::date',
                        v_target_table, v_target_field, v_target_field
                    ) USING v_instance.deal_id, v_resolved_value;
                END IF;

            WHEN 'check_checklist_item' THEN
                -- Look up automator name for checked_by_source metadata
                SELECT name INTO v_automator_name
                FROM automators
                WHERE id = v_instance.automator_id;

                INSERT INTO deal_checklist_items (
                    deal_id, item_key, label, is_checked, date_completed,
                    process_instance_id, checked_by_source
                ) VALUES (
                    v_instance.deal_id,
                    v_action_params->>'checklist_item_key',
                    v_action_params->>'checklist_item_key',
                    true,
                    NOW(),
                    p_instance_id,
                    jsonb_build_object(
                        'source', 'automator',
                        'automator_name', COALESCE(v_automator_name, 'Automator'),
                        'instance_id', p_instance_id,
                        'step_node_id', p_node_id
                    )
                )
                ON CONFLICT (deal_id, item_key) DO UPDATE SET
                    is_checked = true,
                    date_completed = NOW(),
                    process_instance_id = p_instance_id,
                    checked_by_source = jsonb_build_object(
                        'source', 'automator',
                        'automator_name', COALESCE(v_automator_name, 'Automator'),
                        'instance_id', p_instance_id,
                        'step_node_id', p_node_id
                    );

            WHEN 'add_expense' THEN
                INSERT INTO deal_expenses (
                    deal_id, category, amount, description, created_by
                ) VALUES (
                    v_instance.deal_id,
                    COALESCE(resolve_value_source(v_action_params->'category', p_response), 'other'),
                    COALESCE(resolve_value_source(v_action_params->'amount', p_response), '0')::decimal,
                    resolve_value_source(v_action_params->'description', p_response),
                    p_user_id
                );

            WHEN 'add_vendor' THEN
                INSERT INTO deal_vendors (
                    deal_id, contact_id, role
                ) VALUES (
                    v_instance.deal_id,
                    resolve_value_source(v_action_params->'contact_id_source', p_response)::uuid,
                    v_action_params->>'role'
                )
                ON CONFLICT DO NOTHING;

            WHEN 'add_employee' THEN
                INSERT INTO deal_employees (
                    deal_id, user_id, role
                ) VALUES (
                    v_instance.deal_id,
                    resolve_value_source(v_action_params->'user_id_source', p_response)::uuid,
                    v_action_params->>'role'
                )
                ON CONFLICT (deal_id, user_id) DO NOTHING;

            WHEN 'create_showing' THEN
                INSERT INTO deal_showings (
                    deal_id, showing_datetime, buyer_contact_id, created_by
                ) VALUES (
                    v_instance.deal_id,
                    (resolve_value_source(v_action_params->'date_source', p_response)
                     || ' ' ||
                     COALESCE(resolve_value_source(v_action_params->'time_source', p_response), '12:00'))::timestamptz,
                    resolve_value_source(v_action_params->'buyer_contact_id_source', p_response)::uuid,
                    p_user_id
                );

            WHEN 'update_deal_status' THEN
                UPDATE deals
                SET status = (v_action_params->>'status')::deal_status
                WHERE id = v_instance.deal_id;

            WHEN 'trigger_automator' THEN
                -- Fetch the target automator
                SELECT id, definition, status INTO v_child_automator
                FROM automators
                WHERE id = (v_action_params->>'automator_id')::uuid
                  AND team_id = v_instance.team_id;

                IF NOT FOUND OR v_child_automator.status != 'published' THEN
                    v_action_result := jsonb_build_object(
                        'action_type', v_action_type,
                        'success', false,
                        'error', 'Target automator not found or not published'
                    );
                ELSE
                    v_child_definition := v_child_automator.definition;

                    -- Find child start node
                    SELECT node INTO v_child_start_node
                    FROM jsonb_array_elements(v_child_definition->'nodes') AS node
                    WHERE node->'data'->>'type' = 'start'
                    LIMIT 1;

                    v_child_start_node_id := v_child_start_node->>'id';

                    -- Find first node after start
                    SELECT edge INTO v_child_first_edge
                    FROM jsonb_array_elements(v_child_definition->'edges') AS edge
                    WHERE edge->>'source' = v_child_start_node_id
                    LIMIT 1;

                    v_child_first_node_id := v_child_first_edge->>'target';

                    -- Create child instance
                    INSERT INTO automator_instances (
                        team_id, deal_id, automator_id, definition_snapshot,
                        status, current_node_id, parent_instance_id, parent_step_node_id,
                        started_by
                    ) VALUES (
                        v_instance.team_id, v_instance.deal_id,
                        v_child_automator.id, v_child_definition,
                        'running', v_child_first_node_id,
                        p_instance_id, p_node_id,
                        p_user_id
                    )
                    RETURNING id INTO v_child_instance_id;

                    -- Auto-complete child's start node
                    INSERT INTO automator_instance_steps (
                        instance_id, node_id, node_type, completed_by
                    ) VALUES (
                        v_child_instance_id, v_child_start_node_id, 'start', p_user_id
                    );

                    v_child_instances := v_child_instances || jsonb_build_array(
                        (SELECT row_to_json(ai.*)::jsonb FROM automator_instances ai WHERE ai.id = v_child_instance_id)
                    );

                    v_action_result := v_action_result || jsonb_build_object(
                        'details', jsonb_build_object('child_instance_id', v_child_instance_id)
                    );
                END IF;

            ELSE
                v_action_result := jsonb_build_object(
                    'action_type', v_action_type,
                    'success', false,
                    'error', format('Unknown action type: %s', v_action_type)
                );

            END CASE;

        EXCEPTION WHEN OTHERS THEN
            -- Log action failure but don't crash the step
            v_action_result := jsonb_build_object(
                'action_type', v_action_type,
                'success', false,
                'error', SQLERRM
            );
        END;

        v_actions_executed := v_actions_executed || jsonb_build_array(v_action_result);
    END LOOP;

    -- ========================================================================
    -- 6. UPDATE STEP RECORD WITH ACTION RESULTS
    -- ========================================================================

    UPDATE automator_instance_steps
    SET actions_executed = v_actions_executed
    WHERE id = v_step_id;

    -- ========================================================================
    -- 7. RESOLVE NEXT NODE
    -- ========================================================================

    IF v_node_type = 'decision' AND p_branch_taken IS NOT NULL THEN
        -- For decision nodes, match edge by sourceHandle or label
        SELECT edge INTO v_next_edge
        FROM jsonb_array_elements(v_instance.definition_snapshot->'edges') AS edge
        WHERE edge->>'source' = p_node_id
          AND (
              edge->>'sourceHandle' = p_branch_taken
              OR lower(edge->>'sourceHandle') = lower(p_branch_taken)
              OR edge->>'label' = p_branch_taken
              OR lower(edge->>'label') = lower(p_branch_taken)
          )
        LIMIT 1;
    ELSE
        -- For other node types, follow the default outgoing edge
        SELECT edge INTO v_next_edge
        FROM jsonb_array_elements(v_instance.definition_snapshot->'edges') AS edge
        WHERE edge->>'source' = p_node_id
        LIMIT 1;
    END IF;

    IF v_next_edge IS NOT NULL THEN
        v_next_node_id := v_next_edge->>'target';

        -- Fetch next node definition
        SELECT node INTO v_next_node
        FROM jsonb_array_elements(v_instance.definition_snapshot->'nodes') AS node
        WHERE node->>'id' = v_next_node_id
        LIMIT 1;

        -- Check if next node is an end node
        IF v_next_node IS NOT NULL AND v_next_node->'data'->>'type' = 'end' THEN
            -- Auto-complete the end node
            INSERT INTO automator_instance_steps (
                instance_id, node_id, node_type, completed_by
            ) VALUES (
                p_instance_id, v_next_node_id, 'end', p_user_id
            );

            -- Mark instance as completed
            UPDATE automator_instances
            SET status = 'completed',
                current_node_id = NULL,
                completed_at = NOW()
            WHERE id = p_instance_id;

            v_next_node := NULL; -- No next interactive node
        ELSE
            -- Advance to next node
            UPDATE automator_instances
            SET current_node_id = v_next_node_id
            WHERE id = p_instance_id;
        END IF;
    ELSE
        -- Dead end — no outgoing edge, mark as completed
        UPDATE automator_instances
        SET status = 'completed',
            current_node_id = NULL,
            completed_at = NOW()
        WHERE id = p_instance_id;

        v_next_node := NULL;
    END IF;

    -- ========================================================================
    -- 8. LOG ACTIVITY
    -- ========================================================================

    INSERT INTO activity_logs (
        team_id, user_id, deal_id, entity_type, activity_type, content, metadata
    ) VALUES (
        v_instance.team_id, p_user_id, v_instance.deal_id,
        'deal', 'status_change',
        format('Completed automator step: %s', COALESCE(v_node_data->>'label', v_node_type)),
        jsonb_build_object(
            'instance_id', p_instance_id,
            'node_id', p_node_id,
            'node_type', v_node_type,
            'branch_taken', p_branch_taken,
            'actions_executed', v_actions_executed,
            'action', 'automator_step_completed'
        )
    );

    -- ========================================================================
    -- 9. RETURN RESULT
    -- ========================================================================

    RETURN jsonb_build_object(
        'instance', (
            SELECT row_to_json(ai.*)::jsonb
            FROM automator_instances ai
            WHERE ai.id = p_instance_id
        ),
        'next_node', v_next_node,
        'actions_executed', v_actions_executed,
        'child_instances', v_child_instances
    );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION execute_automator_step(UUID, TEXT, JSONB, TEXT, UUID) TO authenticated;

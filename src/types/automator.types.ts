// ============================================================================
// Automator Types - Visual Workflow Builder & Execution Engine
// ============================================================================

// ============================================================================
// Position & Viewport (React Flow compatible)
// ============================================================================

export interface Position {
  x: number
  y: number
}

export interface Viewport {
  x: number
  y: number
  zoom: number
}

// ============================================================================
// Action System Types
// ============================================================================

/** All supported backend action types that fire when a step completes */
export type ActionType =
  | 'set_deal_field'
  | 'set_date_field'
  | 'check_checklist_item'
  | 'add_expense'
  | 'add_vendor'
  | 'add_employee'
  | 'create_showing'
  | 'update_deal_status'
  | 'trigger_automator'
  | 'send_message'

/** Where an action gets its value at execution time */
export type ValueSource =
  | { source: 'field'; field_id: string }
  | { source: 'static'; value: string | number | boolean }
  | { source: 'today' }

/** Params for set_deal_field: update a field on the deal or related table */
export interface SetDealFieldParams {
  target_table: string
  target_field: string
  value: ValueSource
}

/** Params for set_date_field: update a date field on the deal */
export interface SetDateFieldParams {
  target_table: string
  target_field: string
  value: ValueSource
}

/** Params for check_checklist_item: mark a checklist item as completed */
export interface CheckChecklistItemParams {
  checklist_item_key: string
}

/** Params for add_expense: add an expense record to the deal */
export interface AddExpenseParams {
  category: ValueSource
  amount: ValueSource
  description: ValueSource
}

/** Params for add_vendor: link a vendor contact to the deal */
export interface AddVendorParams {
  contact_id_source: ValueSource
  role?: string
}

/** Params for add_employee: link an employee to the deal */
export interface AddEmployeeParams {
  user_id_source: ValueSource
  role?: string
}

/** Params for create_showing: schedule a property showing */
export interface CreateShowingParams {
  date_source: ValueSource
  time_source: ValueSource
  buyer_contact_id_source: ValueSource
}

/** Params for update_deal_status: change the deal's pipeline status */
export interface UpdateDealStatusParams {
  status: string
}

/** Params for trigger_automator: start a child automator on the same deal */
export interface TriggerAutomatorParams {
  automator_id: string
}

/** Target for send_message action */
export type SendMessageTarget = 'deal_chat' | 'channel' | 'new_group'

/** Params for send_message: send a message to a conversation */
export interface SendMessageActionParams {
  target: SendMessageTarget
  channel_id?: string
  participant_ids?: string[]
  include_deal_employees?: boolean
  include_deal_owner?: boolean
  message_content: ValueSource
  include_deal_link: boolean
}

/** Union of all action param types */
export type ActionParams =
  | SetDealFieldParams
  | SetDateFieldParams
  | CheckChecklistItemParams
  | AddExpenseParams
  | AddVendorParams
  | AddEmployeeParams
  | CreateShowingParams
  | UpdateDealStatusParams
  | TriggerAutomatorParams
  | SendMessageActionParams

/** A configured backend action on an automator node */
export interface AutomatorAction {
  action_type: ActionType
  params: ActionParams
}

/** Log entry for a single action execution result */
export interface ActionExecutionLog {
  action_type: ActionType
  success: boolean
  error?: string
  details?: Record<string, unknown>
}

// ============================================================================
// Data Collection Field Definition
// ============================================================================

/** Supported field types for data collection nodes */
export type DataCollectionFieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'textarea'
  | 'contact'
  | 'currency'
  | 'dropdown'

/** A single field definition within a data collection node */
export interface DataCollectionField {
  field_id: string
  label: string
  fieldType: DataCollectionFieldType
  required: boolean
  placeholder?: string
  options?: Array<{ label: string; value: string }>
  min?: number
  max?: number
  validationMessage?: string
}

// ============================================================================
// Node Types
// ============================================================================

export type AutomatorNodeType = 'start' | 'end' | 'decision' | 'dataCollection' | 'wait' | 'messageConfirmation'

/** Base node data shared by all node types */
export interface BaseNodeData {
  label: string
  description?: string
  /** Backend actions that fire when this step completes (all non-start nodes) */
  actions?: AutomatorAction[]
}

// Start Node - Entry point of the workflow
export interface StartNodeData extends BaseNodeData {
  type: 'start'
}

// End Node - Exit point(s) of the workflow
export interface EndNodeData extends BaseNodeData {
  type: 'end'
  outcome: 'success' | 'failure' | 'cancelled'
}

// Decision Option - a single branch choice on a decision node
export interface DecisionOption {
  id: string   // stable identifier (e.g., "option_0"), used as sourceHandle
  label: string // display label (e.g., "Yes", "No", "Maybe")
}

// Decision Node - customizable branching (2-6 options, defaults to Yes/No)
export interface DecisionNodeData extends BaseNodeData {
  type: 'decision'
  question: string
  storeAs?: string // Optional field name to store the answer
  /** Customizable branch options. Undefined = legacy Yes/No fallback. */
  options?: DecisionOption[]
  /** Actions keyed by branch label (e.g., { "Yes": [...], "No": [...] }) */
  branch_actions?: Record<string, AutomatorAction[]>
}

// Data Collection Node - Collect user input
export interface DataCollectionNodeData extends BaseNodeData {
  type: 'dataCollection'
  fieldType: DataCollectionFieldType
  fieldName: string // Key to store the value
  /** Optional unique ID for referencing this field in ValueSource actions */
  field_id?: string
  placeholder?: string
  required: boolean
  // For select/multiselect
  options?: Array<{ label: string; value: string }>
  // For number
  min?: number
  max?: number
  // Validation message
  validationMessage?: string
  /** Multi-field form definition for collecting multiple values in one step */
  fields?: DataCollectionField[]
}

// Wait Node - Time delay before showing next task
export interface WaitDuration {
  days: number
  hours: number
}

export interface WaitNodeData extends BaseNodeData {
  type: 'wait'
  showAfter: WaitDuration  // time until task appears
  dueIn: WaitDuration      // time after showing until due
}

/** Format a WaitDuration to a human-readable string like "2d 4h" */
export function formatDuration(d: WaitDuration): string {
  const parts: string[] = []
  if (d.days > 0) parts.push(`${d.days}d`)
  if (d.hours > 0) parts.push(`${d.hours}h`)
  return parts.length > 0 ? parts.join(' ') : '0h'
}

// Message Confirmation Node - Pause workflow and wait for chat-based confirmation
export type MessageConfirmationAssignee = 'specific_user' | 'deal_owner' | 'any_participant'
export type MessageConfirmationTimeoutAction = 'remind' | 'default_branch'

export interface MessageConfirmationNodeData extends BaseNodeData {
  type: 'messageConfirmation'
  prompt_message: ValueSource
  assignee: MessageConfirmationAssignee
  assignee_user_id?: string
  confirmation_method: 'button'
  timeout_hours?: number
  timeout_action?: MessageConfirmationTimeoutAction
  reminder_message?: string
}

// Union type for all node data
export type AutomatorNodeData =
  | StartNodeData
  | EndNodeData
  | DecisionNodeData
  | DataCollectionNodeData
  | WaitNodeData
  | MessageConfirmationNodeData

// React Flow Node with our data
export interface AutomatorNode {
  id: string
  type: AutomatorNodeType
  position: Position
  data: AutomatorNodeData
  // React Flow properties
  selected?: boolean
  dragging?: boolean
}

// ============================================================================
// Edge Types
// ============================================================================

export interface AutomatorEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string // 'yes' | 'no' for decision nodes, 'default' for others
  targetHandle?: string
  label?: string // 'Yes' | 'No' for decision edges
  type?: 'default' | 'smoothstep' | 'step'
  animated?: boolean
}

// ============================================================================
// Automator Definition (stored in database)
// ============================================================================

export interface AutomatorDefinition {
  nodes: AutomatorNode[]
  edges: AutomatorEdge[]
  viewport: Viewport
}

// Default empty definition
export const DEFAULT_AUTOMATOR_DEFINITION: AutomatorDefinition = {
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
}

// ============================================================================
// Database Types
// ============================================================================

export type AutomatorStatus = 'draft' | 'published' | 'archived'

export interface Automator {
  id: string
  team_id: string
  name: string
  description: string | null
  definition: AutomatorDefinition
  status: AutomatorStatus
  version: number
  created_by: string
  updated_by: string | null
  created_at: string
  updated_at: string
  published_at: string | null
  /** IDs of automators that trigger this one as a child */
  parent_automator_ids?: string[]
}

export interface AutomatorWithCreator extends Automator {
  creator?: {
    id: string
    full_name: string | null
    email: string
  }
}

// ============================================================================
// Automator Instance Types (Execution)
// ============================================================================

/** Status of a running automator instance */
export type AutomatorInstanceStatus = 'running' | 'completed' | 'canceled'

/** A specific execution of an automator on a deal */
export interface AutomatorInstance {
  id: string
  team_id: string
  deal_id: string
  automator_id: string
  /** Frozen copy of the automator definition at start time */
  definition_snapshot: AutomatorDefinition
  status: AutomatorInstanceStatus
  /** Node ID the user is currently on (null when completed/canceled) */
  current_node_id: string | null
  /** Parent instance if this was spawned by a trigger_automator action */
  parent_instance_id: string | null
  /** Node in the parent that triggered this child instance */
  parent_step_node_id: string | null
  /** When a wait node is active: timestamp when the task becomes visible */
  wait_show_at: string | null
  /** When a wait node is active: timestamp when the task is due */
  wait_due_at: string | null
  started_by: string
  completed_at: string | null
  canceled_at: string | null
  created_at: string
  updated_at: string
}

/** Immutable record of a completed step in an automator instance */
export interface AutomatorInstanceStep {
  id: string
  instance_id: string
  node_id: string
  node_type: AutomatorNodeType
  /** For decision nodes: which branch label was chosen */
  branch_taken: string | null
  /** User input data from data collection forms */
  user_response: Record<string, unknown> | null
  /** Log of backend actions fired and their results */
  actions_executed: ActionExecutionLog[] | null
  completed_by: string
  completed_at: string
  created_at: string
}

/** Instance with joined automator name for display */
export interface AutomatorInstanceWithDetails extends AutomatorInstance {
  automator_name?: string
  automator_description?: string | null
}

// ============================================================================
// DTOs - Automator Definition
// ============================================================================

export interface CreateAutomatorDTO {
  team_id: string
  name: string
  description?: string
  definition?: AutomatorDefinition
}

export interface UpdateAutomatorDTO {
  name?: string
  description?: string
  definition?: AutomatorDefinition
  status?: AutomatorStatus
}

// ============================================================================
// DTOs - Automator Instance Execution
// ============================================================================

/** DTO to start a new automator instance on a deal */
export interface CreateInstanceDTO {
  team_id: string
  deal_id: string
  automator_id: string
  started_by: string
}

/** DTO to execute (advance) a step in a running instance */
export interface ExecuteStepDTO {
  instance_id: string
  node_id: string
  /** User input data from data collection forms */
  response?: Record<string, unknown>
  /** Branch label chosen for decision nodes */
  branch_taken?: string
}

/** Result returned from executing a step */
export interface ExecuteStepResult {
  /** Updated instance after step execution */
  instance: AutomatorInstance
  /** Next node definition the user needs to interact with (null if instance completed) */
  next_node?: AutomatorNode | null
  /** Log of backend actions that were executed */
  actions_executed: ActionExecutionLog[]
  /** Any child instances that were created by trigger_automator actions */
  child_instances?: AutomatorInstance[]
}

/** Progress info for an automator instance */
export interface InstanceProgress {
  completed: number
  total: number
  percentage: number
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationError {
  nodeId?: string
  edgeId?: string
  type: 'error' | 'warning'
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
}

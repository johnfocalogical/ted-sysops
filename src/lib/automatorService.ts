import { supabase } from './supabase'
import type {
  Automator,
  AutomatorWithCreator,
  CreateAutomatorDTO,
  UpdateAutomatorDTO,
  AutomatorDefinition,
} from '@/types/automator.types'

/**
 * Get all automators for a team with creator info
 */
export async function getTeamAutomators(teamId: string): Promise<AutomatorWithCreator[]> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('automators')
    .select(`
      *,
      creator:users!created_by(id, full_name, email)
    `)
    .eq('team_id', teamId)
    .neq('status', 'archived')
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Get a single automator by ID
 */
export async function getAutomator(id: string): Promise<Automator | null> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('automators')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }
  return data
}

/**
 * Create a new automator
 */
export async function createAutomator(dto: CreateAutomatorDTO, userId: string): Promise<Automator> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('automators')
    .insert({
      team_id: dto.team_id,
      name: dto.name,
      description: dto.description || null,
      definition: dto.definition || { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } },
      status: 'draft',
      version: 1,
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update an automator
 */
export async function updateAutomator(
  id: string,
  dto: UpdateAutomatorDTO,
  userId: string
): Promise<Automator> {
  if (!supabase) throw new Error('Supabase not configured')

  const updates: Record<string, unknown> = {
    updated_by: userId,
  }

  if (dto.name !== undefined) updates.name = dto.name
  if (dto.description !== undefined) updates.description = dto.description
  if (dto.definition !== undefined) updates.definition = dto.definition
  if (dto.status !== undefined) {
    updates.status = dto.status
    // Set published_at when publishing
    if (dto.status === 'published') {
      updates.published_at = new Date().toISOString()
    }
  }

  const { data, error } = await supabase
    .from('automators')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Save automator definition (convenience method for the builder)
 */
export async function saveAutomatorDefinition(
  id: string,
  definition: AutomatorDefinition,
  userId: string
): Promise<Automator> {
  return updateAutomator(id, { definition }, userId)
}

/**
 * Delete an automator
 */
export async function deleteAutomator(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const { error } = await supabase
    .from('automators')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * Archive an automator (soft delete)
 */
export async function archiveAutomator(id: string, userId: string): Promise<Automator> {
  return updateAutomator(id, { status: 'archived' }, userId)
}

/**
 * Publish an automator
 */
export async function publishAutomator(id: string, userId: string): Promise<Automator> {
  if (!supabase) throw new Error('Supabase not configured')

  // Get current automator to increment version
  const current = await getAutomator(id)
  if (!current) throw new Error('Automator not found')

  const { data, error } = await supabase
    .from('automators')
    .update({
      status: 'published',
      version: current.version + 1,
      published_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Unpublish an automator (set back to draft)
 */
export async function unpublishAutomator(id: string, userId: string): Promise<Automator> {
  return updateAutomator(id, { status: 'draft' }, userId)
}

/**
 * Duplicate an automator
 */
export async function duplicateAutomator(
  id: string,
  newName: string,
  userId: string
): Promise<Automator> {
  if (!supabase) throw new Error('Supabase not configured')

  const original = await getAutomator(id)
  if (!original) throw new Error('Automator not found')

  return createAutomator(
    {
      team_id: original.team_id,
      name: newName,
      description: original.description || undefined,
      definition: original.definition,
    },
    userId
  )
}

/**
 * Check if automator name is unique within a team
 */
export async function isAutomatorNameUnique(
  teamId: string,
  name: string,
  excludeId?: string
): Promise<boolean> {
  if (!supabase) throw new Error('Supabase not configured')

  let query = supabase
    .from('automators')
    .select('id', { count: 'exact', head: true })
    .eq('team_id', teamId)
    .ilike('name', name)
    .neq('status', 'archived')

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { count, error } = await query

  if (error) throw error
  return count === 0
}

// ============================================================================
// Parent-Child Reference Management
// ============================================================================

/**
 * Add a parent reference to a child automator's parent_automator_ids array.
 */
export async function addParentReference(
  childAutomatorId: string,
  parentAutomatorId: string
): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const child = await getAutomator(childAutomatorId)
  if (!child) throw new Error('Child automator not found')

  const existingParents = child.parent_automator_ids ?? []
  if (existingParents.includes(parentAutomatorId)) return // Already linked

  const { error } = await supabase
    .from('automators')
    .update({
      parent_automator_ids: [...existingParents, parentAutomatorId],
    })
    .eq('id', childAutomatorId)

  if (error) throw error
}

/**
 * Remove a parent reference from a child automator's parent_automator_ids array.
 */
export async function removeParentReference(
  childAutomatorId: string,
  parentAutomatorId: string
): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const child = await getAutomator(childAutomatorId)
  if (!child) throw new Error('Child automator not found')

  const existingParents = child.parent_automator_ids ?? []
  const updated = existingParents.filter((id) => id !== parentAutomatorId)

  const { error } = await supabase
    .from('automators')
    .update({
      parent_automator_ids: updated,
    })
    .eq('id', childAutomatorId)

  if (error) throw error
}

/**
 * Create a scaffold child automator with Start + End nodes.
 * Sets parent_automator_ids to reference the parent.
 */
export async function createChildAutomator(
  teamId: string,
  name: string,
  description: string | undefined,
  parentAutomatorId: string,
  userId: string
): Promise<Automator> {
  const scaffoldDefinition: AutomatorDefinition = {
    nodes: [
      {
        id: 'node_start',
        type: 'start',
        position: { x: 250, y: 50 },
        data: { type: 'start', label: 'Start', description: 'Workflow entry point' },
      },
      {
        id: 'node_end',
        type: 'end',
        position: { x: 250, y: 300 },
        data: { type: 'end', label: 'End', description: 'Workflow exit point', outcome: 'success' },
      },
    ],
    edges: [
      {
        id: 'edge_start_end',
        source: 'node_start',
        target: 'node_end',
        type: 'smoothstep',
      },
    ],
    viewport: { x: 0, y: 0, zoom: 1 },
  }

  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('automators')
    .insert({
      team_id: teamId,
      name,
      description: description || null,
      definition: scaffoldDefinition,
      status: 'draft',
      version: 1,
      created_by: userId,
      updated_by: userId,
      parent_automator_ids: [parentAutomatorId],
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get published automators for a team (lightweight, for dropdowns).
 */
export async function getPublishedAutomatorsForTeam(
  teamId: string
): Promise<Array<{ id: string; name: string; status: string }>> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('automators')
    .select('id, name, status')
    .eq('team_id', teamId)
    .neq('status', 'archived')
    .order('name', { ascending: true })

  if (error) throw error
  return data || []
}

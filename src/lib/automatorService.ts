import { supabase } from './supabase'
import type {
  Automator,
  AutomatorWithCreator,
  CreateAutomatorDTO,
  UpdateAutomatorDTO,
  AutomatorDefinition,
  DEFAULT_AUTOMATOR_DEFINITION,
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

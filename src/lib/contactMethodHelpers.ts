import { supabase } from './supabase'
import type { ContactMethod, ContactMethodInput } from '@/types/contact.types'

/**
 * Get contact methods for a contact
 */
export async function getContactMethodsForContact(contactId: string): Promise<ContactMethod[]> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('contact_methods')
    .select('*')
    .eq('contact_id', contactId)
    .order('is_primary', { ascending: false })
    .order('method_type', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Get contact methods for a company
 */
export async function getContactMethodsForCompany(companyId: string): Promise<ContactMethod[]> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('contact_methods')
    .select('*')
    .eq('company_id', companyId)
    .order('is_primary', { ascending: false })
    .order('method_type', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Get contact methods for a contact-company relationship
 */
export async function getContactMethodsForRelationship(contactCompanyId: string): Promise<ContactMethod[]> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .from('contact_methods')
    .select('*')
    .eq('contact_company_id', contactCompanyId)
    .order('is_primary', { ascending: false })
    .order('method_type', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Save contact methods for a contact (replaces existing)
 */
export async function saveContactMethodsForContact(
  contactId: string,
  methods: ContactMethodInput[]
): Promise<ContactMethod[]> {
  if (!supabase) throw new Error('Supabase not configured')

  // Delete existing methods
  const { error: deleteError } = await supabase
    .from('contact_methods')
    .delete()
    .eq('contact_id', contactId)

  if (deleteError) throw deleteError

  // Insert new methods if any
  if (methods.length === 0) return []

  const { data, error } = await supabase
    .from('contact_methods')
    .insert(
      methods.map((m) => ({
        contact_id: contactId,
        method_type: m.method_type,
        label: m.label || null,
        value: m.value,
        is_primary: m.is_primary,
      }))
    )
    .select()

  if (error) throw error
  return data || []
}

/**
 * Save contact methods for a company (replaces existing)
 */
export async function saveContactMethodsForCompany(
  companyId: string,
  methods: ContactMethodInput[]
): Promise<ContactMethod[]> {
  if (!supabase) throw new Error('Supabase not configured')

  // Delete existing methods
  const { error: deleteError } = await supabase
    .from('contact_methods')
    .delete()
    .eq('company_id', companyId)

  if (deleteError) throw deleteError

  // Insert new methods if any
  if (methods.length === 0) return []

  const { data, error } = await supabase
    .from('contact_methods')
    .insert(
      methods.map((m) => ({
        company_id: companyId,
        method_type: m.method_type,
        label: m.label || null,
        value: m.value,
        is_primary: m.is_primary,
      }))
    )
    .select()

  if (error) throw error
  return data || []
}

/**
 * Save contact methods for a contact-company relationship (replaces existing)
 */
export async function saveContactMethodsForRelationship(
  contactCompanyId: string,
  methods: ContactMethodInput[]
): Promise<ContactMethod[]> {
  if (!supabase) throw new Error('Supabase not configured')

  // Delete existing methods
  const { error: deleteError } = await supabase
    .from('contact_methods')
    .delete()
    .eq('contact_company_id', contactCompanyId)

  if (deleteError) throw deleteError

  // Insert new methods if any
  if (methods.length === 0) return []

  const { data, error } = await supabase
    .from('contact_methods')
    .insert(
      methods.map((m) => ({
        contact_company_id: contactCompanyId,
        method_type: m.method_type,
        label: m.label || null,
        value: m.value,
        is_primary: m.is_primary,
      }))
    )
    .select()

  if (error) throw error
  return data || []
}

/**
 * Get primary phone for display
 */
export function getPrimaryPhone(methods: ContactMethod[]): string | null {
  const primary = methods.find((m) => m.method_type === 'phone' && m.is_primary)
  if (primary) return primary.value

  const anyPhone = methods.find((m) => m.method_type === 'phone')
  return anyPhone?.value || null
}

/**
 * Get primary email for display
 */
export function getPrimaryEmail(methods: ContactMethod[]): string | null {
  const primary = methods.find((m) => m.method_type === 'email' && m.is_primary)
  if (primary) return primary.value

  const anyEmail = methods.find((m) => m.method_type === 'email')
  return anyEmail?.value || null
}

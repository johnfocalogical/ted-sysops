import type { DecisionOption } from '@/types/automator.types'

/** Default Yes/No options for backward compatibility with legacy decision nodes */
const DEFAULT_OPTIONS: DecisionOption[] = [
  { id: 'yes', label: 'Yes' },
  { id: 'no', label: 'No' },
]

/**
 * Returns the effective options array for a decision node.
 * When `options` is undefined (legacy nodes), returns the default Yes/No pair
 * whose IDs match the old hardcoded sourceHandle values.
 */
export function getEffectiveOptions(options?: DecisionOption[]): DecisionOption[] {
  return options && options.length >= 2 ? options : DEFAULT_OPTIONS
}

/**
 * Color classes for option handles, indexed by position.
 * - 2 options: green / red (classic Yes/No feel)
 * - 3+ options: rotating palette
 */
const HANDLE_COLORS = [
  { dot: 'bg-green-500', text: 'text-green-600' },
  { dot: 'bg-red-500', text: 'text-red-600' },
  { dot: 'bg-blue-500', text: 'text-blue-600' },
  { dot: 'bg-amber-500', text: 'text-amber-600' },
  { dot: 'bg-purple-500', text: 'text-purple-600' },
  { dot: 'bg-cyan-500', text: 'text-cyan-600' },
]

export function getOptionHandleColor(index: number, _total: number) {
  return HANDLE_COLORS[index % HANDLE_COLORS.length]
}

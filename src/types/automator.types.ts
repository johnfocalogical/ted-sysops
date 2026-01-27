// ============================================================================
// Automator Types - Visual Workflow Builder
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
// Node Types
// ============================================================================

export type AutomatorNodeType = 'start' | 'end' | 'decision' | 'dataCollection'

// Base node data shared by all node types
interface BaseNodeData {
  label: string
  description?: string
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

// Decision Node - Yes/No branching
export interface DecisionNodeData extends BaseNodeData {
  type: 'decision'
  question: string
  storeAs?: string // Optional field name to store the answer
}

// Data Collection Node - Collect user input
export interface DataCollectionNodeData extends BaseNodeData {
  type: 'dataCollection'
  fieldType: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'textarea'
  fieldName: string // Key to store the value
  placeholder?: string
  required: boolean
  // For select/multiselect
  options?: Array<{ label: string; value: string }>
  // For number
  min?: number
  max?: number
  // Validation message
  validationMessage?: string
}

// Union type for all node data
export type AutomatorNodeData =
  | StartNodeData
  | EndNodeData
  | DecisionNodeData
  | DataCollectionNodeData

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
}

export interface AutomatorWithCreator extends Automator {
  creator?: {
    id: string
    full_name: string | null
    email: string
  }
}

// ============================================================================
// DTOs
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

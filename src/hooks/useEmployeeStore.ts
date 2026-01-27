import { create } from 'zustand'
import type {
  Department,
  EmployeeListItem,
  EmployeeWithDetails,
  EmployeeStatus,
} from '@/types/employee.types'
import { getEmployeeDirectory } from '@/lib/employeeService'
import { getEmployeeProfileById } from '@/lib/employeeService'
import { getActiveDepartments } from '@/lib/departmentService'

interface EmployeeStoreState {
  // List state
  employees: EmployeeListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  loading: boolean
  error: string | null

  // Filters
  search: string
  departmentFilter: string | null
  statusFilter: EmployeeStatus | null

  // Departments (lookup data)
  departments: Department[]
  departmentsLoaded: boolean

  // Selected employee (for drawer)
  selectedEmployeeId: string | null
  selectedEmployee: EmployeeWithDetails | null
  loadingSelected: boolean

  // Current team context
  teamId: string | null

  // Actions
  setTeamId: (teamId: string) => void
  loadEmployees: () => Promise<void>
  loadDepartments: () => Promise<void>
  setPage: (page: number) => void
  setSearch: (search: string) => void
  setDepartmentFilter: (departmentId: string | null) => void
  setStatusFilter: (status: EmployeeStatus | null) => void
  selectEmployee: (id: string | null) => Promise<void>
  refreshSelected: () => Promise<void>
  refreshList: () => Promise<void>
  clearStore: () => void
}

export const useEmployeeStore = create<EmployeeStoreState>((set, get) => ({
  // Initial state
  employees: [],
  total: 0,
  page: 1,
  pageSize: 25,
  totalPages: 0,
  loading: false,
  error: null,

  search: '',
  departmentFilter: null,
  statusFilter: null,

  departments: [],
  departmentsLoaded: false,

  selectedEmployeeId: null,
  selectedEmployee: null,
  loadingSelected: false,

  teamId: null,

  // Set the current team
  setTeamId: (teamId: string) => {
    const current = get().teamId
    if (current !== teamId) {
      set({
        teamId,
        employees: [],
        total: 0,
        page: 1,
        totalPages: 0,
        selectedEmployeeId: null,
        selectedEmployee: null,
        search: '',
        departmentFilter: null,
        statusFilter: null,
        departmentsLoaded: false,
        departments: [],
      })
    }
  },

  // Load employees for the current team
  loadEmployees: async () => {
    const { teamId, page, pageSize, search, departmentFilter, statusFilter } = get()
    if (!teamId) return

    set({ loading: true, error: null })

    try {
      const result = await getEmployeeDirectory({
        teamId,
        page,
        pageSize,
        search: search || undefined,
        departmentId: departmentFilter,
        status: statusFilter,
      })

      set({
        employees: result.data,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        loading: false,
      })
    } catch (err) {
      console.error('Error loading employees:', err)
      set({
        error: err instanceof Error ? err.message : 'Failed to load employees',
        loading: false,
      })
    }
  },

  // Load departments (lookup data)
  loadDepartments: async () => {
    const { teamId, departmentsLoaded } = get()
    if (departmentsLoaded || !teamId) return

    try {
      const departments = await getActiveDepartments(teamId)
      set({ departments, departmentsLoaded: true })
    } catch (err) {
      console.error('Error loading departments:', err)
    }
  },

  // Pagination
  setPage: (page: number) => {
    set({ page })
    get().loadEmployees()
  },

  // Search with debounce handled by component
  setSearch: (search: string) => {
    set({ search, page: 1 })
    get().loadEmployees()
  },

  // Department filter
  setDepartmentFilter: (departmentId: string | null) => {
    set({ departmentFilter: departmentId, page: 1 })
    get().loadEmployees()
  },

  // Status filter
  setStatusFilter: (status: EmployeeStatus | null) => {
    set({ statusFilter: status, page: 1 })
    get().loadEmployees()
  },

  // Select an employee (load full details)
  selectEmployee: async (id: string | null) => {
    if (!id) {
      set({ selectedEmployeeId: null, selectedEmployee: null })
      return
    }

    set({ selectedEmployeeId: id, loadingSelected: true })

    try {
      const employee = await getEmployeeProfileById(id)
      set({ selectedEmployee: employee, loadingSelected: false })
    } catch (err) {
      console.error('Error loading employee details:', err)
      set({ loadingSelected: false })
    }
  },

  // Refresh the selected employee
  refreshSelected: async () => {
    const { selectedEmployeeId } = get()
    if (selectedEmployeeId) {
      await get().selectEmployee(selectedEmployeeId)
    }
  },

  // Refresh the list (after update)
  refreshList: async () => {
    await get().loadEmployees()
  },

  // Clear all state
  clearStore: () => {
    set({
      employees: [],
      total: 0,
      page: 1,
      totalPages: 0,
      loading: false,
      error: null,
      search: '',
      departmentFilter: null,
      statusFilter: null,
      selectedEmployeeId: null,
      selectedEmployee: null,
      loadingSelected: false,
      teamId: null,
    })
  },
}))

// Organization types
export type {
  Organization,
  OrganizationWithOwner,
  CreateOrganizationDTO,
  UpdateOrganizationDTO,
} from './organization.types'

// Team types
export type {
  Team,
  TeamWithOrg,
  TeamReference,
  CreateTeamDTO,
  UpdateTeamDTO,
} from './team.types'

// Role types
export type {
  AccessLevel,
  SectionPermission,
  SectionKey,
  RolePermissions,
  TeamRole,
  RoleTemplate,
  CreateTeamRoleDTO,
  UpdateTeamRoleDTO,
} from './role.types'

// Team member types
export type {
  PermissionLevel,
  TeamMember,
  TeamMemberWithUser,
  TeamMemberWithDetails,
  CreateTeamMemberDTO,
  UpdateTeamMemberDTO,
} from './team-member.types'

// Invitation types
export type {
  InvitationStatus,
  TeamInvitation,
  InvitationWithDetails,
  CreateInvitationDTO,
} from './invitation.types'

// User types
export type {
  User,
  UpdateUserDTO,
  SignUpWithOrgTeamDTO,
  SignUpResult,
} from './user.types'

// Context types
export type {
  TeamContext,
  TeamSwitcherItem,
  UserTeamsList,
} from './context.types'

// Contact types
export type {
  ContactMethodType,
  ContactMethod,
  ContactMethodInput,
  ContactType,
  Contact,
  ContactWithTypes,
  ContactCompanyFromContact,
  ContactWithDetails,
  ContactListItem,
  CreateContactDTO,
  UpdateContactDTO,
  UpdateContactMethodsDTO,
} from './contact.types'

// Company types
export type {
  CompanyType,
  Company,
  CompanyWithTypes,
  ContactCompanyFromCompany,
  PocContact,
  CompanyWithDetails,
  CompanyListItem,
  CreateCompanyDTO,
  UpdateCompanyDTO,
  ContactCompany,
  LinkContactToCompanyDTO,
  UpdateContactCompanyDTO,
} from './company.types'

// Type system types
export type {
  ContactTypeTemplate,
  ContactTypeTemplateWithUsage,
  CompanyTypeTemplate,
  CompanyTypeTemplateWithUsage,
  TeamContactType,
  TeamContactTypeWithUsage,
  TeamCompanyType,
  TeamCompanyTypeWithUsage,
  CustomFieldType,
  CustomFieldDefinition,
  CreateTypeTemplateDTO,
  UpdateTypeTemplateDTO,
  CreateTeamTypeDTO,
  UpdateTeamTypeDTO,
  CreateCustomFieldDTO,
  UpdateCustomFieldDTO,
  TypeIcon,
  TypeColor,
} from './type-system.types'

export {
  TYPE_ICONS,
  TYPE_COLORS,
  getTypeColorClasses,
  CUSTOM_FIELD_TYPE_LABELS,
} from './type-system.types'

// Custom field value types
export type {
  CustomFieldValue,
  CustomFieldValueWithDefinition,
  CustomFieldsGroupedByType,
  CustomFieldInputValue,
  CustomFieldFormValue,
  CustomFieldValuesMap,
  SaveCustomFieldValueDTO,
  SaveCustomFieldValuesDTO,
} from './custom-fields.types'

export {
  FIELD_TYPE_VALUE_COLUMN,
  TEXT_FIELD_TYPES,
  NUMERIC_FIELD_TYPES,
  OPTION_FIELD_TYPES,
  LINK_FIELD_TYPES,
} from './custom-fields.types'

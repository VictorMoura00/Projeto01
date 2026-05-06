export interface FormDefinition {
  id: string;
  name: string;
  slug: string;
  description?: string;
  version: number;
  isPublished: boolean;
  isActive: boolean;
  fields: FormField[];
  createdAt: string;
}

export interface FormField {
  id: string;
  label: string;
  key: string;
  type: FormFieldType;
  isRequired: boolean;
  placeholder?: string;
  displayOrder: number;
  optionsJson?: string;
  validationJson?: string;
  layoutJson?: string;
}

export enum FormFieldType {
  Text = 0,
  Textarea = 1,
  Number = 2,
  Date = 3,
  Boolean = 4,
  Select = 5,
  MultiSelect = 6,
  File = 7
}

export const FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  [FormFieldType.Text]: 'Texto',
  [FormFieldType.Textarea]: 'Texto Longo',
  [FormFieldType.Number]: 'Número',
  [FormFieldType.Date]: 'Data',
  [FormFieldType.Boolean]: 'Sim/Não',
  [FormFieldType.Select]: 'Seleção',
  [FormFieldType.MultiSelect]: 'Múltipla Seleção',
  [FormFieldType.File]: 'Arquivo'
};

export interface CreateFormPayload {
  name: string;
  slug: string;
  description?: string;
  fields: FormFieldInput[];
}

export interface UpdateFormPayload {
  name: string;
  description?: string;
  isActive: boolean;
  fields: FormFieldInput[];
}

export interface FormFieldInput {
  label: string;
  key: string;
  type: FormFieldType;
  isRequired: boolean;
  placeholder?: string;
  displayOrder: number;
  optionsJson?: string;
  validationJson?: string;
  layoutJson?: string;
}

export interface DuplicatePayload {
  newName: string;
  newSlug: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const CREATE_FIELD_DEFAULTS: FormFieldInput = {
  label: '',
  key: '',
  type: FormFieldType.Text,
  isRequired: false,
  placeholder: '',
  displayOrder: 0,
  optionsJson: undefined,
  validationJson: undefined,
  layoutJson: undefined
};

export interface EntityDefinition {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  displayOrder: number;
  fieldCount: number;
  createdAt: string;
}

export interface FieldDefinition {
  id: string;
  name: string;
  slug: string;
  fieldType: FieldType;
  isRequired: boolean;
  isSearchable: boolean;
  isFilterable: boolean;
  displayOrder: number;
  defaultValue?: string;
  optionsJson?: string;
  validationJson?: string;
}

export interface EntityDefinitionWithFields extends EntityDefinition {
  fields: FieldDefinition[];
}

export enum FieldType {
  Text = 0,
  Textarea = 1,
  Number = 2,
  Decimal = 3,
  Date = 4,
  DateTime = 5,
  Boolean = 6,
  Select = 7,
  MultiSelect = 8,
  File = 9,
  Relation = 10
}

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  [FieldType.Text]: 'Texto',
  [FieldType.Textarea]: 'Texto Longo',
  [FieldType.Number]: 'Número',
  [FieldType.Decimal]: 'Decimal',
  [FieldType.Date]: 'Data',
  [FieldType.DateTime]: 'Data e Hora',
  [FieldType.Boolean]: 'Sim/Não',
  [FieldType.Select]: 'Seleção',
  [FieldType.MultiSelect]: 'Múltipla Seleção',
  [FieldType.File]: 'Arquivo',
  [FieldType.Relation]: 'Relação'
};

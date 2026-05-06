export enum ParameterType { String = 0, Number = 1, Boolean = 2, Json = 3 }
export enum ParameterScope { Global = 0, Tenant = 1 }

export const PARAMETER_TYPE_LABELS: Record<ParameterType, string> = {
  [ParameterType.String]: 'Texto',
  [ParameterType.Number]: 'Número',
  [ParameterType.Boolean]: 'Booleano',
  [ParameterType.Json]: 'JSON',
};

export interface SystemParameter {
  id: string;
  key: string;
  value: string;
  type: ParameterType;
  group: string | null;
  description: string | null;
  scope: ParameterScope;
  isReadOnly: boolean;
  createdAt: string;
}

export interface PagedList<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

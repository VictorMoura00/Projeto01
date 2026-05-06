export interface RolePermission {
  id: string;
  entitySlug: string;
  operations: number;
}

export interface AppRole {
  id: string;
  name: string;
  description: string | null;
  isSystemRole: boolean;
  isActive: boolean;
  permissions: RolePermission[];
  createdAt: string;
}

export const PERMISSION_OPERATIONS = {
  Create: 1,
  Read: 2,
  Update: 4,
  Delete: 8,
} as const;

export const PERMISSION_LABELS: Record<number, string> = {
  1: 'Criar',
  2: 'Ler',
  4: 'Editar',
  8: 'Excluir',
};

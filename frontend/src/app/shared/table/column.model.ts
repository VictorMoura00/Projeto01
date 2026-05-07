export interface TableColumn {
  field: string;
  header: string;
  width?: string;
  sortable?: boolean;
  visible?: boolean;
  type?: 'text' | 'number' | 'date' | 'boolean' | 'tag' | 'code' | 'actions';
  styleClass?: string;
}

export interface TableAction {
  icon: string;
  label: string;
  severity?: 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'help';
  visible?: (row: any) => boolean;
}

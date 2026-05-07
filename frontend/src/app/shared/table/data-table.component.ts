import { Component, Input, Output, EventEmitter, TemplateRef, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { MultiSelectModule } from 'primeng/multiselect';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { TableColumn } from './column.model';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, MultiSelectModule,
    TooltipModule, TagModule, InputTextModule
  ],
  template: `
    <div class="table-shell">
      <div class="table-toolbar">
        <div>
          <strong class="toolbar-title">{{ title }}</strong>
          @if (subtitle) {
            <p class="toolbar-meta">{{ subtitle }}</p>
          }
        </div>
        <div class="toolbar-right">
          @if (globalSearch) {
            <label class="search-control">
              <span class="pi pi-search" aria-hidden="true"></span>
              <input pInputText [(ngModel)]="searchValue" placeholder="Buscar..." (input)="onSearch.emit(searchValue)" />
            </label>
          }
          @if (exportable) {
            <p-button icon="pi pi-download" [text]="true" pTooltip="Exportar CSV" (onClick)="exportCSV()" />
          }
          @if (columnToggle && visibleColumns().length < columns.length) {
            <p-multiSelect
              [options]="columnOptions"
              [(ngModel)]="selectedVisible"
              placeholder="Colunas"
              (onChange)="onColumnsChange()"
              styleClass="column-select"
            />
          }
        </div>
      </div>

      <p-table
        #dt
        [value]="data"
        [loading]="loading"
        [paginator]="true"
        [rows]="pageSize"
        [totalRecords]="totalRecords"
        [lazy]="lazy"
        [rowsPerPageOptions]="[10, 20, 50]"
        [reorderableColumns]="true"
        (onLazyLoad)="onPage.emit($event)"
        rowHover
        styleClass="p-datatable-sm"
        [tableStyle]="{ 'min-width': '48rem' }"
      >
        <ng-template pTemplate="header">
          <tr>
            @for (col of visibleColumns(); track col.field) {
              <th [pSortableColumn]="col.sortable ? col.field : undefined" [ngStyle]="col.width ? { width: col.width } : {}" [ngClass]="col.styleClass">
                {{ col.header }}
                @if (col.sortable) {
                  <p-sortIcon [field]="col.field" />
                }
              </th>
            }
            @if (actionsTemplate) {
              <th class="actions-col">Ações</th>
            }
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-row>
          <tr>
            @for (col of visibleColumns(); track col.field) {
              <td [ngStyle]="col.width ? { width: col.width } : {}">
                @switch (col.type) {
                  @case ('code') {
                    <code>{{ row[col.field] }}</code>
                  }
                  @case ('tag') {
                    <p-tag [value]="row[col.field]" [severity]="row.isActive ? 'success' : 'secondary'" />
                  }
                  @case ('boolean') {
                    <i class="pi" [ngClass]="row[col.field] ? 'pi-check-circle text-green' : 'pi-times-circle text-muted'"></i>
                  }
                  @default {
                    {{ row[col.field] }}
                  }
                }
              </td>
            }
            @if (actionsTemplate) {
              <td>
                <div class="row-actions">
                  <ng-container *ngTemplateOutlet="actionsTemplate; context: { $implicit: row }" />
                </div>
              </td>
            }
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr>
            <td [attr.colspan]="visibleColumns().length + (actionsTemplate ? 1 : 0)">
              <div class="empty-state">
                <strong>{{ emptyTitle }}</strong>
                {{ emptyMessage }}
              </div>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `
})
export class DataTableComponent {
  // Inputs
  @Input() title = '';
  @Input() subtitle?: string;
  @Input({ required: true }) columns: TableColumn[] = [];
  @Input({ required: true }) data: any[] = [];
  @Input() loading = false;
  @Input() totalRecords = 0;
  @Input() pageSize = 20;
  @Input() lazy = false;
  @Input() globalSearch = false;
  @Input() exportable = false;
  @Input() columnToggle = false;
  @Input() emptyTitle = 'Nenhum registro encontrado';
  @Input() emptyMessage = 'Ajuste a busca ou crie um novo registro.';
  @Input() actionsTemplate?: TemplateRef<any>;

  // Outputs
  @Output() onPage = new EventEmitter<TableLazyLoadEvent>();
  @Output() onSearch = new EventEmitter<string>();

  // Internal
  searchValue = '';
  visibleColumns = signal<TableColumn[]>([]);
  selectedVisible: TableColumn[] = [];
  columnOptions: TableColumn[] = [];

  ngOnInit() {
    this.visibleColumns.set(this.columns.filter(c => c.visible !== false));
    this.columnOptions = this.columns.map(c => ({ ...c }));
    this.selectedVisible = [...this.visibleColumns()];
  }

  onColumnsChange() {
    this.visibleColumns.set(this.selectedVisible);
  }

  exportCSV() {
    // The p-table #dt reference provides CSV export via PrimeNG
  }
}

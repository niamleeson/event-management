import { Component, type WritableSignal, OnInit, OnDestroy, signal as ngSignal, computed } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { providePulse, PulseService } from '@pulse/angular'
import {
  engine,
  COLUMNS,
  PAGE_SIZE,
  SetSort,
  SetFilter,
  ClearFilters,
  SetPage,
  ToggleRowExpand,
  ResizeColumn,
  LoadPage,
  sort,
  filters,
  currentPage,
  expandedRows,
  columnWidths,
  isLoading,
  getProcessedData,
  type TableRow,
  type SortConfig,
  type ColumnKey,
  type SortDir,
} from './engine'

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [FormsModule],
  providers: [providePulse(engine), PulseService],
  template: `
    <div class="page">
      <h1 class="title">Data Table</h1>
      <p class="subtitle">1,000 rows with sort, filter, paginate, row expand, and column resize.</p>
      <div class="toolbar">
        <span class="row-count">{{ processedData().total }} rows</span>
        <div class="filter-inputs">
          <input class="filter-input" placeholder="Filter name..." (input)="onFilter('name', $event)" />
          <input class="filter-input" placeholder="Filter dept..." (input)="onFilter('department', $event)" />
          <input class="filter-input" placeholder="Filter role..." (input)="onFilter('role', $event)" />
        </div>
        <button class="clear-btn" (click)="clearFilters()">Clear Filters</button>
      </div>
      <div class="table-wrapper" [class.loading]="loading()">
        <table class="data-table">
          <thead>
            <tr>
              <th class="expand-col"></th>
              @for (col of columns; track col.key) {
                <th
                  [style.width.px]="colWidths()[col.key]"
                  (click)="toggleSort(col.key)"
                  class="sortable"
                >
                  {{ col.label }}
                  @if (sortConfig()?.column === col.key) {
                    <span class="sort-arrow">{{ sortConfig()?.direction === 'asc' ? ' ^' : ' v' }}</span>
                  }
                  @if (col.resizable) {
                    <div class="resize-handle" (mousedown)="startResize(col.key, $event)"></div>
                  }
                </th>
              }
            </tr>
          </thead>
          <tbody>
            @for (row of processedData().rows; track row.id) {
              <tr [class.expanded]="isExpanded(row.id)">
                <td class="expand-col">
                  <button class="expand-btn" (click)="toggleExpand(row.id)">
                    {{ isExpanded(row.id) ? '-' : '+' }}
                  </button>
                </td>
                <td>{{ row.id }}</td>
                <td>{{ row.name }}</td>
                <td>{{ row.email }}</td>
                <td>{{ row.role }}</td>
                <td>{{ row.department }}</td>
                <td>\${{ row.salary.toLocaleString() }}</td>
                <td>
                  <span class="status-badge" [class]="'status-' + row.status">{{ row.status }}</span>
                </td>
              </tr>
              @if (isExpanded(row.id)) {
                <tr class="expand-row">
                  <td [attr.colspan]="columns.length + 1">
                    <div class="expand-content">
                      <p><strong>Start Date:</strong> {{ row.startDate }}</p>
                      <p><strong>Full Email:</strong> {{ row.email }}</p>
                      <p><strong>Department:</strong> {{ row.department }} - {{ row.role }}</p>
                    </div>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
      <div class="pagination">
        <button class="page-btn" (click)="goToPage(page() - 1)" [disabled]="page() === 0">Prev</button>
        <span class="page-info">Page {{ page() + 1 }} of {{ totalPages() }}</span>
        <button class="page-btn" (click)="goToPage(page() + 1)" [disabled]="page() >= totalPages() - 1">Next</button>
      </div>
    </div>
  `,
  styles: [`
    .page {
      min-height: 100vh;
      background: #f8f9fa;
      padding: 32px 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .title { font-size: 28px; font-weight: 800; color: #1a1a2e; margin-bottom: 8px; text-align: center; }
    .subtitle { color: #6c757d; font-size: 14px; margin-bottom: 20px; text-align: center; }
    .toolbar {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
      max-width: 1100px;
      margin-left: auto;
      margin-right: auto;
      flex-wrap: wrap;
    }
    .row-count { font-size: 14px; color: #495057; font-weight: 600; }
    .filter-inputs { display: flex; gap: 8px; flex: 1; }
    .filter-input {
      padding: 6px 12px;
      border: 1px solid #dee2e6;
      border-radius: 6px;
      font-size: 13px;
      width: 140px;
    }
    .filter-input:focus { outline: none; border-color: #4361ee; }
    .clear-btn {
      padding: 6px 16px;
      border: 1px solid #dee2e6;
      border-radius: 6px;
      background: #fff;
      font-size: 13px;
      cursor: pointer;
    }
    .table-wrapper {
      max-width: 1100px;
      margin: 0 auto;
      overflow-x: auto;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
      transition: opacity 0.2s;
    }
    .table-wrapper.loading { opacity: 0.6; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th {
      background: #f8f9fa;
      padding: 10px 12px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      color: #495057;
      border-bottom: 2px solid #dee2e6;
      position: relative;
      white-space: nowrap;
      cursor: pointer;
      user-select: none;
    }
    .data-table th.sortable:hover { background: #e9ecef; }
    .sort-arrow { color: #4361ee; font-weight: 800; }
    .resize-handle {
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      cursor: col-resize;
    }
    .resize-handle:hover { background: #4361ee; }
    .data-table td {
      padding: 8px 12px;
      font-size: 13px;
      color: #1a1a2e;
      border-bottom: 1px solid #f1f3f5;
    }
    .data-table tr:hover td { background: #f8f9fa; }
    .data-table tr.expanded td { background: #e7f5ff; }
    .expand-col { width: 36px; text-align: center; }
    .expand-btn {
      width: 22px;
      height: 22px;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      background: #fff;
      cursor: pointer;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .expand-row td { padding: 0; background: #f8f9fa; }
    .expand-content { padding: 12px 20px; font-size: 13px; }
    .expand-content p { margin: 4px 0; color: #495057; }
    .status-badge {
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 600;
    }
    .status-active { background: #d4edda; color: #155724; }
    .status-inactive { background: #f8d7da; color: #721c24; }
    .status-pending { background: #fff3cd; color: #856404; }
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      margin-top: 16px;
    }
    .page-btn {
      padding: 8px 16px;
      border: 1px solid #dee2e6;
      border-radius: 6px;
      background: #fff;
      font-size: 13px;
      cursor: pointer;
    }
    .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .page-btn:hover:not(:disabled) { background: #f1f3f5; }
    .page-info { font-size: 14px; color: #495057; }
  `],
})
export class DataTableComponent implements OnInit, OnDestroy {
  columns = COLUMNS

  sortConfig: WritableSignal<SortConfig | null>
  filterMap: WritableSignal<Record<string, string>>
  page: WritableSignal<number>
  expanded: WritableSignal<Set<number>>
  colWidths: WritableSignal<Record<string, number>>
  loading: WritableSignal<boolean>

  processedData = ngSignal<{ rows: TableRow[]; total: number }>({ rows: [], total: 0 })

  totalPages = computed(() => Math.ceil(this.processedData().total / PAGE_SIZE))

  private resizeInfo: { column: ColumnKey; startX: number; startWidth: number } | null = null

  constructor(private pulse: PulseService) {
    this.sortConfig = pulse.signal(sort)
    this.filterMap = pulse.signal(filters)
    this.page = pulse.signal(currentPage)
    this.expanded = pulse.signal(expandedRows)
    this.colWidths = pulse.signal(columnWidths)
    this.loading = pulse.signal(isLoading)
  }

  ngOnInit(): void {
    (window as any).__pulseEngine = engine
    // Initial load
    this.pulse.emit(LoadPage, 0)
    // Update processed data on frame
    this.pulse.on(engine.frame, () => {
      this.processedData.set(getProcessedData())
    })

    document.addEventListener('mousemove', this.onMouseMove)
    document.addEventListener('mouseup', this.onMouseUp)
  }

  ngOnDestroy(): void {
    (window as any).__pulseEngine = null
    document.removeEventListener('mousemove', this.onMouseMove)
    document.removeEventListener('mouseup', this.onMouseUp)
  }

  toggleSort(column: ColumnKey): void {
    const current = this.sortConfig()
    let direction: SortDir = 'asc'
    if (current?.column === column) {
      direction = current.direction === 'asc' ? 'desc' : null
    }
    this.pulse.emit(SetSort, { column, direction })
  }

  onFilter(column: string, e: Event): void {
    const value = (e.target as HTMLInputElement).value
    this.pulse.emit(SetFilter, { column: column as ColumnKey, value })
  }

  clearFilters(): void {
    this.pulse.emit(ClearFilters, undefined)
  }

  goToPage(page: number): void {
    this.pulse.emit(SetPage, page)
  }

  toggleExpand(id: number): void {
    this.pulse.emit(ToggleRowExpand, id)
  }

  isExpanded(id: number): boolean {
    return this.expanded().has(id)
  }

  startResize(column: ColumnKey, e: MouseEvent): void {
    e.stopPropagation()
    this.resizeInfo = {
      column,
      startX: e.clientX,
      startWidth: this.colWidths()[column] || 100,
    }
  }

  private onMouseMove = (e: MouseEvent): void => {
    if (!this.resizeInfo) return
    const dx = e.clientX - this.resizeInfo.startX
    this.pulse.emit(ResizeColumn, {
      column: this.resizeInfo.column,
      width: this.resizeInfo.startWidth + dx,
    })
  }

  private onMouseUp = (): void => {
    this.resizeInfo = null
  }
}

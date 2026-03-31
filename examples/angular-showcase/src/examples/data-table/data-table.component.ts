import { Component, OnInit, OnDestroy, computed } from '@angular/core'
import { providePulse, PulseService } from '@pulse/angular'
import { engine, COLUMNS, PAGE_SIZE, SetSort, SetFilter, ClearFilters, SetPage, SortChanged, FiltersChanged, PageChanged, DataChanged, type TableRow, type SortConfig, type ColumnKey } from './engine'
@Component({ selector: 'app-data-table', standalone: true, providers: [providePulse(engine), PulseService],
  template: `<div class="page"><h1 class="title">Data Table</h1><p class="subtitle">1K rows, sort/filter/paginate.</p><div class="ctrls"><button class="btn" (click)="clearFilters()">Clear Filters</button><span class="info">{{ data().total }} rows</span></div><div class="tw"><table class="tbl"><thead><tr>@for (col of columns; track col.key) {<th [style.width.px]="col.width" (click)="toggleSort(col.key)">{{ col.label }}@if (sort()?.column === col.key) {<span>{{ sort()!.direction === 'asc' ? ' ^' : ' v' }}</span>}</th>}</tr><tr>@for (col of columns; track col.key) {<th><input class="fi" placeholder="Filter..." (input)="onFilter(col.key, $event)" /></th>}</tr></thead><tbody>@for (row of data().rows; track row.id) {<tr><td>{{ row.id }}</td><td>{{ row.name }}</td><td>{{ row.email }}</td><td>{{ row.role }}</td><td>{{ row.department }}</td><td>{{ row.salary }}</td><td><span class="st" [class]="row.status">{{ row.status }}</span></td></tr>}</tbody></table></div><div class="pg"><button class="pb" [disabled]="page() === 0" (click)="setPage(page() - 1)">Prev</button><span>Page {{ page() + 1 }} of {{ totalPages() }}</span><button class="pb" [disabled]="page() >= totalPages() - 1" (click)="setPage(page() + 1)">Next</button></div></div>`,
  styles: [`.page{min-height:100vh;background:#f8f9fa;padding:40px 20px;font-family:sans-serif}.title{font-size:28px;font-weight:800;color:#1a1a2e;margin-bottom:8px;text-align:center}.subtitle{color:#6c757d;font-size:14px;margin-bottom:20px;text-align:center}.ctrls{display:flex;gap:12px;align-items:center;max-width:1100px;margin:0 auto 16px}.btn{padding:6px 16px;border:1px solid #dee2e6;border-radius:6px;background:#fff;cursor:pointer;font-size:13px}.info{color:#6c757d;font-size:13px}.tw{max-width:1100px;margin:0 auto;overflow-x:auto;background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.06)}.tbl{width:100%;border-collapse:collapse}th{padding:10px 12px;text-align:left;font-size:12px;font-weight:600;color:#495057;background:#f1f3f5;cursor:pointer;border-bottom:1px solid #dee2e6}td{padding:10px 12px;font-size:13px;color:#1a1a2e;border-bottom:1px solid #f1f3f5}.fi{width:100%;padding:4px 8px;border:1px solid #dee2e6;border-radius:4px;font-size:12px;outline:none;box-sizing:border-box}.st{padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600}.st.active{background:#d4edda;color:#155724}.st.inactive{background:#f8d7da;color:#721c24}.st.pending{background:#fff3cd;color:#856404}.pg{display:flex;gap:12px;align-items:center;justify-content:center;margin-top:16px}.pb{padding:6px 16px;border:1px solid #dee2e6;border-radius:6px;background:#fff;cursor:pointer}.pb:disabled{opacity:.4;cursor:not-allowed}`],
})
export class DataTableComponent implements OnInit, OnDestroy {
  columns = COLUMNS
  sort = this.pulse.use(SortChanged, null as SortConfig | null)
  page = this.pulse.use(PageChanged, 0)
  data = this.pulse.use(DataChanged, { rows: [] as TableRow[], total: 0 })
  totalPages = computed(() => Math.ceil(this.data().total / PAGE_SIZE))
  constructor(private pulse: PulseService) {}
  ngOnInit(): void { (window as any).__pulseEngine = engine }
  ngOnDestroy(): void { (window as any).__pulseEngine = null; engine.destroy() }
  toggleSort(col: ColumnKey): void {
    const s = this.sort(); const dir = s?.column === col ? (s.direction === 'asc' ? 'desc' : null) : 'asc'
    this.pulse.emit(SetSort, { column: col, direction: dir })
  }
  onFilter(col: ColumnKey, e: Event): void { this.pulse.emit(SetFilter, { column: col, value: (e.target as HTMLInputElement).value }) }
  clearFilters(): void { this.pulse.emit(ClearFilters, undefined) }
  setPage(p: number): void { this.pulse.emit(SetPage, p) }
}

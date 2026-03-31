import { Component, type WritableSignal, OnInit, OnDestroy, signal as ngSignal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { providePulse, PulseService } from '@pulse/angular'
import { engine, ROWS, COLS, cellId, CellEdited, SelectCell, CellsChanged, SelectedCellChanged, type CellData, type CellId } from './engine'

@Component({
  selector: 'app-spreadsheet',
  standalone: true,
  imports: [FormsModule],
  providers: [providePulse(engine), PulseService],
  template: `
    <div class="page">
      <h1 class="title">Spreadsheet</h1>
      <p class="subtitle">Edit cells with formulas (=A1+B1, =SUM(A1:A8)). Changes cascade via events.</p>
      <div class="formula-bar"><span class="cell-ref">{{ selected() || '-' }}</span><input class="formula-input" [value]="formulaBarValue()" (keydown.enter)="commitFormula($event)" (blur)="commitFormula($event)" placeholder="Enter value or formula (=A1+B1)" /></div>
      <div class="grid-wrapper">
        <table class="grid"><thead><tr><th class="corner"></th>@for (col of colHeaders; track col) { <th class="col-header">{{ col }}</th> }</tr></thead>
          <tbody>@for (row of rowIndices; track row; let r = $index) { <tr><td class="row-header">{{ row + 1 }}</td>@for (col of colIndices; track col; let c = $index) { <td class="cell" [class.selected]="selected() === getCellId(r, c)" [class.error]="getCellData(r, c)?.error" (click)="selectCell(r, c)" (dblclick)="startEdit(r, c, $event)">
            @if (editingCell() === getCellId(r, c)) { <input class="cell-edit" [value]="getCellData(r, c)?.raw || ''" (keydown.enter)="finishEdit($event, r, c)" (blur)="finishEdit($event, r, c)" (keydown.escape)="cancelEdit()" /> } @else { <span class="cell-value" [class.has-error]="getCellData(r, c)?.error">{{ formatValue(getCellData(r, c)) }}</span> }
          </td> }</tr> }</tbody></table>
      </div>
    </div>
  `,
  styles: [`
    .page { min-height: 100vh; background: #f8f9fa; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .title { font-size: 28px; font-weight: 800; color: #1a1a2e; margin-bottom: 8px; text-align: center; }
    .subtitle { color: #6c757d; font-size: 14px; margin-bottom: 24px; text-align: center; }
    .formula-bar { display: flex; gap: 8px; align-items: center; max-width: 800px; margin: 0 auto 16px; background: #fff; border: 1px solid #dee2e6; border-radius: 8px; padding: 8px 12px; }
    .cell-ref { font-weight: 700; color: #4361ee; min-width: 30px; font-size: 14px; }
    .formula-input { flex: 1; border: none; outline: none; font-size: 14px; font-family: monospace; }
    .grid-wrapper { max-width: 800px; margin: 0 auto; overflow-x: auto; }
    .grid { border-collapse: collapse; width: 100%; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .corner { width: 40px; background: #f1f3f5; }
    .col-header { background: #f1f3f5; padding: 8px 12px; font-size: 12px; font-weight: 600; color: #495057; text-align: center; min-width: 80px; }
    .row-header { background: #f1f3f5; padding: 8px; font-size: 12px; font-weight: 600; color: #495057; text-align: center; }
    .cell { border: 1px solid #e9ecef; padding: 0; min-width: 80px; height: 32px; cursor: cell; position: relative; }
    .cell.selected { outline: 2px solid #4361ee; outline-offset: -1px; }
    .cell.error { background: #fff5f5; }
    .cell-value { display: block; padding: 4px 8px; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .cell-value.has-error { color: #e63946; }
    .cell-edit { width: 100%; height: 100%; border: none; outline: none; padding: 4px 8px; font-size: 13px; font-family: monospace; background: #e7f5ff; }
  `],
})
export class SpreadsheetComponent implements OnInit, OnDestroy {
  colHeaders = Array.from({ length: COLS }, (_, i) => String.fromCharCode(65 + i))
  rowIndices = Array.from({ length: ROWS }, (_, i) => i)
  colIndices = Array.from({ length: COLS }, (_, i) => i)
  cellsData = this.pulse.use(CellsChanged, {} as Record<CellId, CellData>)
  selected = this.pulse.use(SelectedCellChanged, null as CellId | null)
  editingCell = ngSignal<CellId | null>(null)
  formulaBarValue = () => { const sel = this.selected(); if (!sel) return ''; return this.cellsData()[sel]?.raw || '' }

  constructor(private pulse: PulseService) {}
  ngOnInit(): void {
    (window as any).__pulseEngine = engine
    this.pulse.emit(CellEdited, { id: 'A1', raw: '10' }); this.pulse.emit(CellEdited, { id: 'A2', raw: '20' }); this.pulse.emit(CellEdited, { id: 'A3', raw: '30' })
    this.pulse.emit(CellEdited, { id: 'B1', raw: '=A1*2' }); this.pulse.emit(CellEdited, { id: 'B2', raw: '=A2*2' }); this.pulse.emit(CellEdited, { id: 'B3', raw: '=A3*2' })
    this.pulse.emit(CellEdited, { id: 'A8', raw: '=SUM(A1:A3)' })
  }
  ngOnDestroy(): void { (window as any).__pulseEngine = null; engine.destroy() }
  getCellId(row: number, col: number): CellId { return cellId(row, col) }
  getCellData(row: number, col: number): CellData | undefined { return this.cellsData()[cellId(row, col)] }
  formatValue(data: CellData | undefined): string { if (!data) return ''; if (data.error) return data.error; if (typeof data.computed === 'number') return String(Math.round(data.computed * 1000) / 1000); return String(data.computed) }
  selectCell(row: number, col: number): void { this.pulse.emit(SelectCell, cellId(row, col)); this.editingCell.set(null) }
  startEdit(row: number, col: number, event: MouseEvent): void { const id = cellId(row, col); this.pulse.emit(SelectCell, id); this.editingCell.set(id); setTimeout(() => { const input = (event.target as HTMLElement).closest('td')?.querySelector('input'); input?.focus(); input?.select() }, 0) }
  finishEdit(event: Event, row: number, col: number): void { this.pulse.emit(CellEdited, { id: cellId(row, col), raw: (event.target as HTMLInputElement).value }); this.editingCell.set(null) }
  cancelEdit(): void { this.editingCell.set(null) }
  commitFormula(event: Event): void { const sel = this.selected(); if (sel) this.pulse.emit(CellEdited, { id: sel, raw: (event.target as HTMLInputElement).value }) }
}

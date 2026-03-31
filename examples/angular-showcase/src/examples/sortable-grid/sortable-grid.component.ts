import { Component, OnInit, OnDestroy } from '@angular/core'
import { providePulse, PulseService } from '@pulse/angular'
import { engine, COLS, CELL_SIZE, GAP, Reorder, Shuffle, AddItem, RemoveItem, ItemsChanged, type GridItem } from './engine'
@Component({ selector: 'app-sortable-grid', standalone: true, providers: [providePulse(engine), PulseService],
  template: `<div class="page"><h1 class="title">Sortable Grid</h1><p class="subtitle">Drag to reorder, shuffle, add/remove.</p><div class="ctrls"><button class="btn" (click)="shuffle()">Shuffle</button><button class="btn" (click)="add()">Add</button></div><div class="grid" [style.width.px]="COLS * (CELL_SIZE + GAP)">@for (item of items(); track item.id; let i = $index) {<div class="cell" [style.background]="item.color" [style.width.px]="CELL_SIZE" [style.height.px]="CELL_SIZE" draggable="true" (dragstart)="onDragStart(i)" (dragover)="onDragOver($event)" (drop)="onDrop(i)"><span class="label">{{ item.label }}</span><button class="rm" (click)="remove(item.id)">x</button></div>}</div></div>`,
  styles: [`.page{min-height:100vh;background:#f8f9fa;padding:40px 20px;font-family:sans-serif;display:flex;flex-direction:column;align-items:center}.title{font-size:28px;font-weight:800;color:#1a1a2e;margin-bottom:8px}.subtitle{color:#6c757d;font-size:14px;margin-bottom:20px}.ctrls{display:flex;gap:8px;margin-bottom:24px}.btn{padding:8px 20px;border:none;border-radius:8px;background:#4361ee;color:#fff;font-weight:600;cursor:pointer}.grid{display:flex;flex-wrap:wrap;gap:12px}.cell{border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:grab;position:relative}.cell:active{cursor:grabbing;opacity:.8}.label{color:#fff;font-weight:700;font-size:16px}.rm{position:absolute;top:6px;right:6px;background:rgba(0,0,0,.3);border:none;color:#fff;border-radius:50%;width:22px;height:22px;cursor:pointer;font-size:12px}`],
})
export class SortableGridComponent implements OnInit, OnDestroy {
  COLS = COLS; CELL_SIZE = CELL_SIZE; GAP = GAP
  items = this.pulse.use(ItemsChanged, [{id:'a',label:'Alpha',color:'#4361ee'},{id:'b',label:'Beta',color:'#7209b7'},{id:'c',label:'Gamma',color:'#f72585'},{id:'d',label:'Delta',color:'#4cc9f0'},{id:'e',label:'Epsilon',color:'#2a9d8f'},{id:'f',label:'Zeta',color:'#e76f51'},{id:'g',label:'Eta',color:'#06d6a0'},{id:'h',label:'Theta',color:'#ffd166'}] as GridItem[])
  private dragFrom = -1
  constructor(private pulse: PulseService) {}
  ngOnInit(): void { (window as any).__pulseEngine = engine }
  ngOnDestroy(): void { (window as any).__pulseEngine = null; engine.destroy() }
  shuffle(): void { this.pulse.emit(Shuffle, undefined) }
  add(): void { this.pulse.emit(AddItem, undefined) }
  remove(id: string): void { this.pulse.emit(RemoveItem, id) }
  onDragStart(i: number): void { this.dragFrom = i }
  onDragOver(e: DragEvent): void { e.preventDefault() }
  onDrop(i: number): void { if (this.dragFrom >= 0 && this.dragFrom !== i) this.pulse.emit(Reorder, { fromIndex: this.dragFrom, toIndex: i }); this.dragFrom = -1 }
}

import { Component, OnInit, OnDestroy, HostListener, computed } from '@angular/core'
import { providePulse, PulseService } from '@pulse/angular'
import { engine, FILE_TREE, ToggleNode, SelectNode, KeyboardNav, ExpandedChanged, SelectedChanged, flattenVisible, type FileNode } from './engine'
@Component({ selector: 'app-file-tree', standalone: true, providers: [providePulse(engine), PulseService],
  template: `<div class="page"><h1 class="title">File Tree</h1><p class="subtitle">Nested expand, keyboard nav.</p><div class="tree-container" tabindex="0">@for (item of visibleNodes(); track item.node.id) {<div class="tree-node" [class.selected]="selected() === item.node.id" [style.padding-left.px]="16 + item.depth * 20" (click)="onNodeClick(item.node)">@if (item.node.type === 'folder') {<span class="ei">{{ isExpanded(item.node.id) ? 'v' : '>' }}</span>} @else {<span class="ei" style="visibility:hidden">.</span>}<span class="ni">{{ item.node.icon }}</span><span class="nn" [class.folder]="item.node.type === 'folder'">{{ item.node.name }}</span></div>}</div></div>`,
  styles: [`.page{min-height:100vh;background:#f8f9fa;padding:40px 20px;font-family:sans-serif;display:flex;flex-direction:column;align-items:center}.title{font-size:28px;font-weight:800;color:#1a1a2e;margin-bottom:8px}.subtitle{color:#6c757d;font-size:14px;margin-bottom:24px}.tree-container{width:400px;background:#1a1a2e;border-radius:12px;padding:12px 0;outline:none}.tree-node{display:flex;align-items:center;gap:6px;padding:4px 12px;cursor:pointer;color:rgba(255,255,255,.7);font-size:13px;font-family:monospace}.tree-node:hover{background:rgba(255,255,255,.05)}.tree-node.selected{background:rgba(67,97,238,.2);color:#fff}.ei{width:12px;font-size:10px;color:rgba(255,255,255,.4);text-align:center}.ni{font-size:12px;color:#4361ee}.nn{font-size:13px}.nn.folder{font-weight:600}`],
})
export class FileTreeComponent implements OnInit, OnDestroy {
  expanded = this.pulse.use(ExpandedChanged, new Set(['src', 'src/components']))
  selected = this.pulse.use(SelectedChanged, '')
  visibleNodes = computed(() => flattenVisible(FILE_TREE, this.expanded()))
  isExpanded(id: string): boolean { return this.expanded().has(id) }
  constructor(private pulse: PulseService) {}
  ngOnInit(): void { (window as any).__pulseEngine = engine }
  ngOnDestroy(): void { (window as any).__pulseEngine = null; engine.destroy() }
  onNodeClick(node: FileNode): void { this.pulse.emit(SelectNode, node.id); if (node.type === 'folder') this.pulse.emit(ToggleNode, node.id) }
  @HostListener('keydown', ['$event'])
  onKeyDown(e: KeyboardEvent): void {
    const map: Record<string, 'up' | 'down' | 'enter' | 'left' | 'right'> = { ArrowUp: 'up', ArrowDown: 'down', Enter: 'enter', ArrowLeft: 'left', ArrowRight: 'right' }
    const key = map[e.key]; if (key) { e.preventDefault(); this.pulse.emit(KeyboardNav, key) }
  }
}

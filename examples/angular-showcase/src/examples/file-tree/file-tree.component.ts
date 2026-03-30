import { Component, type WritableSignal, OnInit, OnDestroy, HostListener } from '@angular/core'
import { NgTemplateOutlet } from '@angular/common'
import { providePulse, PulseService } from '@pulse/angular'
import {
  engine,
  FILE_TREE,
  ToggleNode,
  SelectNode,
  ContextMenu,
  KeyboardNav,
  expandedNodes,
  selectedNode,
  contextMenuState,
  type FileNode,
} from './engine'

@Component({
  selector: 'app-file-tree',
  standalone: true,
  imports: [NgTemplateOutlet],
  providers: [providePulse(engine), PulseService],
  template: `
    <div class="page" (click)="closeContextMenu()" (keydown)="onKeyDown($event)" tabindex="0">
      <h1 class="title">File Tree</h1>
      <p class="subtitle">Nested expand/collapse with tween. Context menu. Keyboard nav (arrows + enter).</p>
      <div class="tree-container">
        <div class="tree" role="tree">
          @for (node of rootNodes; track node.id) {
            <ng-container *ngTemplateOutlet="nodeTemplate; context: { node: node, depth: 0 }"></ng-container>
          }
        </div>
      </div>
      @if (ctxMenu()) {
        <div class="context-menu"
          [style.left.px]="ctxMenu()!.x"
          [style.top.px]="ctxMenu()!.y"
          (click)="$event.stopPropagation()"
        >
          <div class="ctx-item" (click)="closeContextMenu()">Open</div>
          <div class="ctx-item" (click)="closeContextMenu()">Rename</div>
          <div class="ctx-item" (click)="closeContextMenu()">Copy Path</div>
          <div class="ctx-divider"></div>
          <div class="ctx-item danger" (click)="closeContextMenu()">Delete</div>
        </div>
      }
    </div>
    <ng-template #nodeTemplate let-node="node" let-depth="depth">
      <div
        class="tree-node"
        [style.padding-left.px]="depth * 20 + 12"
        [class.selected]="selected() === node.id"
        [class.folder]="node.type === 'folder'"
        (click)="onNodeClick(node, $event)"
        (contextmenu)="onContextMenu(node, $event)"
        role="treeitem"
      >
        @if (node.type === 'folder') {
          <span class="arrow" [class.expanded]="isExpanded(node.id)">
            &#9656;
          </span>
        } @else {
          <span class="arrow spacer"></span>
        }
        <span class="icon" [class]="'icon-' + node.icon">{{ node.icon }}</span>
        <span class="name">{{ node.name }}</span>
      </div>
      @if (node.type === 'folder' && node.children && isExpanded(node.id)) {
        <div class="children" [style.animation]="'expandIn 0.2s ease-out'">
          @for (child of node.children; track child.id) {
            <ng-container *ngTemplateOutlet="nodeTemplate; context: { node: child, depth: depth + 1 }"></ng-container>
          }
        </div>
      }
    </ng-template>
  `,
  styles: [`
    .page {
      min-height: 100vh;
      background: #f8f9fa;
      padding: 40px 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      outline: none;
    }
    .title { font-size: 28px; font-weight: 800; color: #1a1a2e; margin-bottom: 8px; }
    .subtitle { color: #6c757d; font-size: 14px; margin-bottom: 24px; }
    .tree-container {
      width: 400px;
      background: #1e1e2e;
      border-radius: 12px;
      padding: 12px 0;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }
    .tree-node {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      cursor: pointer;
      color: rgba(255,255,255,0.7);
      font-size: 13px;
      transition: background 0.1s;
      user-select: none;
    }
    .tree-node:hover { background: rgba(255,255,255,0.05); }
    .tree-node.selected { background: rgba(67,97,238,0.2); color: #fff; }
    .arrow {
      font-size: 10px;
      width: 14px;
      display: inline-block;
      transition: transform 0.2s;
    }
    .arrow.expanded { transform: rotate(90deg); }
    .arrow.spacer { visibility: hidden; }
    .icon {
      width: 18px;
      height: 18px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 700;
      color: #fff;
    }
    .icon-D { background: #f0c14b; color: #1a1a2e; }
    .icon-T { background: #3178c6; }
    .icon-C { background: #264de4; }
    .icon-J { background: #f7df1e; color: #1a1a2e; }
    .icon-M { background: #495057; }
    .name { white-space: nowrap; }
    @keyframes expandIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
    .context-menu {
      position: fixed;
      background: #2e2e3e;
      border-radius: 8px;
      padding: 4px 0;
      min-width: 160px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
      z-index: 1000;
    }
    .ctx-item {
      padding: 8px 16px;
      font-size: 13px;
      color: rgba(255,255,255,0.8);
      cursor: pointer;
      transition: background 0.1s;
    }
    .ctx-item:hover { background: rgba(255,255,255,0.1); }
    .ctx-item.danger { color: #ef476f; }
    .ctx-divider { height: 1px; background: rgba(255,255,255,0.1); margin: 4px 0; }
  `],
})
export class FileTreeComponent implements OnInit, OnDestroy {
  rootNodes: FileNode[] = FILE_TREE

  expanded: WritableSignal<Set<string>>
  selected: WritableSignal<string>
  ctxMenu: WritableSignal<{ nodeId: string; x: number; y: number } | null>

  constructor(private pulse: PulseService) {
    this.expanded = pulse.signal(expandedNodes)
    this.selected = pulse.signal(selectedNode)
    this.ctxMenu = pulse.signal(contextMenuState)
  }

  ngOnInit(): void {
    (window as any).__pulseEngine = engine
  }

  ngOnDestroy(): void {
    (window as any).__pulseEngine = null
    engine.destroy()
  }

  isExpanded(id: string): boolean {
    return this.expanded().has(id)
  }

  onNodeClick(node: FileNode, e: MouseEvent): void {
    e.stopPropagation()
    this.pulse.emit(SelectNode, node.id)
    if (node.type === 'folder') {
      this.pulse.emit(ToggleNode, node.id)
    }
  }

  onContextMenu(node: FileNode, e: MouseEvent): void {
    e.preventDefault()
    e.stopPropagation()
    this.pulse.emit(SelectNode, node.id)
    this.pulse.emit(ContextMenu, { nodeId: node.id, x: e.clientX, y: e.clientY })
  }

  closeContextMenu(): void {
    if (this.ctxMenu()) {
      this.pulse.emit(ContextMenu, null)
    }
  }

  onKeyDown(e: KeyboardEvent): void {
    switch (e.key) {
      case 'ArrowUp': e.preventDefault(); this.pulse.emit(KeyboardNav, 'up'); break
      case 'ArrowDown': e.preventDefault(); this.pulse.emit(KeyboardNav, 'down'); break
      case 'ArrowLeft': e.preventDefault(); this.pulse.emit(KeyboardNav, 'left'); break
      case 'ArrowRight': e.preventDefault(); this.pulse.emit(KeyboardNav, 'right'); break
      case 'Enter': this.pulse.emit(KeyboardNav, 'enter'); break
    }
  }
}

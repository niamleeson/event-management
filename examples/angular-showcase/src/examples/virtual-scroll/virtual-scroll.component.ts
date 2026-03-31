import { Component, type WritableSignal, OnInit, OnDestroy, AfterViewInit, computed } from '@angular/core'
import { providePulse, PulseService } from '@pulse/angular'
import { engine, TOTAL_ITEMS, ITEM_HEIGHT, ScrollTo, ScrollTopChanged, ItemsChanged, TotalLoadedChanged, LoadingPagesChanged, type VirtualItem } from './engine'

@Component({
  selector: 'app-virtual-scroll',
  standalone: true,
  providers: [providePulse(engine), PulseService],
  template: `
    <div class="page">
      <h1 class="title">Virtual Scroll</h1><p class="subtitle">10,000 items with virtual rendering. Async page loading with prefetch.</p>
      <div class="stats"><span>Total: {{ total }}</span><span>Loaded: {{ loaded() }}</span><span>Loading: {{ loadingCount() }} pages</span><span>Scroll: {{ scroll().toFixed(0) }}px</span></div>
      <div class="viewport" (scroll)="onScroll($event)">
        <div class="spacer" [style.height.px]="totalHeight"></div>
        <div class="items" [style.transform]="'translateY(' + offsetY() + 'px)'">
          @for (item of visibleItems(); track item.id) {
            <div class="item" [class.skeleton]="item.status === 'skeleton'" [class.loading]="item.status === 'loading'">
              @if (item.status === 'loaded') { <span class="item-id">#{{ item.id + 1 }}</span><span class="item-title">{{ item.title }}</span><span class="item-desc">{{ item.description }}</span> } @else { <div class="skeleton-line short"></div><div class="skeleton-line"></div><div class="skeleton-line long"></div> }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { min-height: 100vh; background: #f8f9fa; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; }
    .title { font-size: 28px; font-weight: 800; color: #1a1a2e; margin-bottom: 8px; } .subtitle { color: #6c757d; font-size: 14px; margin-bottom: 16px; }
    .stats { display: flex; gap: 20px; margin-bottom: 16px; font-size: 13px; color: #495057; } .stats span { background: #e9ecef; padding: 4px 10px; border-radius: 6px; }
    .viewport { width: 600px; height: 600px; overflow-y: auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); position: relative; }
    .spacer { width: 100%; } .items { position: absolute; top: 0; left: 0; right: 0; }
    .item { height: 60px; display: flex; align-items: center; gap: 12px; padding: 0 20px; border-bottom: 1px solid #f1f3f5; font-size: 14px; }
    .item-id { color: #4361ee; font-weight: 700; min-width: 50px; } .item-title { font-weight: 600; color: #1a1a2e; min-width: 100px; } .item-desc { color: #6c757d; }
    .item.skeleton, .item.loading { opacity: 0.6; }
    .skeleton-line { height: 12px; background: #e9ecef; border-radius: 4px; animation: shimmer 1.5s infinite; }
    .skeleton-line.short { width: 50px; } .skeleton-line.long { width: 200px; } .skeleton-line:not(.short):not(.long) { width: 100px; }
    @keyframes shimmer { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
  `],
})
export class VirtualScrollComponent implements OnInit, OnDestroy, AfterViewInit {
  total = TOTAL_ITEMS; totalHeight = TOTAL_ITEMS * ITEM_HEIGHT
  scroll = this.pulse.use(ScrollTopChanged, 0)
  loaded = this.pulse.use(TotalLoadedChanged, 0)
  itemMap = this.pulse.use(ItemsChanged, new Map<number, VirtualItem>())
  loadingPgs = this.pulse.use(LoadingPagesChanged, new Set<number>())
  loadingCount = computed(() => this.loadingPgs().size)
  visibleItems = computed(() => {
    const st = this.scroll(), startIdx = Math.floor(st / ITEM_HEIGHT), visibleCount = Math.ceil(600 / ITEM_HEIGHT) + 2
    const result: VirtualItem[] = [], map = this.itemMap()
    for (let i = startIdx; i < startIdx + visibleCount && i < TOTAL_ITEMS; i++) result.push(map.get(i) || { id: i, title: '', description: '', status: 'skeleton' })
    return result
  })
  offsetY = computed(() => Math.floor(this.scroll() / ITEM_HEIGHT) * ITEM_HEIGHT)

  constructor(private pulse: PulseService) {}
  ngOnInit(): void { (window as any).__pulseEngine = engine }
  ngOnDestroy(): void { (window as any).__pulseEngine = null; engine.destroy() }
  ngAfterViewInit(): void { this.pulse.emit(ScrollTo, 0) }
  onScroll(e: Event): void { this.pulse.emit(ScrollTo, (e.target as HTMLElement).scrollTop) }
}

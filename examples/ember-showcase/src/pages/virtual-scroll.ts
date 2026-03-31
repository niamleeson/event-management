import { engine, TOTAL_ITEMS, ITEM_HEIGHT, ScrollTo, SearchChanged, getScrollTop, getSearchQuery, getLoadedItems, getTotalLoadedCount, getVisibleRange, ensureLoaded, StateChanged } from '../engines/virtual-scroll'

export function mount(container: HTMLElement): () => void {
  ;(window as any).__pulseEngine = engine
  const unsubs: (() => void)[] = []
  const wrapper = document.createElement('div'); wrapper.style.cssText = 'max-width: 700px; margin: 0 auto; padding: 32px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;'
  wrapper.innerHTML = `<h2 style="font-size: 28px; font-weight: 800; color: #1a1a2e; margin-bottom: 4px;">Virtual Scroll</h2><p style="color: #666; font-size: 14px; margin-bottom: 16px;">10K items, virtual render, prefetch batches on scroll.</p>`
  const statsEl = document.createElement('div'); statsEl.style.cssText = 'font-size: 13px; color: #667085; margin-bottom: 12px;'; wrapper.appendChild(statsEl)
  const viewport = document.createElement('div'); viewport.style.cssText = 'height: 500px; overflow-y: auto; border: 1px solid #e4e7ec; border-radius: 8px; position: relative;'
  const scrollContent = document.createElement('div'); scrollContent.style.cssText = `height: ${TOTAL_ITEMS * ITEM_HEIGHT}px; position: relative;`
  const visibleContainer = document.createElement('div'); visibleContainer.style.cssText = 'position: absolute; top: 0; left: 0; right: 0;'
  scrollContent.appendChild(visibleContainer); viewport.appendChild(scrollContent); wrapper.appendChild(viewport)
  viewport.addEventListener('scroll', () => engine.emit(ScrollTo, viewport.scrollTop))
  container.appendChild(wrapper)

  function render() {
    const scrollPos = getScrollTop(); const { start, end } = getVisibleRange(scrollPos, 500)
    ensureLoaded(start, end); const loaded = getLoadedItems()
    visibleContainer.innerHTML = ''; visibleContainer.style.top = `${start * ITEM_HEIGHT}px`
    for (let i = start; i <= end; i++) {
      const item = loaded.get(i); const row = document.createElement('div')
      row.style.cssText = `height: ${ITEM_HEIGHT}px; display: flex; align-items: center; padding: 0 16px; border-bottom: 1px solid #f0f2f5; font-size: 14px; color: #344054;`
      if (item) row.innerHTML = `<div style="flex: 1;"><div style="font-weight: 600;">${item.title}</div><div style="font-size: 12px; color: #98a2b3;">${item.subtitle}</div></div>`
      else row.innerHTML = `<div style="color: #98a2b3;">Loading item ${i + 1}...</div>`
      visibleContainer.appendChild(row)
    }
    statsEl.textContent = `Loaded: ${getTotalLoadedCount()} / ${TOTAL_ITEMS} | Visible: ${start}-${end} | Scroll: ${Math.round(scrollPos)}px`
  }
  unsubs.push(engine.on(StateChanged, () => render())); render()
  return () => { ;(window as any).__pulseEngine = null; engine.destroy(); unsubs.forEach((u) => u()) }
}

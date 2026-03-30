import {
  engine,
  TOTAL_ITEMS,
  ITEM_HEIGHT,
  ScrollTo,
  SearchChanged,
  loadedItems,
  totalLoadedCount,
  scrollTop,
  searchQuery,
  getVisibleRange,
  ensureLoaded,
} from '../engines/virtual-scroll'

export function mount(container: HTMLElement): () => void {
  ;(window as any).__pulseEngine = engine

  const unsubs: (() => void)[] = []

  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'max-width: 700px; margin: 0 auto; padding: 32px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;'

  // Header
  const h1 = document.createElement('h2')
  h1.style.cssText = 'font-size: 28px; font-weight: 800; color: #1a1a2e; margin-bottom: 4px;'
  h1.textContent = 'Virtual Scroll'
  const sub = document.createElement('p')
  sub.style.cssText = 'color: #666; font-size: 14px; margin-bottom: 16px;'
  sub.textContent = `${TOTAL_ITEMS.toLocaleString()} items with virtual rendering. Only visible items are in the DOM. Batches load on demand.`
  wrapper.appendChild(h1)
  wrapper.appendChild(sub)

  // Stats
  const stats = document.createElement('div')
  stats.style.cssText = 'display: flex; gap: 16px; margin-bottom: 16px; font-size: 13px; color: #667085;'
  const statItems = document.createElement('span')
  const statLoaded = document.createElement('span')
  const statVisible = document.createElement('span')
  stats.appendChild(statItems)
  stats.appendChild(statLoaded)
  stats.appendChild(statVisible)
  wrapper.appendChild(stats)

  // Scroll viewport
  const VIEWPORT_HEIGHT = 500
  const viewport = document.createElement('div')
  viewport.style.cssText = `height: ${VIEWPORT_HEIGHT}px; overflow-y: auto; border: 1px solid #e4e7ec; border-radius: 10px; position: relative; background: #fff;`

  // Spacer for total height
  const spacer = document.createElement('div')
  spacer.style.cssText = `height: ${TOTAL_ITEMS * ITEM_HEIGHT}px; position: relative;`

  // Visible items container
  const visibleContainer = document.createElement('div')
  visibleContainer.style.cssText = 'position: absolute; left: 0; right: 0;'

  spacer.appendChild(visibleContainer)
  viewport.appendChild(spacer)
  wrapper.appendChild(viewport)

  container.appendChild(wrapper)

  viewport.addEventListener('scroll', () => {
    engine.emit(ScrollTo, viewport.scrollTop)
  })

  // Render visible items
  function renderVisible() {
    const scroll = scrollTop.value
    const { start, end } = getVisibleRange(scroll, VIEWPORT_HEIGHT)
    const loaded = loadedItems.value

    // Ensure items in range are loaded
    ensureLoaded(start, end)

    visibleContainer.innerHTML = ''
    visibleContainer.style.top = `${start * ITEM_HEIGHT}px`

    let visibleCount = 0

    for (let i = start; i <= end; i++) {
      const item = loaded.get(i)
      const row = document.createElement('div')
      row.style.cssText = `height: ${ITEM_HEIGHT}px; display: flex; align-items: center; padding: 0 16px; border-bottom: 1px solid #f0f2f5;`

      if (item) {
        const idx = document.createElement('div')
        idx.style.cssText = 'width: 60px; font-size: 12px; color: #98a2b3; font-weight: 600;'
        idx.textContent = `#${item.id + 1}`

        const info = document.createElement('div')
        info.style.cssText = 'flex: 1;'
        const title = document.createElement('div')
        title.style.cssText = 'font-size: 14px; font-weight: 600; color: #1a1a2e;'
        title.textContent = item.title
        const subtitle = document.createElement('div')
        subtitle.style.cssText = 'font-size: 12px; color: #98a2b3;'
        subtitle.textContent = item.subtitle
        info.appendChild(title)
        info.appendChild(subtitle)

        row.appendChild(idx)
        row.appendChild(info)
        visibleCount++
      } else {
        // Loading placeholder
        const placeholder = document.createElement('div')
        placeholder.style.cssText = 'display: flex; gap: 8px; align-items: center; width: 100%;'
        const bar1 = document.createElement('div')
        bar1.style.cssText = 'width: 40px; height: 12px; background: #e4e7ec; border-radius: 4px;'
        const bar2 = document.createElement('div')
        bar2.style.cssText = 'width: 200px; height: 12px; background: #e4e7ec; border-radius: 4px;'
        placeholder.appendChild(bar1)
        placeholder.appendChild(bar2)
        row.appendChild(placeholder)
      }

      visibleContainer.appendChild(row)
    }

    statItems.textContent = `Total: ${TOTAL_ITEMS.toLocaleString()}`
    statLoaded.textContent = `Loaded: ${totalLoadedCount.value}`
    statVisible.textContent = `Visible: ${visibleCount} (${start}-${end})`
  }

  // Subscribe to changes
  unsubs.push(scrollTop.subscribe(() => renderVisible()))
  unsubs.push(loadedItems.subscribe(() => renderVisible()))

  // Initial load
  ensureLoaded(0, Math.ceil(VIEWPORT_HEIGHT / ITEM_HEIGHT) + 5)
  renderVisible()

  return () => {
    ;(window as any).__pulseEngine = null
    engine.destroy()
    unsubs.forEach((u) => u())
    container.removeChild(wrapper)
  }
}

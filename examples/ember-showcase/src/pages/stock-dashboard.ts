import {
  engine,
  ToggleFeed,
  DismissAlert,
  SelectStock,
  stocks,
  alerts,
  feedRunning,
  selectedStock,
  startFeed,
  stopFeed,
} from '../engines/stock-dashboard'

export function mount(container: HTMLElement): () => void {
  ;(window as any).__pulseEngine = engine

  const unsubs: (() => void)[] = []

  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'max-width: 900px; margin: 0 auto; padding: 32px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0d1117; min-height: 100vh; color: #e0e0e0;'

  // Header
  const h1 = document.createElement('h2')
  h1.style.cssText = 'font-size: 28px; font-weight: 800; color: #fff; margin-bottom: 4px;'
  h1.textContent = 'Stock Dashboard'
  const sub = document.createElement('p')
  sub.style.cssText = 'color: rgba(255,255,255,0.5); font-size: 14px; margin-bottom: 16px;'
  sub.textContent = '8 stocks with live updates, sparkline charts, threshold alerts, and dark theme.'
  wrapper.appendChild(h1)
  wrapper.appendChild(sub)

  // Controls
  const controls = document.createElement('div')
  controls.style.cssText = 'display: flex; gap: 8px; margin-bottom: 16px;'
  const feedBtn = document.createElement('button')
  feedBtn.style.cssText = 'padding: 8px 16px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px;'
  feedBtn.addEventListener('click', () => engine.emit(ToggleFeed, undefined))
  controls.appendChild(feedBtn)
  wrapper.appendChild(controls)

  // Stock grid
  const stockGrid = document.createElement('div')
  stockGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin-bottom: 20px;'
  wrapper.appendChild(stockGrid)

  // Alerts panel
  const alertsPanel = document.createElement('div')
  alertsPanel.style.cssText = 'background: #161b22; border: 1px solid #30363d; border-radius: 10px; padding: 16px; margin-bottom: 16px;'
  const alertsTitle = document.createElement('div')
  alertsTitle.style.cssText = 'font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 12px;'
  alertsTitle.textContent = 'Alerts'
  alertsPanel.appendChild(alertsTitle)
  const alertsList = document.createElement('div')
  alertsPanel.appendChild(alertsList)
  wrapper.appendChild(alertsPanel)

  // Detail panel
  const detailPanel = document.createElement('div')
  detailPanel.style.cssText = 'background: #161b22; border: 1px solid #30363d; border-radius: 10px; padding: 16px;'
  wrapper.appendChild(detailPanel)

  container.appendChild(wrapper)

  startFeed()

  function render() {
    const stockList = stocks.value
    const sel = selectedStock.value
    const running = feedRunning.value

    feedBtn.textContent = running ? 'Pause Feed' : 'Resume Feed'
    feedBtn.style.background = running ? '#e63946' : '#2a9d8f'
    feedBtn.style.color = '#fff'

    // Stock cards
    stockGrid.innerHTML = ''
    for (const stock of stockList) {
      const card = document.createElement('div')
      const isUp = stock.change >= 0
      const isSelected = sel === stock.symbol

      card.style.cssText = `background: ${isSelected ? '#1c2333' : '#161b22'}; border: 1px solid ${isSelected ? stock.color : '#30363d'}; border-radius: 10px; padding: 14px; cursor: pointer; transition: border-color 0.2s;`

      card.addEventListener('click', () => engine.emit(SelectStock, stock.symbol))

      // Symbol and name
      const header = document.createElement('div')
      header.style.cssText = 'display: flex; justify-content: space-between; margin-bottom: 8px;'
      const symbolEl = document.createElement('div')
      symbolEl.style.cssText = `font-size: 14px; font-weight: 800; color: ${stock.color};`
      symbolEl.textContent = stock.symbol
      const nameEl = document.createElement('div')
      nameEl.style.cssText = 'font-size: 11px; color: #8b949e;'
      nameEl.textContent = stock.name
      header.appendChild(symbolEl)
      header.appendChild(nameEl)
      card.appendChild(header)

      // Price
      const priceEl = document.createElement('div')
      priceEl.style.cssText = 'font-size: 22px; font-weight: 800; color: #fff; margin-bottom: 4px;'
      priceEl.textContent = `$${stock.price.toFixed(2)}`
      card.appendChild(priceEl)

      // Change
      const changeEl = document.createElement('div')
      changeEl.style.cssText = `font-size: 12px; font-weight: 600; color: ${isUp ? '#3fb950' : '#f85149'}; margin-bottom: 8px;`
      changeEl.textContent = `${isUp ? '+' : ''}${stock.change.toFixed(2)} (${isUp ? '+' : ''}${stock.changePercent.toFixed(2)}%)`
      card.appendChild(changeEl)

      // Sparkline
      if (stock.history.length > 1) {
        const sparkline = document.createElement('div')
        sparkline.style.cssText = 'display: flex; align-items: flex-end; gap: 1px; height: 32px;'
        const min = Math.min(...stock.history)
        const max = Math.max(...stock.history)
        const range = max - min || 1

        for (const val of stock.history) {
          const bar = document.createElement('div')
          const h = Math.max(2, ((val - min) / range) * 28)
          bar.style.cssText = `flex: 1; height: ${h}px; background: ${stock.color}; border-radius: 1px; opacity: 0.6;`
          sparkline.appendChild(bar)
        }
        card.appendChild(sparkline)
      }

      // Alert threshold badge
      if (stock.alertThreshold !== null) {
        const badge = document.createElement('div')
        badge.style.cssText = 'font-size: 10px; color: #8b949e; margin-top: 6px;'
        badge.textContent = `Alert: $${stock.alertThreshold}`
        card.appendChild(badge)
      }

      stockGrid.appendChild(card)
    }

    // Alerts list
    const alertList = alerts.value
    alertsList.innerHTML = ''
    if (alertList.length === 0) {
      const empty = document.createElement('div')
      empty.style.cssText = 'color: #8b949e; font-size: 13px;'
      empty.textContent = 'No alerts triggered yet.'
      alertsList.appendChild(empty)
    } else {
      for (const alert of alertList.slice(0, 10)) {
        const el = document.createElement('div')
        el.style.cssText = `display: flex; align-items: center; gap: 8px; padding: 6px 10px; margin-bottom: 4px; background: ${alert.type === 'above' ? 'rgba(248,81,73,0.1)' : 'rgba(63,185,80,0.1)'}; border-radius: 6px; font-size: 12px;`

        const arrow = document.createElement('span')
        arrow.textContent = alert.type === 'above' ? '\u2191' : '\u2193'
        arrow.style.color = alert.type === 'above' ? '#f85149' : '#3fb950'
        const msg = document.createElement('span')
        msg.style.cssText = 'flex: 1; color: #e0e0e0;'
        msg.textContent = `${alert.symbol} ${alert.type === 'above' ? 'above' : 'below'} $${alert.threshold} at $${alert.price.toFixed(2)}`
        const dismiss = document.createElement('button')
        dismiss.style.cssText = 'background: none; border: none; color: #8b949e; cursor: pointer; font-size: 14px; padding: 0 4px;'
        dismiss.textContent = '\u00D7'
        dismiss.addEventListener('click', () => engine.emit(DismissAlert, alert.id))

        el.appendChild(arrow)
        el.appendChild(msg)
        el.appendChild(dismiss)
        alertsList.appendChild(el)
      }
    }

    // Detail panel
    if (sel) {
      const stock = stockList.find((s) => s.symbol === sel)
      if (stock) {
        detailPanel.innerHTML = `
          <div style="font-size: 18px; font-weight: 800; color: ${stock.color}; margin-bottom: 8px;">${stock.symbol} — ${stock.name}</div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; font-size: 13px;">
            <div><span style="color: #8b949e;">Price</span><br><strong>$${stock.price.toFixed(2)}</strong></div>
            <div><span style="color: #8b949e;">Change</span><br><strong style="color: ${stock.change >= 0 ? '#3fb950' : '#f85149'};">${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}</strong></div>
            <div><span style="color: #8b949e;">History</span><br><strong>${stock.history.length} pts</strong></div>
          </div>
        `
      }
    } else {
      detailPanel.innerHTML = '<div style="color: #8b949e; font-size: 13px;">Click a stock to see details.</div>'
    }
  }

  unsubs.push(stocks.subscribe(() => render()))
  unsubs.push(alerts.subscribe(() => render()))
  unsubs.push(feedRunning.subscribe(() => render()))
  unsubs.push(selectedStock.subscribe(() => render()))

  render()

  return () => {
    ;(window as any).__pulseEngine = null
    stopFeed()
    unsubs.forEach((u) => u())
    container.removeChild(wrapper)
  }
}

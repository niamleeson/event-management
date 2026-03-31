import { engine, ToggleFeed, DismissAlert, SelectStock, SetAlertThreshold, getStocks, getAlerts, getFeedRunning, getSelectedStock, startFeed, stopFeed, StocksChanged, AlertsChanged } from '../engines/stock-dashboard'

export function mount(container: HTMLElement): () => void {
  ;(window as any).__pulseEngine = engine
  const unsubs: (() => void)[] = []
  const wrapper = document.createElement('div'); wrapper.style.cssText = 'max-width: 1100px; margin: 0 auto; padding: 32px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0a0a1a; min-height: 100vh; color: #e2e8f0;'
  wrapper.innerHTML = `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;"><div><h2 style="font-size: 28px; font-weight: 800; color: #f1f5f9; margin: 0;">Stock Dashboard</h2><p style="color: #64748b; font-size: 14px; margin-top: 4px;">8 stocks, sparklines, alerts, live feed.</p></div></div>`
  const toggleBtn = document.createElement('button'); toggleBtn.style.cssText = 'padding: 8px 20px; border: none; border-radius: 8px; color: #fff; font-weight: 600; cursor: pointer;'
  toggleBtn.addEventListener('click', () => engine.emit(ToggleFeed, undefined)); wrapper.firstElementChild!.appendChild(toggleBtn)

  const stocksGrid = document.createElement('div'); stocksGrid.style.cssText = 'display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px;'; wrapper.appendChild(stocksGrid)
  const alertsList = document.createElement('div'); alertsList.style.cssText = 'margin-top: 16px;'
  wrapper.innerHTML += '<h3 style="font-size: 16px; font-weight: 700; color: #f1f5f9; margin-bottom: 12px;">Alerts</h3>'
  wrapper.appendChild(alertsList)
  container.appendChild(wrapper)

  function renderStocks() {
    const stocks = getStocks(); const selected = getSelectedStock(); const running = getFeedRunning()
    toggleBtn.textContent = running ? 'Pause' : 'Resume'; toggleBtn.style.background = running ? '#ef4444' : '#10b981'
    stocksGrid.innerHTML = ''
    for (const stock of stocks) {
      const isSelected = selected === stock.symbol; const up = stock.change >= 0
      const card = document.createElement('div'); card.style.cssText = `background: #111827; border: 1px solid ${isSelected ? stock.color : '#1e293b'}; border-radius: 12px; padding: 16px; cursor: pointer; transition: border-color 0.2s;`
      card.addEventListener('click', () => engine.emit(SelectStock, stock.symbol === selected ? null : stock.symbol))
      card.innerHTML = `<div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span style="font-weight: 700; color: ${stock.color};">${stock.symbol}</span><span style="font-size: 12px; color: #64748b;">${stock.name}</span></div><div style="font-size: 24px; font-weight: 800; color: #f1f5f9; margin-bottom: 4px;">$${stock.price.toFixed(2)}</div><div style="font-size: 13px; color: ${up ? '#10b981' : '#ef4444'};">${up ? '+' : ''}${stock.change.toFixed(2)} (${stock.changePercent.toFixed(2)}%)</div>`
      // Sparkline
      if (stock.history.length > 1) {
        const canvas = document.createElement('canvas'); canvas.width = 200; canvas.height = 40; canvas.style.cssText = 'width: 100%; height: 40px; margin-top: 8px;'
        const ctx = canvas.getContext('2d')!; const h = stock.history; const min = Math.min(...h); const max = Math.max(...h); const range = max - min || 1
        ctx.strokeStyle = stock.color; ctx.lineWidth = 1.5; ctx.beginPath()
        for (let i = 0; i < h.length; i++) { const x = (i / (h.length - 1)) * 200; const y = 40 - ((h[i] - min) / range) * 36; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y) }
        ctx.stroke(); card.appendChild(canvas)
      }
      stocksGrid.appendChild(card)
    }
  }

  function renderAlerts() {
    const alerts = getAlerts(); alertsList.innerHTML = ''
    if (alerts.length === 0) { alertsList.innerHTML = '<div style="color: #334155; font-size: 14px; text-align: center; padding: 24px;">No alerts</div>'; return }
    for (const alert of alerts) {
      const card = document.createElement('div'); card.style.cssText = 'background: #1a0a0a; border: 1px solid #7f1d1d; border-radius: 8px; padding: 12px 16px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;'
      card.innerHTML = `<span style="color: #fca5a5; font-size: 14px;">${alert.symbol} ${alert.type === 'above' ? 'above' : 'below'} $${alert.threshold} (now $${alert.price.toFixed(2)})</span><span style="font-size: 12px; color: #7f1d1d;">${new Date(alert.timestamp).toLocaleTimeString()}</span>`
      const dismissBtn = document.createElement('button'); dismissBtn.style.cssText = 'border: none; background: none; color: #7f1d1d; cursor: pointer; font-size: 16px; margin-left: 8px;'; dismissBtn.textContent = '\u00D7'
      dismissBtn.addEventListener('click', () => engine.emit(DismissAlert, alert.id)); card.appendChild(dismissBtn); alertsList.appendChild(card)
    }
  }

  unsubs.push(engine.on(StocksChanged, () => renderStocks())); unsubs.push(engine.on(AlertsChanged, () => renderAlerts()))
  startFeed(); renderStocks(); renderAlerts()
  return () => { ;(window as any).__pulseEngine = null; engine.destroy(); stopFeed(); unsubs.forEach((u) => u()) }
}

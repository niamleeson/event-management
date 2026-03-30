// ---- Value Inspector Component ----
// Displays current values of signals, tweens, and springs.

import { el, formatPayload, cleanName, clearChildren } from '../utils.js'
import type { PulseEngine } from '../types.js'

export interface InspectorComponent {
  element: HTMLElement
  update(): void
  destroy(): void
}

export function createInspectorComponent(engine: PulseEngine): InspectorComponent {
  const wrapper = el('div')

  // Sections
  const signalsSection = el('div', { cls: 'pd-inspector-section' })
  const tweensSection = el('div', { cls: 'pd-inspector-section' })
  const springsSection = el('div', { cls: 'pd-inspector-section' })

  wrapper.appendChild(signalsSection)
  wrapper.appendChild(tweensSection)
  wrapper.appendChild(springsSection)

  function update(): void {
    renderSignals()
    renderTweens()
    renderSprings()
  }

  function renderSignals(): void {
    clearChildren(signalsSection)

    let signals: Array<{ _eventType: { name: string }; value: any }>
    try {
      signals = engine.getSignals()
    } catch {
      signals = []
    }

    const heading = el('div', { cls: 'pd-inspector-heading' })
    heading.appendChild(document.createTextNode('Signals'))
    heading.appendChild(el('span', { cls: 'pd-inspector-heading-count', text: String(signals.length) }))
    signalsSection.appendChild(heading)

    if (signals.length === 0) {
      signalsSection.appendChild(el('div', { cls: 'pd-inspector-empty', text: 'No signals registered.' }))
      return
    }

    const table = el('table', { cls: 'pd-inspector-table' })
    const thead = el('thead')
    const headerRow = el('tr')
    headerRow.appendChild(el('th', { text: 'Name' }))
    headerRow.appendChild(el('th', { text: 'Value' }))
    headerRow.appendChild(el('th', { text: 'Type' }))
    thead.appendChild(headerRow)
    table.appendChild(thead)

    const tbody = el('tbody')
    for (const signal of signals) {
      const row = el('tr')
      const name = signal._eventType ? cleanName(signal._eventType.name) : '(unknown)'
      row.appendChild(el('td', { cls: 'pd-inspector-name', text: name, attrs: { title: name } }))

      const valueStr = formatPayload(signal.value, 60)
      row.appendChild(el('td', { cls: 'pd-inspector-value', text: valueStr, attrs: { title: formatPayload(signal.value, 500) } }))

      const typeStr = signal.value === null ? 'null' : typeof signal.value
      row.appendChild(el('td', { text: typeStr, style: { color: 'var(--pd-text-dim)', fontSize: '11px' } }))

      tbody.appendChild(row)
    }
    table.appendChild(tbody)
    signalsSection.appendChild(table)
  }

  function renderTweens(): void {
    clearChildren(tweensSection)

    let tweens: Array<{ value: number; active: boolean; progress: number }>
    try {
      tweens = engine.getTweens()
    } catch {
      tweens = []
    }

    const heading = el('div', { cls: 'pd-inspector-heading' })
    heading.appendChild(document.createTextNode('Tweens'))
    heading.appendChild(el('span', { cls: 'pd-inspector-heading-count', text: String(tweens.length) }))
    tweensSection.appendChild(heading)

    if (tweens.length === 0) {
      tweensSection.appendChild(el('div', { cls: 'pd-inspector-empty', text: 'No tweens registered.' }))
      return
    }

    const table = el('table', { cls: 'pd-inspector-table' })
    const thead = el('thead')
    const headerRow = el('tr')
    headerRow.appendChild(el('th', { text: '#' }))
    headerRow.appendChild(el('th', { text: 'Value' }))
    headerRow.appendChild(el('th', { text: 'Progress' }))
    headerRow.appendChild(el('th', { text: 'Status' }))
    thead.appendChild(headerRow)
    table.appendChild(thead)

    const tbody = el('tbody')
    for (let i = 0; i < tweens.length; i++) {
      const tween = tweens[i]
      const row = el('tr')

      row.appendChild(el('td', { cls: 'pd-inspector-name', text: `tween[${i}]` }))
      row.appendChild(el('td', { cls: 'pd-inspector-value', text: tween.value.toFixed(3) }))

      // Progress bar cell
      const progressCell = el('td')
      const progressBar = el('div', { cls: 'pd-progress-bar' })
      const progressFill = el('div', {
        cls: ['pd-progress-fill', tween.active ? 'pd-tween-active' : ''],
        style: { width: `${(tween.progress * 100).toFixed(1)}%` },
      })
      progressBar.appendChild(progressFill)
      progressCell.appendChild(progressBar)
      const progressLabel = el('span', {
        text: `${(tween.progress * 100).toFixed(0)}%`,
        style: { fontSize: '10px', color: 'var(--pd-text-dim)', fontFamily: 'var(--pd-mono)' },
      })
      progressCell.appendChild(progressLabel)
      row.appendChild(progressCell)

      // Status
      const statusText = tween.active ? 'Active' : 'Idle'
      const statusColor = tween.active ? 'var(--pd-green)' : 'var(--pd-text-dim)'
      row.appendChild(el('td', { text: statusText, style: { color: statusColor, fontWeight: '500', fontSize: '11px' } }))

      tbody.appendChild(row)
    }
    table.appendChild(tbody)
    tweensSection.appendChild(table)
  }

  function renderSprings(): void {
    clearChildren(springsSection)

    let springs: Array<{ value: number; velocity: number; settled: boolean }>
    try {
      springs = engine.getSprings()
    } catch {
      springs = []
    }

    const heading = el('div', { cls: 'pd-inspector-heading' })
    heading.appendChild(document.createTextNode('Springs'))
    heading.appendChild(el('span', { cls: 'pd-inspector-heading-count', text: String(springs.length) }))
    springsSection.appendChild(heading)

    if (springs.length === 0) {
      springsSection.appendChild(el('div', { cls: 'pd-inspector-empty', text: 'No springs registered.' }))
      return
    }

    const table = el('table', { cls: 'pd-inspector-table' })
    const thead = el('thead')
    const headerRow = el('tr')
    headerRow.appendChild(el('th', { text: '#' }))
    headerRow.appendChild(el('th', { text: 'Value' }))
    headerRow.appendChild(el('th', { text: 'Velocity' }))
    headerRow.appendChild(el('th', { text: 'Status' }))
    thead.appendChild(headerRow)
    table.appendChild(thead)

    const tbody = el('tbody')
    for (let i = 0; i < springs.length; i++) {
      const spring = springs[i]
      const row = el('tr')

      row.appendChild(el('td', { cls: 'pd-inspector-name', text: `spring[${i}]` }))
      row.appendChild(el('td', { cls: 'pd-inspector-value', text: spring.value.toFixed(3) }))

      // Velocity indicator
      const velCell = el('td')
      const velWrapper = el('span', { cls: 'pd-spring-velocity' })
      const velLabel = el('span', {
        text: spring.velocity.toFixed(2),
        style: { fontFamily: 'var(--pd-mono)', fontSize: '11px' },
      })

      const indicator = el('span', { cls: 'pd-spring-indicator' })
      // Map velocity to visual width (clamp to [-1, 1] range for display)
      const normalizedVel = Math.max(-1, Math.min(1, spring.velocity / 10))
      const fillWidth = Math.abs(normalizedVel) * 50
      const fillLeft = normalizedVel >= 0 ? 50 : 50 - fillWidth
      const fill = el('span', {
        cls: 'pd-spring-indicator-fill',
        style: { left: `${fillLeft}%`, width: `${fillWidth}%` },
      })
      indicator.appendChild(fill)
      velWrapper.appendChild(velLabel)
      velWrapper.appendChild(indicator)
      velCell.appendChild(velWrapper)
      row.appendChild(velCell)

      // Settled status
      if (spring.settled) {
        row.appendChild(el('td', { cls: 'pd-spring-settled', text: 'Settled' }))
      } else {
        row.appendChild(el('td', { text: 'Moving', style: { color: 'var(--pd-orange)', fontWeight: '500', fontSize: '11px' } }))
      }

      tbody.appendChild(row)
    }
    table.appendChild(tbody)
    springsSection.appendChild(table)
  }

  // Initial render
  update()

  function destroy(): void {
    wrapper.innerHTML = ''
  }

  return {
    element: wrapper,
    update,
    destroy,
  }
}

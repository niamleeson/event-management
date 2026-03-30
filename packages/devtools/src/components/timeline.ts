// ---- Event Timeline Component ----
// Chronological log of events emitted, consumed, and propagation cycles.

import { el, formatPayload, prettyJSON, formatTimestamp, hashColor, cleanName, clearChildren } from '../utils.js'

export interface TimelineEntry {
  id: number
  kind: 'event' | 'consume' | 'cycle-start' | 'cycle-end'
  timestamp: number
  eventType?: string
  payload?: any
  seq?: number
  ruleId?: string
  ruleName?: string
  cycleSeq?: number
  rulesEvaluated?: number
  eventsDeposited?: number
  duration?: number
  /** Rules that consumed this event (populated over time) */
  consumedBy: Array<{ id: string; name: string }>
}

export interface TimelineComponent {
  element: HTMLElement
  addEvent(entry: Omit<TimelineEntry, 'id' | 'consumedBy'>): void
  markConsumed(seq: number, rule: { id: string; name: string }): void
  clear(): void
  destroy(): void
}

const MAX_ENTRIES = 2000

export function createTimelineComponent(): TimelineComponent {
  const wrapper = el('div', { style: { height: '100%', display: 'flex', flexDirection: 'column' } })

  // Toolbar
  const toolbar = el('div', { cls: 'pd-timeline-toolbar' })
  const filterSelect = el('select', { cls: 'pd-timeline-filter' }) as HTMLSelectElement
  const allOption = el('option', { text: 'All Events', attrs: { value: '' } })
  filterSelect.appendChild(allOption)

  const searchInput = el('input', {
    cls: 'pd-timeline-search',
    attrs: { type: 'text', placeholder: 'Search payloads...' },
  }) as HTMLInputElement

  const clearBtn = el('button', { cls: 'pd-timeline-clear-btn', text: 'Clear' })

  toolbar.appendChild(filterSelect)
  toolbar.appendChild(searchInput)
  toolbar.appendChild(clearBtn)

  // List
  const list = el('div', { cls: 'pd-timeline-list' })

  wrapper.appendChild(toolbar)
  wrapper.appendChild(list)

  let entries: TimelineEntry[] = []
  let entryCounter = 0
  let expandedId: number | null = null
  let knownTypes = new Set<string>()
  let filterValue = ''
  let searchValue = ''

  // Wire up filter/search
  filterSelect.addEventListener('change', () => {
    filterValue = filterSelect.value
    renderFiltered()
  })

  searchInput.addEventListener('input', () => {
    searchValue = searchInput.value.toLowerCase()
    renderFiltered()
  })

  clearBtn.addEventListener('click', () => {
    entries = []
    expandedId = null
    clearChildren(list)
  })

  function addEvent(data: Omit<TimelineEntry, 'id' | 'consumedBy'>): void {
    const entry: TimelineEntry = {
      ...data,
      id: entryCounter++,
      consumedBy: [],
    }
    entries.push(entry)

    // Cap entries
    if (entries.length > MAX_ENTRIES) {
      entries = entries.slice(-MAX_ENTRIES)
    }

    // Track event types for filter dropdown
    if (entry.eventType && !knownTypes.has(entry.eventType)) {
      knownTypes.add(entry.eventType)
      const option = el('option', {
        text: cleanName(entry.eventType),
        attrs: { value: entry.eventType },
      })
      filterSelect.appendChild(option)
    }

    if (matchesFilter(entry)) {
      const row = renderEntry(entry)
      list.appendChild(row)
      // Auto-scroll to bottom
      list.scrollTop = list.scrollHeight
    }
  }

  function markConsumed(seq: number, rule: { id: string; name: string }): void {
    // Find the event entry by seq
    for (let i = entries.length - 1; i >= 0; i--) {
      const e = entries[i]
      if (e.kind === 'event' && e.seq === seq) {
        e.consumedBy.push(rule)
        // If currently expanded, re-render detail
        if (expandedId === e.id) {
          const detailEl = list.querySelector(`[data-detail-id="${e.id}"]`)
          if (detailEl) {
            updateDetail(detailEl as HTMLElement, e)
          }
        }
        break
      }
    }
  }

  function matchesFilter(entry: TimelineEntry): boolean {
    if (filterValue && entry.eventType !== filterValue) {
      // Show cycles regardless of filter
      if (entry.kind !== 'cycle-start' && entry.kind !== 'cycle-end') {
        return false
      }
    }
    if (searchValue && entry.kind === 'event') {
      const payloadStr = formatPayload(entry.payload, 500).toLowerCase()
      const typeStr = (entry.eventType ?? '').toLowerCase()
      if (!payloadStr.includes(searchValue) && !typeStr.includes(searchValue)) {
        return false
      }
    }
    return true
  }

  function renderFiltered(): void {
    clearChildren(list)
    expandedId = null
    for (const entry of entries) {
      if (matchesFilter(entry)) {
        list.appendChild(renderEntry(entry))
      }
    }
  }

  function renderEntry(entry: TimelineEntry): HTMLElement {
    if (entry.kind === 'cycle-start' || entry.kind === 'cycle-end') {
      return renderCycleMarker(entry)
    }

    const row = el('div', { cls: 'pd-timeline-entry', attrs: { 'data-entry-id': String(entry.id) } })

    // Colored dot
    const dotColor = entry.eventType ? hashColor(entry.eventType) : '#666'
    const dot = el('span', { cls: 'pd-timeline-dot', style: { backgroundColor: dotColor } })

    // Timestamp
    const time = el('span', { cls: 'pd-timeline-time', text: formatTimestamp(entry.timestamp) })

    // Event type
    const typeLabel = el('span', {
      cls: 'pd-timeline-type',
      text: entry.eventType ? cleanName(entry.eventType) : '',
    })
    if (entry.kind === 'consume') {
      typeLabel.style.opacity = '0.6'
      typeLabel.textContent = `${cleanName(entry.eventType ?? '')} -> ${cleanName(entry.ruleName ?? '')}`
    }

    // Payload preview
    const payloadPreview = el('span', {
      cls: 'pd-timeline-payload',
      text: entry.payload !== undefined ? formatPayload(entry.payload) : '',
    })

    // Seq number
    const seqLabel = el('span', { cls: 'pd-timeline-seq', text: entry.seq !== undefined ? `#${entry.seq}` : '' })

    row.appendChild(dot)
    row.appendChild(time)
    row.appendChild(typeLabel)
    row.appendChild(payloadPreview)
    row.appendChild(seqLabel)

    // Click to expand/collapse
    if (entry.kind === 'event') {
      row.addEventListener('click', () => {
        if (expandedId === entry.id) {
          // Collapse
          const detailEl = row.nextElementSibling
          if (detailEl && detailEl.hasAttribute('data-detail-id')) {
            detailEl.remove()
          }
          expandedId = null
        } else {
          // Collapse previous
          if (expandedId !== null) {
            const prevDetail = list.querySelector(`[data-detail-id="${expandedId}"]`)
            if (prevDetail) prevDetail.remove()
          }
          expandedId = entry.id
          const detail = createDetail(entry)
          row.after(detail)
        }
      })
    }

    return row
  }

  function renderCycleMarker(entry: TimelineEntry): HTMLElement {
    const row = el('div', { cls: 'pd-timeline-cycle' })

    if (entry.kind === 'cycle-start') {
      row.appendChild(el('span', { cls: 'pd-timeline-cycle-label', text: `Cycle #${entry.cycleSeq}` }))
    } else {
      const info: string[] = []
      if (entry.rulesEvaluated !== undefined) info.push(`${entry.rulesEvaluated} rules`)
      if (entry.eventsDeposited !== undefined) info.push(`${entry.eventsDeposited} events`)
      if (entry.duration !== undefined) info.push(`${entry.duration.toFixed(1)}ms`)
      row.appendChild(el('span', { cls: 'pd-timeline-cycle-label', text: `End #${entry.cycleSeq}` }))
      if (info.length > 0) {
        row.appendChild(el('span', { text: info.join(' | ') }))
      }
    }

    return row
  }

  function createDetail(entry: TimelineEntry): HTMLElement {
    const detail = el('div', {
      cls: 'pd-timeline-detail',
      attrs: { 'data-detail-id': String(entry.id) },
    })

    // Full payload
    const payloadLabel = el('div', { cls: 'pd-timeline-detail-label', text: 'Payload' })
    const payloadPre = el('pre', { text: prettyJSON(entry.payload) })
    detail.appendChild(payloadLabel)
    detail.appendChild(payloadPre)

    // Consumed by rules
    if (entry.consumedBy.length > 0) {
      const rulesSection = el('div', { cls: 'pd-timeline-detail-rules' })
      const rulesLabel = el('div', { cls: 'pd-timeline-detail-label', text: 'Consumed By' })
      rulesSection.appendChild(rulesLabel)
      for (const rule of entry.consumedBy) {
        rulesSection.appendChild(
          el('span', { cls: 'pd-timeline-detail-rule-tag', text: cleanName(rule.name) }),
        )
      }
      detail.appendChild(rulesSection)
    }

    return detail
  }

  function updateDetail(detailEl: HTMLElement, entry: TimelineEntry): void {
    // Update consumed-by section
    const existingRules = detailEl.querySelector('.pd-timeline-detail-rules')
    if (existingRules) {
      existingRules.remove()
    }
    if (entry.consumedBy.length > 0) {
      const rulesSection = el('div', { cls: 'pd-timeline-detail-rules' })
      const rulesLabel = el('div', { cls: 'pd-timeline-detail-label', text: 'Consumed By' })
      rulesSection.appendChild(rulesLabel)
      for (const rule of entry.consumedBy) {
        rulesSection.appendChild(
          el('span', { cls: 'pd-timeline-detail-rule-tag', text: cleanName(rule.name) }),
        )
      }
      detailEl.appendChild(rulesSection)
    }
  }

  function clear(): void {
    entries = []
    expandedId = null
    clearChildren(list)
    // Reset filter
    clearChildren(filterSelect)
    filterSelect.appendChild(el('option', { text: 'All Events', attrs: { value: '' } }))
    knownTypes.clear()
    filterValue = ''
    searchValue = ''
    searchInput.value = ''
  }

  function destroy(): void {
    clear()
    wrapper.innerHTML = ''
  }

  return {
    element: wrapper,
    addEvent,
    markConsumed,
    clear,
    destroy,
  }
}

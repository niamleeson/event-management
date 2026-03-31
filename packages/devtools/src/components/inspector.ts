// ---- Inspector Component ----
// Displays event types, mailbox contents, and registered rules.

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
  const eventTypesSection = el('div', { cls: 'pd-inspector-section' })
  const mailboxSection = el('div', { cls: 'pd-inspector-section' })
  const rulesSection = el('div', { cls: 'pd-inspector-section' })

  wrapper.appendChild(eventTypesSection)
  wrapper.appendChild(mailboxSection)
  wrapper.appendChild(rulesSection)

  function update(): void {
    renderEventTypes()
    renderMailboxes()
    renderRules()
  }

  function renderEventTypes(): void {
    clearChildren(eventTypesSection)

    const dag = safeGetDAG()
    const rules = safeGetRules()

    // Count consumers per event type (how many rules are triggered by each event)
    const consumerCount = new Map<string, number>()
    for (const node of dag.nodes) {
      consumerCount.set(node.name, 0)
    }
    for (const rule of rules) {
      for (const t of rule.triggers) {
        const current = consumerCount.get(t.name) ?? 0
        consumerCount.set(t.name, current + 1)
      }
    }

    const heading = el('div', { cls: 'pd-inspector-heading' })
    heading.appendChild(document.createTextNode('Event Types'))
    heading.appendChild(el('span', { cls: 'pd-inspector-heading-count', text: String(consumerCount.size) }))
    eventTypesSection.appendChild(heading)

    if (consumerCount.size === 0) {
      eventTypesSection.appendChild(el('div', { cls: 'pd-inspector-empty', text: 'No event types registered.' }))
      return
    }

    const table = el('table', { cls: 'pd-inspector-table' })
    const thead = el('thead')
    const headerRow = el('tr')
    headerRow.appendChild(el('th', { text: 'Name' }))
    headerRow.appendChild(el('th', { text: 'Consumers' }))
    thead.appendChild(headerRow)
    table.appendChild(thead)

    const tbody = el('tbody')
    const sortedNames = [...consumerCount.keys()].sort()
    for (const name of sortedNames) {
      const row = el('tr')
      row.appendChild(el('td', { cls: 'pd-inspector-name', text: cleanName(name), attrs: { title: name } }))
      row.appendChild(el('td', { cls: 'pd-inspector-value', text: String(consumerCount.get(name)) }))
      tbody.appendChild(row)
    }
    table.appendChild(tbody)
    eventTypesSection.appendChild(table)
  }

  function renderMailboxes(): void {
    clearChildren(mailboxSection)

    let mailboxes: Map<any, { queue: Array<{ payload: any; seq: number }> }>
    try {
      mailboxes = engine.getMailboxes()
    } catch {
      mailboxes = new Map()
    }

    // Count total pending events
    let totalPending = 0
    for (const mailbox of mailboxes.values()) {
      totalPending += mailbox.queue.length
    }

    const heading = el('div', { cls: 'pd-inspector-heading' })
    heading.appendChild(document.createTextNode('Mailboxes'))
    heading.appendChild(el('span', { cls: 'pd-inspector-heading-count', text: String(totalPending) }))
    mailboxSection.appendChild(heading)

    let hasContent = false
    for (const [eventType, mailbox] of mailboxes.entries()) {
      if (mailbox.queue.length === 0) continue
      hasContent = true

      const typeName = eventType.name ?? '(unknown)'
      const entry = el('div', { cls: 'pd-mailbox-entry' })
      entry.appendChild(el('span', { cls: 'pd-mailbox-type', text: cleanName(typeName) }))
      entry.appendChild(
        el('span', {
          cls: 'pd-mailbox-count',
          text: `${mailbox.queue.length} event${mailbox.queue.length !== 1 ? 's' : ''}`,
        }),
      )

      // Show queued payloads
      for (const item of mailbox.queue) {
        const payloadRow = el('div', {
          style: { paddingLeft: '16px', fontSize: '11px', color: 'var(--pd-text-dim)', fontFamily: 'var(--pd-mono)' },
          text: `#${item.seq}: ${formatPayload(item.payload, 60)}`,
        })
        entry.appendChild(payloadRow)
      }

      mailboxSection.appendChild(entry)
    }

    if (!hasContent) {
      mailboxSection.appendChild(el('div', { cls: 'pd-inspector-empty', text: 'All mailboxes empty.' }))
    }
  }

  function renderRules(): void {
    clearChildren(rulesSection)

    const rules = safeGetRules()

    const heading = el('div', { cls: 'pd-inspector-heading' })
    heading.appendChild(document.createTextNode('Rules'))
    heading.appendChild(el('span', { cls: 'pd-inspector-heading-count', text: String(rules.length) }))
    rulesSection.appendChild(heading)

    if (rules.length === 0) {
      rulesSection.appendChild(el('div', { cls: 'pd-inspector-empty', text: 'No rules registered.' }))
      return
    }

    const table = el('table', { cls: 'pd-inspector-table' })
    const thead = el('thead')
    const headerRow = el('tr')
    headerRow.appendChild(el('th', { text: 'Name' }))
    headerRow.appendChild(el('th', { text: 'Mode' }))
    headerRow.appendChild(el('th', { text: 'Triggers' }))
    headerRow.appendChild(el('th', { text: 'Outputs' }))
    thead.appendChild(headerRow)
    table.appendChild(thead)

    const tbody = el('tbody')
    for (const rule of rules) {
      const row = el('tr')
      row.appendChild(el('td', { cls: 'pd-inspector-name', text: cleanName(rule.name), attrs: { title: rule.id } }))
      row.appendChild(el('td', { text: rule.mode, style: { fontSize: '11px' } }))

      const triggersText = rule.triggers.map((t) => cleanName(t.name)).join(', ')
      row.appendChild(el('td', { text: triggersText, style: { fontSize: '11px', color: 'var(--pd-text-dim)' } }))

      const outputsText = rule.outputs.length > 0
        ? rule.outputs.map((o) => cleanName(o.name)).join(', ')
        : '(none)'
      row.appendChild(el('td', { text: outputsText, style: { fontSize: '11px', color: 'var(--pd-text-dim)' } }))

      tbody.appendChild(row)
    }
    table.appendChild(tbody)
    rulesSection.appendChild(table)
  }

  function safeGetDAG(): { nodes: Array<{ id: string; name: string }>; edges: Array<[{ id: string }, { id: string }]> } {
    try {
      return engine.getDAG()
    } catch {
      return { nodes: [], edges: [] }
    }
  }

  function safeGetRules(): Array<{
    id: string
    name: string
    mode: string
    triggers: Array<{ name: string }>
    outputs: Array<{ name: string }>
  }> {
    try {
      return engine.getRules()
    } catch {
      return []
    }
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

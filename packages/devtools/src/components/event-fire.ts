// ---- Manual Event Firing Panel ----
// Allows selecting an event type, editing a JSON payload, and firing it.

import { el, cleanName, clearChildren } from '../utils.js'
import type { PulseEngine } from '../types.js'

export interface EventFireComponent {
  element: HTMLElement
  update(): void
  destroy(): void
}

const MAX_RECENT = 10

interface RecentEntry {
  eventTypeName: string
  payload: string
}

export function createEventFireComponent(engine: PulseEngine): EventFireComponent {
  const wrapper = el('div', { cls: 'pd-fire-form' })

  // Event type selector
  const selectorGroup = el('div')
  const selectorLabel = el('div', { cls: 'pd-fire-label', text: 'Event Type' })
  const selector = el('select', { cls: 'pd-fire-select' }) as HTMLSelectElement
  selectorGroup.appendChild(selectorLabel)
  selectorGroup.appendChild(selector)

  // Payload textarea
  const payloadGroup = el('div')
  const payloadLabel = el('div', { cls: 'pd-fire-label', text: 'Payload (JSON)' })
  const textarea = el('textarea', {
    cls: 'pd-fire-textarea',
    attrs: { placeholder: '{\n  "key": "value"\n}', spellcheck: 'false' },
  }) as HTMLTextAreaElement
  textarea.value = '{}'
  const errorMsg = el('div', { cls: 'pd-fire-error' })
  payloadGroup.appendChild(payloadLabel)
  payloadGroup.appendChild(textarea)
  payloadGroup.appendChild(errorMsg)

  // Actions
  const actionsRow = el('div', { cls: 'pd-fire-actions' })
  const fireBtn = el('button', { cls: 'pd-fire-btn', text: 'Fire Event' })
  actionsRow.appendChild(fireBtn)

  // Recent events
  const recentSection = el('div', { cls: 'pd-fire-recent' })
  const recentHeading = el('div', { cls: 'pd-fire-recent-heading', text: 'Recently Fired' })
  const recentList = el('div', { cls: 'pd-fire-recent-list' })
  recentSection.appendChild(recentHeading)
  recentSection.appendChild(recentList)

  wrapper.appendChild(selectorGroup)
  wrapper.appendChild(payloadGroup)
  wrapper.appendChild(actionsRow)
  wrapper.appendChild(recentSection)

  let eventTypeMap = new Map<string, any>() // name -> eventType object
  let recent: RecentEntry[] = []

  // Validate JSON on input
  textarea.addEventListener('input', () => {
    validatePayload()
  })

  // Fire event
  fireBtn.addEventListener('click', () => {
    fireEvent()
  })

  // Ctrl+Enter to fire
  textarea.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      fireEvent()
    }
  })

  function validatePayload(): boolean {
    const val = textarea.value.trim()
    if (val === '') {
      errorMsg.textContent = ''
      textarea.classList.remove('pd-fire-invalid')
      return true
    }
    try {
      JSON.parse(val)
      errorMsg.textContent = ''
      textarea.classList.remove('pd-fire-invalid')
      return true
    } catch (e: any) {
      errorMsg.textContent = `Invalid JSON: ${e.message}`
      textarea.classList.add('pd-fire-invalid')
      return false
    }
  }

  function fireEvent(): void {
    const selectedName = selector.value
    if (!selectedName) {
      errorMsg.textContent = 'Select an event type first.'
      return
    }

    if (!validatePayload()) return

    let payload: any
    const val = textarea.value.trim()
    if (val === '') {
      payload = undefined
    } else {
      try {
        payload = JSON.parse(val)
      } catch {
        return
      }
    }

    // Find the event type
    const eventType = eventTypeMap.get(selectedName)
    if (!eventType) {
      errorMsg.textContent = `Event type "${selectedName}" not found.`
      return
    }

    try {
      engine.emit(eventType, payload)
      errorMsg.textContent = ''

      // Add to recent
      addRecent(selectedName, val || '{}')
    } catch (e: any) {
      errorMsg.textContent = `Error: ${e.message}`
    }
  }

  function addRecent(eventTypeName: string, payload: string): void {
    // Remove duplicate if exists
    recent = recent.filter(
      (r) => !(r.eventTypeName === eventTypeName && r.payload === payload),
    )
    recent.unshift({ eventTypeName, payload })
    if (recent.length > MAX_RECENT) {
      recent = recent.slice(0, MAX_RECENT)
    }
    renderRecent()
  }

  function renderRecent(): void {
    clearChildren(recentList)
    for (const entry of recent) {
      const btn = el('button', {
        cls: 'pd-fire-recent-btn',
        text: cleanName(entry.eventTypeName),
        attrs: { title: `${cleanName(entry.eventTypeName)}: ${entry.payload}` },
      })
      btn.addEventListener('click', () => {
        selector.value = entry.eventTypeName
        textarea.value = entry.payload
        validatePayload()
      })
      recentList.appendChild(btn)
    }
  }

  function update(): void {
    // Rebuild event type options from the engine
    const rules = safeGetRules()
    const allTypes = new Map<string, any>()

    for (const rule of rules) {
      for (const t of rule.triggers) {
        allTypes.set(t.name, t)
      }
      for (const o of rule.outputs) {
        allTypes.set(o.name, o)
      }
    }

    // Also check signals for event types
    try {
      const signals = engine.getSignals()
      for (const sig of signals) {
        if (sig._eventType) {
          allTypes.set(sig._eventType.name, sig._eventType)
        }
      }
    } catch {
      // ignore
    }

    const prevSelected = selector.value
    eventTypeMap = allTypes
    clearChildren(selector)

    const placeholder = el('option', { text: '-- Select Event Type --', attrs: { value: '', disabled: 'true' } })
    selector.appendChild(placeholder)

    const sortedNames = [...allTypes.keys()].sort()
    for (const name of sortedNames) {
      const option = el('option', {
        text: cleanName(name),
        attrs: { value: name },
      })
      selector.appendChild(option)
    }

    // Restore selection
    if (prevSelected && allTypes.has(prevSelected)) {
      selector.value = prevSelected
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

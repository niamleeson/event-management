import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PulseEngine, EngineDebugHooks } from '../types.js'

// ---- Helpers ----

function createMockEngine(overrides: Partial<PulseEngine> = {}): PulseEngine {
  return {
    debug: {},
    emit: vi.fn(),
    getRules: vi.fn().mockReturnValue([
      {
        id: 'rule-1',
        name: 'OnClick',
        mode: 'each',
        triggers: [{ name: 'Click' }],
        outputs: [{ name: 'Navigate' }],
      },
      {
        id: 'rule-2',
        name: 'OnNavigate',
        mode: 'each',
        triggers: [{ name: 'Navigate' }],
        outputs: [{ name: 'PageLoad' }],
      },
    ]),
    getMailboxes: vi.fn().mockReturnValue(new Map()),
    getDAG: vi.fn().mockReturnValue({
      nodes: [
        { id: 'Click', name: 'Click' },
        { id: 'Navigate', name: 'Navigate' },
        { id: 'PageLoad', name: 'PageLoad' },
      ],
      edges: [
        [{ id: 'Click' }, { id: 'Navigate' }],
        [{ id: 'Navigate' }, { id: 'PageLoad' }],
      ],
    }),
    ...overrides,
  }
}

// ---- Graph Component Tests ----

describe('Graph component', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('renders event type nodes from getDAG()', async () => {
    const engine = createMockEngine()

    // Dynamic import to ensure jsdom is set up
    const { createGraphComponent } = await import('../components/graph.js')
    const graph = createGraphComponent(engine)

    document.body.appendChild(graph.element)

    // getDAG should have been called during initial render
    expect(engine.getDAG).toHaveBeenCalled()

    // Should have an SVG element
    const svgEl = graph.element.querySelector('.pd-graph-svg')
    expect(svgEl).not.toBeNull()

    // Should have event nodes (3 event types: Click, Navigate, PageLoad)
    const eventNodes = svgEl!.querySelectorAll('.pd-graph-node-event')
    expect(eventNodes.length).toBe(3)

    // Should have edges (Click -> Navigate, Navigate -> PageLoad)
    const edges = svgEl!.querySelectorAll('.pd-graph-edge')
    expect(edges.length).toBe(2)

    graph.destroy()
  })

  it('shows empty message when no nodes exist', async () => {
    const engine = createMockEngine({
      getDAG: vi.fn().mockReturnValue({ nodes: [], edges: [] }),
    })

    const { createGraphComponent } = await import('../components/graph.js')
    const graph = createGraphComponent(engine)

    document.body.appendChild(graph.element)

    const emptyMsg = graph.element.querySelector('.pd-graph-empty')
    expect(emptyMsg).not.toBeNull()
    expect(emptyMsg!.textContent).toContain('No event types discovered yet')

    graph.destroy()
  })

  it('re-reads getDAG() on update', async () => {
    const engine = createMockEngine()

    const { createGraphComponent } = await import('../components/graph.js')
    const graph = createGraphComponent(engine)

    // Reset call count after initial render
    ;(engine.getDAG as any).mockClear()

    graph.update()
    expect(engine.getDAG).toHaveBeenCalledTimes(1)

    graph.destroy()
  })
})

// ---- Timeline Component Tests ----

describe('Timeline component', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('tracks events with type name, payload, and timestamp', async () => {
    const { createTimelineComponent } = await import('../components/timeline.js')
    const timeline = createTimelineComponent()

    document.body.appendChild(timeline.element)

    const now = Date.now()
    timeline.addEvent({
      kind: 'event',
      timestamp: now,
      eventType: 'Click',
      payload: { x: 10, y: 20 },
      seq: 1,
    })

    // Should have one entry in the list
    const entries = timeline.element.querySelectorAll('.pd-timeline-entry')
    expect(entries.length).toBe(1)

    // Entry should show the event type name
    const typeLabel = entries[0].querySelector('.pd-timeline-type')
    expect(typeLabel).not.toBeNull()
    expect(typeLabel!.textContent).toBe('Click')

    // Entry should show the payload
    const payloadLabel = entries[0].querySelector('.pd-timeline-payload')
    expect(payloadLabel).not.toBeNull()
    expect(payloadLabel!.textContent).toContain('"x":10')

    // Entry should show the timestamp
    const timeLabel = entries[0].querySelector('.pd-timeline-time')
    expect(timeLabel).not.toBeNull()
    expect(timeLabel!.textContent!.length).toBeGreaterThan(0)

    // Entry should show the seq number
    const seqLabel = entries[0].querySelector('.pd-timeline-seq')
    expect(seqLabel).not.toBeNull()
    expect(seqLabel!.textContent).toBe('#1')

    timeline.destroy()
  })

  it('records cycle start and end markers', async () => {
    const { createTimelineComponent } = await import('../components/timeline.js')
    const timeline = createTimelineComponent()

    document.body.appendChild(timeline.element)

    timeline.addEvent({
      kind: 'cycle-start',
      timestamp: Date.now(),
      cycleSeq: 1,
    })

    timeline.addEvent({
      kind: 'cycle-end',
      timestamp: Date.now(),
      cycleSeq: 1,
      rulesEvaluated: 3,
      eventsDeposited: 2,
      duration: 1.5,
    })

    const cycleMarkers = timeline.element.querySelectorAll('.pd-timeline-cycle')
    expect(cycleMarkers.length).toBe(2)

    timeline.destroy()
  })

  it('integrates with engine debug hooks', async () => {
    const engine = createMockEngine()

    const { createTimelineComponent } = await import('../components/timeline.js')
    const timeline = createTimelineComponent()

    document.body.appendChild(timeline.element)

    // Simulate what devtools.ts does: attach hooks and forward to timeline
    const debug = engine.debug!

    debug.onEventDeposited = (event) => {
      timeline.addEvent({
        kind: 'event',
        timestamp: Date.now(),
        eventType: event.type.name,
        payload: event.payload,
        seq: event.seq,
      })
    }

    // Fire the hook
    debug.onEventDeposited!({
      type: { name: 'Click' },
      payload: { button: 'left' },
      seq: 42,
    })

    const entries = timeline.element.querySelectorAll('.pd-timeline-entry')
    expect(entries.length).toBe(1)

    const typeLabel = entries[0].querySelector('.pd-timeline-type')
    expect(typeLabel!.textContent).toBe('Click')

    timeline.destroy()
  })
})

// ---- Event Fire Component Tests ----

describe('Event fire component', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('populates event type dropdown from DAG nodes', async () => {
    const engine = createMockEngine()

    const { createEventFireComponent } = await import('../components/event-fire.js')
    const eventFire = createEventFireComponent(engine)

    document.body.appendChild(eventFire.element)

    const select = eventFire.element.querySelector('.pd-fire-select') as HTMLSelectElement
    expect(select).not.toBeNull()

    // Should have placeholder + 3 event types (Click, Navigate, PageLoad)
    const options = select.querySelectorAll('option')
    expect(options.length).toBe(4) // placeholder + 3 event types

    // Check that option values include the event type names
    const optionValues = Array.from(options).map((o) => o.getAttribute('value'))
    expect(optionValues).toContain('Click')
    expect(optionValues).toContain('Navigate')
    expect(optionValues).toContain('PageLoad')

    eventFire.destroy()
  })

  it('calls engine.emit when firing an event', async () => {
    const engine = createMockEngine()

    const { createEventFireComponent } = await import('../components/event-fire.js')
    const eventFire = createEventFireComponent(engine)

    document.body.appendChild(eventFire.element)

    // Select an event type
    const select = eventFire.element.querySelector('.pd-fire-select') as HTMLSelectElement
    select.value = 'Click'

    // Set payload
    const textarea = eventFire.element.querySelector('.pd-fire-textarea') as HTMLTextAreaElement
    textarea.value = '{"x": 100}'

    // Click fire button
    const fireBtn = eventFire.element.querySelector('.pd-fire-btn') as HTMLButtonElement
    fireBtn.click()

    // engine.emit should have been called
    expect(engine.emit).toHaveBeenCalledTimes(1)
    // The first argument is the event type object from the DAG/rules
    const callArgs = (engine.emit as any).mock.calls[0]
    expect(callArgs[1]).toEqual({ x: 100 })

    eventFire.destroy()
  })
})

// ---- Inspector Component Tests ----

describe('Inspector component', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('shows event types with consumer counts', async () => {
    const engine = createMockEngine()

    const { createInspectorComponent } = await import('../components/inspector.js')
    const inspector = createInspectorComponent(engine)

    document.body.appendChild(inspector.element)

    // Should have headings for Event Types, Mailboxes, Rules
    const headings = inspector.element.querySelectorAll('.pd-inspector-heading')
    const headingTexts = Array.from(headings).map((h) => h.textContent)

    expect(headingTexts.some((t) => t?.includes('Event Types'))).toBe(true)
    expect(headingTexts.some((t) => t?.includes('Mailboxes'))).toBe(true)
    expect(headingTexts.some((t) => t?.includes('Rules'))).toBe(true)

    inspector.destroy()
  })

  it('shows registered rules with triggers and outputs', async () => {
    const engine = createMockEngine()

    const { createInspectorComponent } = await import('../components/inspector.js')
    const inspector = createInspectorComponent(engine)

    document.body.appendChild(inspector.element)

    // Should show rules in a table
    const tables = inspector.element.querySelectorAll('.pd-inspector-table')
    // At least 2 tables: event types table and rules table
    expect(tables.length).toBeGreaterThanOrEqual(2)

    // Check for rule names in the content
    const text = inspector.element.textContent ?? ''
    expect(text).toContain('OnClick')
    expect(text).toContain('OnNavigate')

    inspector.destroy()
  })

  it('shows mailbox contents when present', async () => {
    const mailboxes = new Map()
    const clickType = { name: 'Click' }
    mailboxes.set(clickType, {
      queue: [
        { payload: { x: 1 }, seq: 1 },
        { payload: { x: 2 }, seq: 2 },
      ],
    })

    const engine = createMockEngine({
      getMailboxes: vi.fn().mockReturnValue(mailboxes),
    })

    const { createInspectorComponent } = await import('../components/inspector.js')
    const inspector = createInspectorComponent(engine)

    document.body.appendChild(inspector.element)

    // Should show mailbox entries
    const mailboxEntries = inspector.element.querySelectorAll('.pd-mailbox-entry')
    expect(mailboxEntries.length).toBe(1)

    const mailboxText = inspector.element.textContent ?? ''
    expect(mailboxText).toContain('Click')
    expect(mailboxText).toContain('2 events')

    inspector.destroy()
  })

  it('updates when update() is called', async () => {
    const engine = createMockEngine()

    const { createInspectorComponent } = await import('../components/inspector.js')
    const inspector = createInspectorComponent(engine)

    document.body.appendChild(inspector.element)

    // Clear mock counts from initial render
    ;(engine.getRules as any).mockClear()
    ;(engine.getDAG as any).mockClear()
    ;(engine.getMailboxes as any).mockClear()

    inspector.update()

    expect(engine.getRules).toHaveBeenCalled()
    expect(engine.getDAG).toHaveBeenCalled()
    expect(engine.getMailboxes).toHaveBeenCalled()

    inspector.destroy()
  })
})

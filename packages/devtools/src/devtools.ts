// ---- Main DevTools Class ----
// Orchestrates all components and manages the engine connection.

import { injectStyles } from './styles.js'
import { el } from './utils.js'
import { createGraphComponent, type GraphComponent } from './components/graph.js'
import { createTimelineComponent, type TimelineComponent } from './components/timeline.js'
import { createInspectorComponent, type InspectorComponent } from './components/inspector.js'
import { createEventFireComponent, type EventFireComponent } from './components/event-fire.js'
import { createPauseControls, type PauseControlsComponent } from './components/pause-controls.js'
import type { PulseEngine, DevToolsOptions } from './types.js'

type TabId = 'graph' | 'timeline' | 'inspector' | 'fire'

export class DevTools {
  private engine: PulseEngine
  private options: Required<DevToolsOptions>
  private root: HTMLElement
  private ownsContainer: boolean

  // Components
  private graph!: GraphComponent
  private timeline!: TimelineComponent
  private inspector!: InspectorComponent
  private eventFire!: EventFireComponent
  private pauseControls!: PauseControlsComponent

  // UI elements
  private tabButtons = new Map<TabId, HTMLButtonElement>()
  private tabPanels = new Map<TabId, HTMLElement>()
  private activeTab: TabId = 'graph'
  private statusBadge!: HTMLElement
  private collapsed = false

  // Pause/step state
  private paused = false
  private originalEmit: ((eventType: any, payload?: any) => void) | null = null
  private pendingEmissions: Array<{ eventType: any; payload: any }> = []

  // Update interval for inspector
  private updateInterval: ReturnType<typeof setInterval> | null = null

  // Dragging state for floating panel
  private dragState: { startX: number; startY: number; origX: number; origY: number } | null = null

  constructor(engine: PulseEngine, options: DevToolsOptions = {}) {
    this.engine = engine
    this.options = {
      container: options.container ?? null,
      position: options.position ?? 'floating',
      collapsed: options.collapsed ?? false,
      theme: options.theme ?? 'dark',
    }

    // Inject CSS
    injectStyles()

    // Create or use container
    if (this.options.container) {
      this.root = this.options.container
      this.ownsContainer = false
    } else {
      this.root = document.createElement('div')
      document.body.appendChild(this.root)
      this.ownsContainer = true
    }

    this.collapsed = this.options.collapsed

    this.buildUI()
    this.attachHooks()
    this.startUpdateLoop()
  }

  // ---- Public API ----

  pause(): void {
    if (!this.paused) {
      this.pauseControls.pause()
    }
  }

  resume(): void {
    if (this.paused) {
      this.pauseControls.resume()
    }
  }

  step(): void {
    if (this.paused) {
      this.pauseControls.step()
    }
  }

  destroy(): void {
    // Restore engine emit
    if (this.originalEmit) {
      this.engine.emit = this.originalEmit
      this.originalEmit = null
    }

    // Clear hooks
    if (this.engine.debug) {
      this.engine.debug.onCycleStart = undefined
      this.engine.debug.onCycleEnd = undefined
      this.engine.debug.onEventDeposited = undefined
      this.engine.debug.onEventConsumed = undefined
      this.engine.debug.onRuleFired = undefined
      this.engine.debug.onTweenUpdate = undefined
    }

    // Stop update loop
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }

    // Destroy components
    this.graph.destroy()
    this.timeline.destroy()
    this.inspector.destroy()
    this.eventFire.destroy()
    this.pauseControls.destroy()

    // Remove DOM
    this.root.innerHTML = ''
    this.root.classList.remove('pulse-devtools', 'pd-floating', 'pd-bottom', 'pd-right', 'pd-collapsed', 'pd-theme-light')
    if (this.ownsContainer) {
      this.root.remove()
    }

    // Flush pending emissions
    if (this.paused) {
      this.processPendingEmissions()
    }
  }

  // ---- UI Construction ----

  private buildUI(): void {
    const root = this.root
    root.className = 'pulse-devtools'

    // Position class
    if (this.options.position === 'floating') {
      root.classList.add('pd-floating')
      // Default position
      if (!root.style.width) root.style.width = '700px'
      if (!root.style.height) root.style.height = '460px'
      if (!root.style.right) root.style.right = '16px'
      if (!root.style.bottom) root.style.bottom = '16px'
    } else if (this.options.position === 'bottom') {
      root.classList.add('pd-bottom')
    } else if (this.options.position === 'right') {
      root.classList.add('pd-right')
    }

    // Theme
    if (this.options.theme === 'light') {
      root.classList.add('pd-theme-light')
    }

    // Collapsed state
    if (this.collapsed) {
      root.classList.add('pd-collapsed')
    }

    // ---- Titlebar ----
    const titlebar = el('div', { cls: 'pd-titlebar' })

    const logo = el('span', { cls: 'pd-titlebar-logo', text: 'Pulse DevTools' })

    this.statusBadge = el('span', {
      cls: ['pd-titlebar-badge', 'pd-badge-running'],
      text: 'RUNNING',
    })

    const spacer = el('span', { cls: 'pd-titlebar-spacer' })

    const collapseBtn = el('button', {
      cls: 'pd-titlebar-btn',
      text: this.collapsed ? '\u25B2' : '\u25BC',
      attrs: { title: 'Toggle panel' },
    })
    collapseBtn.addEventListener('click', () => {
      this.collapsed = !this.collapsed
      root.classList.toggle('pd-collapsed', this.collapsed)
      collapseBtn.textContent = this.collapsed ? '\u25B2' : '\u25BC'
      contentWrapper.style.display = this.collapsed ? 'none' : 'flex'
      pauseBar.style.display = this.collapsed ? 'none' : ''
    })

    const closeBtn = el('button', {
      cls: 'pd-titlebar-btn',
      text: '\u2715',
      attrs: { title: 'Close devtools' },
    })
    closeBtn.addEventListener('click', () => {
      this.destroy()
    })

    titlebar.appendChild(logo)
    titlebar.appendChild(this.statusBadge)
    titlebar.appendChild(spacer)
    titlebar.appendChild(collapseBtn)
    if (this.ownsContainer) {
      titlebar.appendChild(closeBtn)
    }

    // Make titlebar draggable (floating mode)
    if (this.options.position === 'floating') {
      this.setupDragging(titlebar)
    }

    // ---- Tabs ----
    const tabsBar = el('div', { cls: 'pd-tabs' })
    const tabs: Array<{ id: TabId; label: string }> = [
      { id: 'graph', label: 'Graph' },
      { id: 'timeline', label: 'Timeline' },
      { id: 'inspector', label: 'Inspector' },
      { id: 'fire', label: 'Fire Event' },
    ]

    for (const tab of tabs) {
      const btn = el('button', {
        cls: ['pd-tab', tab.id === this.activeTab ? 'pd-tab-active' : ''],
        text: tab.label,
      })
      btn.addEventListener('click', () => this.switchTab(tab.id))
      this.tabButtons.set(tab.id, btn)
      tabsBar.appendChild(btn)
    }

    // ---- Content ----
    const content = el('div', { cls: 'pd-content' })

    // Create components
    this.graph = createGraphComponent(this.engine)
    this.timeline = createTimelineComponent()
    this.inspector = createInspectorComponent(this.engine)
    this.eventFire = createEventFireComponent(this.engine)
    this.pauseControls = createPauseControls(this.engine, {
      onPause: () => this.handlePause(),
      onResume: () => this.handleResume(),
      onStep: () => this.handleStep(),
    })

    // Create tab panels
    const graphPanel = el('div', { cls: ['pd-panel', 'pd-panel-active'], children: [this.graph.element] })
    const timelinePanel = el('div', { cls: 'pd-panel', children: [this.timeline.element] })
    const inspectorPanel = el('div', { cls: 'pd-panel' })
    inspectorPanel.appendChild(this.pauseControls.element)
    inspectorPanel.appendChild(this.inspector.element)
    const firePanel = el('div', { cls: 'pd-panel', children: [this.eventFire.element] })

    this.tabPanels.set('graph', graphPanel)
    this.tabPanels.set('timeline', timelinePanel)
    this.tabPanels.set('inspector', inspectorPanel)
    this.tabPanels.set('fire', firePanel)

    content.appendChild(graphPanel)
    content.appendChild(timelinePanel)
    content.appendChild(inspectorPanel)
    content.appendChild(firePanel)

    // ---- Pause status bar ----
    const pauseBar = this.pauseControls.statusBar

    // ---- Content wrapper (hides when collapsed) ----
    const contentWrapper = el('div', {
      style: {
        display: this.collapsed ? 'none' : 'flex',
        flexDirection: 'column',
        flex: '1',
        overflow: 'hidden',
      },
    })
    contentWrapper.appendChild(tabsBar)
    contentWrapper.appendChild(content)
    contentWrapper.appendChild(pauseBar)

    // Assemble
    root.appendChild(titlebar)
    root.appendChild(contentWrapper)
  }

  private switchTab(tabId: TabId): void {
    // Deactivate current
    this.tabButtons.get(this.activeTab)?.classList.remove('pd-tab-active')
    this.tabPanels.get(this.activeTab)?.classList.remove('pd-panel-active')

    // Activate new
    this.activeTab = tabId
    this.tabButtons.get(tabId)?.classList.add('pd-tab-active')
    this.tabPanels.get(tabId)?.classList.add('pd-panel-active')

    // Refresh the active component
    if (tabId === 'graph') this.graph.update()
    if (tabId === 'inspector') this.inspector.update()
    if (tabId === 'fire') this.eventFire.update()
  }

  private setupDragging(handle: HTMLElement): void {
    handle.addEventListener('mousedown', (e: MouseEvent) => {
      // Only drag on left click, not on buttons
      if (e.button !== 0) return
      if ((e.target as HTMLElement).tagName === 'BUTTON') return

      e.preventDefault()
      const rect = this.root.getBoundingClientRect()
      this.dragState = {
        startX: e.clientX,
        startY: e.clientY,
        origX: rect.left,
        origY: rect.top,
      }

      const onMouseMove = (ev: MouseEvent) => {
        if (!this.dragState) return
        const dx = ev.clientX - this.dragState.startX
        const dy = ev.clientY - this.dragState.startY
        this.root.style.left = `${this.dragState.origX + dx}px`
        this.root.style.top = `${this.dragState.origY + dy}px`
        // Clear right/bottom positioning when manually positioned
        this.root.style.right = 'auto'
        this.root.style.bottom = 'auto'
      }

      const onMouseUp = () => {
        this.dragState = null
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
      }

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    })
  }

  // ---- Engine Hooks ----

  private attachHooks(): void {
    // Ensure the engine has a debug object
    if (!this.engine.debug) {
      ;(this.engine as any).debug = {}
    }

    const debug = this.engine.debug!

    debug.onCycleStart = (cycle) => {
      this.timeline.addEvent({
        kind: 'cycle-start',
        timestamp: Date.now(),
        cycleSeq: cycle.seq,
      })
    }

    debug.onCycleEnd = (cycle) => {
      this.timeline.addEvent({
        kind: 'cycle-end',
        timestamp: Date.now(),
        cycleSeq: cycle.seq,
        rulesEvaluated: cycle.rulesEvaluated,
        eventsDeposited: cycle.eventsDeposited,
        duration: cycle.duration,
      })

      // Refresh graph and inspector after each cycle
      if (this.activeTab === 'graph') this.graph.update()
      if (this.activeTab === 'inspector') this.inspector.update()
    }

    debug.onEventDeposited = (event) => {
      this.timeline.addEvent({
        kind: 'event',
        timestamp: Date.now(),
        eventType: event.type.name,
        payload: event.payload,
        seq: event.seq,
      })
    }

    debug.onEventConsumed = (event, rule) => {
      this.timeline.markConsumed(event.seq, rule)
      this.timeline.addEvent({
        kind: 'consume',
        timestamp: Date.now(),
        eventType: event.type.name,
        payload: event.payload,
        seq: event.seq,
        ruleId: rule.id,
        ruleName: rule.name,
      })

      // Animate the graph edge
      const fromId = `evt:${event.type.name}`
      const toId = `rule:${rule.id}`
      this.graph.highlightEdge(fromId, toId)
    }

    debug.onRuleFired = (rule, _inputs, outputs) => {
      // Highlight output edges
      for (const output of outputs) {
        if (output && output.type) {
          const fromId = `rule:${rule.id}`
          const toId = `evt:${output.type.name}`
          this.graph.highlightEdge(fromId, toId)
        }
      }
    }

    debug.onTweenUpdate = (_tween) => {
      // Inspector will pick up changes on next update cycle
    }
  }

  // ---- Pause/Step Logic ----

  private handlePause(): void {
    this.paused = true
    this.pendingEmissions = []
    this.updateStatusBadge()

    // Wrap engine.emit to intercept emissions
    this.originalEmit = this.engine.emit.bind(this.engine)
    this.engine.emit = (eventType: any, payload?: any) => {
      this.pendingEmissions.push({ eventType, payload })
      const name = eventType?.name ?? '(unknown)'
      this.pauseControls.onQueuedEvent(name, payload)
    }
  }

  private handleResume(): void {
    this.paused = false
    this.updateStatusBadge()

    // Restore original emit
    if (this.originalEmit) {
      this.engine.emit = this.originalEmit
      this.originalEmit = null
    }

    // Process all pending emissions
    this.processPendingEmissions()
  }

  private handleStep(): void {
    if (this.pendingEmissions.length === 0) return

    // Process one pending emission with the original emit
    const emission = this.pendingEmissions.shift()!
    if (this.originalEmit) {
      this.originalEmit(emission.eventType, emission.payload)
    }

    // Update displays
    this.pauseControls.update()
    this.inspector.update()
    this.graph.update()
  }

  private processPendingEmissions(): void {
    const emissions = [...this.pendingEmissions]
    this.pendingEmissions = []

    for (const emission of emissions) {
      if (this.originalEmit) {
        this.originalEmit(emission.eventType, emission.payload)
      } else {
        this.engine.emit(emission.eventType, emission.payload)
      }
    }
  }

  private updateStatusBadge(): void {
    if (this.paused) {
      this.statusBadge.textContent = 'PAUSED'
      this.statusBadge.className = 'pd-titlebar-badge pd-badge-paused'
    } else {
      this.statusBadge.textContent = 'RUNNING'
      this.statusBadge.className = 'pd-titlebar-badge pd-badge-running'
    }
  }

  // ---- Update Loop ----

  private startUpdateLoop(): void {
    // Periodically update the inspector (for tweens/springs that animate)
    this.updateInterval = setInterval(() => {
      if (this.activeTab === 'inspector') {
        this.inspector.update()
      }
      if (this.paused) {
        this.pauseControls.update()
      }
    }, 200)
  }
}

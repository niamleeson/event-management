// ---- Pause/Step/Resume Controls ----
// Allows pausing the engine, stepping through propagation cycles, and inspecting mailboxes.

import { el, formatPayload, cleanName, clearChildren } from '../utils.js'
import type { PulseEngine } from '../types.js'

export interface PauseControlsComponent {
  element: HTMLElement
  statusBar: HTMLElement
  isPaused(): boolean
  pause(): void
  resume(): void
  step(): void
  /** Called by devtools when an event is emitted while paused */
  onQueuedEvent(eventType: string, payload: any): void
  update(): void
  destroy(): void
}

interface QueuedEmission {
  eventType: string
  payload: any
}

export function createPauseControls(
  engine: PulseEngine,
  callbacks: {
    onPause: () => void
    onResume: () => void
    onStep: () => void
  },
): PauseControlsComponent {
  let paused = false
  let queuedEmissions: QueuedEmission[] = []

  // Status bar (sits at bottom of devtools)
  const statusBar = el('div', { cls: 'pd-pause-bar' })

  const pauseBtn = el('button', { cls: 'pd-pause-btn' })
  const pauseIcon = el('span', { cls: 'pd-pause-btn-icon', text: '\u23F8' }) // pause symbol
  const pauseLabel = document.createTextNode(' Pause')
  pauseBtn.appendChild(pauseIcon)
  pauseBtn.appendChild(pauseLabel)

  const stepBtn = el('button', { cls: 'pd-pause-btn' })
  const stepIcon = el('span', { cls: 'pd-pause-btn-icon', text: '\u23ED' }) // next track symbol
  const stepLabel = document.createTextNode(' Step')
  stepBtn.appendChild(stepIcon)
  stepBtn.appendChild(stepLabel)
  stepBtn.disabled = true

  const resumeBtn = el('button', { cls: 'pd-pause-btn' })
  const resumeIcon = el('span', { cls: 'pd-pause-btn-icon', text: '\u25B6' }) // play symbol
  const resumeLabel = document.createTextNode(' Resume')
  resumeBtn.appendChild(resumeIcon)
  resumeBtn.appendChild(resumeLabel)
  resumeBtn.disabled = true

  const infoLabel = el('span', { cls: 'pd-pause-info' })

  statusBar.appendChild(pauseBtn)
  statusBar.appendChild(stepBtn)
  statusBar.appendChild(resumeBtn)
  statusBar.appendChild(infoLabel)

  // Pending panel (shown when paused, inside the main panel area)
  const pendingPanel = el('div', { style: { display: 'none' } })

  const pendingSection = el('div', { cls: 'pd-pause-pending' })
  const pendingHeading = el('div', { cls: 'pd-pause-pending-heading', text: 'Pending Emissions' })
  const pendingList = el('div')
  pendingSection.appendChild(pendingHeading)
  pendingSection.appendChild(pendingList)

  const mailboxSection = el('div', { cls: 'pd-mailbox-section' })
  const mailboxHeading = el('div', { cls: 'pd-mailbox-heading', text: 'Mailbox Contents' })
  const mailboxList = el('div')
  mailboxSection.appendChild(mailboxHeading)
  mailboxSection.appendChild(mailboxList)

  pendingPanel.appendChild(pendingSection)
  pendingPanel.appendChild(mailboxSection)

  // Compose element
  const element = el('div', { children: [pendingPanel] })

  // Event handlers
  pauseBtn.addEventListener('click', () => {
    if (!paused) doPause()
  })

  stepBtn.addEventListener('click', () => {
    if (paused) doStep()
  })

  resumeBtn.addEventListener('click', () => {
    if (paused) doResume()
  })

  function doPause(): void {
    paused = true
    queuedEmissions = []
    updateButtonStates()
    pendingPanel.style.display = 'block'
    callbacks.onPause()
    updateMailboxDisplay()
  }

  function doResume(): void {
    paused = false
    queuedEmissions = []
    updateButtonStates()
    pendingPanel.style.display = 'none'
    callbacks.onResume()
  }

  function doStep(): void {
    callbacks.onStep()
    updateMailboxDisplay()
    updatePendingDisplay()
  }

  function updateButtonStates(): void {
    pauseBtn.disabled = paused
    stepBtn.disabled = !paused
    resumeBtn.disabled = !paused

    if (paused) {
      infoLabel.textContent = `PAUSED | ${queuedEmissions.length} queued`
      infoLabel.style.color = 'var(--pd-red)'
    } else {
      infoLabel.textContent = 'Running'
      infoLabel.style.color = 'var(--pd-green)'
    }
  }

  function onQueuedEvent(eventType: string, payload: any): void {
    queuedEmissions.push({ eventType, payload })
    updatePendingDisplay()
    updateButtonStates()
  }

  function updatePendingDisplay(): void {
    clearChildren(pendingList)
    if (queuedEmissions.length === 0) {
      pendingList.appendChild(
        el('div', {
          text: 'No pending emissions.',
          style: { color: 'var(--pd-text-dim)', fontSize: '12px', padding: '4px 0' },
        }),
      )
      return
    }
    for (const emission of queuedEmissions) {
      const item = el('div', { cls: 'pd-pause-pending-item' })
      item.appendChild(el('span', { cls: 'pd-pause-pending-type', text: cleanName(emission.eventType) }))
      item.appendChild(
        el('span', {
          cls: 'pd-pause-pending-payload',
          text: formatPayload(emission.payload),
        }),
      )
      pendingList.appendChild(item)
    }
  }

  function updateMailboxDisplay(): void {
    clearChildren(mailboxList)

    let mailboxes: Map<any, { queue: Array<{ payload: any; seq: number }> }>
    try {
      mailboxes = engine.getMailboxes()
    } catch {
      return
    }

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
      mailboxList.appendChild(entry)
    }

    if (!hasContent) {
      mailboxList.appendChild(
        el('div', {
          text: 'All mailboxes empty.',
          style: { color: 'var(--pd-text-dim)', fontSize: '12px', padding: '4px 0' },
        }),
      )
    }
  }

  function update(): void {
    if (paused) {
      updateMailboxDisplay()
      updatePendingDisplay()
    }
    updateButtonStates()
  }

  function isPausedFn(): boolean {
    return paused
  }

  function destroy(): void {
    element.innerHTML = ''
    statusBar.innerHTML = ''
  }

  // Initial state
  updateButtonStates()
  updatePendingDisplay()

  return {
    element,
    statusBar,
    isPaused: isPausedFn,
    pause: doPause,
    resume: doResume,
    step: doStep,
    onQueuedEvent,
    update,
    destroy,
  }
}

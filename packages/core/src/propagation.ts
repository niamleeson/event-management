import type { EventType, PulseEvent, Rule } from './types.js'
import { Mailbox } from './mailbox.js'
import { DAG } from './dag.js'

/**
 * Core propagation loop.
 * Drains mailboxes in topological (DAG) order, fires rules.
 * Repeats until quiescent or max rounds exceeded.
 *
 * For 'each' mode rules: fires the handler for each pending event in each trigger's mailbox.
 * For 'join' mode rules: fires only when all trigger mailboxes have at least one ready event.
 *
 * Handlers that emit events do so via the engine's emit path (which deposits into
 * mailboxes and traces DAG edges). The propagation loop picks up newly deposited
 * events on the next iteration.
 */
export function propagate(
  dag: DAG,
  mailboxes: Map<EventType, Mailbox>,
  maxRounds: number,
  onError?: (error: Error, rule: Rule, event: any) => void,
): void {
  // Evict orphaned events whose consumers have all been disposed
  for (const mb of mailboxes.values()) {
    mb.evictOrphans()
  }

  let rounds = 0
  let work = true

  while (work) {
    if (rounds >= maxRounds) {
      throw new Error(`Propagation exceeded ${maxRounds} rounds — probable cycle in rule graph`)
    }
    work = false
    rounds++

    const order = dag.getTopologicalOrder()
    for (const rule of order) {
      if (rule._disposed) continue

      if (rule.mode === 'each') {
        // Each-mode: fire for every trigger that has a ready event
        for (const trigger of rule.triggers) {
          const mb = getMailbox(mailboxes, trigger)
          while (mb.hasReadyEvent(rule)) {
            const ev = mb.consume(rule)
            if (rule.guard && !rule.guard(ev.payload)) continue
            try {
              rule.action(ev.payload)
              work = true
            } catch (err) {
              if (onError) {
                onError(err as Error, rule, ev.payload)
              } else {
                throw err
              }
            }
          }
        }
      } else if (rule.mode === 'join') {
        let allReady = true
        for (const t of rule.triggers) {
          if (!getMailbox(mailboxes, t).hasReadyEvent(rule)) {
            allReady = false
            break
          }
        }
        if (allReady) {
          const consumed: PulseEvent[] = []
          const payloads: any[] = []
          for (const t of rule.triggers) {
            const ev = getMailbox(mailboxes, t).consume(rule)
            consumed.push(ev)
            payloads.push(ev.payload)
          }
          if (rule.guard && !rule.guard(...payloads)) {
            for (let i = 0; i < consumed.length; i++) {
              getMailbox(mailboxes, rule.triggers[i]).unconsumeAll(rule, [consumed[i]])
            }
            continue
          }
          try {
            rule.action(...payloads)
            work = true
          } catch (err) {
            if (onError) {
              onError(err as Error, rule, payloads)
            } else {
              throw err
            }
          }
        }
      }
    }
  }
}

function getMailbox<T>(mailboxes: Map<EventType, Mailbox>, type: EventType<T>): Mailbox<T> {
  let mb = mailboxes.get(type)
  if (!mb) {
    mb = new Mailbox(type)
    mailboxes.set(type, mb)
  }
  return mb as Mailbox<T>
}

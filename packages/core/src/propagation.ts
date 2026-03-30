import type { EventType, PulseEvent, Rule } from './types.js'
import { createEvent } from './event.js'
import { Mailbox } from './mailbox.js'
import { DAG } from './dag.js'

/**
 * Core propagation loop.
 * Drains mailboxes in topological (DAG) order, fires rules, deposits resulting events.
 * Repeats until quiescent or max rounds exceeded.
 */
export function propagate(
  dag: DAG,
  mailboxes: Map<EventType, Mailbox>,
  emitFn: (type: EventType, payload: any) => void,
  maxRounds: number,
): void {
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
        const trigger = rule.triggers[0]
        const mb = getMailbox(mailboxes, trigger)
        while (mb.hasReadyEvent(rule)) {
          const ev = mb.consume(rule)
          if (rule.guard && !rule.guard(ev.payload)) continue
          const result = rule.action(ev.payload)
          if (result !== undefined && rule.outputs.length > 0) {
            if (rule.outputs.length > 1 && Array.isArray(result)) {
              for (let i = 0; i < rule.outputs.length; i++) {
                depositEvent(mailboxes, rule.outputs[i], result[i])
              }
            } else {
              depositEvent(mailboxes, rule.outputs[0], result)
            }
            work = true
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
          const result = rule.action(...payloads)
          if (result !== undefined && rule.outputs.length > 0) {
            depositEvent(mailboxes, rule.outputs[0], result)
            work = true
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

function depositEvent<T>(mailboxes: Map<EventType, Mailbox>, type: EventType<T>, payload: T): void {
  const ev = createEvent(type, payload)
  if (ev._pendingConsumers.size > 0) {
    getMailbox(mailboxes, type).enqueue(ev)
  }
}

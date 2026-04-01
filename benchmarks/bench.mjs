/**
 * Pulse Engine Benchmark Suite
 *
 * Compares Pulse against: RxJS, Redux, Zustand, Jotai, MobX, EventEmitter3
 * Setup is hoisted to beforeAll — only the hot path is measured.
 */

import { Bench } from 'tinybench'
import { createEngine, Skip } from '@pulse/core'
import { Subject, combineLatest, map, filter } from 'rxjs'
import { configureStore, createSlice } from '@reduxjs/toolkit'
import { createStore as createZustandStore } from 'zustand/vanilla'
import { createStore as createJotaiStore, atom } from 'jotai/vanilla'
import { makeAutoObservable, autorun, runInAction } from 'mobx'
import EventEmitter from 'eventemitter3'

const JSON_MODE = process.argv.includes('--json')

function log(msg) { if (!JSON_MODE) console.log(msg) }
function formatOps(hz) {
  if (hz >= 1e6) return `${(hz / 1e6).toFixed(2)}M ops/s`
  if (hz >= 1e3) return `${(hz / 1e3).toFixed(1)}K ops/s`
  return `${hz.toFixed(0)} ops/s`
}
function formatNs(ms) {
  const ns = ms * 1e6
  if (ns < 1000) return `${ns.toFixed(0)}ns`
  if (ns < 1e6) return `${(ns / 1000).toFixed(1)}us`
  return `${(ns / 1e6).toFixed(2)}ms`
}

async function printBench(bench) {
  await bench.run()
  if (!JSON_MODE) {
    console.log('\nResults:')
    for (const t of bench.tasks) {
      console.log(`  ${t.name.padEnd(25)} ${formatOps(t.result.hz).padStart(16)}  avg: ${formatNs(t.result.mean).padStart(10)}`)
    }
  }
  return bench
}

// ============================================================================
// 1. Single-emit throughput (emit + 1 handler)
// ============================================================================

async function benchThroughput() {
  log('\n=== Single-Emit Throughput (1 handler) ===')
  const bench = new Bench({ warmupIterations: 5000, iterations: 500_000 })

  // Pulse
  let p_engine, p_ev, p_count
  bench.add('Pulse', () => { p_engine.emit(p_ev, p_count) }, {
    beforeAll: () => { p_engine = createEngine(); p_ev = p_engine.event('ev'); p_count = 0; p_engine.on(p_ev, () => { p_count++ }) },
  })

  // EventEmitter3
  let ee, ee_count
  bench.add('EventEmitter3', () => { ee.emit('ev', ee_count) }, {
    beforeAll: () => { ee = new EventEmitter(); ee_count = 0; ee.on('ev', () => { ee_count++ }) },
  })

  // RxJS
  let rx_subj, rx_count
  bench.add('RxJS Subject', () => { rx_subj.next(rx_count) }, {
    beforeAll: () => { rx_subj = new Subject(); rx_count = 0; rx_subj.subscribe(() => { rx_count++ }) },
  })

  // Redux
  let rdx_store, rdx_inc
  bench.add('Redux', () => { rdx_store.dispatch(rdx_inc()) }, {
    beforeAll: () => {
      const slice = createSlice({ name: 'c', initialState: { v: 0 }, reducers: { inc: s => { s.v++ } } })
      rdx_store = configureStore({ reducer: slice.reducer }); rdx_inc = slice.actions.inc
      let c = 0; rdx_store.subscribe(() => { c++ })
    },
  })

  // Zustand
  let zs_store
  bench.add('Zustand', () => { zs_store.getState().inc() }, {
    beforeAll: () => {
      zs_store = createZustandStore(set => ({ count: 0, inc: () => set(s => ({ count: s.count + 1 })) }))
      let c = 0; zs_store.subscribe(() => { c++ })
    },
  })

  // Jotai
  let jt_store, jt_atom
  bench.add('Jotai', () => { jt_store.set(jt_atom, c => c + 1) }, {
    beforeAll: () => {
      jt_atom = atom(0); jt_store = createJotaiStore()
      let c = 0; jt_store.sub(jt_atom, () => { c++ })
    },
  })

  // MobX
  let mx_state
  bench.add('MobX', () => { runInAction(() => { mx_state.count++ }) }, {
    beforeAll: () => {
      mx_state = makeAutoObservable({ count: 0 })
      let c = 0; autorun(() => { c = mx_state.count })
    },
  })

  return printBench(bench)
}

// ============================================================================
// 2. Chain propagation (A -> B -> C -> D, 4 levels)
// ============================================================================

async function benchChain() {
  log('\n=== Chain Propagation (4 levels: A->B->C->D) ===')
  const bench = new Bench({ warmupIterations: 5000, iterations: 500_000 })

  // Pulse chaining
  let pc_engine, pc_a
  bench.add('Pulse (chaining)', () => { pc_engine.emit(pc_a, 1) }, {
    beforeAll: () => {
      pc_engine = createEngine()
      pc_a = pc_engine.event('a'); const b = pc_engine.event('b'); const c = pc_engine.event('c'); const d = pc_engine.event('d')
      pc_engine.on(pc_a).emit(b, n => n + 1)
      pc_engine.on(b).emit(c, n => n * 2)
      pc_engine.on(c).emit(d, n => n + 10)
      let r = 0; pc_engine.on(d, v => { r = v })
    },
  })

  // Pulse handler emit
  let ph_engine, ph_a
  bench.add('Pulse (handler emit)', () => { ph_engine.emit(ph_a, 1) }, {
    beforeAll: () => {
      ph_engine = createEngine()
      ph_a = ph_engine.event('a'); const b = ph_engine.event('b'); const c = ph_engine.event('c'); const d = ph_engine.event('d')
      ph_engine.on(ph_a, n => ph_engine.emit(b, n + 1))
      ph_engine.on(b, n => ph_engine.emit(c, n * 2))
      ph_engine.on(c, n => ph_engine.emit(d, n + 10))
      let r = 0; ph_engine.on(d, v => { r = v })
    },
  })

  // RxJS
  let rx_src
  bench.add('RxJS pipe chain', () => { rx_src.next(1) }, {
    beforeAll: () => {
      rx_src = new Subject(); let r = 0
      rx_src.pipe(map(n => n + 1), map(n => n * 2), map(n => n + 10)).subscribe(v => { r = v })
    },
  })

  // EventEmitter3
  let ee_chain
  bench.add('EventEmitter3 chain', () => { ee_chain.emit('a', 1) }, {
    beforeAll: () => {
      ee_chain = new EventEmitter(); let r = 0
      ee_chain.on('a', n => ee_chain.emit('b', n + 1))
      ee_chain.on('b', n => ee_chain.emit('c', n * 2))
      ee_chain.on('c', n => ee_chain.emit('d', n + 10))
      ee_chain.on('d', v => { r = v })
    },
  })

  // Redux
  let rdx_chain, rdx_step
  bench.add('Redux middleware chain', () => { rdx_chain.dispatch(rdx_step(1)) }, {
    beforeAll: () => {
      const slice = createSlice({ name: 'ch', initialState: { v: 0 }, reducers: { step: (s, a) => { s.v = ((a.payload + 1) * 2) + 10 } } })
      rdx_chain = configureStore({ reducer: slice.reducer }); rdx_step = slice.actions.step
      let r = 0; rdx_chain.subscribe(() => { r = rdx_chain.getState().v })
    },
  })

  return printBench(bench)
}

// ============================================================================
// 3. Fan-out (1 event -> N handlers)
// ============================================================================

async function benchFanOut() {
  log('\n=== Fan-Out (1 event -> 100 handlers) ===')
  const bench = new Bench({ warmupIterations: 2000, iterations: 100_000 })
  const N = 100

  // Pulse
  let pf_engine, pf_ev
  bench.add('Pulse', () => { pf_engine.emit(pf_ev, 1) }, {
    beforeAll: () => {
      pf_engine = createEngine(); pf_ev = pf_engine.event('ev'); let t = 0
      for (let i = 0; i < N; i++) pf_engine.on(pf_ev, v => { t += v })
    },
  })

  // EventEmitter3
  let ee_fo
  bench.add('EventEmitter3', () => { ee_fo.emit('ev', 1) }, {
    beforeAll: () => { ee_fo = new EventEmitter(); let t = 0; for (let i = 0; i < N; i++) ee_fo.on('ev', v => { t += v }) },
  })

  // RxJS
  let rx_fo
  bench.add('RxJS Subject', () => { rx_fo.next(1) }, {
    beforeAll: () => { rx_fo = new Subject(); let t = 0; for (let i = 0; i < N; i++) rx_fo.subscribe(v => { t += v }) },
  })

  // Redux
  let rdx_fo, rdx_set
  bench.add('Redux', () => { rdx_fo.dispatch(rdx_set(++rdx_v)) }, {
    beforeAll: () => {
      const slice = createSlice({ name: 'fo', initialState: { v: 0 }, reducers: { set: (s, a) => { s.v = a.payload } } })
      rdx_fo = configureStore({ reducer: slice.reducer }); rdx_set = slice.actions.set; rdx_v = 0
      let t = 0; for (let i = 0; i < N; i++) rdx_fo.subscribe(() => { t += rdx_fo.getState().v })
    },
  })
  let rdx_v = 0

  return printBench(bench)
}

// ============================================================================
// 4. Join / combineLatest
// ============================================================================

async function benchJoin() {
  log('\n=== Join / CombineLatest (2 inputs) ===')
  const bench = new Bench({ warmupIterations: 5000, iterations: 500_000 })

  // Pulse
  let pj_engine, pj_a, pj_b
  bench.add('Pulse join', () => { pj_engine.emit(pj_a, 1); pj_engine.emit(pj_b, 2) }, {
    beforeAll: () => {
      pj_engine = createEngine(); pj_a = pj_engine.event('a'); pj_b = pj_engine.event('b')
      let r = 0; pj_engine.on([pj_a, pj_b], (va, vb) => { r = va + vb })
    },
  })

  // RxJS
  let rx_a, rx_b
  bench.add('RxJS combineLatest', () => { rx_a.next(1); rx_b.next(2) }, {
    beforeAll: () => {
      rx_a = new Subject(); rx_b = new Subject(); let r = 0
      combineLatest([rx_a, rx_b]).subscribe(([va, vb]) => { r = va + vb })
    },
  })

  return printBench(bench)
}

// ============================================================================
// 5. Conditional routing
// ============================================================================

async function benchConditional() {
  log('\n=== Conditional Routing ===')
  const bench = new Bench({ warmupIterations: 5000, iterations: 500_000 })

  // Pulse
  let pcon_engine, pcon_input, pcon_i
  bench.add('Pulse on().emit() + Skip', () => { pcon_engine.emit(pcon_input, (pcon_i++ % 2 === 0) ? 5 : -5) }, {
    beforeAll: () => {
      pcon_engine = createEngine(); pcon_input = pcon_engine.event('input'); pcon_i = 0
      const pos = pcon_engine.event('pos'); const neg = pcon_engine.event('neg'); let r = 0
      pcon_engine.on(pcon_input).emit(pos, n => n > 0 ? n : Skip)
      pcon_engine.on(pcon_input).emit(neg, n => n <= 0 ? n : Skip)
      pcon_engine.on(pos, v => { r = v }); pcon_engine.on(neg, v => { r = v })
    },
  })

  // RxJS
  let rx_con, rx_ci
  bench.add('RxJS filter + map', () => { rx_con.next((rx_ci++ % 2 === 0) ? 5 : -5) }, {
    beforeAll: () => {
      rx_con = new Subject(); rx_ci = 0; let r = 0
      rx_con.pipe(filter(n => n > 0)).subscribe(v => { r = v })
      rx_con.pipe(filter(n => n <= 0)).subscribe(v => { r = v })
    },
  })

  return printBench(bench)
}

// ============================================================================
// 6. Deep chain (26 levels)
// ============================================================================

async function benchDeepChain() {
  log('\n=== Deep Chain (26 levels) ===')
  const bench = new Bench({ warmupIterations: 2000, iterations: 100_000 })

  // Pulse chaining
  let pd_engine, pd_first
  bench.add('Pulse chaining', () => { pd_engine.emit(pd_first, 0) }, {
    beforeAll: () => {
      pd_engine = createEngine(); const events = []; for (let i = 0; i < 27; i++) events.push(pd_engine.event(`e${i}`))
      pd_first = events[0]; for (let i = 0; i < 26; i++) pd_engine.on(events[i]).emit(events[i + 1], n => n + 1)
      let r = 0; pd_engine.on(events[26], v => { r = v })
    },
  })

  // RxJS
  let rx_deep
  bench.add('RxJS pipe', () => { rx_deep.next(0) }, {
    beforeAll: () => {
      rx_deep = new Subject(); let obs = rx_deep.asObservable()
      for (let i = 0; i < 26; i++) obs = obs.pipe(map(n => n + 1))
      let r = 0; obs.subscribe(v => { r = v })
    },
  })

  // EventEmitter3
  let ee_deep
  bench.add('EventEmitter3', () => { ee_deep.emit('e0', 0) }, {
    beforeAll: () => {
      ee_deep = new EventEmitter()
      for (let i = 0; i < 26; i++) { const from = `e${i}`, to = `e${i + 1}`; ee_deep.on(from, n => ee_deep.emit(to, n + 1)) }
      let r = 0; ee_deep.on('e26', v => { r = v })
    },
  })

  return printBench(bench)
}

// ============================================================================
// 7. Memory
// ============================================================================

async function benchMemory() {
  log('\n=== Memory: heap delta for 1K events ===')
  const results = {}

  for (const [name, setup] of [
    ['Pulse', () => { const e = createEngine(); const ev = e.event('ev'); let c = 0; e.on(ev, () => { c++ }); return () => e.emit(ev, c) }],
    ['RxJS', () => { const s = new Subject(); let c = 0; s.subscribe(() => { c++ }); return () => s.next(c) }],
    ['EventEmitter3', () => { const ee = new EventEmitter(); let c = 0; ee.on('ev', () => { c++ }); return () => ee.emit('ev', c) }],
  ]) {
    const fn = setup()
    if (global.gc) global.gc()
    const before = process.memoryUsage().heapUsed
    for (let i = 0; i < 1000; i++) fn()
    const after = process.memoryUsage().heapUsed
    results[name] = Math.max(0, after - before)
  }

  if (!JSON_MODE) {
    for (const [name, bytes] of Object.entries(results)) {
      console.log(`  ${name.padEnd(20)} ${(bytes / 1024).toFixed(1)} KB`)
    }
  }
  return results
}

// ============================================================================
// Run
// ============================================================================

async function main() {
  log('Pulse Engine Benchmark Suite')
  log('============================')
  log(`Node ${process.version} | ${process.platform} ${process.arch}\n`)

  await benchThroughput()
  await benchChain()
  await benchFanOut()
  await benchJoin()
  await benchConditional()
  await benchDeepChain()
  await benchMemory()

  log('\nDone.')
}

main().catch(console.error)

# Ember + Pulse: Realtime Dashboard

Demonstrates a live metrics dashboard with mock data feed, threshold detection via `engine.when`, join pattern for critical alerts, and `TrackedTween` for chart animations.

## Pulse Concepts Used

- **Events**: `DataTick`, per-metric updates (`CpuUpdated`, `MemoryUpdated`, etc.), `CpuThresholdBreached`, `MemoryThresholdBreached`, `AlertRaised`, `AlertDismissed`
- **Pipes**: Fan out `DataTick` to individual metric events; threshold breaches to alerts
- **When**: `engine.when(cpuValue, v => v > 85, CpuThresholdBreached)` for threshold detection
- **Join**: `engine.join([CpuThreshold, MemoryThreshold], AlertRaised)` for critical alert
- **Signals**: `cpuValue`, `memoryValue`, `cpuHistory`, `alerts`, `feedRunning`, etc.
- **Tween**: `chartTween` animates on each new data point
- **TrackedSignal/TrackedTween**: Bridges all reactive state into Ember autotracking

## Integration Pattern

1. `engine.ts` sets up the full event pipeline: data tick -> fan-out -> threshold -> alerts
2. `startFeed()`/`stopFeed()` control a mock data interval
3. Component creates tracked wrappers for all signals and the chart tween
4. Template reads tracked values directly; Ember handles re-rendering
5. Sparkline bars are computed from signal history arrays

## Running with Ember CLI

1. Generate a new Ember app: `npx ember-cli new my-app --embroider`
2. Install deps: `pnpm add @pulse/core @pulse/ember`
3. Copy `src/engine.ts` and component files into your app

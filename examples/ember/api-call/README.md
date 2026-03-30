# Ember + Pulse: API Call

Demonstrates async event handling with `engine.async()` and TrackedSignal for loading/error/results states.

## Pulse Concepts Used

- **Events**: `SearchQueryChanged`, `SearchSubmitted`, `SearchPending`, `SearchDone`, `SearchError`, `SearchCleared`
- **Pipe**: Query forwarding (`SearchQueryChanged` -> `SearchSubmitted`)
- **Async**: Simulated API search with `strategy: 'latest'` (cancels in-flight requests)
- **Signals**: `queryText`, `isLoading`, `searchResults`, `searchError`
- **TrackedSignal**: Wraps each signal for Ember autotracking

## Integration Pattern

1. `engine.ts` wires the async flow: query change -> debounced search -> pending/done/error
2. Multiple signals track different aspects of the async lifecycle
3. Components consume `TrackedSignal` wrappers that auto-update templates
4. The `strategy: 'latest'` ensures only the most recent search completes

## Running with Ember CLI

1. Generate a new Ember app: `npx ember-cli new my-app --embroider`
2. Install deps: `pnpm add @pulse/core @pulse/ember`
3. Copy `src/engine.ts` into your app's services
4. Copy component logic into `app/components/`

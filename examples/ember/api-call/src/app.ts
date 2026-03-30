import Component from '@glimmer/component'
import { action } from '@ember/object'
import { TrackedSignal } from '@pulse/ember'
import {
  pulse,
  queryText,
  isLoading,
  searchResults,
  searchError,
  SearchQueryChanged,
  SearchCleared,
  type User,
} from './engine'

// ---------------------------------------------------------------------------
// UserSearchApp — root component
// ---------------------------------------------------------------------------

// Template: see components/app.hbs

export default class UserSearchApp extends Component {
  query: TrackedSignal<string>
  loading: TrackedSignal<boolean>
  results: TrackedSignal<User[]>
  error: TrackedSignal<string | null>

  constructor(owner: unknown, args: Record<string, unknown>) {
    super(owner, args)
    this.query = pulse.createSignal(queryText)
    this.loading = pulse.createSignal(isLoading)
    this.results = pulse.createSignal(searchResults)
    this.error = pulse.createSignal(searchError)
  }

  get hasResults(): boolean {
    return this.results.value.length > 0
  }

  get showEmpty(): boolean {
    return (
      !this.loading.value &&
      !this.error.value &&
      this.query.value.trim().length > 0 &&
      this.results.value.length === 0
    )
  }

  @action
  updateQuery(event: Event): void {
    const value = (event.target as HTMLInputElement).value
    pulse.emit(SearchQueryChanged, value)
  }

  @action
  clearSearch(): void {
    pulse.emit(SearchQueryChanged, '')
    pulse.emit(SearchCleared, undefined)
  }

  willDestroy(): void {
    super.willDestroy()
    this.query.destroy()
    this.loading.destroy()
    this.results.destroy()
    this.error.destroy()
  }
}

import Component from '@glimmer/component'
import { action } from '@ember/object'
import { type PulseBinding } from '@pulse/ember'
import {
  pulse,
  startLoop,
  SearchInput,
  SearchQueryChanged,
  SearchLoading,
  SearchDone,
  SearchError,
  type User,
} from './engine'

// ---------------------------------------------------------------------------
// UserSearchApp — root component
// ---------------------------------------------------------------------------

// Template: see components/app.hbs

export default class UserSearchApp extends Component {
  query: PulseBinding<string>
  loading: PulseBinding<boolean>
  results: PulseBinding<User[]>
  error: PulseBinding<string | null>

  constructor(owner: unknown, args: Record<string, unknown>) {
    super(owner, args)
    startLoop()
    this.query = pulse.bind(SearchQueryChanged, '')
    this.loading = pulse.bind(SearchLoading, false)
    this.results = pulse.bind(SearchDone, [])
    this.error = pulse.bind(SearchError, null)
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
    pulse.emit(SearchInput, value)
  }

  @action
  clearSearch(): void {
    pulse.emit(SearchInput, '')
  }

  willDestroy(): void {
    super.willDestroy()
    this.query.destroy()
    this.loading.destroy()
    this.results.destroy()
    this.error.destroy()
  }
}

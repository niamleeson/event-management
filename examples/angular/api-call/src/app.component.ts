import { Component, type WritableSignal } from '@angular/core'
import { PulseService } from '@pulse/angular'
import {
  SearchQuery,
  querySig,
  loadingSig,
  resultsSig,
  errorSig,
  type User,
} from './engine'

@Component({
  selector: 'app-root',
  standalone: true,
  providers: [PulseService],
  template: `
    <div class="container">
      <h1>User Search</h1>
      <p class="subtitle">Async search with "latest" strategy (cancels previous requests)</p>

      <div class="search-box">
        <input
          type="text"
          [value]="query()"
          (input)="onSearch($event)"
          placeholder="Search users by name, email, or company..."
        />
        @if (loading()) {
          <div class="spinner"></div>
        }
      </div>

      @if (error()) {
        <div class="error">{{ error() }}</div>
      }

      @if (!loading() && query().length > 0 && results().length === 0 && !error()) {
        <p class="no-results">No users found for "{{ query() }}"</p>
      }

      <div class="results">
        @for (user of results(); track user.id) {
          <div class="user-card">
            <div class="avatar">{{ user.name.charAt(0) }}</div>
            <div class="info">
              <div class="name">{{ user.name }}</div>
              <div class="email">{{ user.email }}</div>
              <div class="company">{{ user.company }}</div>
            </div>
          </div>
        }
      </div>

      <p class="hint">Try typing "error" to see error handling, or type fast to see request cancellation.</p>
    </div>
  `,
  styles: [`
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 { margin-bottom: 0.25rem; }
    .subtitle { color: #888; margin-bottom: 1rem; font-size: 0.9rem; }
    .search-box {
      position: relative;
      margin-bottom: 1rem;
    }
    input[type="text"] {
      width: 100%;
      padding: 0.75rem;
      padding-right: 2.5rem;
      border: 2px solid #ddd;
      border-radius: 6px;
      font-size: 1rem;
    }
    input[type="text"]:focus {
      outline: none;
      border-color: #3498db;
    }
    .spinner {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      width: 20px;
      height: 20px;
      border: 3px solid #eee;
      border-top-color: #3498db;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: translateY(-50%) rotate(360deg); } }
    .error {
      background: #fce4e4;
      color: #c0392b;
      padding: 0.75rem;
      border-radius: 6px;
      margin-bottom: 1rem;
    }
    .no-results {
      text-align: center;
      color: #888;
      padding: 2rem 0;
    }
    .results {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .user-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem;
      border: 1px solid #eee;
      border-radius: 6px;
      transition: box-shadow 0.2s;
    }
    .user-card:hover {
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #3498db;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 1.1rem;
      flex-shrink: 0;
    }
    .info { flex: 1; }
    .name { font-weight: 600; }
    .email { color: #888; font-size: 0.85rem; }
    .company { color: #3498db; font-size: 0.85rem; }
    .hint {
      margin-top: 1.5rem;
      font-size: 0.8rem;
      color: #aaa;
      text-align: center;
    }
  `],
})
export class AppComponent {
  query: WritableSignal<string>
  loading: WritableSignal<boolean>
  results: WritableSignal<User[]>
  error: WritableSignal<string | null>

  constructor(private pulse: PulseService) {
    this.query = pulse.signal(querySig)
    this.loading = pulse.signal(loadingSig)
    this.results = pulse.signal(resultsSig)
    this.error = pulse.signal(errorSig)
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value
    this.pulse.emit(SearchQuery, value)
  }
}

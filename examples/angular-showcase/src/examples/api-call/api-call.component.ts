import { Component, type WritableSignal, OnInit, OnDestroy } from '@angular/core'
import { providePulse, PulseService } from '@pulse/angular'
import {
  engine,
  SearchInput,
  UserSelected,
  searchQuery,
  searchResults,
  isSearching,
  selectedUserId,
  userDetails,
  isLoadingDetails,
  error,
  type User,
  type UserDetails,
} from './engine'

@Component({
  selector: 'app-api-call',
  standalone: true,
  providers: [providePulse(engine), PulseService],
  template: `
    <div class="container">
      <div class="header">
        <h1 class="title">User Search</h1>
        <p class="subtitle">
          Async search with debounce, cancellation, and details fetching via Pulse
        </p>
      </div>

      @if (errorMsg()) {
        <div class="error-box">{{ errorMsg() }}</div>
      }

      <div class="search-box">
        <span class="search-icon">&#128269;</span>
        <input
          class="input"
          [value]="query()"
          (input)="onSearch($event)"
          placeholder="Search users by name, email, or role..."
        />
        @if (loading()) {
          <div class="spinner"></div>
        }
      </div>

      @if (loading() && results().length === 0) {
        <div class="loading-overlay">Searching...</div>
      } @else if (query().length > 0 && results().length === 0 && !loading()) {
        <div class="empty">No users found for "{{ query() }}"</div>
      } @else if (results().length === 0) {
        <div class="empty">Type in the search box to find users</div>
      } @else {
        <div class="grid">
          @for (user of results(); track user.id) {
            <div
              class="user-card"
              [class.selected]="selected() === user.id"
              (click)="selectUser(user.id)"
            >
              <div class="avatar">{{ user.avatar }}</div>
              <p class="user-name">{{ user.name }}</p>
              <p class="user-role">{{ user.role }}</p>
            </div>
          }
        </div>
      }

      @if (selected()) {
        @if (loadingDetails()) {
          <div class="details-panel">
            <div class="loading-overlay">Loading user details...</div>
          </div>
        } @else if (details()) {
          <div class="details-panel">
            <div class="details-header">
              <div class="details-avatar">{{ details()!.avatar }}</div>
              <div>
                <h3 class="details-name">{{ details()!.name }}</h3>
                <p class="details-email">{{ details()!.email }}</p>
              </div>
            </div>
            <div class="detail-field">
              <div class="detail-label">Role</div>
              <div class="detail-value">{{ details()!.role }}</div>
            </div>
            <div class="detail-field">
              <div class="detail-label">Bio</div>
              <div class="detail-value">{{ details()!.bio }}</div>
            </div>
            <div class="detail-field">
              <div class="detail-label">Location</div>
              <div class="detail-value">{{ details()!.location }}</div>
            </div>
            <div class="detail-field">
              <div class="detail-label">Joined</div>
              <div class="detail-value">{{ details()!.joinDate }}</div>
            </div>
            <div class="detail-field">
              <div class="detail-label">Projects</div>
              <div>
                @for (p of details()!.projects; track p) {
                  <span class="tag">{{ p }}</span>
                }
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .container {
      max-width: 720px;
      margin: 40px auto;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 0 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
    }
    .title {
      font-size: 36px;
      font-weight: 700;
      color: #1a1a2e;
      margin: 0;
    }
    .subtitle {
      color: #6c757d;
      font-size: 14px;
      margin-top: 4px;
    }
    .search-box {
      position: relative;
      margin-bottom: 24px;
    }
    .search-icon {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      color: #6c757d;
      font-size: 18px;
    }
    .input {
      width: 100%;
      padding: 14px 16px 14px 44px;
      font-size: 16px;
      border: 2px solid #e9ecef;
      border-radius: 12px;
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.2s;
    }
    .input:focus {
      border-color: #4361ee;
    }
    .spinner {
      position: absolute;
      right: 16px;
      top: 50%;
      transform: translateY(-50%);
      width: 20px;
      height: 20px;
      border: 2px solid #e9ecef;
      border-top: 2px solid #4361ee;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: translateY(-50%) rotate(360deg); } }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .user-card {
      padding: 16px;
      background: #ffffff;
      border-radius: 12px;
      border: 2px solid #e9ecef;
      cursor: pointer;
      transition: all 0.2s;
    }
    .user-card:hover {
      border-color: #4361ee;
      transform: translateY(-2px);
    }
    .user-card.selected {
      background: #eef0ff;
      border-color: #4361ee;
    }
    .avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #4361ee;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 16px;
      margin-bottom: 8px;
    }
    .user-name {
      font-weight: 600;
      font-size: 16px;
      color: #1a1a2e;
      margin: 0;
    }
    .user-role {
      font-size: 13px;
      color: #6c757d;
      margin: 2px 0 0;
    }
    .details-panel {
      margin-top: 24px;
      padding: 24px;
      background: #ffffff;
      border-radius: 12px;
      border: 2px solid #e9ecef;
    }
    .details-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }
    .details-avatar {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #4361ee;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 22px;
      flex-shrink: 0;
    }
    .details-name {
      margin: 0;
      font-size: 22px;
      color: #1a1a2e;
    }
    .details-email {
      margin: 4px 0 0;
      color: #6c757d;
      font-size: 14px;
    }
    .detail-field {
      margin-bottom: 12px;
    }
    .detail-label {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      color: #6c757d;
      letter-spacing: 0.5px;
    }
    .detail-value {
      font-size: 15px;
      color: #1a1a2e;
      margin-top: 2px;
    }
    .tag {
      display: inline-block;
      padding: 4px 10px;
      background: #eef0ff;
      color: #4361ee;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      margin-right: 6px;
      margin-top: 4px;
    }
    .error-box {
      padding: 16px;
      background: #fef2f2;
      border: 1px solid #e63946;
      border-radius: 8px;
      color: #e63946;
      font-size: 14px;
      margin-bottom: 16px;
    }
    .empty {
      text-align: center;
      padding: 40px;
      color: #6c757d;
    }
    .loading-overlay {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
      color: #6c757d;
    }
  `],
})
export class ApiCallComponent implements OnInit, OnDestroy {
  query: WritableSignal<string>
  loading: WritableSignal<boolean>
  results: WritableSignal<User[]>
  errorMsg: WritableSignal<string | null>
  selected: WritableSignal<string | null>
  details: WritableSignal<UserDetails | null>
  loadingDetails: WritableSignal<boolean>

  constructor(private pulse: PulseService) {
    this.query = pulse.signal(searchQuery)
    this.loading = pulse.signal(isSearching)
    this.results = pulse.signal(searchResults)
    this.errorMsg = pulse.signal(error)
    this.selected = pulse.signal(selectedUserId)
    this.details = pulse.signal(userDetails)
    this.loadingDetails = pulse.signal(isLoadingDetails)
  }

  ngOnInit(): void {
    ;(window as any).__pulseEngine = engine
  }

  ngOnDestroy(): void {
    ;(window as any).__pulseEngine = null
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value
    this.pulse.emit(SearchInput, value)
  }

  selectUser(userId: string): void {
    this.pulse.emit(UserSelected, userId)
  }
}

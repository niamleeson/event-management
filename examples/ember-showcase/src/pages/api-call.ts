import {
  engine,
  getSearchQuery,
  getSearchResults,
  getIsSearching,
  getSelectedUserId,
  getUserDetails,
  getIsLoadingDetails,
  getError,
  SearchInput,
  SearchDone,
  SearchError,
  SearchPending,
  UserSelected,
  UserDetailsDone,
  UserDetailsPending,
  UserDetailsError,
  type User,
  type UserDetails as UserDetailsType,
} from '../engines/api-call'

const colors = {
  bg: '#f8f9fa',
  card: '#ffffff',
  primary: '#4361ee',
  primaryLight: '#eef0ff',
  text: '#1a1a2e',
  muted: '#6c757d',
  border: '#e9ecef',
  danger: '#e63946',
  success: '#2a9d8f',
}

export function mount(container: HTMLElement): () => void {
  ;(window as any).__pulseEngine = engine

  const unsubs: (() => void)[] = []

  const wrapper = document.createElement('div')
  wrapper.style.cssText = `max-width: 720px; margin: 40px auto; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 0 20px;`
  container.appendChild(wrapper)

  // Header
  const header = document.createElement('div')
  header.style.cssText = 'text-align: center; margin-bottom: 32px;'
  header.innerHTML = `
    <h1 style="font-size: 36px; font-weight: 700; color: ${colors.text}; margin: 0;">User Search</h1>
    <p style="color: ${colors.muted}; font-size: 14px; margin-top: 4px;">Async search with debounce, cancellation, and details fetching via Pulse</p>
  `
  wrapper.appendChild(header)

  // Error banner
  const errorBanner = document.createElement('div')
  errorBanner.style.cssText = `padding: 16px; background: #fef2f2; border: 1px solid ${colors.danger}; border-radius: 8px; color: ${colors.danger}; font-size: 14px; margin-bottom: 16px; display: none;`
  wrapper.appendChild(errorBanner)

  // Search box
  const searchBox = document.createElement('div')
  searchBox.style.cssText = 'position: relative; margin-bottom: 24px;'

  const searchIcon = document.createElement('span')
  searchIcon.style.cssText = `position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: ${colors.muted}; font-size: 18px;`
  searchIcon.innerHTML = '&#128269;'

  const searchInput = document.createElement('input')
  searchInput.style.cssText = `width: 100%; padding: 14px 16px 14px 44px; font-size: 16px; border: 2px solid ${colors.border}; border-radius: 12px; outline: none; box-sizing: border-box; transition: border-color 0.2s;`
  searchInput.placeholder = 'Search users by name, email, or role...'
  searchInput.value = getSearchQuery()
  searchInput.addEventListener('input', (e) => {
    engine.emit(SearchInput, (e.target as HTMLInputElement).value)
  })

  const spinner = document.createElement('div')
  spinner.style.cssText = `position: absolute; right: 16px; top: 50%; transform: translateY(-50%); width: 20px; height: 20px; border: 2px solid ${colors.border}; border-top: 2px solid ${colors.primary}; border-radius: 50%; animation: spin 0.8s linear infinite; display: none;`

  const styleTag = document.createElement('style')
  styleTag.textContent = `@keyframes spin { to { transform: translateY(-50%) rotate(360deg); } }`
  document.head.appendChild(styleTag)

  searchBox.appendChild(searchIcon)
  searchBox.appendChild(searchInput)
  searchBox.appendChild(spinner)
  wrapper.appendChild(searchBox)

  const resultsArea = document.createElement('div')
  wrapper.appendChild(resultsArea)

  const detailsPanel = document.createElement('div')
  detailsPanel.style.cssText = `margin-top: 24px; padding: 24px; background: ${colors.card}; border-radius: 12px; border: 2px solid ${colors.border}; display: none;`
  wrapper.appendChild(detailsPanel)

  // --- Render functions ---

  function renderResults() {
    resultsArea.innerHTML = ''
    const results = getSearchResults()
    const query = getSearchQuery()
    const loading = getIsSearching()

    if (loading && results.length === 0) {
      const loadingDiv = document.createElement('div')
      loadingDiv.style.cssText = `display: flex; align-items: center; justify-content: center; padding: 40px; color: ${colors.muted};`
      loadingDiv.textContent = 'Searching...'
      resultsArea.appendChild(loadingDiv)
      return
    }

    if (query.length > 0 && results.length === 0 && !loading) {
      const empty = document.createElement('div')
      empty.style.cssText = `text-align: center; padding: 40px; color: ${colors.muted};`
      empty.textContent = `No users found for "${query}"`
      resultsArea.appendChild(empty)
      return
    }

    if (results.length === 0) {
      const empty = document.createElement('div')
      empty.style.cssText = `text-align: center; padding: 40px; color: ${colors.muted};`
      empty.textContent = 'Type in the search box to find users'
      resultsArea.appendChild(empty)
      return
    }

    const grid = document.createElement('div')
    grid.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 16px;'

    const selected = getSelectedUserId()

    for (const user of results) {
      const isSelected = selected === user.id
      const card = document.createElement('div')
      card.style.cssText = `padding: 16px; background: ${isSelected ? colors.primaryLight : colors.card}; border-radius: 12px; border: 2px solid ${isSelected ? colors.primary : colors.border}; cursor: pointer; transition: all 0.2s;`

      const avatar = document.createElement('div')
      avatar.style.cssText = `width: 48px; height: 48px; border-radius: 50%; background: ${colors.primary}; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; margin-bottom: 8px;`
      avatar.textContent = user.avatar

      const name = document.createElement('p')
      name.style.cssText = `font-weight: 600; font-size: 16px; color: ${colors.text}; margin: 0;`
      name.textContent = user.name

      const role = document.createElement('p')
      role.style.cssText = `font-size: 13px; color: ${colors.muted}; margin: 2px 0 0;`
      role.textContent = user.role

      card.appendChild(avatar)
      card.appendChild(name)
      card.appendChild(role)

      card.addEventListener('click', () => engine.emit(UserSelected, user.id))
      card.addEventListener('mouseenter', () => {
        if (getSelectedUserId() !== user.id) {
          card.style.borderColor = colors.primary
          card.style.transform = 'translateY(-2px)'
        }
      })
      card.addEventListener('mouseleave', () => {
        if (getSelectedUserId() !== user.id) {
          card.style.borderColor = colors.border
          card.style.transform = 'translateY(0)'
        }
      })

      grid.appendChild(card)
    }

    resultsArea.appendChild(grid)
  }

  function renderDetailsPanel() {
    const selected = getSelectedUserId()
    if (!selected) {
      detailsPanel.style.display = 'none'
      return
    }

    detailsPanel.style.display = 'block'

    if (getIsLoadingDetails()) {
      detailsPanel.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; padding: 40px; color: ${colors.muted};">Loading user details...</div>`
      return
    }

    const details = getUserDetails()
    if (!details) {
      detailsPanel.style.display = 'none'
      return
    }

    detailsPanel.innerHTML = `
      <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
        <div style="width: 64px; height: 64px; border-radius: 50%; background: ${colors.primary}; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 22px; flex-shrink: 0;">${details.avatar}</div>
        <div>
          <h3 style="margin: 0; font-size: 22px; color: ${colors.text};">${details.name}</h3>
          <p style="margin: 4px 0 0; color: ${colors.muted}; font-size: 14px;">${details.email}</p>
        </div>
      </div>
      <div style="margin-bottom: 12px;">
        <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: ${colors.muted}; letter-spacing: 0.5px;">Role</div>
        <div style="font-size: 15px; color: ${colors.text}; margin-top: 2px;">${details.role}</div>
      </div>
      <div style="margin-bottom: 12px;">
        <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: ${colors.muted}; letter-spacing: 0.5px;">Bio</div>
        <div style="font-size: 15px; color: ${colors.text}; margin-top: 2px;">${details.bio}</div>
      </div>
      <div style="margin-bottom: 12px;">
        <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: ${colors.muted}; letter-spacing: 0.5px;">Location</div>
        <div style="font-size: 15px; color: ${colors.text}; margin-top: 2px;">${details.location}</div>
      </div>
      <div style="margin-bottom: 12px;">
        <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: ${colors.muted}; letter-spacing: 0.5px;">Joined</div>
        <div style="font-size: 15px; color: ${colors.text}; margin-top: 2px;">${details.joinDate}</div>
      </div>
      <div>
        <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: ${colors.muted}; letter-spacing: 0.5px;">Projects</div>
        <div style="margin-top: 4px;">${details.projects.map((p: string) => `<span style="display: inline-block; padding: 4px 10px; background: ${colors.primaryLight}; color: ${colors.primary}; border-radius: 12px; font-size: 12px; font-weight: 600; margin-right: 6px; margin-top: 4px;">${p}</span>`).join('')}</div>
      </div>
    `
  }

  // Subscribe
  unsubs.push(engine.on(SearchPending, () => {
    spinner.style.display = 'block'
    renderResults()
  }))
  unsubs.push(engine.on(SearchDone, () => {
    spinner.style.display = 'none'
    renderResults()
  }))
  unsubs.push(engine.on(SearchError, () => {
    spinner.style.display = 'none'
    const err = getError()
    if (err) {
      errorBanner.textContent = err
      errorBanner.style.display = 'block'
    } else {
      errorBanner.style.display = 'none'
    }
    renderResults()
  }))
  unsubs.push(engine.on(UserSelected, () => {
    renderResults()
    renderDetailsPanel()
  }))
  unsubs.push(engine.on(UserDetailsPending, () => renderDetailsPanel()))
  unsubs.push(engine.on(UserDetailsDone, () => renderDetailsPanel()))
  unsubs.push(engine.on(UserDetailsError, () => renderDetailsPanel()))

  // Initial render
  renderResults()

  return () => {
    ;(window as any).__pulseEngine = null
    engine.destroy()
    unsubs.forEach((u) => u())
    if (styleTag.parentNode) styleTag.parentNode.removeChild(styleTag)
  }
}

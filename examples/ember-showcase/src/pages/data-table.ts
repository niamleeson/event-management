import { engine, DEPARTMENTS, STATUSES, PAGE_SIZE, SortChanged, SearchChanged, DepartmentFilterChanged, StatusFilterChanged, PageChanged, ToggleRowExpand, getSortState, getFilterState, getCurrentPage, getExpandedRows, getColumnWidths, getFilteredRows, getPageRows, getTotalPages, TableChanged, type ColumnKey } from '../engines/data-table'

export function mount(container: HTMLElement): () => void {
  ;(window as any).__pulseEngine = engine
  const unsubs: (() => void)[] = []
  const wrapper = document.createElement('div'); wrapper.style.cssText = 'max-width: 1100px; margin: 0 auto; padding: 32px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;'
  wrapper.innerHTML = `<h2 style="font-size: 28px; font-weight: 800; color: #1a1a2e; margin-bottom: 4px;">Data Table</h2><p style="color: #666; font-size: 14px; margin-bottom: 16px;">1K rows, sort/filter/paginate, expand rows.</p>`

  // Filters
  const filterRow = document.createElement('div'); filterRow.style.cssText = 'display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; align-items: center;'
  const searchInput = document.createElement('input'); searchInput.type = 'text'; searchInput.style.cssText = 'padding: 8px 12px; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 14px; outline: none; min-width: 200px;'; searchInput.placeholder = 'Search...'
  searchInput.addEventListener('input', () => engine.emit(SearchChanged, searchInput.value)); filterRow.appendChild(searchInput)

  const deptSelect = document.createElement('select'); deptSelect.style.cssText = 'padding: 8px 12px; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 13px;'
  deptSelect.innerHTML = '<option value="">All Departments</option>' + DEPARTMENTS.map((d) => `<option value="${d}">${d}</option>`).join('')
  deptSelect.addEventListener('change', () => engine.emit(DepartmentFilterChanged, deptSelect.value || null)); filterRow.appendChild(deptSelect)

  const statusSelect = document.createElement('select'); statusSelect.style.cssText = 'padding: 8px 12px; border: 1px solid #e0e0e0; border-radius: 6px; font-size: 13px;'
  statusSelect.innerHTML = '<option value="">All Statuses</option>' + STATUSES.map((s) => `<option value="${s}">${s}</option>`).join('')
  statusSelect.addEventListener('change', () => engine.emit(StatusFilterChanged, statusSelect.value || null)); filterRow.appendChild(statusSelect)
  wrapper.appendChild(filterRow)

  const infoEl = document.createElement('div'); infoEl.style.cssText = 'font-size: 13px; color: #667085; margin-bottom: 8px;'; wrapper.appendChild(infoEl)

  // Table
  const tableWrapper = document.createElement('div'); tableWrapper.style.cssText = 'overflow-x: auto; border: 1px solid #e4e7ec; border-radius: 8px;'
  const table = document.createElement('table'); table.style.cssText = 'border-collapse: collapse; width: 100%;'
  tableWrapper.appendChild(table); wrapper.appendChild(tableWrapper)

  // Pagination
  const pagination = document.createElement('div'); pagination.style.cssText = 'display: flex; gap: 4px; justify-content: center; margin-top: 16px; flex-wrap: wrap;'; wrapper.appendChild(pagination)
  container.appendChild(wrapper)

  const COLUMNS: { key: ColumnKey; label: string }[] = [
    { key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'email', label: 'Email' },
    { key: 'department', label: 'Dept' }, { key: 'salary', label: 'Salary' }, { key: 'startDate', label: 'Start Date' }, { key: 'status', label: 'Status' },
  ]

  const statusColors: Record<string, string> = { active: '#10b981', inactive: '#ef4444', pending: '#f59e0b' }

  function render() {
    const rows = getPageRows(); const sort = getSortState(); const expanded = getExpandedRows(); const totalFiltered = getFilteredRows().length; const totalPages = getTotalPages(); const page = getCurrentPage(); const widths = getColumnWidths()

    infoEl.textContent = `Showing ${page * PAGE_SIZE + 1}-${Math.min((page + 1) * PAGE_SIZE, totalFiltered)} of ${totalFiltered} rows`

    table.innerHTML = ''
    // Header
    const thead = document.createElement('thead'); const headRow = document.createElement('tr')
    headRow.innerHTML = '<th style="width: 30px; padding: 8px; background: #f8f9fa; border-bottom: 2px solid #e4e7ec;"></th>'
    for (const col of COLUMNS) {
      const th = document.createElement('th'); th.style.cssText = `padding: 8px 12px; background: #f8f9fa; border-bottom: 2px solid #e4e7ec; text-align: left; cursor: pointer; font-size: 13px; font-weight: 600; color: #344054; width: ${widths[col.key]}px; user-select: none;`
      th.textContent = col.label + (sort.column === col.key ? (sort.direction === 'asc' ? ' \u25B2' : ' \u25BC') : '')
      th.addEventListener('click', () => engine.emit(SortChanged, col.key)); headRow.appendChild(th)
    }
    thead.appendChild(headRow); table.appendChild(thead)

    // Body
    const tbody = document.createElement('tbody')
    for (const row of rows) {
      const isExpanded = expanded.has(row.id)
      const tr = document.createElement('tr'); tr.style.cssText = `border-bottom: 1px solid #f0f2f5; ${isExpanded ? 'background: #f8f9fa;' : ''}`
      const expandTd = document.createElement('td'); expandTd.style.cssText = 'padding: 6px 8px; text-align: center; cursor: pointer; font-size: 12px; color: #98a2b3;'; expandTd.textContent = isExpanded ? '\u25BC' : '\u25B6'
      expandTd.addEventListener('click', () => engine.emit(ToggleRowExpand, row.id)); tr.appendChild(expandTd)

      for (const col of COLUMNS) {
        const td = document.createElement('td'); td.style.cssText = 'padding: 8px 12px; font-size: 13px; color: #344054;'
        if (col.key === 'salary') td.textContent = `$${row.salary.toLocaleString()}`
        else if (col.key === 'status') { td.innerHTML = `<span style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; background: ${statusColors[row.status]}20; color: ${statusColors[row.status]};">${row.status}</span>` }
        else td.textContent = String(row[col.key])
        tr.appendChild(td)
      }
      tbody.appendChild(tr)

      if (isExpanded) {
        const detailTr = document.createElement('tr'); detailTr.style.cssText = 'background: #fafbfc; border-bottom: 1px solid #e4e7ec;'
        detailTr.innerHTML = `<td colspan="${COLUMNS.length + 1}" style="padding: 16px; font-size: 13px; color: #667085;"><strong>ID:</strong> ${row.id} | <strong>Email:</strong> ${row.email} | <strong>Department:</strong> ${row.department} | <strong>Salary:</strong> $${row.salary.toLocaleString()} | <strong>Start:</strong> ${row.startDate}</td>`
        tbody.appendChild(detailTr)
      }
    }
    table.appendChild(tbody)

    // Pagination
    pagination.innerHTML = ''
    for (let p = 0; p < Math.min(totalPages, 20); p++) {
      const btn = document.createElement('button'); btn.style.cssText = `padding: 4px 10px; border: 1px solid ${p === page ? '#4361ee' : '#e0e0e0'}; border-radius: 4px; background: ${p === page ? '#4361ee' : '#fff'}; color: ${p === page ? '#fff' : '#344054'}; cursor: pointer; font-size: 12px;`
      btn.textContent = String(p + 1); btn.addEventListener('click', () => engine.emit(PageChanged, p)); pagination.appendChild(btn)
    }
    if (totalPages > 20) { const more = document.createElement('span'); more.style.cssText = 'padding: 4px 8px; font-size: 12px; color: #98a2b3;'; more.textContent = `... (${totalPages} total)`; pagination.appendChild(more) }
  }

  unsubs.push(engine.on(TableChanged, () => render())); render()
  return () => { ;(window as any).__pulseEngine = null; engine.destroy(); unsubs.forEach((u) => u()) }
}

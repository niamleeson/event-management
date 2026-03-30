import {
  engine,
  DEPARTMENTS,
  STATUSES,
  PAGE_SIZE,
  SortChanged,
  SearchChanged,
  DepartmentFilterChanged,
  StatusFilterChanged,
  PageChanged,
  ToggleRowExpand,
  sortState,
  filterState,
  currentPage,
  expandedRows,
  columnWidths,
  getFilteredRows,
  getPageRows,
  getTotalPages,
  type ColumnKey,
} from '../engines/data-table'

export function mount(container: HTMLElement): () => void {
  ;(window as any).__pulseEngine = engine

  const unsubs: (() => void)[] = []

  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'max-width: 1000px; margin: 0 auto; padding: 32px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;'

  // Header
  const h1 = document.createElement('h2')
  h1.style.cssText = 'font-size: 28px; font-weight: 800; color: #1a1a2e; margin-bottom: 4px;'
  h1.textContent = 'Data Table'
  const sub = document.createElement('p')
  sub.style.cssText = 'color: #666; font-size: 14px; margin-bottom: 16px;'
  sub.textContent = '1,000 rows with sort, filter, paginate, expandable rows, and resizable columns.'
  wrapper.appendChild(h1)
  wrapper.appendChild(sub)

  // Filter bar
  const filterBar = document.createElement('div')
  filterBar.style.cssText = 'display: flex; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; align-items: center;'

  const searchInput = document.createElement('input')
  searchInput.type = 'text'
  searchInput.style.cssText = 'padding: 6px 12px; border: 1px solid #d0d5dd; border-radius: 6px; font-size: 13px; width: 200px; outline: none;'
  searchInput.placeholder = 'Search name, email...'
  searchInput.addEventListener('input', () => engine.emit(SearchChanged, searchInput.value))

  const deptSelect = document.createElement('select')
  deptSelect.style.cssText = 'padding: 6px 12px; border: 1px solid #d0d5dd; border-radius: 6px; font-size: 13px; width: auto;'
  const deptAll = document.createElement('option')
  deptAll.value = ''
  deptAll.textContent = 'All Departments'
  deptSelect.appendChild(deptAll)
  for (const dept of DEPARTMENTS) {
    const opt = document.createElement('option')
    opt.value = dept
    opt.textContent = dept
    deptSelect.appendChild(opt)
  }
  deptSelect.addEventListener('change', () => engine.emit(DepartmentFilterChanged, deptSelect.value || null))

  const statusSelect = document.createElement('select')
  statusSelect.style.cssText = 'padding: 6px 12px; border: 1px solid #d0d5dd; border-radius: 6px; font-size: 13px; width: auto;'
  const statusAll = document.createElement('option')
  statusAll.value = ''
  statusAll.textContent = 'All Statuses'
  statusSelect.appendChild(statusAll)
  for (const st of STATUSES) {
    const opt = document.createElement('option')
    opt.value = st
    opt.textContent = st.charAt(0).toUpperCase() + st.slice(1)
    statusSelect.appendChild(opt)
  }
  statusSelect.addEventListener('change', () => engine.emit(StatusFilterChanged, statusSelect.value || null))

  filterBar.appendChild(searchInput)
  filterBar.appendChild(deptSelect)
  filterBar.appendChild(statusSelect)
  wrapper.appendChild(filterBar)

  // Results info
  const resultsInfo = document.createElement('div')
  resultsInfo.style.cssText = 'font-size: 12px; color: #667085; margin-bottom: 8px;'
  wrapper.appendChild(resultsInfo)

  // Table
  const tableWrapper = document.createElement('div')
  tableWrapper.style.cssText = 'overflow-x: auto; border: 1px solid #e4e7ec; border-radius: 10px;'

  const table = document.createElement('table')
  table.style.cssText = 'border-collapse: collapse; width: 100%; min-width: 700px;'

  // Table header
  const thead = document.createElement('thead')
  const headRow = document.createElement('tr')
  const columns: { key: ColumnKey; label: string }[] = [
    { key: 'id', label: '#' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'department', label: 'Department' },
    { key: 'salary', label: 'Salary' },
    { key: 'startDate', label: 'Start Date' },
    { key: 'status', label: 'Status' },
  ]

  const headerCells: HTMLElement[] = []
  for (const col of columns) {
    const th = document.createElement('th')
    th.style.cssText = `padding: 10px 12px; background: #f8f9fa; border-bottom: 1px solid #e4e7ec; font-weight: 700; font-size: 12px; color: #344054; text-align: left; cursor: pointer; user-select: none; white-space: nowrap;`
    th.addEventListener('click', () => engine.emit(SortChanged, col.key))
    headRow.appendChild(th)
    headerCells.push(th)
  }
  thead.appendChild(headRow)
  table.appendChild(thead)

  const tbody = document.createElement('tbody')
  table.appendChild(tbody)
  tableWrapper.appendChild(table)
  wrapper.appendChild(tableWrapper)

  // Pagination
  const pagination = document.createElement('div')
  pagination.style.cssText = 'display: flex; gap: 6px; align-items: center; justify-content: center; margin-top: 12px;'
  wrapper.appendChild(pagination)

  container.appendChild(wrapper)

  function render() {
    const rows = getPageRows()
    const totalFiltered = getFilteredRows().length
    const totalPages = getTotalPages()
    const page = currentPage.value
    const sort = sortState.value
    const expanded = expandedRows.value
    const widths = columnWidths.value

    resultsInfo.textContent = `Showing ${page * PAGE_SIZE + 1}-${Math.min((page + 1) * PAGE_SIZE, totalFiltered)} of ${totalFiltered} results`

    // Header sort indicators
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i]
      const w = widths[col.key]
      let arrow = ''
      if (sort.column === col.key) {
        arrow = sort.direction === 'asc' ? ' \u2191' : ' \u2193'
      }
      headerCells[i].textContent = col.label + arrow
      headerCells[i].style.width = `${w}px`
    }

    // Body
    tbody.innerHTML = ''
    for (const row of rows) {
      const isExpanded = expanded.has(row.id)
      const tr = document.createElement('tr')
      tr.style.cssText = 'border-bottom: 1px solid #f0f2f5; cursor: pointer; transition: background 0.1s;'
      tr.addEventListener('mouseenter', () => { tr.style.background = '#f8f9fa' })
      tr.addEventListener('mouseleave', () => { tr.style.background = '' })
      tr.addEventListener('click', () => engine.emit(ToggleRowExpand, row.id))

      for (const col of columns) {
        const td = document.createElement('td')
        td.style.cssText = 'padding: 8px 12px; font-size: 13px; color: #344054;'

        if (col.key === 'salary') {
          td.textContent = `$${row.salary.toLocaleString()}`
        } else if (col.key === 'status') {
          const badge = document.createElement('span')
          const colors: Record<string, { bg: string; color: string }> = {
            active: { bg: '#ecfdf3', color: '#065f46' },
            inactive: { bg: '#fef3f2', color: '#b42318' },
            pending: { bg: '#fef3c7', color: '#92400e' },
          }
          const style = colors[row.status] || colors.active
          badge.style.cssText = `padding: 2px 8px; border-radius: 12px; background: ${style.bg}; color: ${style.color}; font-size: 11px; font-weight: 600;`
          badge.textContent = row.status
          td.appendChild(badge)
        } else {
          td.textContent = String(row[col.key])
        }

        tr.appendChild(td)
      }

      tbody.appendChild(tr)

      // Expanded row
      if (isExpanded) {
        const expandTr = document.createElement('tr')
        const expandTd = document.createElement('td')
        expandTd.colSpan = columns.length
        expandTd.style.cssText = 'padding: 12px 16px; background: #f8f9fa; font-size: 12px; color: #667085; border-bottom: 1px solid #e4e7ec;'
        expandTd.innerHTML = `
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
            <div><strong>ID:</strong> ${row.id}</div>
            <div><strong>Email:</strong> ${row.email}</div>
            <div><strong>Department:</strong> ${row.department}</div>
            <div><strong>Salary:</strong> $${row.salary.toLocaleString()}</div>
            <div><strong>Start Date:</strong> ${row.startDate}</div>
            <div><strong>Status:</strong> ${row.status}</div>
          </div>
        `
        expandTr.appendChild(expandTd)
        tbody.appendChild(expandTr)
      }
    }

    // Pagination
    pagination.innerHTML = ''
    const prevBtn = document.createElement('button')
    prevBtn.style.cssText = 'padding: 4px 10px; border: none; border-radius: 4px; background: #e4e7ec; color: #344054; font-size: 12px; cursor: pointer;'
    prevBtn.textContent = 'Prev'
    prevBtn.disabled = page === 0
    prevBtn.style.opacity = page === 0 ? '0.5' : '1'
    prevBtn.addEventListener('click', () => engine.emit(PageChanged, page - 1))
    pagination.appendChild(prevBtn)

    // Page numbers
    const maxButtons = 7
    let startPage = Math.max(0, page - Math.floor(maxButtons / 2))
    const endPage = Math.min(totalPages, startPage + maxButtons)
    if (endPage - startPage < maxButtons) startPage = Math.max(0, endPage - maxButtons)

    for (let p = startPage; p < endPage; p++) {
      const btn = document.createElement('button')
      btn.style.cssText = `padding: 4px 10px; border: none; border-radius: 4px; font-size: 12px; cursor: pointer; ${p === page ? 'background: #4361ee; color: #fff; font-weight: 700;' : 'background: #e4e7ec; color: #344054;'}`
      btn.textContent = String(p + 1)
      btn.addEventListener('click', () => engine.emit(PageChanged, p))
      pagination.appendChild(btn)
    }

    const nextBtn = document.createElement('button')
    nextBtn.style.cssText = 'padding: 4px 10px; border: none; border-radius: 4px; background: #e4e7ec; color: #344054; font-size: 12px; cursor: pointer;'
    nextBtn.textContent = 'Next'
    nextBtn.disabled = page >= totalPages - 1
    nextBtn.style.opacity = page >= totalPages - 1 ? '0.5' : '1'
    nextBtn.addEventListener('click', () => engine.emit(PageChanged, page + 1))
    pagination.appendChild(nextBtn)
  }

  unsubs.push(sortState.subscribe(() => render()))
  unsubs.push(filterState.subscribe(() => render()))
  unsubs.push(currentPage.subscribe(() => render()))
  unsubs.push(expandedRows.subscribe(() => render()))

  render()

  return () => {
    ;(window as any).__pulseEngine = null
    engine.destroy()
    unsubs.forEach((u) => u())
    container.removeChild(wrapper)
  }
}

import {
  engine,
  ROWS,
  COLS,
  cellKey,
  CellEdited,
  CellSelected,
  FormulaBarChanged,
  RecalcAll,
  grid,
  selectedCell,
  formulaBarText,
} from '../engines/spreadsheet'

export function mount(container: HTMLElement): () => void {
  ;(window as any).__pulseEngine = engine

  const unsubs: (() => void)[] = []

  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'max-width: 900px; margin: 0 auto; padding: 32px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;'

  // Header
  const header = document.createElement('div')
  header.style.cssText = 'margin-bottom: 24px;'
  const h1 = document.createElement('h2')
  h1.style.cssText = 'font-size: 28px; font-weight: 800; color: #1a1a2e; margin-bottom: 4px;'
  h1.textContent = 'Spreadsheet'
  const sub = document.createElement('p')
  sub.style.cssText = 'color: #666; font-size: 14px;'
  sub.textContent = '8x8 grid with formula evaluation (=A1+B1), SUM function, and cascading recalculation.'
  header.appendChild(h1)
  header.appendChild(sub)
  wrapper.appendChild(header)

  // Formula bar
  const formulaBar = document.createElement('div')
  formulaBar.style.cssText = 'display: flex; gap: 8px; margin-bottom: 12px; align-items: center;'
  const cellLabel = document.createElement('div')
  cellLabel.style.cssText = 'padding: 6px 12px; background: #e4e7ec; border-radius: 6px; font-weight: 700; font-size: 13px; color: #344054; min-width: 40px; text-align: center;'
  cellLabel.textContent = '--'
  const formulaInput = document.createElement('input')
  formulaInput.type = 'text'
  formulaInput.style.cssText = 'flex: 1; padding: 8px 12px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 14px; font-family: monospace; outline: none;'
  formulaInput.placeholder = 'Select a cell to edit (e.g. =A1+B2, =SUM(A1:A4))'
  formulaInput.addEventListener('input', () => {
    engine.emit(FormulaBarChanged, formulaInput.value)
  })
  formulaInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const sel = selectedCell.value
      if (sel) {
        engine.emit(CellEdited, { row: sel.row, col: sel.col, value: formulaInput.value })
        // Move to next row
        const nextRow = Math.min(sel.row + 1, ROWS - 1)
        engine.emit(CellSelected, { row: nextRow, col: sel.col })
      }
    }
  })
  formulaBar.appendChild(cellLabel)
  formulaBar.appendChild(formulaInput)
  wrapper.appendChild(formulaBar)

  // Table
  const tableWrapper = document.createElement('div')
  tableWrapper.style.cssText = 'overflow-x: auto; border: 1px solid #e4e7ec; border-radius: 8px;'
  const table = document.createElement('table')
  table.style.cssText = 'border-collapse: collapse; width: 100%; min-width: 600px;'

  // Header row
  const thead = document.createElement('thead')
  const headRow = document.createElement('tr')
  const cornerTh = document.createElement('th')
  cornerTh.style.cssText = 'width: 40px; padding: 8px; background: #f8f9fa; border: 1px solid #e4e7ec; font-size: 12px; color: #98a2b3;'
  headRow.appendChild(cornerTh)

  for (let c = 0; c < COLS; c++) {
    const th = document.createElement('th')
    th.style.cssText = 'padding: 8px 12px; background: #f8f9fa; border: 1px solid #e4e7ec; font-weight: 700; font-size: 13px; color: #344054; min-width: 80px; text-align: center;'
    th.textContent = String.fromCharCode(65 + c)
    headRow.appendChild(th)
  }
  thead.appendChild(headRow)
  table.appendChild(thead)

  // Body
  const tbody = document.createElement('tbody')
  const cellElements: HTMLElement[][] = []

  for (let r = 0; r < ROWS; r++) {
    const row = document.createElement('tr')
    const rowLabel = document.createElement('td')
    rowLabel.style.cssText = 'padding: 6px 8px; background: #f8f9fa; border: 1px solid #e4e7ec; font-weight: 700; font-size: 12px; color: #98a2b3; text-align: center;'
    rowLabel.textContent = String(r + 1)
    row.appendChild(rowLabel)

    const cellRow: HTMLElement[] = []
    for (let c = 0; c < COLS; c++) {
      const td = document.createElement('td')
      td.style.cssText = 'padding: 6px 10px; border: 1px solid #e4e7ec; font-size: 13px; cursor: pointer; min-height: 32px; font-family: -apple-system, sans-serif; transition: background 0.1s;'
      td.addEventListener('click', () => {
        engine.emit(CellSelected, { row: r, col: c })
      })
      row.appendChild(td)
      cellRow.push(td)
    }
    cellElements.push(cellRow)
    tbody.appendChild(row)
  }
  table.appendChild(tbody)
  tableWrapper.appendChild(table)
  wrapper.appendChild(tableWrapper)

  // Help
  const help = document.createElement('div')
  help.style.cssText = 'margin-top: 16px; font-size: 12px; color: #98a2b3; line-height: 1.6;'
  help.innerHTML = '<strong>Formulas:</strong> Start with = (e.g. <code>=A1+B1</code>, <code>=A2*B2</code>, <code>=SUM(A1:A4)</code>). Enter to confirm and move down.'
  wrapper.appendChild(help)

  container.appendChild(wrapper)

  // Render cells
  function renderGrid() {
    const g = grid.value
    const sel = selectedCell.value

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const key = cellKey(r, c)
        const data = g[key]
        const td = cellElements[r][c]

        td.textContent = data?.computed || ''

        const isSelected = sel && sel.row === r && sel.col === c
        const isFormula = data?.raw.startsWith('=')
        const isError = data?.error

        td.style.background = isSelected ? '#eef0ff' : (isError ? '#fef3f2' : '#fff')
        td.style.outline = isSelected ? '2px solid #4361ee' : 'none'
        td.style.outlineOffset = '-1px'
        td.style.color = isError ? '#e63946' : (isFormula ? '#4361ee' : '#1a1a2e')
        td.style.fontWeight = isFormula ? '600' : '400'
        td.title = data?.raw || ''
      }
    }

    if (sel) {
      cellLabel.textContent = cellKey(sel.row, sel.col)
    } else {
      cellLabel.textContent = '--'
    }
  }

  // Subscriptions
  unsubs.push(grid.subscribe(() => renderGrid()))
  unsubs.push(selectedCell.subscribe(() => renderGrid()))
  unsubs.push(formulaBarText.subscribe((text) => {
    formulaInput.value = text
  }))

  // Initial render
  renderGrid()

  return () => {
    ;(window as any).__pulseEngine = null
    unsubs.forEach((u) => u())
    container.removeChild(wrapper)
  }
}

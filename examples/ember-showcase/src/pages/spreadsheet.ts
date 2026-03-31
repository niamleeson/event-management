import { engine, ROWS, COLS, cellKey, CellEdited, CellSelected, FormulaBarChanged, getGrid, getSelectedCell, getFormulaBarText, GridChanged } from '../engines/spreadsheet'

export function mount(container: HTMLElement): () => void {
  ;(window as any).__pulseEngine = engine
  const unsubs: (() => void)[] = []
  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'max-width: 900px; margin: 0 auto; padding: 32px 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;'
  wrapper.innerHTML = `<div style="margin-bottom: 24px;"><h2 style="font-size: 28px; font-weight: 800; color: #1a1a2e; margin-bottom: 4px;">Spreadsheet</h2><p style="color: #666; font-size: 14px;">8x8 grid with formula evaluation (=A1+B1), SUM function, and cascading recalculation.</p></div>`
  const formulaBar = document.createElement('div'); formulaBar.style.cssText = 'display: flex; gap: 8px; margin-bottom: 12px; align-items: center;'
  const cellLabel = document.createElement('div'); cellLabel.style.cssText = 'padding: 6px 12px; background: #e4e7ec; border-radius: 6px; font-weight: 700; font-size: 13px; color: #344054; min-width: 40px; text-align: center;'; cellLabel.textContent = '--'
  const formulaInput = document.createElement('input'); formulaInput.type = 'text'; formulaInput.style.cssText = 'flex: 1; padding: 8px 12px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 14px; font-family: monospace; outline: none;'; formulaInput.placeholder = 'Select a cell to edit'
  formulaInput.addEventListener('input', () => engine.emit(FormulaBarChanged, formulaInput.value))
  formulaInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const sel = getSelectedCell(); if (sel) { engine.emit(CellEdited, { row: sel.row, col: sel.col, value: formulaInput.value }); engine.emit(CellSelected, { row: Math.min(sel.row + 1, ROWS - 1), col: sel.col }) } } })
  formulaBar.appendChild(cellLabel); formulaBar.appendChild(formulaInput); wrapper.appendChild(formulaBar)

  const tableWrapper = document.createElement('div'); tableWrapper.style.cssText = 'overflow-x: auto; border: 1px solid #e4e7ec; border-radius: 8px;'
  const table = document.createElement('table'); table.style.cssText = 'border-collapse: collapse; width: 100%; min-width: 600px;'
  const thead = document.createElement('thead'); const headRow = document.createElement('tr')
  headRow.innerHTML = `<th style="width: 40px; padding: 8px; background: #f8f9fa; border: 1px solid #e4e7ec; font-size: 12px; color: #98a2b3;"></th>`
  for (let c = 0; c < COLS; c++) headRow.innerHTML += `<th style="padding: 8px 12px; background: #f8f9fa; border: 1px solid #e4e7ec; font-weight: 700; font-size: 13px; color: #344054; min-width: 80px; text-align: center;">${String.fromCharCode(65 + c)}</th>`
  thead.appendChild(headRow); table.appendChild(thead)

  const tbody = document.createElement('tbody'); const cellElements: HTMLElement[][] = []
  for (let r = 0; r < ROWS; r++) {
    const row = document.createElement('tr'); row.innerHTML = `<td style="padding: 6px 8px; background: #f8f9fa; border: 1px solid #e4e7ec; font-weight: 700; font-size: 12px; color: #98a2b3; text-align: center;">${r + 1}</td>`
    const cellRow: HTMLElement[] = []
    for (let c = 0; c < COLS; c++) {
      const td = document.createElement('td'); td.style.cssText = 'padding: 6px 10px; border: 1px solid #e4e7ec; font-size: 13px; cursor: pointer; min-height: 32px;'
      td.addEventListener('click', () => engine.emit(CellSelected, { row: r, col: c })); row.appendChild(td); cellRow.push(td)
    }
    cellElements.push(cellRow); tbody.appendChild(row)
  }
  table.appendChild(tbody); tableWrapper.appendChild(table); wrapper.appendChild(tableWrapper)
  wrapper.innerHTML += '<div style="margin-top: 16px; font-size: 12px; color: #98a2b3; line-height: 1.6;"><strong>Formulas:</strong> Start with = (e.g. <code>=A1+B1</code>, <code>=SUM(A1:A4)</code>). Enter to confirm.</div>'
  container.appendChild(wrapper)

  function renderGrid() {
    const g = getGrid(); const sel = getSelectedCell()
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const key = cellKey(r, c); const data = g[key]; const td = cellElements[r][c]; td.textContent = data?.computed || ''
      const isSelected = sel && sel.row === r && sel.col === c; const isError = data?.error; const isFormula = data?.raw.startsWith('=')
      td.style.background = isSelected ? '#eef0ff' : (isError ? '#fef3f2' : '#fff'); td.style.outline = isSelected ? '2px solid #4361ee' : 'none'; td.style.outlineOffset = '-1px'; td.style.color = isError ? '#e63946' : (isFormula ? '#4361ee' : '#1a1a2e'); td.style.fontWeight = isFormula ? '600' : '400'; td.title = data?.raw || ''
    }
    cellLabel.textContent = sel ? cellKey(sel.row, sel.col) : '--'
    formulaInput.value = getFormulaBarText()
  }

  unsubs.push(engine.on(GridChanged, () => renderGrid()))
  unsubs.push(engine.on(FormulaBarChanged, () => { formulaInput.value = getFormulaBarText() }))
  renderGrid()

  return () => { ;(window as any).__pulseEngine = null; engine.destroy(); unsubs.forEach((u) => u()) }
}

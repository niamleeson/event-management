import { engine, getCurrentStep, getStepDirection, getFieldValues, getFieldErrors, getIsSubmitting, getSubmitResult, getShakeCount, FieldUpdated, NextStep, PrevStep, ShakeError, FormStateChanged, STEP_FIELDS, STEP_LABELS, type StepId, type FormData } from '../engines/form-wizard'

const colors = { bg: '#f8fafc', card: '#ffffff', primary: '#4361ee', text: '#0f172a', muted: '#64748b', border: '#e2e8f0', error: '#ef4444', errorBg: '#fef2f2', success: '#10b981', successBg: '#ecfdf5' }
const FIELD_LABELS: Record<string, string> = { firstName: 'First Name', lastName: 'Last Name', email: 'Email Address', phone: 'Phone Number', street: 'Street Address', city: 'City', state: 'State', zip: 'ZIP Code' }

export function mount(container: HTMLElement): () => void {
  ;(window as any).__pulseEngine = engine
  const unsubs: (() => void)[] = []
  const styleTag = document.createElement('style')
  styleTag.textContent = `@keyframes shakeForm { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); } 20%, 40%, 60%, 80% { transform: translateX(6px); } } @keyframes slideInRight { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } } @keyframes slideInLeft { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }`
  document.head.appendChild(styleTag)

  const outerDiv = document.createElement('div')
  outerDiv.style.cssText = `min-height: 100vh; background: ${colors.bg}; display: flex; align-items: center; justify-content: center; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px;`
  container.appendChild(outerDiv)

  const card = document.createElement('div')
  card.style.cssText = `background: ${colors.card}; border-radius: 20px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); width: 100%; max-width: 540px; overflow: hidden;`
  outerDiv.appendChild(card)

  let lastShake = 0

  function render() {
    card.innerHTML = ''
    const result = getSubmitResult()
    if (result?.success) {
      card.innerHTML = `<div style="text-align: center; padding: 60px 32px;"><div style="width: 64px; height: 64px; border-radius: 50%; background: ${colors.successBg}; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 32px;">&#10004;</div><h2 style="font-size: 24px; font-weight: 700; color: ${colors.text}; margin: 0;">Submission Complete</h2><p style="color: ${colors.muted}; font-size: 14px; margin-top: 8px;">Your form has been submitted successfully.</p></div>`
      return
    }
    const step = getCurrentStep(); const direction = getStepDirection(); const submitting = getIsSubmitting(); const shake = getShakeCount()
    if (shake > lastShake) { card.style.animation = 'shakeForm 0.5s ease-in-out'; card.addEventListener('animationend', () => { card.style.animation = '' }, { once: true }) }
    lastShake = shake

    card.innerHTML += `<div style="padding: 32px 32px 0;"><h1 style="font-size: 28px; font-weight: 800; color: ${colors.text}; margin: 0;">Create Account</h1><p style="color: ${colors.muted}; font-size: 14px; margin-top: 4px;">Multi-step form with event-driven validation</p></div>`

    const progressBar = document.createElement('div'); progressBar.style.cssText = 'display: flex; align-items: center; padding: 24px 32px; gap: 0;'
    for (let i = 0; i < STEP_LABELS.length; i++) {
      const active = step === i; const completed = step > i
      const sw = document.createElement('div'); sw.style.cssText = 'flex: 1; display: flex; align-items: center;'
      sw.innerHTML = `<div style="flex: 1; display: flex; flex-direction: column; align-items: center;"><div style="width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; background: ${completed || active ? colors.primary : colors.border}; color: ${completed || active ? '#fff' : colors.muted};">${completed ? '\u2713' : i + 1}</div><span style="font-size: 12px; font-weight: ${active ? 600 : 400}; color: ${active ? colors.primary : colors.muted}; margin-top: 6px;">${STEP_LABELS[i]}</span></div>`
      if (i < STEP_LABELS.length - 1) sw.innerHTML += `<div style="flex: 1; height: 2px; background: ${step > i ? colors.primary : colors.border}; margin-bottom: 22px;"></div>`
      progressBar.appendChild(sw)
    }
    card.appendChild(progressBar)

    const body = document.createElement('div'); body.style.cssText = `padding: 8px 32px 32px; min-height: 280px; animation: ${direction === 'next' ? 'slideInRight' : 'slideInLeft'} 0.3s ease-out;`
    if (step === 0) { const row = document.createElement('div'); row.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 16px;'; row.appendChild(createFormField('firstName', 0)); row.appendChild(createFormField('lastName', 0)); body.appendChild(row); body.appendChild(createFormField('email', 0)); body.appendChild(createFormField('phone', 0)) }
    else if (step === 1) { body.appendChild(createFormField('street', 1)); body.appendChild(createFormField('city', 1)); const row = document.createElement('div'); row.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 16px;'; row.appendChild(createFormField('state', 1)); row.appendChild(createFormField('zip', 1)); body.appendChild(row) }
    else { const values = getFieldValues(); body.innerHTML = `<p style="color: ${colors.muted}; font-size: 14px; margin-bottom: 20px;">Please review your information before submitting.</p>`; for (const { label, value } of [{ label: 'Name', value: `${values.firstName} ${values.lastName}` }, { label: 'Email', value: values.email }, { label: 'Phone', value: values.phone }, { label: 'Address', value: `${values.street}, ${values.city}, ${values.state} ${values.zip}` }]) { body.innerHTML += `<div style="margin-bottom: 16px;"><div style="font-size: 12px; font-weight: 600; color: ${colors.muted}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">${label}</div><div style="font-size: 16px; color: ${colors.text}; padding: 8px 0; border-bottom: 1px solid ${colors.border};">${value || '(not provided)'}</div></div>` } }
    card.appendChild(body)

    const footer = document.createElement('div'); footer.style.cssText = 'display: flex; justify-content: space-between; padding: 16px 32px 32px;'
    if (step > 0) { const backBtn = document.createElement('button'); backBtn.style.cssText = `padding: 12px 24px; font-size: 14px; font-weight: 600; border: 2px solid ${colors.border}; border-radius: 10px; background: #fff; color: ${colors.text}; cursor: pointer;`; backBtn.textContent = 'Back'; backBtn.addEventListener('click', () => engine.emit(PrevStep, undefined)); footer.appendChild(backBtn) } else footer.appendChild(document.createElement('div'))
    const nextBtn = document.createElement('button'); nextBtn.style.cssText = `padding: 12px 32px; font-size: 14px; font-weight: 600; border: none; border-radius: 10px; background: ${submitting ? colors.border : colors.primary}; color: ${submitting ? colors.muted : '#fff'}; cursor: ${submitting ? 'not-allowed' : 'pointer'};`; nextBtn.disabled = submitting; nextBtn.textContent = submitting ? 'Submitting...' : step === 2 ? 'Submit' : 'Continue'; nextBtn.addEventListener('click', () => engine.emit(NextStep, undefined)); footer.appendChild(nextBtn)
    card.appendChild(footer)
  }

  function createFormField(field: string, step: StepId): HTMLElement {
    const values = getFieldValues(); const errors = getFieldErrors(); const value = values[field as keyof FormData] ?? ''; const fieldError = errors[field] ?? null; const hasError = fieldError !== null
    const group = document.createElement('div'); group.style.cssText = 'margin-bottom: 20px;'
    group.innerHTML = `<label style="display: block; font-size: 13px; font-weight: 600; color: ${colors.text}; margin-bottom: 6px;">${FIELD_LABELS[field] ?? field}</label>`
    const input = document.createElement('input'); input.style.cssText = `width: 100%; padding: 12px 14px; font-size: 15px; border: 2px solid ${hasError ? colors.error : colors.border}; border-radius: 10px; outline: none; box-sizing: border-box; background: ${hasError ? colors.errorBg : '#fff'};`; input.value = value; input.placeholder = FIELD_LABELS[field] ?? field
    input.addEventListener('input', (e) => engine.emit(FieldUpdated, { step, field, value: (e.target as HTMLInputElement).value }))
    group.appendChild(input)
    group.innerHTML += `<div style="font-size: 12px; color: ${colors.error}; margin-top: 4px; min-height: 16px;">${fieldError ?? '\u00A0'}</div>`
    return group
  }

  unsubs.push(engine.on(FormStateChanged, () => render()))
  unsubs.push(engine.on(ShakeError, () => render()))
  render()

  return () => { ;(window as any).__pulseEngine = null; engine.destroy(); unsubs.forEach((u) => u()); if (styleTag.parentNode) styleTag.parentNode.removeChild(styleTag) }
}

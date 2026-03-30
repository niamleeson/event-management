import {
  engine,
  currentStep,
  stepDirection,
  fieldValues,
  fieldErrors,
  stepValid,
  isSubmitting,
  submitResult,
  shakeActive,
  FieldUpdated,
  NextStep,
  PrevStep,
  STEP_FIELDS,
  STEP_LABELS,
  type StepId,
  type FormData,
} from '../engines/form-wizard'

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

const colors = {
  bg: '#f8fafc',
  card: '#ffffff',
  primary: '#4361ee',
  primaryHover: '#3451de',
  text: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
  error: '#ef4444',
  errorBg: '#fef2f2',
  success: '#10b981',
  successBg: '#ecfdf5',
}

// ---------------------------------------------------------------------------
// Field labels
// ---------------------------------------------------------------------------

const FIELD_LABELS: Record<string, string> = {
  firstName: 'First Name',
  lastName: 'Last Name',
  email: 'Email Address',
  phone: 'Phone Number',
  street: 'Street Address',
  city: 'City',
  state: 'State',
  zip: 'ZIP Code',
}

// ---------------------------------------------------------------------------
// Mount
// ---------------------------------------------------------------------------

export function mount(container: HTMLElement): () => void {
  ;(window as any).__pulseEngine = engine

  const unsubs: (() => void)[] = []

  // Inject keyframes
  const styleTag = document.createElement('style')
  styleTag.textContent = `
    @keyframes shakeForm {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
      20%, 40%, 60%, 80% { transform: translateX(6px); }
    }
    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(30px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes slideInLeft {
      from { opacity: 0; transform: translateX(-30px); }
      to { opacity: 1; transform: translateX(0); }
    }
  `
  document.head.appendChild(styleTag)

  // Outer container
  const outerDiv = document.createElement('div')
  outerDiv.style.cssText = `min-height: 100vh; background: ${colors.bg}; display: flex; align-items: center; justify-content: center; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px;`
  container.appendChild(outerDiv)

  // Card
  const card = document.createElement('div')
  card.style.cssText = `background: ${colors.card}; border-radius: 20px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); width: 100%; max-width: 540px; overflow: hidden;`
  outerDiv.appendChild(card)

  // Track shake count for re-triggering animation
  let lastShake = 0

  function render() {
    card.innerHTML = ''

    const result = submitResult.value

    // Show success screen
    if (result?.success) {
      const successDiv = document.createElement('div')
      successDiv.style.cssText = 'text-align: center; padding: 60px 32px;'

      const iconDiv = document.createElement('div')
      iconDiv.style.cssText = `width: 64px; height: 64px; border-radius: 50%; background: ${colors.successBg}; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 32px;`
      iconDiv.innerHTML = '&#10004;'

      const successTitle = document.createElement('h2')
      successTitle.style.cssText = `font-size: 24px; font-weight: 700; color: ${colors.text}; margin: 0;`
      successTitle.textContent = 'Submission Complete'

      const successMsg = document.createElement('p')
      successMsg.style.cssText = `color: ${colors.muted}; font-size: 14px; margin-top: 8px;`
      successMsg.textContent = 'Your form has been submitted successfully. All state was managed through Pulse events and signals.'

      successDiv.appendChild(iconDiv)
      successDiv.appendChild(successTitle)
      successDiv.appendChild(successMsg)
      card.appendChild(successDiv)
      return
    }

    const step = currentStep.value
    const direction = stepDirection.value
    const submitting = isSubmitting.value
    const shake = shakeActive.value

    // Apply shake animation
    if (shake > lastShake) {
      card.style.animation = 'shakeForm 0.5s ease-in-out'
      card.addEventListener('animationend', () => { card.style.animation = '' }, { once: true })
    }
    lastShake = shake

    // Header
    const headerDiv = document.createElement('div')
    headerDiv.style.cssText = 'padding: 32px 32px 0;'
    const h1 = document.createElement('h1')
    h1.style.cssText = `font-size: 28px; font-weight: 800; color: ${colors.text}; margin: 0;`
    h1.textContent = 'Create Account'
    const sub = document.createElement('p')
    sub.style.cssText = `color: ${colors.muted}; font-size: 14px; margin-top: 4px;`
    sub.textContent = 'Multi-step form with event-driven validation'
    headerDiv.appendChild(h1)
    headerDiv.appendChild(sub)
    card.appendChild(headerDiv)

    // Progress bar
    const progressBar = document.createElement('div')
    progressBar.style.cssText = 'display: flex; align-items: center; padding: 24px 32px; gap: 0;'

    for (let i = 0; i < STEP_LABELS.length; i++) {
      const stepWrapper = document.createElement('div')
      stepWrapper.style.cssText = 'flex: 1; display: flex; align-items: center;'

      const stepDiv = document.createElement('div')
      stepDiv.style.cssText = 'flex: 1; display: flex; flex-direction: column; align-items: center;'

      const active = step === i
      const completed = step > i

      const dot = document.createElement('div')
      dot.style.cssText = `width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; background: ${completed ? colors.primary : active ? colors.primary : colors.border}; color: ${completed || active ? '#fff' : colors.muted}; transition: all 0.3s;`
      dot.textContent = completed ? '\u2713' : String(i + 1)

      const label = document.createElement('span')
      label.style.cssText = `font-size: 12px; font-weight: ${active ? 600 : 400}; color: ${active ? colors.primary : colors.muted}; margin-top: 6px; transition: color 0.3s;`
      label.textContent = STEP_LABELS[i]

      stepDiv.appendChild(dot)
      stepDiv.appendChild(label)
      stepWrapper.appendChild(stepDiv)

      if (i < STEP_LABELS.length - 1) {
        const line = document.createElement('div')
        line.style.cssText = `flex: 1; height: 2px; background: ${step > i ? colors.primary : colors.border}; margin-bottom: 22px; transition: background 0.3s;`
        stepWrapper.appendChild(line)
      }

      progressBar.appendChild(stepWrapper)
    }
    card.appendChild(progressBar)

    // Body
    const body = document.createElement('div')
    body.style.cssText = `padding: 8px 32px 32px; min-height: 280px; animation: ${direction === 'next' ? 'slideInRight' : 'slideInLeft'} 0.3s ease-out;`

    if (step === 0) renderPersonalInfoStep(body)
    else if (step === 1) renderAddressStep(body)
    else if (step === 2) renderReviewStep(body)

    card.appendChild(body)

    // Footer
    const footer = document.createElement('div')
    footer.style.cssText = 'display: flex; justify-content: space-between; padding: 16px 32px 32px;'

    if (step > 0) {
      const backBtn = document.createElement('button')
      backBtn.style.cssText = `padding: 12px 24px; font-size: 14px; font-weight: 600; border: 2px solid ${colors.border}; border-radius: 10px; background: #fff; color: ${colors.text}; cursor: pointer; transition: border-color 0.2s;`
      backBtn.textContent = 'Back'
      backBtn.addEventListener('click', () => engine.emit(PrevStep, undefined))
      footer.appendChild(backBtn)
    } else {
      footer.appendChild(document.createElement('div'))
    }

    const nextBtn = document.createElement('button')
    const nextDisabled = submitting
    nextBtn.style.cssText = `padding: 12px 32px; font-size: 14px; font-weight: 600; border: none; border-radius: 10px; background: ${nextDisabled ? colors.border : colors.primary}; color: ${nextDisabled ? colors.muted : '#fff'}; cursor: ${nextDisabled ? 'not-allowed' : 'pointer'}; transition: background 0.2s;`
    nextBtn.disabled = submitting
    nextBtn.textContent = submitting ? 'Submitting...' : step === 2 ? 'Submit' : 'Continue'
    nextBtn.addEventListener('click', () => engine.emit(NextStep, undefined))
    footer.appendChild(nextBtn)

    card.appendChild(footer)
  }

  function createFormField(field: string, step: StepId): HTMLElement {
    const values = fieldValues.value
    const errors = fieldErrors.value
    const value = values[field as keyof FormData] ?? ''
    const fieldError = errors[field] ?? null
    const hasError = fieldError !== null

    const group = document.createElement('div')
    group.style.cssText = 'margin-bottom: 20px;'

    const label = document.createElement('label')
    label.style.cssText = `display: block; font-size: 13px; font-weight: 600; color: ${colors.text}; margin-bottom: 6px;`
    label.textContent = FIELD_LABELS[field] ?? field

    const input = document.createElement('input')
    input.style.cssText = `width: 100%; padding: 12px 14px; font-size: 15px; border: 2px solid ${hasError ? colors.error : colors.border}; border-radius: 10px; outline: none; box-sizing: border-box; transition: border-color 0.2s; background: ${hasError ? colors.errorBg : '#fff'};`
    input.value = value
    input.placeholder = FIELD_LABELS[field] ?? field
    input.addEventListener('input', (e) => {
      engine.emit(FieldUpdated, { step, field, value: (e.target as HTMLInputElement).value })
    })
    input.addEventListener('focus', () => {
      input.style.borderColor = hasError ? colors.error : colors.primary
    })
    input.addEventListener('blur', () => {
      const currentError = fieldErrors.value[field]
      input.style.borderColor = currentError ? colors.error : colors.border
    })

    const errorEl = document.createElement('div')
    errorEl.style.cssText = `font-size: 12px; color: ${colors.error}; margin-top: 4px; min-height: 16px;`
    errorEl.textContent = fieldError ?? '\u00A0'

    group.appendChild(label)
    group.appendChild(input)
    group.appendChild(errorEl)
    return group
  }

  function renderPersonalInfoStep(body: HTMLElement) {
    const row = document.createElement('div')
    row.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 16px;'
    row.appendChild(createFormField('firstName', 0))
    row.appendChild(createFormField('lastName', 0))
    body.appendChild(row)
    body.appendChild(createFormField('email', 0))
    body.appendChild(createFormField('phone', 0))
  }

  function renderAddressStep(body: HTMLElement) {
    body.appendChild(createFormField('street', 1))
    body.appendChild(createFormField('city', 1))
    const row = document.createElement('div')
    row.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 16px;'
    row.appendChild(createFormField('state', 1))
    row.appendChild(createFormField('zip', 1))
    body.appendChild(row)
  }

  function renderReviewStep(body: HTMLElement) {
    const values = fieldValues.value
    const intro = document.createElement('p')
    intro.style.cssText = `color: ${colors.muted}; font-size: 14px; margin-bottom: 20px;`
    intro.textContent = 'Please review your information before submitting.'
    body.appendChild(intro)

    const reviewFields = [
      { label: 'Name', value: `${values.firstName} ${values.lastName}` },
      { label: 'Email', value: values.email },
      { label: 'Phone', value: values.phone },
      { label: 'Address', value: `${values.street}, ${values.city}, ${values.state} ${values.zip}` },
    ]

    for (const item of reviewFields) {
      const section = document.createElement('div')
      section.style.cssText = 'margin-bottom: 16px;'

      const labelEl = document.createElement('div')
      labelEl.style.cssText = `font-size: 12px; font-weight: 600; color: ${colors.muted}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;`
      labelEl.textContent = item.label

      const valueEl = document.createElement('div')
      valueEl.style.cssText = `font-size: 16px; color: ${colors.text}; padding: 8px 0; border-bottom: 1px solid ${colors.border};`
      valueEl.textContent = item.value || '(not provided)'

      section.appendChild(labelEl)
      section.appendChild(valueEl)
      body.appendChild(section)
    }
  }

  // Subscribe to all relevant signals
  unsubs.push(currentStep.subscribe(() => render()))
  unsubs.push(stepDirection.subscribe(() => render()))
  unsubs.push(fieldValues.subscribe(() => render()))
  unsubs.push(fieldErrors.subscribe(() => render()))
  unsubs.push(isSubmitting.subscribe(() => render()))
  unsubs.push(submitResult.subscribe(() => render()))
  unsubs.push(shakeActive.subscribe(() => render()))

  // Initial render
  render()

  return () => {
    ;(window as any).__pulseEngine = null
    engine.destroy()
    unsubs.forEach((u) => u())
    if (styleTag.parentNode) styleTag.parentNode.removeChild(styleTag)
  }
}

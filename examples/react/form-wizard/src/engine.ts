import { createEngine } from '@pulse/core'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StepId = 0 | 1 | 2

export interface FieldUpdate {
  step: StepId
  field: string
  value: string
}

export interface FieldValidation {
  step: StepId
  field: string
  valid: boolean
  error: string | null
}

export interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  street: string
  city: string
  state: string
  zip: string
}

// ---------------------------------------------------------------------------
// Field definitions per step
// ---------------------------------------------------------------------------

export const STEP_FIELDS: Record<StepId, string[]> = {
  0: ['firstName', 'lastName', 'email', 'phone'],
  1: ['street', 'city', 'state', 'zip'],
  2: [],
}

export const STEP_LABELS: string[] = ['Personal Info', 'Address', 'Review & Submit']

// ---------------------------------------------------------------------------
// Validation rules
// ---------------------------------------------------------------------------

function validateField(field: string, value: string): { valid: boolean; error: string | null } {
  switch (field) {
    case 'firstName':
    case 'lastName':
      if (!value.trim()) return { valid: false, error: 'Required' }
      if (value.trim().length < 2) return { valid: false, error: 'At least 2 characters' }
      return { valid: true, error: null }
    case 'email':
      if (!value.trim()) return { valid: false, error: 'Required' }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return { valid: false, error: 'Invalid email' }
      return { valid: true, error: null }
    case 'phone':
      if (!value.trim()) return { valid: false, error: 'Required' }
      if (!/^\+?[\d\s()-]{7,}$/.test(value)) return { valid: false, error: 'Invalid phone number' }
      return { valid: true, error: null }
    case 'street':
    case 'city':
      if (!value.trim()) return { valid: false, error: 'Required' }
      return { valid: true, error: null }
    case 'state':
      if (!value.trim()) return { valid: false, error: 'Required' }
      if (value.trim().length < 2) return { valid: false, error: 'At least 2 characters' }
      return { valid: true, error: null }
    case 'zip':
      if (!value.trim()) return { valid: false, error: 'Required' }
      if (!/^\d{5}(-\d{4})?$/.test(value.trim())) return { valid: false, error: 'Invalid zip (e.g. 12345)' }
      return { valid: true, error: null }
    default:
      return { valid: true, error: null }
  }
}

// ---------------------------------------------------------------------------
// DAG (4 levels deep)
// ---------------------------------------------------------------------------
// FieldUpdated ──→ FieldValuesChanged ──→ FieldErrorsChanged
//
// NextStep ──→ CurrentStepChanged ──→ StepDirectionChanged
//          └──→ IsSubmittingChanged ──→ SubmitResultChanged
//          └──→ ShakeCountChanged (on validation failure)
//          └──→ FieldUpdated (re-validate on failure)
//
// PrevStep ──→ CurrentStepChanged ──→ StepDirectionChanged
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Event declarations
// ---------------------------------------------------------------------------

// Layer 0: User input events
export const FieldUpdated = engine.event<FieldUpdate>('FieldUpdated')
export const NextStep = engine.event<void>('NextStep')
export const PrevStep = engine.event<void>('PrevStep')
export const ShakeError = engine.event<void>('ShakeError')

// Layer 1: Primary state events
export const FieldValuesChanged = engine.event<FormData>('FieldValuesChanged')
export const CurrentStepChanged = engine.event<StepId>('CurrentStepChanged')
export const IsSubmittingChanged = engine.event<boolean>('IsSubmittingChanged')
export const ShakeCountChanged = engine.event<number>('ShakeCountChanged')

// Layer 2: Derived state events
export const FieldErrorsChanged = engine.event<Record<string, string | null>>('FieldErrorsChanged')
export const StepDirectionChanged = engine.event<'next' | 'prev'>('StepDirectionChanged')

// Layer 3: Terminal state events (async)
export const SubmitResultChanged = engine.event<{ success: boolean } | null>('SubmitResultChanged')

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let currentStep: StepId = 0
let prevStep: StepId = 0
let fieldValues: FormData = {
  firstName: '', lastName: '', email: '', phone: '',
  street: '', city: '', state: '', zip: '',
}
let fieldErrors: Record<string, string | null> = {}
let isSubmitting = false
let shakeCount = 0
let lastUpdatedField: string | null = null

// ---------------------------------------------------------------------------
// Layer 0 → Layer 1: Input handlers → primary state
// ---------------------------------------------------------------------------

engine.on(FieldUpdated, [FieldValuesChanged], (update, setValues) => {
  lastUpdatedField = update.field
  fieldValues = { ...fieldValues, [update.field]: update.value }
  setValues({ ...fieldValues })
})

engine.on(NextStep, [CurrentStepChanged, IsSubmittingChanged, ShakeCountChanged], async (_, setStep, setSubmitting, setShake) => {
  if (currentStep >= 2) {
    // Submit flow
    isSubmitting = true
    setSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    isSubmitting = false
    setSubmitting(false)
    return
  }

  // Check step validity
  const fields = STEP_FIELDS[currentStep]
  const allValid = fields.every((field) => {
    const val = fieldValues[field as keyof FormData]
    return fieldErrors[field] === null && val?.trim()
  })

  if (allValid) {
    prevStep = currentStep
    currentStep = (currentStep + 1) as StepId
    setStep(currentStep)
  } else {
    // Trigger validation for all fields
    for (const field of fields) {
      const value = fieldValues[field as keyof FormData] ?? ''
      engine.emit(FieldUpdated, { step: currentStep, field, value })
    }
    shakeCount++
    setShake(shakeCount)
  }
})

engine.on(PrevStep, [CurrentStepChanged], (_, setStep) => {
  if (currentStep > 0) {
    prevStep = currentStep
    currentStep = (currentStep - 1) as StepId
    setStep(currentStep)
  }
})

// ---------------------------------------------------------------------------
// Layer 1 → Layer 2: Primary state → derived state
// ---------------------------------------------------------------------------

// FieldValuesChanged → FieldErrorsChanged (validate only the field that changed)
engine.on(FieldValuesChanged, [FieldErrorsChanged], (_values, setErrors) => {
  if (!lastUpdatedField) return
  const value = fieldValues[lastUpdatedField as keyof FormData] ?? ''
  const result = validateField(lastUpdatedField, value)
  fieldErrors = { ...fieldErrors, [lastUpdatedField]: result.error }
  setErrors({ ...fieldErrors })
})

// CurrentStepChanged → StepDirectionChanged (direction derived from step transition)
engine.on(CurrentStepChanged, [StepDirectionChanged], (newStep, setDirection) => {
  setDirection(newStep > prevStep ? 'next' : 'prev')
})

// ---------------------------------------------------------------------------
// Layer 2 → Layer 3: Derived state → terminal async result
// ---------------------------------------------------------------------------

// IsSubmittingChanged → SubmitResultChanged (result emitted when submission completes)
engine.on(IsSubmittingChanged, [SubmitResultChanged], (submitting, setResult) => {
  // When submitting transitions to false, submission is complete
  if (!submitting && currentStep >= 2) {
    setResult({ success: true })
  }
})

export function startLoop() {}
export function stopLoop() {}

export function resetState() {
  currentStep = 0
  prevStep = 0
  fieldValues = {
    firstName: '', lastName: '', email: '', phone: '',
    street: '', city: '', state: '', zip: '',
  }
  fieldErrors = {}
  isSubmitting = false
  shakeCount = 0
  lastUpdatedField = null
}

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
// Event declarations
// ---------------------------------------------------------------------------

export const FieldUpdated = engine.event<FieldUpdate>('FieldUpdated')
export const NextStep = engine.event<void>('NextStep')
export const PrevStep = engine.event<void>('PrevStep')
export const StepChanged = engine.event<{ step: StepId; direction: 'next' | 'prev' }>('StepChanged')
export const FormSubmitted = engine.event<FormData>('FormSubmitted')
export const SubmitDone = engine.event<{ success: boolean }>('SubmitDone')
export const ShakeError = engine.event<void>('ShakeError')
export const FormStateChanged = engine.event<void>('FormStateChanged')

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let _currentStep: StepId = 0
let _stepDirection: 'next' | 'prev' = 'next'
let _fieldValues: FormData = {
  firstName: '', lastName: '', email: '', phone: '',
  street: '', city: '', state: '', zip: '',
}
let _fieldErrors: Record<string, string | null> = {}
let _isSubmitting = false
let _submitResult: { success: boolean } | null = null
let _shakeCount = 0

export function getCurrentStep(): StepId { return _currentStep }
export function getStepDirection(): 'next' | 'prev' { return _stepDirection }
export function getFieldValues(): FormData { return _fieldValues }
export function getFieldErrors(): Record<string, string | null> { return _fieldErrors }
export function getIsSubmitting(): boolean { return _isSubmitting }
export function getSubmitResult(): { success: boolean } | null { return _submitResult }
export function getShakeCount(): number { return _shakeCount }

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

engine.on(FieldUpdated, (update: FieldUpdate) => {
  _fieldValues = { ..._fieldValues, [update.field]: update.value }
  const result = validateField(update.field, update.value)
  _fieldErrors = { ..._fieldErrors, [update.field]: result.error }
  engine.emit(FormStateChanged, undefined)
})

engine.on(NextStep, () => {
  const step = _currentStep
  if (step >= 2) {
    engine.emit(FormSubmitted, _fieldValues)
    return
  }

  const fields = STEP_FIELDS[step]
  const allValid = fields.every((field) => {
    const val = _fieldValues[field as keyof FormData]
    return _fieldErrors[field] === null && val?.trim()
  })

  if (allValid) {
    _currentStep = (step + 1) as StepId
    _stepDirection = 'next'
    engine.emit(FormStateChanged, undefined)
  } else {
    for (const field of fields) {
      const value = _fieldValues[field as keyof FormData] ?? ''
      engine.emit(FieldUpdated, { step, field, value })
    }
    _shakeCount++
    engine.emit(ShakeError, undefined)
    engine.emit(FormStateChanged, undefined)
  }
})

engine.on(PrevStep, () => {
  if (_currentStep > 0) {
    _currentStep = (_currentStep - 1) as StepId
    _stepDirection = 'prev'
    engine.emit(FormStateChanged, undefined)
  }
})

engine.on(FormSubmitted, (_data: FormData) => {
  _isSubmitting = true
  engine.emit(FormStateChanged, undefined)

  setTimeout(() => {
    _isSubmitting = false
    _submitResult = { success: true }
    engine.emit(SubmitDone, { success: true })
    engine.emit(FormStateChanged, undefined)
  }, 1500)
})

// DAG
// FieldUpdated ──→ FieldValuesChanged, FieldErrorsChanged
// NextStep ──→ CurrentStepChanged, StepDirectionChanged, IsSubmittingChanged, SubmitResultChanged, ShakeCountChanged
// PrevStep ──→ CurrentStepChanged, StepDirectionChanged

import { createEngine } from '@pulse/core'
import { createPulseService } from '@pulse/ember'

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
// Event declarations
// ---------------------------------------------------------------------------

export const FieldUpdated = engine.event<FieldUpdate>('FieldUpdated')
export const NextStep = engine.event<void>('NextStep')
export const PrevStep = engine.event<void>('PrevStep')
export const ShakeError = engine.event<void>('ShakeError')

// State change events
export const CurrentStepChanged = engine.event<StepId>('CurrentStepChanged')
export const StepDirectionChanged = engine.event<'next' | 'prev'>('StepDirectionChanged')
export const FieldValuesChanged = engine.event<FormData>('FieldValuesChanged')
export const FieldErrorsChanged = engine.event<Record<string, string | null>>('FieldErrorsChanged')
export const IsSubmittingChanged = engine.event<boolean>('IsSubmittingChanged')
export const SubmitResultChanged = engine.event<{ success: boolean } | null>('SubmitResultChanged')
export const ShakeCountChanged = engine.event<number>('ShakeCountChanged')

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let currentStep: StepId = 0
let fieldValues: FormData = {
  firstName: '', lastName: '', email: '', phone: '',
  street: '', city: '', state: '', zip: '',
}
let fieldErrors: Record<string, string | null> = {}
let isSubmitting = false
let shakeCount = 0

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

engine.on(FieldUpdated, [FieldValuesChanged, FieldErrorsChanged], (update, setValues, setErrors) => {
  fieldValues = { ...fieldValues, [update.field]: update.value }
  setValues({ ...fieldValues })

  const result = validateField(update.field, update.value)
  fieldErrors = { ...fieldErrors, [update.field]: result.error }
  setErrors({ ...fieldErrors })
})

engine.on(NextStep, [CurrentStepChanged, StepDirectionChanged, IsSubmittingChanged, SubmitResultChanged, ShakeCountChanged], async (_, setStep, setDir, setSubmitting, setResult, setShake) => {
  if (currentStep >= 2) {
    // Submit
    isSubmitting = true
    setSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    isSubmitting = false
    setSubmitting(false)
    setResult({ success: true })
    return
  }

  // Check step validity
  const fields = STEP_FIELDS[currentStep]
  const allValid = fields.every((field) => {
    const val = fieldValues[field as keyof FormData]
    return fieldErrors[field] === null && val?.trim()
  })

  if (allValid) {
    currentStep = (currentStep + 1) as StepId
    setStep(currentStep)
    setDir('next')
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

engine.on(PrevStep, [CurrentStepChanged, StepDirectionChanged], (_, setStep, setDir) => {
  if (currentStep > 0) {
    currentStep = (currentStep - 1) as StepId
    setStep(currentStep)
    setDir('prev')
  }
})

// ---------------------------------------------------------------------------
// Start/stop loop (no-op: this example has no animation frame loop)
// ---------------------------------------------------------------------------

export function startLoop() {}
export function stopLoop() {}

// ---------------------------------------------------------------------------
// Pulse Service
// ---------------------------------------------------------------------------

export const pulse = createPulseService(engine)

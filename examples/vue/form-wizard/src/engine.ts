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

export interface StepValidation {
  step: StepId
  valid: boolean
}

export interface FormData {
  // Step 0: Personal Info
  firstName: string
  lastName: string
  email: string
  phone: string
  // Step 1: Address
  street: string
  city: string
  state: string
  zip: string
  // Step 2: Review (no fields)
}

// ---------------------------------------------------------------------------
// Field definitions per step
// ---------------------------------------------------------------------------

const STEP_FIELDS: Record<StepId, string[]> = {
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
      if (!value.trim()) return { valid: false, error: 'Required' }
      return { valid: true, error: null }
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
export const FieldValidated = engine.event<FieldValidation>('FieldValidated')
export const StepValidated = engine.event<StepValidation>('StepValidated')
export const NextStep = engine.event<void>('NextStep')
export const PrevStep = engine.event<void>('PrevStep')
export const StepChanged = engine.event<{ step: StepId; direction: 'next' | 'prev' }>('StepChanged')
export const FormSubmitted = engine.event<FormData>('FormSubmitted')
export const SubmitPending = engine.event<void>('SubmitPending')
export const SubmitDone = engine.event<{ success: boolean }>('SubmitDone')
export const SubmitError = engine.event<string>('SubmitError')
export const ShakeError = engine.event<void>('ShakeError')

// ---------------------------------------------------------------------------
// State-changed events
// ---------------------------------------------------------------------------

export const CurrentStepChanged = engine.event<StepId>('CurrentStepChanged')
export const StepDirectionChanged = engine.event<string>('StepDirectionChanged')
export const FieldValuesChanged = engine.event<FormData>('FieldValuesChanged')
export const FieldErrorsChanged = engine.event<Record<string, string | null>>('FieldErrorsChanged')
export const StepValidChanged = engine.event<Record<number, boolean>>('StepValidChanged')
export const IsSubmittingChanged = engine.event<boolean>('IsSubmittingChanged')
export const SubmitResultChanged = engine.event<{ success: boolean } | null>('SubmitResultChanged')
export const ShakeActiveChanged = engine.event<number>('ShakeActiveChanged')

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let currentStep: StepId = 0
let stepDirection = 'next'

const initialFormData: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  street: '',
  city: '',
  state: '',
  zip: '',
}

let fieldValues: FormData = initialFormData
let fieldErrors: Record<string, string | null> = {}
let stepValid: Record<number, boolean> = { 0: false, 1: false, 2: true }
let isSubmitting = false
let submitResult: { success: boolean } | null = null
let shakeActive = 0

// ---------------------------------------------------------------------------
// Pipes
// ---------------------------------------------------------------------------

// FieldUpdated -> FieldValidated (per-field validation)
engine.on(FieldUpdated, (update) => {
  const result = validateField(update.field, update.value)
  engine.emit(FieldValidated, {
    step: update.step,
    field: update.field,
    valid: result.valid,
    error: result.error,
  })
})

// ---------------------------------------------------------------------------
// Step validation: check if all fields in current step are valid
// ---------------------------------------------------------------------------

engine.on(FieldValidated, (validation) => {
  const step = validation.step
  const fields = STEP_FIELDS[step]
  const allValid = fields.every((field) => {
    return fieldErrors[field] === null && (fieldValues[field as keyof FormData] ?? '').trim()
  })
  engine.emit(StepValidated, { step, valid: allValid })
})

// ---------------------------------------------------------------------------
// Navigation: NextStep only advances if current step is valid
// ---------------------------------------------------------------------------

engine.on(NextStep, () => {
  const step = currentStep
  if (step >= 2) {
    // On step 2, submit the form
    engine.emit(FormSubmitted, fieldValues as FormData)
    return
  }

  // Check step validity
  const fields = STEP_FIELDS[step]
  const allValid = fields.every((field) => {
    const val = fieldValues[field as keyof FormData]
    return fieldErrors[field] === null && val?.trim()
  })

  if (allValid) {
    engine.emit(StepChanged, { step: (step + 1) as StepId, direction: 'next' })
  } else {
    // Trigger validation for all fields on the step to show errors
    for (const field of fields) {
      const value = fieldValues[field as keyof FormData] ?? ''
      engine.emit(FieldUpdated, { step, field, value })
    }
    engine.emit(ShakeError, undefined as unknown as void)
  }
})

engine.on(PrevStep, () => {
  const step = currentStep
  if (step > 0) {
    engine.emit(StepChanged, { step: (step - 1) as StepId, direction: 'prev' })
  }
})

// ---------------------------------------------------------------------------
// Async: FormSubmitted -> SubmitDone (mock API)
// ---------------------------------------------------------------------------

{
  let _aa: AbortController | null = null
  engine.on(FormSubmitted, async (data: FormData) => {
    if (_aa) _aa.abort()
    _aa = new AbortController()
    const signal = _aa.signal
    engine.emit(SubmitPending, undefined as unknown as void)
    try {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, 1500)
        signal.addEventListener('abort', () => {
          clearTimeout(timer)
          reject(new DOMException('Aborted', 'AbortError'))
        })
      })
      engine.emit(SubmitDone, { success: true })
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        engine.emit(SubmitError, typeof e === 'string' ? e : (e?.message ?? 'Submission failed'))
      }
    }
  })
}

// ---------------------------------------------------------------------------
// State reducers
// ---------------------------------------------------------------------------

// Current step
engine.on(StepChanged, (change) => {
  currentStep = change.step
  engine.emit(CurrentStepChanged, currentStep)
})

// Transition direction for animation
engine.on(StepChanged, (change) => {
  stepDirection = change.direction
  engine.emit(StepDirectionChanged, stepDirection)
})

// Field values
engine.on(FieldUpdated, (update) => {
  fieldValues = { ...fieldValues, [update.field]: update.value }
  engine.emit(FieldValuesChanged, fieldValues)
})

// Field errors
engine.on(FieldValidated, (validation) => {
  fieldErrors = { ...fieldErrors, [validation.field]: validation.error }
  engine.emit(FieldErrorsChanged, fieldErrors)
})

// Step validity
engine.on(StepValidated, (validation) => {
  stepValid = { ...stepValid, [validation.step]: validation.valid }
  engine.emit(StepValidChanged, stepValid)
})

// Submitting state
engine.on(SubmitPending, () => {
  isSubmitting = true
  engine.emit(IsSubmittingChanged, isSubmitting)
})
engine.on(SubmitDone, () => {
  isSubmitting = false
  engine.emit(IsSubmittingChanged, isSubmitting)
})
engine.on(SubmitError, () => {
  isSubmitting = false
  engine.emit(IsSubmittingChanged, isSubmitting)
})

// Submit success state
engine.on(SubmitDone, (result) => {
  submitResult = result
  engine.emit(SubmitResultChanged, submitResult)
})

// Shake trigger
engine.on(ShakeError, () => {
  shakeActive = shakeActive + 1
  engine.emit(ShakeActiveChanged, shakeActive)
})

// ---------------------------------------------------------------------------
// Initial values
// ---------------------------------------------------------------------------

export function getCurrentStep() { return currentStep }
export function getStepDirection() { return stepDirection }
export function getFieldValues() { return fieldValues }
export function getFieldErrors() { return fieldErrors }
export function getStepValid() { return stepValid }
export function getIsSubmitting() { return isSubmitting }
export function getSubmitResult() { return submitResult }
export function getShakeActive() { return shakeActive }

export { STEP_FIELDS }

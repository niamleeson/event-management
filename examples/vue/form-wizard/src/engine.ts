import { createEngine } from '@pulse/core'

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
// DAG
// ---------------------------------------------------------------------------
//
//  FieldUpdated ──→ FieldValuesChanged ──→ FieldErrorsChanged
//
//  NextStep ──┬──→ StepValidated ──┬──→ CurrentStepChanged ──→ StepDirectionChanged
//             │                   ├──→ ShakeCountChanged (if invalid)
//             │                   └──→ FieldErrorsChanged
//             └──→ SubmitForm ──→ IsSubmittingChanged ──→ SubmitResultChanged
//
//  PrevStep ──→ CurrentStepChanged ──→ StepDirectionChanged
//
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const STEP_FIELDS: Record<StepId, string[]> = {
  0: ['firstName', 'lastName', 'email', 'phone'],
  1: ['street', 'city', 'state', 'zip'],
  2: [],
}

export const STEP_LABELS: string[] = ['Personal Info', 'Address', 'Review & Submit']

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateField(field: string, value: string): string | null {
  switch (field) {
    case 'firstName':
    case 'lastName':
      if (!value.trim()) return 'Required'
      if (value.trim().length < 2) return 'At least 2 characters'
      return null
    case 'email':
      if (!value.trim()) return 'Required'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email'
      return null
    case 'phone':
      if (!value.trim()) return 'Required'
      if (!/^\+?[\d\s()-]{7,}$/.test(value)) return 'Invalid phone number'
      return null
    case 'street':
    case 'city':
      if (!value.trim()) return 'Required'
      return null
    case 'state':
      if (!value.trim()) return 'Required'
      if (value.trim().length < 2) return 'At least 2 characters'
      return null
    case 'zip':
      if (!value.trim()) return 'Required'
      if (!/^\d{5}(-\d{4})?$/.test(value.trim())) return 'Invalid zip (e.g. 12345)'
      return null
    default:
      return null
  }
}

function validateStep(step: StepId): Record<string, string | null> {
  const errors: Record<string, string | null> = {}
  for (const field of STEP_FIELDS[step]) {
    errors[field] = validateField(field, fieldValues[field as keyof FormData] ?? '')
  }
  return errors
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

// Layer 0: User actions
export const FieldUpdated = engine.event<FieldUpdate>('FieldUpdated')
export const NextStep = engine.event<void>('NextStep')
export const PrevStep = engine.event<void>('PrevStep')
export const SubmitForm = engine.event<void>('SubmitForm')

// Layer 1: Primary state
export const FieldValuesChanged = engine.event<FormData>('FieldValuesChanged')
export const StepValidated = engine.event<{ valid: boolean; errors: Record<string, string | null> }>('StepValidated')
export const CurrentStepChanged = engine.event<StepId>('CurrentStepChanged')
export const IsSubmittingChanged = engine.event<boolean>('IsSubmittingChanged')

// Layer 2: Derived state
export const FieldErrorsChanged = engine.event<Record<string, string | null>>('FieldErrorsChanged')
export const StepDirectionChanged = engine.event<'next' | 'prev'>('StepDirectionChanged')
export const ShakeCountChanged = engine.event<number>('ShakeCountChanged')
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
let shakeCount = 0

// ---------------------------------------------------------------------------
// Layer 0 → 1: FieldUpdated → FieldValuesChanged
// ---------------------------------------------------------------------------

engine.on(FieldUpdated, [FieldValuesChanged], (update, setValues) => {
  fieldValues = { ...fieldValues, [update.field]: update.value }
  setValues({ ...fieldValues })
})

// ---------------------------------------------------------------------------
// Layer 1 → 2: FieldValuesChanged → FieldErrorsChanged
// Validate the changed field on every keystroke
// ---------------------------------------------------------------------------

engine.on(FieldValuesChanged, [FieldErrorsChanged], (values, setErrors) => {
  // Re-validate all fields that have been touched (have existing errors or values)
  const newErrors = { ...fieldErrors }
  for (const field of Object.keys(values)) {
    const val = values[field as keyof FormData]
    // Only validate if field has been touched (has an existing error entry or non-empty value)
    if (field in fieldErrors || (val && val.trim())) {
      newErrors[field] = validateField(field, val)
    }
  }
  fieldErrors = newErrors
  setErrors({ ...fieldErrors })
})

// ---------------------------------------------------------------------------
// Layer 0 → 1: NextStep → StepValidated
// Validate current step, emit result
// ---------------------------------------------------------------------------

engine.on(NextStep, [StepValidated, SubmitForm], (_, setValidated, submitForm) => {
  if (currentStep >= 2) {
    // On review step, "Next" means submit
    submitForm(undefined)
    return
  }
  const errors = validateStep(currentStep)
  const valid = Object.values(errors).every(e => e === null)
  // Merge validation errors into fieldErrors so they show in UI
  fieldErrors = { ...fieldErrors, ...errors }
  setValidated({ valid, errors: { ...fieldErrors } })
})

// ---------------------------------------------------------------------------
// Layer 1 → 2: StepValidated → advance or shake
// ---------------------------------------------------------------------------

engine.on(StepValidated, [CurrentStepChanged, ShakeCountChanged, FieldErrorsChanged],
  (result, setStep, setShake, setErrors) => {
    // Always update errors so validation messages show
    setErrors(result.errors)

    if (result.valid) {
      prevStep = currentStep
      currentStep = (currentStep + 1) as StepId
      setStep(currentStep)
    } else {
      shakeCount++
      setShake(shakeCount)
    }
  }
)

// ---------------------------------------------------------------------------
// Layer 0 → 1: PrevStep → CurrentStepChanged
// ---------------------------------------------------------------------------

engine.on(PrevStep, [CurrentStepChanged], (_, setStep) => {
  if (currentStep > 0) {
    prevStep = currentStep
    currentStep = (currentStep - 1) as StepId
    setStep(currentStep)
  }
})

// ---------------------------------------------------------------------------
// Layer 1 → 2: CurrentStepChanged → StepDirectionChanged
// ---------------------------------------------------------------------------

engine.on(CurrentStepChanged, [StepDirectionChanged], (newStep, setDirection) => {
  setDirection(newStep > prevStep ? 'next' : 'prev')
})

// ---------------------------------------------------------------------------
// Layer 0 → 1 → 2: SubmitForm → IsSubmittingChanged → SubmitResultChanged
// ---------------------------------------------------------------------------

engine.on(SubmitForm, [IsSubmittingChanged], async (_, setSubmitting) => {
  setSubmitting(true)
  await new Promise(resolve => setTimeout(resolve, 1500))
  setSubmitting(false)
})

engine.on(IsSubmittingChanged, [SubmitResultChanged], (submitting, setResult) => {
  // When async submit finishes, submitting transitions false → emit success
  if (!submitting) setResult({ success: true })
})

// ---------------------------------------------------------------------------
// Getters for initial values
// ---------------------------------------------------------------------------

export function getCurrentStep() { return currentStep }
export function getFieldValues() { return fieldValues }
export function getFieldErrors() { return fieldErrors }
export function getShakeCount() { return shakeCount }

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
  shakeCount = 0
}

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
// Pipes
// ---------------------------------------------------------------------------

// FieldUpdated -> FieldValidated (per-field validation)
engine.pipe(FieldUpdated, FieldValidated, (update: FieldUpdate): FieldValidation => {
  const result = validateField(update.field, update.value)
  return {
    step: update.step,
    field: update.field,
    valid: result.valid,
    error: result.error,
  }
})

// ---------------------------------------------------------------------------
// Step validation: check if all fields in current step are valid
// We do this reactively when any field is validated
// ---------------------------------------------------------------------------

engine.on(FieldValidated, (_validation: FieldValidation) => {
  // Recheck validation for the affected step
  const step = _validation.step
  const fields = STEP_FIELDS[step]
  const allValid = fields.every((field) => {
    const errors = fieldErrors.value
    return errors[field] === null && fieldValues.value[field as keyof FormData]?.trim()
  })
  engine.emit(StepValidated, { step, valid: allValid })
})

// ---------------------------------------------------------------------------
// Navigation: NextStep only advances if current step is valid
// ---------------------------------------------------------------------------

engine.on(NextStep, () => {
  const step = currentStep.value
  if (step >= 2) {
    // On step 2, submit the form
    engine.emit(FormSubmitted, fieldValues.value as FormData)
    return
  }

  // Check step validity
  const fields = STEP_FIELDS[step]
  const allValid = fields.every((field) => {
    const errors = fieldErrors.value
    const val = fieldValues.value[field as keyof FormData]
    return errors[field] === null && val?.trim()
  })

  if (allValid) {
    engine.emit(StepChanged, { step: (step + 1) as StepId, direction: 'next' })
  } else {
    // Trigger validation for all fields on the step to show errors
    for (const field of fields) {
      const value = fieldValues.value[field as keyof FormData] ?? ''
      engine.emit(FieldUpdated, { step, field, value })
    }
    engine.emit(ShakeError, undefined)
  }
})

engine.on(PrevStep, () => {
  const step = currentStep.value
  if (step > 0) {
    engine.emit(StepChanged, { step: (step - 1) as StepId, direction: 'prev' })
  }
})

// ---------------------------------------------------------------------------
// Async: FormSubmitted -> SubmitDone (mock API)
// ---------------------------------------------------------------------------

engine.async(FormSubmitted, {
  pending: SubmitPending,
  done: SubmitDone,
  error: SubmitError,
  strategy: 'latest',
  do: async (_data: FormData, { signal }) => {
    try {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, 1500)
        signal.addEventListener('abort', () => {
          clearTimeout(timer)
          reject(new DOMException('Aborted', 'AbortError'))
        })
      })
      return { success: true }
    } catch (err: any) {
      if (err?.name === 'AbortError') throw err
      throw typeof err === 'string' ? err : (err?.message ?? 'Submission failed')
    }
  },
})

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

// Current step
export const currentStep = engine.signal<StepId>(
  StepChanged,
  0 as StepId,
  (_prev, change) => change.step,
)

// Transition direction for animation
export const stepDirection = engine.signal<'next' | 'prev'>(
  StepChanged,
  'next',
  (_prev, change) => change.direction,
)

// Field values
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

export const fieldValues = engine.signal<FormData>(
  FieldUpdated,
  initialFormData,
  (prev, update) => ({
    ...prev,
    [update.field]: update.value,
  }),
)

// Field errors
export const fieldErrors = engine.signal<Record<string, string | null>>(
  FieldValidated,
  {},
  (prev, validation) => ({
    ...prev,
    [validation.field]: validation.error,
  }),
)

// Step validity
export const stepValid = engine.signal<Record<number, boolean>>(
  StepValidated,
  { 0: false, 1: false, 2: true },
  (prev, validation) => ({
    ...prev,
    [validation.step]: validation.valid,
  }),
)

// Submitting state
export const isSubmitting = engine.signal<boolean>(
  SubmitPending,
  false,
  () => true,
)
engine.signalUpdate(isSubmitting, SubmitDone, () => false)
engine.signalUpdate(isSubmitting, SubmitError, () => false)

// Submit success state
export const submitResult = engine.signal<{ success: boolean } | null>(
  SubmitDone,
  null,
  (_prev, result) => result,
)

// Shake trigger
export const shakeActive = engine.signal<number>(
  ShakeError,
  0,
  (prev) => prev + 1,
)

// ---------------------------------------------------------------------------
// Recording / Replay: record and replay user interactions
// ---------------------------------------------------------------------------

export function startRec() {
  engine.startRecording()
}

export function stopRec() {
  return engine.stopRecording()
}

export function replayRec(events: any[]) {
  engine.replay(events)
}

// Start frame loop for animations
engine.startFrameLoop()

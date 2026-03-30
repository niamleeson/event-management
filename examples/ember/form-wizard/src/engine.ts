import { createEngine } from '@pulse/core'
import { createPulseService } from '@pulse/ember'

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export const engine = createEngine()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StepId = 'personal' | 'contact' | 'preferences' | 'review'

export interface PersonalInfo {
  firstName: string
  lastName: string
}

export interface ContactInfo {
  email: string
  phone: string
}

export interface Preferences {
  newsletter: boolean
  theme: 'light' | 'dark'
}

export interface FormData {
  personal: PersonalInfo
  contact: ContactInfo
  preferences: Preferences
}

export interface ValidationError {
  field: string
  message: string
}

export interface StepValidation {
  step: StepId
  valid: boolean
  errors: ValidationError[]
}

// ---------------------------------------------------------------------------
// Step order
// ---------------------------------------------------------------------------

export const STEPS: StepId[] = ['personal', 'contact', 'preferences', 'review']

// ---------------------------------------------------------------------------
// Event declarations
// ---------------------------------------------------------------------------

// Navigation
export const NextStepRequested = engine.event<void>('NextStepRequested')
export const PrevStepRequested = engine.event<void>('PrevStepRequested')
export const StepChanged = engine.event<StepId>('StepChanged')
export const TransitionStart = engine.event<void>('TransitionStart')
export const TransitionDone = engine.event<void>('TransitionDone')

// Field updates
export const PersonalUpdated = engine.event<Partial<PersonalInfo>>('PersonalUpdated')
export const ContactUpdated = engine.event<Partial<ContactInfo>>('ContactUpdated')
export const PreferencesUpdated = engine.event<Partial<Preferences>>('PreferencesUpdated')

// Validation
export const ValidateStep = engine.event<StepId>('ValidateStep')
export const StepValidated = engine.event<StepValidation>('StepValidated')

// Submission
export const FormSubmitted = engine.event<void>('FormSubmitted')
export const SubmitPending = engine.event<void>('SubmitPending')
export const SubmitDone = engine.event<FormData>('SubmitDone')
export const SubmitError = engine.event<Error>('SubmitError')
export const FormReset = engine.event<void>('FormReset')

// ---------------------------------------------------------------------------
// Signals: form data
// ---------------------------------------------------------------------------

export const personalInfo = engine.signal<PersonalInfo>(
  PersonalUpdated,
  { firstName: '', lastName: '' },
  (prev, partial) => ({ ...prev, ...partial }),
)

engine.signalUpdate(personalInfo, FormReset, () => ({ firstName: '', lastName: '' }))

export const contactInfo = engine.signal<ContactInfo>(
  ContactUpdated,
  { email: '', phone: '' },
  (prev, partial) => ({ ...prev, ...partial }),
)

engine.signalUpdate(contactInfo, FormReset, () => ({ email: '', phone: '' }))

export const preferences = engine.signal<Preferences>(
  PreferencesUpdated,
  { newsletter: true, theme: 'light' },
  (prev, partial) => ({ ...prev, ...partial }),
)

engine.signalUpdate(preferences, FormReset, () => ({ newsletter: true, theme: 'light' }))

// ---------------------------------------------------------------------------
// Signal: current step
// ---------------------------------------------------------------------------

export const currentStep = engine.signal<StepId>(
  StepChanged,
  'personal',
  (_prev, step) => step,
)

engine.signalUpdate(currentStep, FormReset, () => 'personal')

// ---------------------------------------------------------------------------
// Pipes: validation
// ---------------------------------------------------------------------------

// Validate step fires validation for the current step
engine.pipe(ValidateStep, StepValidated, (step: StepId): StepValidation => {
  const errors: ValidationError[] = []

  if (step === 'personal') {
    const p = personalInfo.value
    if (!p.firstName.trim()) {
      errors.push({ field: 'firstName', message: 'First name is required' })
    }
    if (!p.lastName.trim()) {
      errors.push({ field: 'lastName', message: 'Last name is required' })
    }
  }

  if (step === 'contact') {
    const c = contactInfo.value
    if (!c.email.trim()) {
      errors.push({ field: 'email', message: 'Email is required' })
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) {
      errors.push({ field: 'email', message: 'Invalid email format' })
    }
    if (c.phone && !/^\+?[\d\s-]{7,}$/.test(c.phone)) {
      errors.push({ field: 'phone', message: 'Invalid phone format' })
    }
  }

  // Preferences step has no required validation
  return { step, valid: errors.length === 0, errors }
})

// ---------------------------------------------------------------------------
// Signal: validation state per step
// ---------------------------------------------------------------------------

export const stepValidation = engine.signal<Record<StepId, StepValidation>>(
  StepValidated,
  {
    personal: { step: 'personal', valid: false, errors: [] },
    contact: { step: 'contact', valid: false, errors: [] },
    preferences: { step: 'preferences', valid: true, errors: [] },
    review: { step: 'review', valid: true, errors: [] },
  },
  (prev, validation) => ({
    ...prev,
    [validation.step]: validation,
  }),
)

engine.signalUpdate(stepValidation, FormReset, () => ({
  personal: { step: 'personal' as StepId, valid: false, errors: [] },
  contact: { step: 'contact' as StepId, valid: false, errors: [] },
  preferences: { step: 'preferences' as StepId, valid: true, errors: [] },
  review: { step: 'review' as StepId, valid: true, errors: [] },
}))

// ---------------------------------------------------------------------------
// Navigation logic: validate before advancing
// ---------------------------------------------------------------------------

engine.on(NextStepRequested, () => {
  const step = currentStep.value
  // Trigger validation
  engine.emit(ValidateStep, step)
})

// After validation, advance if valid
engine.on(StepValidated, (result) => {
  if (!result.valid) return

  const idx = STEPS.indexOf(result.step)
  if (idx >= 0 && idx < STEPS.length - 1) {
    const nextStep = STEPS[idx + 1]
    engine.emit(TransitionStart, undefined)
    engine.emit(StepChanged, nextStep)
  }
})

engine.on(PrevStepRequested, () => {
  const idx = STEPS.indexOf(currentStep.value)
  if (idx > 0) {
    engine.emit(TransitionStart, undefined)
    engine.emit(StepChanged, STEPS[idx - 1])
  }
})

// ---------------------------------------------------------------------------
// Tween: step transition animation
// ---------------------------------------------------------------------------

export const stepTransition = engine.tween({
  start: TransitionStart,
  done: TransitionDone,
  from: 0,
  to: 1,
  duration: 350,
  easing: 'easeOut',
})

// ---------------------------------------------------------------------------
// Signal: submission state
// ---------------------------------------------------------------------------

export const isSubmitting = engine.signal<boolean>(
  SubmitPending,
  false,
  () => true,
)
engine.signalUpdate(isSubmitting, SubmitDone, () => false)
engine.signalUpdate(isSubmitting, SubmitError, () => false)

export const submitError = engine.signal<string | null>(
  SubmitError,
  null,
  (_prev, err) => err.message,
)
engine.signalUpdate(submitError, FormSubmitted, () => null)

export const submitted = engine.signal<boolean>(
  SubmitDone,
  false,
  () => true,
)
engine.signalUpdate(submitted, FormReset, () => false)

// ---------------------------------------------------------------------------
// Async: form submission
// ---------------------------------------------------------------------------

engine.async(FormSubmitted, {
  pending: SubmitPending,
  done: SubmitDone,
  error: SubmitError,
  strategy: 'first',
  do: async (_payload, { signal }) => {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, 1200)
      signal.addEventListener('abort', () => {
        clearTimeout(timer)
        reject(new DOMException('Aborted', 'AbortError'))
      })
    })

    const data: FormData = {
      personal: personalInfo.value,
      contact: contactInfo.value,
      preferences: preferences.value,
    }

    return data
  },
})

// ---------------------------------------------------------------------------
// Start the frame loop for tween updates
// ---------------------------------------------------------------------------

engine.startFrameLoop()

// ---------------------------------------------------------------------------
// Pulse Service
// ---------------------------------------------------------------------------

export const pulse = createPulseService(engine)

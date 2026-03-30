import { createEngine } from '@pulse/core'
import type { Engine, EventType, Signal, TweenValue } from '@pulse/core'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PersonalInfo {
  firstName: string
  lastName: string
  email: string
}

export interface AddressInfo {
  street: string
  city: string
  state: string
  zip: string
}

export interface PreferencesInfo {
  newsletter: boolean
  theme: 'light' | 'dark'
  notifications: boolean
}

export interface FormData {
  personal: PersonalInfo
  address: AddressInfo
  preferences: PreferencesInfo
}

export interface StepValidation {
  step: number
  valid: boolean
  errors: string[]
}

export interface SubmitResult {
  success: boolean
  message: string
}

// ---------------------------------------------------------------------------
// Engine + Events
// ---------------------------------------------------------------------------

export const engine: Engine = createEngine()

// Field updates
export const PersonalUpdated: EventType<Partial<PersonalInfo>> = engine.event('PersonalUpdated')
export const AddressUpdated: EventType<Partial<AddressInfo>> = engine.event('AddressUpdated')
export const PreferencesUpdated: EventType<Partial<PreferencesInfo>> = engine.event('PreferencesUpdated')

// Navigation
export const NextStep: EventType<void> = engine.event('NextStep')
export const PrevStep: EventType<void> = engine.event('PrevStep')
export const GoToStep: EventType<number> = engine.event('GoToStep')

// Validation
export const ValidateStep: EventType<number> = engine.event('ValidateStep')
export const StepValidated: EventType<StepValidation> = engine.event('StepValidated')

// Submission
export const SubmitForm: EventType<FormData> = engine.event('SubmitForm')
export const SubmitPending: EventType<FormData> = engine.event('SubmitPending')
export const SubmitDone: EventType<SubmitResult> = engine.event('SubmitDone')
export const SubmitError: EventType<Error> = engine.event('SubmitError')

// Step transition animation
export const StepTransition: EventType<void> = engine.event('StepTransition')
export const TransitionDone: EventType<void> = engine.event('TransitionDone')

// ---------------------------------------------------------------------------
// Validation pipe
// ---------------------------------------------------------------------------

engine.pipe(ValidateStep, StepValidated, (step: number): StepValidation => {
  const personal = personalSig.value
  const address = addressSig.value

  if (step === 0) {
    const errors: string[] = []
    if (!personal.firstName.trim()) errors.push('First name is required')
    if (!personal.lastName.trim()) errors.push('Last name is required')
    if (!personal.email.trim()) errors.push('Email is required')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personal.email)) {
      errors.push('Email format is invalid')
    }
    return { step, valid: errors.length === 0, errors }
  }

  if (step === 1) {
    const errors: string[] = []
    if (!address.street.trim()) errors.push('Street is required')
    if (!address.city.trim()) errors.push('City is required')
    if (!address.state.trim()) errors.push('State is required')
    if (!address.zip.trim()) errors.push('ZIP code is required')
    else if (!/^\d{5}(-\d{4})?$/.test(address.zip)) {
      errors.push('ZIP code format is invalid')
    }
    return { step, valid: errors.length === 0, errors }
  }

  // Step 2 (preferences) always valid
  return { step, valid: true, errors: [] }
})

// ---------------------------------------------------------------------------
// Navigation: NextStep triggers ValidateStep first
// ---------------------------------------------------------------------------

engine.on(NextStep, () => {
  const step = currentStepSig.value
  engine.emit(ValidateStep, step)
})

// Only advance if validation passed
engine.on(StepValidated, (result: StepValidation) => {
  if (result.valid && result.step === currentStepSig.value) {
    const next = Math.min(currentStepSig.value + 1, 3)
    engine.emit(GoToStep, next)
    engine.emit(StepTransition, undefined)
  }
})

engine.on(PrevStep, () => {
  const prev = Math.max(currentStepSig.value - 1, 0)
  engine.emit(GoToStep, prev)
  engine.emit(StepTransition, undefined)
})

// ---------------------------------------------------------------------------
// Async submit
// ---------------------------------------------------------------------------

engine.async<FormData, SubmitResult>(SubmitForm, {
  pending: SubmitPending,
  done: SubmitDone,
  error: SubmitError,
  strategy: 'first',
  do: async (data, { signal }) => {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, 1500)
      signal.addEventListener('abort', () => {
        clearTimeout(timer)
        reject(new DOMException('Aborted', 'AbortError'))
      })
    })

    // Simulate occasional failure
    if (Math.random() < 0.2) {
      throw new Error('Server error: failed to save form. Please try again.')
    }

    return {
      success: true,
      message: `Registration complete for ${data.personal.firstName} ${data.personal.lastName}!`,
    }
  },
})

// ---------------------------------------------------------------------------
// Step transition tween
// ---------------------------------------------------------------------------

export const stepTransitionTween: TweenValue = engine.tween({
  start: StepTransition,
  done: TransitionDone,
  from: 0,
  to: 1,
  duration: 300,
  easing: 'easeOut',
})

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

export const currentStepSig: Signal<number> = engine.signal<number>(
  GoToStep,
  0,
  (_prev, step) => step,
)

export const personalSig: Signal<PersonalInfo> = engine.signal<PersonalInfo>(
  PersonalUpdated,
  { firstName: '', lastName: '', email: '' },
  (prev, partial) => ({ ...prev, ...partial }),
)

export const addressSig: Signal<AddressInfo> = engine.signal<AddressInfo>(
  AddressUpdated,
  { street: '', city: '', state: '', zip: '' },
  (prev, partial) => ({ ...prev, ...partial }),
)

export const preferencesSig: Signal<PreferencesInfo> = engine.signal<PreferencesInfo>(
  PreferencesUpdated,
  { newsletter: true, theme: 'light', notifications: true },
  (prev, partial) => ({ ...prev, ...partial }),
)

export const validationSig: Signal<StepValidation> = engine.signal<StepValidation>(
  StepValidated,
  { step: -1, valid: true, errors: [] },
  (_prev, v) => v,
)

export const submittingSig: Signal<boolean> = engine.signal<boolean>(
  SubmitPending,
  false,
  () => true,
)
engine.signalUpdate(submittingSig, SubmitDone, () => false)
engine.signalUpdate(submittingSig, SubmitError, () => false)

export const submitResultSig: Signal<SubmitResult | null> = engine.signal<SubmitResult | null>(
  SubmitDone,
  null,
  (_prev, result) => result,
)

export const submitErrorSig: Signal<string | null> = engine.signal<string | null>(
  SubmitError,
  null,
  (_prev, err) => err.message,
)
engine.signalUpdate(submitErrorSig, SubmitPending, () => null)

// Start frame loop for tween animation
engine.startFrameLoop()

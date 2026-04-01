import Component from '@glimmer/component'
import { action } from '@ember/object'
import { TrackedSignal, TrackedTween } from '@pulse/ember'
import {
  pulse,
  startLoop,
  currentStep,
  personalInfo,
  contactInfo,
  preferences,
  stepValidation,
  isSubmitting,
  submitError,
  submitted,
  stepTransition,
  STEPS,
  NextStepRequested,
  PrevStepRequested,
  PersonalUpdated,
  ContactUpdated,
  PreferencesUpdated,
  FormSubmitted,
  FormReset,
  type StepId,
  type PersonalInfo,
  type ContactInfo,
  type Preferences,
  type StepValidation,
  type ValidationError,
} from './engine'

// ---------------------------------------------------------------------------
// FormWizardApp — root component
// ---------------------------------------------------------------------------

// Template: see components/app.hbs

export default class FormWizardApp extends Component {
  step: TrackedSignal<StepId>
  personal: TrackedSignal<PersonalInfo>
  contact: TrackedSignal<ContactInfo>
  prefs: TrackedSignal<Preferences>
  validation: TrackedSignal<Record<StepId, StepValidation>>
  submitting: TrackedSignal<boolean>
  error: TrackedSignal<string | null>
  done: TrackedSignal<boolean>
  transition: TrackedTween

  steps = STEPS

  constructor(owner: unknown, args: Record<string, unknown>) {
    super(owner, args)
    startLoop()
    this.step = pulse.createSignal(currentStep)
    this.personal = pulse.createSignal(personalInfo)
    this.contact = pulse.createSignal(contactInfo)
    this.prefs = pulse.createSignal(preferences)
    this.validation = pulse.createSignal(stepValidation)
    this.submitting = pulse.createSignal(isSubmitting)
    this.error = pulse.createSignal(submitError)
    this.done = pulse.createSignal(submitted)
    this.transition = pulse.createTween(stepTransition)
  }

  // -- Computed --

  get currentStepIndex(): number {
    return STEPS.indexOf(this.step.value)
  }

  get isFirstStep(): boolean {
    return this.currentStepIndex === 0
  }

  get isLastStep(): boolean {
    return this.step.value === 'review'
  }

  get stepLabel(): string {
    const labels: Record<StepId, string> = {
      personal: 'Personal Information',
      contact: 'Contact Details',
      preferences: 'Preferences',
      review: 'Review & Submit',
    }
    return labels[this.step.value]
  }

  get progressPercent(): string {
    return `${((this.currentStepIndex + 1) / STEPS.length) * 100}%`
  }

  get currentErrors(): ValidationError[] {
    return this.validation.value[this.step.value]?.errors ?? []
  }

  get hasErrors(): boolean {
    return this.currentErrors.length > 0
  }

  get transitionOpacity(): number {
    return this.transition.active ? this.transition.value : 1
  }

  get transitionTransform(): string {
    if (!this.transition.active) return 'translateX(0)'
    const offset = (1 - this.transition.value) * 20
    return `translateX(${offset}px)`
  }

  get stepContentStyle(): string {
    return `opacity: ${this.transitionOpacity}; transform: ${this.transitionTransform}`
  }

  isStepActive(stepId: StepId): boolean {
    return this.step.value === stepId
  }

  isStepCompleted(stepId: StepId): boolean {
    const idx = STEPS.indexOf(stepId)
    return idx < this.currentStepIndex
  }

  fieldError(fieldName: string): string | null {
    const err = this.currentErrors.find((e) => e.field === fieldName)
    return err?.message ?? null
  }

  // -- Actions: field updates --

  @action
  updateFirstName(event: Event): void {
    pulse.emit(PersonalUpdated, { firstName: (event.target as HTMLInputElement).value })
  }

  @action
  updateLastName(event: Event): void {
    pulse.emit(PersonalUpdated, { lastName: (event.target as HTMLInputElement).value })
  }

  @action
  updateEmail(event: Event): void {
    pulse.emit(ContactUpdated, { email: (event.target as HTMLInputElement).value })
  }

  @action
  updatePhone(event: Event): void {
    pulse.emit(ContactUpdated, { phone: (event.target as HTMLInputElement).value })
  }

  @action
  toggleNewsletter(): void {
    pulse.emit(PreferencesUpdated, { newsletter: !this.prefs.value.newsletter })
  }

  @action
  setTheme(event: Event): void {
    const theme = (event.target as HTMLSelectElement).value as 'light' | 'dark'
    pulse.emit(PreferencesUpdated, { theme })
  }

  // -- Actions: navigation --

  @action
  nextStep(): void {
    pulse.emit(NextStepRequested, undefined)
  }

  @action
  prevStep(): void {
    pulse.emit(PrevStepRequested, undefined)
  }

  @action
  submit(): void {
    pulse.emit(FormSubmitted, undefined)
  }

  @action
  reset(): void {
    pulse.emit(FormReset, undefined)
  }

  willDestroy(): void {
    super.willDestroy()
    this.step.destroy()
    this.personal.destroy()
    this.contact.destroy()
    this.prefs.destroy()
    this.validation.destroy()
    this.submitting.destroy()
    this.error.destroy()
    this.done.destroy()
    this.transition.destroy()
  }
}

# Ember + Pulse: Form Wizard

Demonstrates a multi-step registration form with validation pipes, step transition animations via `TrackedTween`, and async form submission.

## Pulse Concepts Used

- **Events**: `NextStepRequested`, `PrevStepRequested`, `StepChanged`, `ValidateStep`, `StepValidated`, field update events, `FormSubmitted`, `SubmitPending`, `SubmitDone`, `FormReset`
- **Pipes**: `ValidateStep` -> `StepValidated` (synchronous validation logic)
- **Async**: Form submission with loading state
- **Signals**: `currentStep`, `personalInfo`, `contactInfo`, `preferences`, `stepValidation`, `isSubmitting`, `submitted`
- **Tween**: `stepTransition` animates opacity and translateX when navigating steps
- **TrackedSignal/TrackedTween**: All form state and transitions bridged into Ember autotracking

## Integration Pattern

1. `engine.ts` defines the complete form flow: field updates -> validation pipes -> navigation -> submission
2. Navigation validates the current step before advancing (pipe from `ValidateStep` to `StepValidated`)
3. Component reads all form data through `TrackedSignal` wrappers
4. Step transition tween drives CSS opacity + transform for smooth step changes
5. Review step reads all signal values for a summary display

## Running with Ember CLI

1. Generate a new Ember app: `npx ember-cli new my-app --embroider`
2. Install deps: `pnpm add @pulse/core @pulse/ember`
3. Copy `src/engine.ts` and component files into your app

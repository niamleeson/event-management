import { createEngine } from '@pulse/core';
// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------
export const engine = createEngine();
// ---------------------------------------------------------------------------
// Field definitions per step
// ---------------------------------------------------------------------------
export const STEP_FIELDS = {
    0: ['firstName', 'lastName', 'email', 'phone'],
    1: ['street', 'city', 'state', 'zip'],
    2: [],
};
export const STEP_LABELS = ['Personal Info', 'Address', 'Review & Submit'];
// ---------------------------------------------------------------------------
// Validation rules
// ---------------------------------------------------------------------------
function validateField(field, value) {
    switch (field) {
        case 'firstName':
        case 'lastName':
            if (!value.trim())
                return { valid: false, error: 'Required' };
            if (value.trim().length < 2)
                return { valid: false, error: 'At least 2 characters' };
            return { valid: true, error: null };
        case 'email':
            if (!value.trim())
                return { valid: false, error: 'Required' };
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
                return { valid: false, error: 'Invalid email' };
            return { valid: true, error: null };
        case 'phone':
            if (!value.trim())
                return { valid: false, error: 'Required' };
            if (!/^\+?[\d\s()-]{7,}$/.test(value))
                return { valid: false, error: 'Invalid phone number' };
            return { valid: true, error: null };
        case 'street':
            if (!value.trim())
                return { valid: false, error: 'Required' };
            return { valid: true, error: null };
        case 'city':
            if (!value.trim())
                return { valid: false, error: 'Required' };
            return { valid: true, error: null };
        case 'state':
            if (!value.trim())
                return { valid: false, error: 'Required' };
            if (value.trim().length < 2)
                return { valid: false, error: 'At least 2 characters' };
            return { valid: true, error: null };
        case 'zip':
            if (!value.trim())
                return { valid: false, error: 'Required' };
            if (!/^\d{5}(-\d{4})?$/.test(value.trim()))
                return { valid: false, error: 'Invalid zip (e.g. 12345)' };
            return { valid: true, error: null };
        default:
            return { valid: true, error: null };
    }
}
// ---------------------------------------------------------------------------
// Event declarations
// ---------------------------------------------------------------------------
export const FieldUpdated = engine.event('FieldUpdated');
export const FieldValidated = engine.event('FieldValidated');
export const StepValidated = engine.event('StepValidated');
export const NextStep = engine.event('NextStep');
export const PrevStep = engine.event('PrevStep');
export const StepChanged = engine.event('StepChanged');
export const FormSubmitted = engine.event('FormSubmitted');
export const SubmitPending = engine.event('SubmitPending');
export const SubmitDone = engine.event('SubmitDone');
export const SubmitError = engine.event('SubmitError');
export const ShakeError = engine.event('ShakeError');
// ---------------------------------------------------------------------------
// Pipes
// ---------------------------------------------------------------------------
// FieldUpdated -> FieldValidated (per-field validation)
engine.pipe(FieldUpdated, FieldValidated, (update) => {
    const result = validateField(update.field, update.value);
    return {
        step: update.step,
        field: update.field,
        valid: result.valid,
        error: result.error,
    };
});
// ---------------------------------------------------------------------------
// Step validation: check if all fields in current step are valid
// ---------------------------------------------------------------------------
engine.on(FieldValidated, (_validation) => {
    const step = _validation.step;
    const fields = STEP_FIELDS[step];
    const allValid = fields.every((field) => {
        const errors = fieldErrors.value;
        return errors[field] === null && fieldValues.value[field]?.trim();
    });
    engine.emit(StepValidated, { step, valid: allValid });
});
// ---------------------------------------------------------------------------
// Navigation: NextStep only advances if current step is valid
// ---------------------------------------------------------------------------
engine.on(NextStep, () => {
    const step = currentStep.value;
    if (step >= 2) {
        // On step 2, submit the form
        engine.emit(FormSubmitted, fieldValues.value);
        return;
    }
    // Check step validity
    const fields = STEP_FIELDS[step];
    const allValid = fields.every((field) => {
        const errors = fieldErrors.value;
        const val = fieldValues.value[field];
        return errors[field] === null && val?.trim();
    });
    if (allValid) {
        engine.emit(StepChanged, { step: (step + 1), direction: 'next' });
    }
    else {
        // Trigger validation for all fields on the step to show errors
        for (const field of fields) {
            const value = fieldValues.value[field] ?? '';
            engine.emit(FieldUpdated, { step, field, value });
        }
        engine.emit(ShakeError, undefined);
    }
});
engine.on(PrevStep, () => {
    const step = currentStep.value;
    if (step > 0) {
        engine.emit(StepChanged, { step: (step - 1), direction: 'prev' });
    }
});
// ---------------------------------------------------------------------------
// Async: FormSubmitted -> SubmitDone (mock API)
// ---------------------------------------------------------------------------
engine.async(FormSubmitted, {
    pending: SubmitPending,
    done: SubmitDone,
    error: SubmitError,
    strategy: 'latest',
    do: async (_data, { signal }) => {
        try {
            await new Promise((resolve, reject) => {
                const timer = setTimeout(resolve, 1500);
                signal.addEventListener('abort', () => {
                    clearTimeout(timer);
                    reject(new DOMException('Aborted', 'AbortError'));
                });
            });
            return { success: true };
        }
        catch (err) {
            if (err?.name === 'AbortError')
                throw err;
            throw typeof err === 'string' ? err : (err?.message ?? 'Submission failed');
        }
    },
});
// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------
// Current step
export const currentStep = engine.signal(StepChanged, 0, (_prev, change) => change.step);
// Transition direction for animation
export const stepDirection = engine.signal(StepChanged, 'next', (_prev, change) => change.direction);
// Field values
const initialFormData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip: '',
};
export const fieldValues = engine.signal(FieldUpdated, initialFormData, (prev, update) => ({
    ...prev,
    [update.field]: update.value,
}));
// Field errors
export const fieldErrors = engine.signal(FieldValidated, {}, (prev, validation) => ({
    ...prev,
    [validation.field]: validation.error,
}));
// Step validity
export const stepValid = engine.signal(StepValidated, { 0: false, 1: false, 2: true }, (prev, validation) => ({
    ...prev,
    [validation.step]: validation.valid,
}));
// Submitting state
export const isSubmitting = engine.signal(SubmitPending, false, () => true);
engine.signalUpdate(isSubmitting, SubmitDone, () => false);
engine.signalUpdate(isSubmitting, SubmitError, () => false);
// Submit success state
export const submitResult = engine.signal(SubmitDone, null, (_prev, result) => result);
// Shake trigger
export const shakeActive = engine.signal(ShakeError, 0, (prev) => prev + 1);
// Start frame loop for animations
engine.startFrameLoop();

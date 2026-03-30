import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSignal, useEmit } from '@pulse/react';
import { currentStep, stepDirection, fieldValues, fieldErrors, isSubmitting, submitResult, shakeActive, FieldUpdated, NextStep, PrevStep, STEP_LABELS, } from './engine';
// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const colors = {
    bg: '#f8fafc',
    card: '#ffffff',
    primary: '#4361ee',
    primaryHover: '#3451de',
    text: '#0f172a',
    muted: '#64748b',
    border: '#e2e8f0',
    error: '#ef4444',
    errorBg: '#fef2f2',
    success: '#10b981',
    successBg: '#ecfdf5',
};
const styles = {
    container: {
        minHeight: '100vh',
        background: colors.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: 20,
    },
    card: {
        background: colors.card,
        borderRadius: 20,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        width: '100%',
        maxWidth: 540,
        overflow: 'hidden',
    },
    header: {
        padding: '32px 32px 0',
    },
    title: {
        fontSize: 28,
        fontWeight: 800,
        color: colors.text,
        margin: 0,
    },
    subtitle: {
        color: colors.muted,
        fontSize: 14,
        marginTop: 4,
    },
    progressBar: {
        display: 'flex',
        alignItems: 'center',
        padding: '24px 32px',
        gap: 0,
    },
    progressStep: (active, completed) => ({
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    }),
    progressDot: (active, completed) => ({
        width: 32,
        height: 32,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        fontWeight: 700,
        background: completed ? colors.primary : active ? colors.primary : colors.border,
        color: completed || active ? '#fff' : colors.muted,
        transition: 'all 0.3s',
    }),
    progressLabel: (active) => ({
        fontSize: 12,
        fontWeight: active ? 600 : 400,
        color: active ? colors.primary : colors.muted,
        marginTop: 6,
        transition: 'color 0.3s',
    }),
    progressLine: (completed) => ({
        flex: 1,
        height: 2,
        background: completed ? colors.primary : colors.border,
        marginBottom: 22,
        transition: 'background 0.3s',
    }),
    body: {
        padding: '8px 32px 32px',
        minHeight: 280,
    },
    fieldGroup: {
        marginBottom: 20,
    },
    label: {
        display: 'block',
        fontSize: 13,
        fontWeight: 600,
        color: colors.text,
        marginBottom: 6,
    },
    input: (hasError) => ({
        width: '100%',
        padding: '12px 14px',
        fontSize: 15,
        border: `2px solid ${hasError ? colors.error : colors.border}`,
        borderRadius: 10,
        outline: 'none',
        boxSizing: 'border-box',
        transition: 'border-color 0.2s',
        background: hasError ? colors.errorBg : '#fff',
    }),
    errorText: {
        fontSize: 12,
        color: colors.error,
        marginTop: 4,
        minHeight: 16,
    },
    row: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
    },
    footer: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '16px 32px 32px',
    },
    backBtn: {
        padding: '12px 24px',
        fontSize: 14,
        fontWeight: 600,
        border: `2px solid ${colors.border}`,
        borderRadius: 10,
        background: '#fff',
        color: colors.text,
        cursor: 'pointer',
        transition: 'border-color 0.2s',
    },
    nextBtn: (disabled) => ({
        padding: '12px 32px',
        fontSize: 14,
        fontWeight: 600,
        border: 'none',
        borderRadius: 10,
        background: disabled ? colors.border : colors.primary,
        color: disabled ? colors.muted : '#fff',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.2s',
    }),
    reviewSection: {
        marginBottom: 16,
    },
    reviewLabel: {
        fontSize: 12,
        fontWeight: 600,
        color: colors.muted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    reviewValue: {
        fontSize: 16,
        color: colors.text,
        padding: '8px 0',
        borderBottom: `1px solid ${colors.border}`,
    },
    successCard: {
        textAlign: 'center',
        padding: '60px 32px',
    },
    successIcon: {
        width: 64,
        height: 64,
        borderRadius: '50%',
        background: colors.successBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 16px',
        fontSize: 32,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 700,
        color: colors.text,
        margin: 0,
    },
    successMessage: {
        color: colors.muted,
        fontSize: 14,
        marginTop: 8,
    },
};
// ---------------------------------------------------------------------------
// Field labels
// ---------------------------------------------------------------------------
const FIELD_LABELS = {
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email Address',
    phone: 'Phone Number',
    street: 'Street Address',
    city: 'City',
    state: 'State',
    zip: 'ZIP Code',
};
// ---------------------------------------------------------------------------
// FormField component
// ---------------------------------------------------------------------------
function FormField({ field, step }) {
    const emit = useEmit();
    const values = useSignal(fieldValues);
    const errors = useSignal(fieldErrors);
    const value = values[field] ?? '';
    const error = errors[field] ?? null;
    const hasError = error !== null;
    return (_jsxs("div", { style: styles.fieldGroup, children: [_jsx("label", { style: styles.label, children: FIELD_LABELS[field] ?? field }), _jsx("input", { style: styles.input(hasError), value: value, placeholder: FIELD_LABELS[field] ?? field, onChange: (e) => emit(FieldUpdated, { step, field, value: e.target.value }), onFocus: (e) => {
                    e.currentTarget.style.borderColor = hasError ? colors.error : colors.primary;
                }, onBlur: (e) => {
                    e.currentTarget.style.borderColor = hasError ? colors.error : colors.border;
                } }), _jsx("div", { style: styles.errorText, children: error ?? '\u00A0' })] }));
}
// ---------------------------------------------------------------------------
// Step 0: Personal Info
// ---------------------------------------------------------------------------
function PersonalInfoStep() {
    return (_jsxs("div", { children: [_jsxs("div", { style: styles.row, children: [_jsx(FormField, { field: "firstName", step: 0 }), _jsx(FormField, { field: "lastName", step: 0 })] }), _jsx(FormField, { field: "email", step: 0 }), _jsx(FormField, { field: "phone", step: 0 })] }));
}
// ---------------------------------------------------------------------------
// Step 1: Address
// ---------------------------------------------------------------------------
function AddressStep() {
    return (_jsxs("div", { children: [_jsx(FormField, { field: "street", step: 1 }), _jsx(FormField, { field: "city", step: 1 }), _jsxs("div", { style: styles.row, children: [_jsx(FormField, { field: "state", step: 1 }), _jsx(FormField, { field: "zip", step: 1 })] })] }));
}
// ---------------------------------------------------------------------------
// Step 2: Review
// ---------------------------------------------------------------------------
function ReviewStep() {
    const values = useSignal(fieldValues);
    const reviewFields = [
        { label: 'Name', value: `${values.firstName} ${values.lastName}` },
        { label: 'Email', value: values.email },
        { label: 'Phone', value: values.phone },
        { label: 'Address', value: `${values.street}, ${values.city}, ${values.state} ${values.zip}` },
    ];
    return (_jsxs("div", { children: [_jsx("p", { style: { color: colors.muted, fontSize: 14, marginBottom: 20 }, children: "Please review your information before submitting." }), reviewFields.map((item) => (_jsxs("div", { style: styles.reviewSection, children: [_jsx("div", { style: styles.reviewLabel, children: item.label }), _jsx("div", { style: styles.reviewValue, children: item.value || '(not provided)' })] }, item.label)))] }));
}
// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------
function ProgressBar() {
    const step = useSignal(currentStep);
    return (_jsx("div", { style: styles.progressBar, children: STEP_LABELS.map((label, i) => (_jsxs("div", { style: { display: 'flex', alignItems: 'center', flex: 1 }, children: [_jsxs("div", { style: styles.progressStep(step === i, step > i), children: [_jsx("div", { style: styles.progressDot(step === i, step > i), children: step > i ? '\u2713' : i + 1 }), _jsx("span", { style: styles.progressLabel(step === i), children: label })] }), i < STEP_LABELS.length - 1 && (_jsx("div", { style: styles.progressLine(step > i) }))] }, i))) }));
}
// ---------------------------------------------------------------------------
// Success screen
// ---------------------------------------------------------------------------
function SuccessScreen() {
    return (_jsxs("div", { style: styles.successCard, children: [_jsx("div", { style: styles.successIcon, children: _jsx("span", { role: "img", "aria-label": "check", children: "\u2714" }) }), _jsx("h2", { style: styles.successTitle, children: "Submission Complete" }), _jsx("p", { style: styles.successMessage, children: "Your form has been submitted successfully. All state was managed through Pulse events and signals." })] }));
}
// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
export default function App() {
    const emit = useEmit();
    const step = useSignal(currentStep);
    const direction = useSignal(stepDirection);
    const submitting = useSignal(isSubmitting);
    const result = useSignal(submitResult);
    const shake = useSignal(shakeActive);
    // Show success screen after submit
    if (result?.success) {
        return (_jsx("div", { style: styles.container, children: _jsx("div", { style: styles.card, children: _jsx(SuccessScreen, {}) }) }));
    }
    const stepComponents = [
        _jsx(PersonalInfoStep, {}, "personal"),
        _jsx(AddressStep, {}, "address"),
        _jsx(ReviewStep, {}, "review"),
    ];
    return (_jsxs("div", { style: styles.container, children: [_jsx("style", { children: `
        @keyframes shakeForm {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
          20%, 40%, 60%, 80% { transform: translateX(6px); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
      ` }), _jsxs("div", { style: {
                    ...styles.card,
                    animation: shake > 0 ? 'shakeForm 0.5s ease-in-out' : undefined,
                }, children: [_jsxs("div", { style: styles.header, children: [_jsx("h1", { style: styles.title, children: "Create Account" }), _jsx("p", { style: styles.subtitle, children: "Multi-step form with event-driven validation" })] }), _jsx(ProgressBar, {}), _jsx("div", { style: {
                            ...styles.body,
                            animation: direction === 'next'
                                ? 'slideInRight 0.3s ease-out'
                                : 'slideInLeft 0.3s ease-out',
                        }, children: stepComponents[step] }, `step-${step}`), _jsxs("div", { style: styles.footer, children: [step > 0 ? (_jsx("button", { style: styles.backBtn, onClick: () => emit(PrevStep, undefined), children: "Back" })) : (_jsx("div", {})), _jsx("button", { style: styles.nextBtn(submitting), disabled: submitting, onClick: () => emit(NextStep, undefined), children: submitting
                                    ? 'Submitting...'
                                    : step === 2
                                        ? 'Submit'
                                        : 'Continue' })] })] }, `shake-${shake}`)] }));
}

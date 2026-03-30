import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSignal, useEmit } from '@pulse/react';
import { useCallback, useEffect, useRef } from 'react';
import { modalStack, activeModalId, OpenModal, CloseModal, CloseAll, ConfirmAction, CancelAction, } from './engine';
// ---------------------------------------------------------------------------
// Size config
// ---------------------------------------------------------------------------
const SIZE_CONFIG = {
    small: { width: 360, minHeight: 200 },
    medium: { width: 520, minHeight: 300 },
    large: { width: 700, minHeight: 400 },
};
// ---------------------------------------------------------------------------
// Modal component
// ---------------------------------------------------------------------------
function Modal({ modal, index, total, isActive, }) {
    const emit = useEmit();
    const dialogRef = useRef(null);
    const config = SIZE_CONFIG[modal.size];
    // Focus trap
    useEffect(() => {
        if (!isActive || !dialogRef.current)
            return;
        const el = dialogRef.current;
        const focusableElements = el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];
        firstFocusable?.focus();
        const handleTab = (e) => {
            if (e.key !== 'Tab')
                return;
            if (!firstFocusable || !lastFocusable)
                return;
            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable.focus();
                }
            }
            else {
                if (document.activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable.focus();
                }
            }
        };
        el.addEventListener('keydown', handleTab);
        return () => el.removeEventListener('keydown', handleTab);
    }, [isActive]);
    // Escape to close
    useEffect(() => {
        if (!isActive)
            return;
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                emit(CloseModal, modal.id);
            }
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [isActive, emit, modal.id]);
    const isEntering = modal.state === 'entering';
    const isExiting = modal.state === 'exiting';
    const stackOffset = (total - 1 - index) * 8;
    const dimFactor = isActive ? 1 : 0.92 - (total - 1 - index) * 0.04;
    return (_jsxs("div", { ref: dialogRef, role: "dialog", "aria-modal": "true", "aria-label": modal.title, style: {
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: config.width,
            minHeight: config.minHeight,
            transform: isEntering
                ? `translate(-50%, -50%) scale(0.9)`
                : isExiting
                    ? `translate(-50%, -50%) scale(0.9)`
                    : `translate(-50%, calc(-50% - ${stackOffset}px)) scale(${dimFactor})`,
            opacity: isEntering ? 0 : isExiting ? 0 : isActive ? 1 : 0.8,
            transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s ease',
            background: '#1e293b',
            borderRadius: 16,
            border: '1px solid #334155',
            boxShadow: isActive
                ? '0 24px 64px rgba(0,0,0,0.4)'
                : '0 8px 24px rgba(0,0,0,0.2)',
            zIndex: 1000 + index,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
        }, children: [_jsxs("div", { style: {
                    padding: '20px 24px 16px',
                    borderBottom: '1px solid #334155',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }, children: [_jsx("h2", { style: {
                            margin: 0,
                            fontSize: 18,
                            fontWeight: 700,
                            color: '#f1f5f9',
                        }, children: modal.title }), _jsx("button", { onClick: () => emit(CloseModal, modal.id), style: {
                            background: 'none',
                            border: 'none',
                            color: '#64748b',
                            cursor: 'pointer',
                            fontSize: 18,
                            padding: '4px 8px',
                            borderRadius: 6,
                            transition: 'all 0.15s',
                        }, onMouseEnter: (e) => {
                            e.currentTarget.style.color = '#e2e8f0';
                            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                        }, onMouseLeave: (e) => {
                            e.currentTarget.style.color = '#64748b';
                            e.currentTarget.style.background = 'none';
                        }, children: "\\u2715" })] }), _jsxs("div", { style: {
                    flex: 1,
                    padding: 24,
                    color: '#94a3b8',
                    fontSize: 14,
                    lineHeight: 1.6,
                }, children: [_jsx("p", { children: modal.content }), _jsx("button", { onClick: () => {
                            const sizes = ['small', 'medium', 'large'];
                            const nextSize = sizes[(sizes.indexOf(modal.size) + 1) % sizes.length];
                            const nextNum = total + 1;
                            emit(OpenModal, {
                                id: `modal-${Date.now()}`,
                                title: `Nested Modal #${nextNum}`,
                                content: `This is a ${nextSize} modal opened from within "${modal.title}". You can keep stacking modals. Press Escape to close the top modal.`,
                                size: nextSize,
                            });
                        }, style: {
                            marginTop: 16,
                            padding: '8px 16px',
                            borderRadius: 8,
                            border: '1px solid #6366f140',
                            background: '#6366f120',
                            color: '#818cf8',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                        }, children: "Open Another Modal" })] }), _jsxs("div", { style: {
                    padding: '16px 24px',
                    borderTop: '1px solid #334155',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 10,
                }, children: [_jsx("button", { onClick: () => emit(CancelAction, modal.id), style: {
                            padding: '8px 20px',
                            borderRadius: 8,
                            border: '1px solid #475569',
                            background: 'transparent',
                            color: '#94a3b8',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                        }, children: "Cancel" }), _jsx("button", { onClick: () => emit(ConfirmAction, modal.id), style: {
                            padding: '8px 20px',
                            borderRadius: 8,
                            border: 'none',
                            background: '#3b82f6',
                            color: '#fff',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                        }, children: "Confirm" })] })] }));
}
// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
export default function App() {
    const emit = useEmit();
    const stack = useSignal(modalStack);
    const activeId = useSignal(activeModalId);
    let modalCounter = useRef(0);
    const handleOpen = useCallback((size) => {
        modalCounter.current++;
        const n = modalCounter.current;
        emit(OpenModal, {
            id: `modal-${Date.now()}`,
            title: `Modal #${n}`,
            content: `This is a ${size} modal dialog. It supports focus trapping, stacking with visual offset, and animated entrance/exit transitions. Try opening another modal from inside, or pressing Escape to close.`,
            size,
        });
    }, [emit]);
    const hasModals = stack.length > 0;
    const anyEntering = stack.some((m) => m.state === 'entering');
    const anyExiting = stack.some((m) => m.state === 'exiting');
    return (_jsxs("div", { style: {
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 40,
        }, children: [_jsx("h1", { style: {
                    fontSize: 32,
                    fontWeight: 800,
                    color: '#f1f5f9',
                    marginBottom: 8,
                }, children: "Modal System" }), _jsx("p", { style: { color: '#64748b', fontSize: 14, marginBottom: 40, textAlign: 'center', maxWidth: 500 }, children: "Stacked modal dialogs with animated entrance/exit, focus trapping, backdrop blur, and visual stacking offset. Escape closes the top modal." }), _jsx("div", { style: { display: 'flex', gap: 12, marginBottom: 24 }, children: ['small', 'medium', 'large'].map((size) => (_jsxs("button", { onClick: () => handleOpen(size), style: {
                        padding: '12px 24px',
                        borderRadius: 10,
                        border: '1px solid #3b82f640',
                        background: '#3b82f620',
                        color: '#60a5fa',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                        transition: 'all 0.2s',
                    }, onMouseEnter: (e) => {
                        e.currentTarget.style.background = '#3b82f635';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                    }, onMouseLeave: (e) => {
                        e.currentTarget.style.background = '#3b82f620';
                        e.currentTarget.style.transform = 'translateY(0)';
                    }, children: ["Open ", size] }, size))) }), stack.length > 0 && (_jsxs("button", { onClick: () => emit(CloseAll, undefined), style: {
                    padding: '10px 20px',
                    borderRadius: 10,
                    border: '1px solid #ef444440',
                    background: '#ef444420',
                    color: '#f87171',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginBottom: 24,
                }, children: ["Close All (", stack.length, ")"] })), _jsxs("p", { style: { color: '#475569', fontSize: 13 }, children: ["Open modals: ", stack.length] }), hasModals && (_jsxs("div", { style: {
                    position: 'fixed',
                    inset: 0,
                    zIndex: 999,
                }, children: [_jsx("div", { onClick: () => {
                            if (activeId)
                                emit(CloseModal, activeId);
                        }, style: {
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(0, 0, 0, 0.6)',
                            backdropFilter: `blur(${Math.min(stack.length * 4, 16)}px)`,
                            WebkitBackdropFilter: `blur(${Math.min(stack.length * 4, 16)}px)`,
                            opacity: stack.some((m) => m.state === 'exiting') && stack.length <= 1 ? 0 : 1,
                            transition: 'opacity 0.3s ease, backdrop-filter 0.3s ease',
                        } }), stack.map((modal, i) => (_jsx(Modal, { modal: modal, index: i, total: stack.length, isActive: modal.id === activeId }, modal.id)))] }))] }));
}

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSignal, useEmit } from '@pulse/react';
import { useCallback } from 'react';
import { notifications, notificationCount, NotifyInfo, NotifySuccess, NotifyWarning, NotifyError, DismissNotification, DismissAll, } from './engine';
// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const MAX_VISIBLE = 5;
const TYPE_COLORS = {
    info: { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.4)', icon: '#3b82f6' },
    success: { bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.4)', icon: '#22c55e' },
    warning: { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)', icon: '#f59e0b' },
    error: { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)', icon: '#ef4444' },
};
const TYPE_ICONS = {
    info: '\u2139',
    success: '\u2713',
    warning: '\u26A0',
    error: '\u2717',
};
// ---------------------------------------------------------------------------
// NotificationItem
// ---------------------------------------------------------------------------
function NotificationItem({ notif, index, onDismiss, }) {
    const colors = TYPE_COLORS[notif.type];
    const icon = TYPE_ICONS[notif.type];
    const isEntering = notif.entering;
    const isExiting = notif.exiting;
    return (_jsxs("div", { style: {
            position: 'relative',
            padding: '14px 44px 14px 16px',
            borderRadius: 12,
            background: colors.bg,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: `1px solid ${colors.border}`,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            transform: isEntering
                ? 'translateX(120%)'
                : isExiting
                    ? 'translateX(120%) scale(0.95)'
                    : 'translateX(0)',
            opacity: isEntering ? 0 : isExiting ? 0 : 1,
            transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease',
            marginBottom: 10,
            minWidth: 320,
            maxWidth: 400,
        }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'flex-start', gap: 10 }, children: [_jsx("span", { style: {
                            fontSize: 18,
                            color: colors.icon,
                            lineHeight: 1,
                            marginTop: 2,
                            fontWeight: 700,
                        }, children: icon }), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsx("div", { style: {
                                    fontWeight: 600,
                                    fontSize: 14,
                                    color: '#e2e8f0',
                                    marginBottom: 2,
                                }, children: notif.title }), _jsx("div", { style: { fontSize: 13, color: '#94a3b8', lineHeight: 1.4 }, children: notif.message })] })] }), _jsx("button", { onClick: () => onDismiss(notif.id), style: {
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    fontSize: 16,
                    lineHeight: 1,
                    padding: '2px 6px',
                    borderRadius: 4,
                }, onMouseEnter: (e) => {
                    e.currentTarget.style.color = '#e2e8f0';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                }, onMouseLeave: (e) => {
                    e.currentTarget.style.color = '#64748b';
                    e.currentTarget.style.background = 'none';
                }, children: "\\u2715" })] }));
}
// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
export default function App() {
    const emit = useEmit();
    const allNotifications = useSignal(notifications);
    const count = useSignal(notificationCount);
    const visibleNotifications = allNotifications.slice(0, MAX_VISIBLE);
    const queuedCount = Math.max(0, allNotifications.length - MAX_VISIBLE);
    const handleDismiss = useCallback((id) => emit(DismissNotification, id), [emit]);
    const handleFlood = useCallback(() => {
        const types = [
            { event: NotifyInfo, type: 'Info' },
            { event: NotifySuccess, type: 'Success' },
            { event: NotifyWarning, type: 'Warning' },
            { event: NotifyError, type: 'Error' },
        ];
        for (let i = 0; i < 20; i++) {
            const t = types[i % types.length];
            setTimeout(() => emit(t.event, {
                title: `${t.type} #${i + 1}`,
                message: `Flood notification message number ${i + 1}`,
            }), i * 80);
        }
    }, [emit]);
    return (_jsxs("div", { style: {
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            padding: 40,
            position: 'relative',
        }, children: [_jsxs("div", { style: { maxWidth: 600, margin: '0 auto', textAlign: 'center' }, children: [_jsx("h1", { style: {
                            fontSize: 32,
                            fontWeight: 800,
                            color: '#f1f5f9',
                            marginBottom: 8,
                        }, children: "Notification System" }), _jsxs("p", { style: { color: '#64748b', fontSize: 14, marginBottom: 40 }, children: ["Toast notifications with priority ordering, auto-dismiss, and animated transitions. Max ", MAX_VISIBLE, " visible at a time."] }), _jsxs("div", { style: {
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 10,
                            justifyContent: 'center',
                            marginBottom: 20,
                        }, children: [_jsx(ControlButton, { label: "Info", color: "#3b82f6", onClick: () => emit(NotifyInfo, {
                                    title: 'Information',
                                    message: 'This is an informational notification that will auto-dismiss in 5 seconds.',
                                }) }), _jsx(ControlButton, { label: "Success", color: "#22c55e", onClick: () => emit(NotifySuccess, {
                                    title: 'Success!',
                                    message: 'Operation completed successfully. This dismisses in 5 seconds.',
                                }) }), _jsx(ControlButton, { label: "Warning", color: "#f59e0b", onClick: () => emit(NotifyWarning, {
                                    title: 'Warning',
                                    message: 'Something needs your attention. This stays for 10 seconds.',
                                }) }), _jsx(ControlButton, { label: "Error", color: "#ef4444", onClick: () => emit(NotifyError, {
                                    title: 'Error',
                                    message: 'Something went wrong! This notification stays until dismissed manually.',
                                }) }), _jsx(ControlButton, { label: "Flood (20)", color: "#8b5cf6", onClick: handleFlood }), _jsx(ControlButton, { label: "Dismiss All", color: "#64748b", onClick: () => emit(DismissAll, undefined) })] }), _jsxs("div", { style: { color: '#475569', fontSize: 13 }, children: ["Active: ", count, queuedCount > 0 && (_jsxs("span", { style: { marginLeft: 12 }, children: ["Queued: ", queuedCount] }))] })] }), _jsxs("div", { style: {
                    position: 'fixed',
                    top: 20,
                    right: 20,
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                }, children: [visibleNotifications.map((notif, i) => (_jsx(NotificationItem, { notif: notif, index: i, onDismiss: handleDismiss }, notif.id))), queuedCount > 0 && (_jsxs("div", { style: {
                            textAlign: 'center',
                            color: '#475569',
                            fontSize: 12,
                            marginTop: 4,
                        }, children: ["+", queuedCount, " more queued"] }))] })] }));
}
// ---------------------------------------------------------------------------
// ControlButton
// ---------------------------------------------------------------------------
function ControlButton({ label, color, onClick, }) {
    return (_jsx("button", { onClick: onClick, style: {
            padding: '10px 20px',
            borderRadius: 10,
            border: `1px solid ${color}40`,
            background: `${color}20`,
            color: color,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
        }, onMouseEnter: (e) => {
            e.currentTarget.style.background = `${color}35`;
            e.currentTarget.style.transform = 'translateY(-1px)';
        }, onMouseLeave: (e) => {
            e.currentTarget.style.background = `${color}20`;
            e.currentTarget.style.transform = 'translateY(0)';
        }, children: label }));
}

import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useRef, useEffect, useState, useCallback } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { createDevTools } from '@pulse/devtools';
import { routeInfo } from './routes';
// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const SIDEBAR_WIDTH = 260;
const styles = {
    wrapper: {
        display: 'flex',
        minHeight: '100vh',
    },
    sidebar: {
        width: SIDEBAR_WIDTH,
        minWidth: SIDEBAR_WIDTH,
        background: '#1a1a2e',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        overflowY: 'auto',
        zIndex: 100,
    },
    logoArea: {
        padding: '28px 24px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
    },
    logoTitle: {
        fontSize: 26,
        fontWeight: 800,
        margin: 0,
        letterSpacing: -0.5,
        background: 'linear-gradient(135deg, #4361ee 0%, #7c3aed 50%, #a855f7 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
    },
    logoSubtitle: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 4,
        fontWeight: 500,
        letterSpacing: 0.3,
    },
    nav: {
        flex: 1,
        padding: '12px 0',
    },
    navLabel: {
        fontSize: 10,
        fontWeight: 700,
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        padding: '12px 24px 8px',
    },
    navLink: (isActive) => ({
        display: 'block',
        padding: '10px 24px',
        textDecoration: 'none',
        borderLeft: `3px solid ${isActive ? '#4361ee' : 'transparent'}`,
        background: isActive ? 'rgba(67, 97, 238, 0.1)' : 'transparent',
        transition: 'all 0.15s ease',
        cursor: 'pointer',
    }),
    navLinkName: (isActive) => ({
        fontSize: 14,
        fontWeight: isActive ? 600 : 500,
        color: isActive ? '#fff' : '#cbd5e1',
        lineHeight: 1.3,
    }),
    navLinkDesc: {
        fontSize: 11,
        color: '#475569',
        marginTop: 2,
        lineHeight: 1.4,
    },
    footer: {
        padding: '16px 24px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        fontSize: 11,
        color: '#334155',
        lineHeight: 1.5,
    },
    main: {
        flex: 1,
        marginLeft: SIDEBAR_WIDTH,
        background: '#f8fafc',
        minHeight: '100vh',
    },
    contentHeader: {
        padding: '24px 32px 0',
    },
    pageTitle: {
        fontSize: 22,
        fontWeight: 700,
        color: '#0f172a',
        margin: 0,
    },
    pageDesc: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 4,
        marginBottom: 0,
    },
    divider: {
        height: 1,
        background: '#e2e8f0',
        margin: '16px 32px 0',
    },
    contentBody: {
        padding: '0',
    },
    devtoolsBtn: (active) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        margin: '8px 24px 4px',
        padding: '8px 14px',
        border: 'none',
        borderRadius: 8,
        background: active ? '#4361ee' : 'rgba(255,255,255,0.08)',
        color: active ? '#fff' : 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        letterSpacing: 0.2,
    }),
};
// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------
export default function Layout() {
    const location = useLocation();
    const currentRoute = routeInfo.find((r) => location.pathname === r.path);
    const devtoolsRef = useRef(null);
    const [devtoolsOpen, setDevtoolsOpen] = useState(false);
    const destroyDevTools = useCallback(() => {
        if (devtoolsRef.current) {
            devtoolsRef.current.destroy();
            devtoolsRef.current = null;
        }
        setDevtoolsOpen(false);
    }, []);
    // When route changes, destroy existing devtools and re-create if it was open
    useEffect(() => {
        if (devtoolsOpen) {
            // Destroy old instance
            if (devtoolsRef.current) {
                devtoolsRef.current.destroy();
                devtoolsRef.current = null;
            }
            // Small delay to allow the new page to set __pulseEngine
            const timer = setTimeout(() => {
                const engine = window.__pulseEngine;
                if (engine) {
                    devtoolsRef.current = createDevTools(engine, { position: 'bottom', theme: 'dark' });
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [location.pathname, devtoolsOpen]);
    // Clean up devtools on unmount
    useEffect(() => {
        return () => {
            if (devtoolsRef.current) {
                devtoolsRef.current.destroy();
                devtoolsRef.current = null;
            }
        };
    }, []);
    const toggleDevTools = () => {
        if (devtoolsRef.current) {
            destroyDevTools();
        }
        else {
            const engine = window.__pulseEngine;
            if (engine) {
                devtoolsRef.current = createDevTools(engine, { position: 'bottom', theme: 'dark' });
                setDevtoolsOpen(true);
            }
        }
    };
    return (_jsxs("div", { style: styles.wrapper, children: [_jsxs("aside", { style: styles.sidebar, children: [_jsxs("div", { style: styles.logoArea, children: [_jsx("h1", { style: styles.logoTitle, children: "Pulse" }), _jsx("div", { style: styles.logoSubtitle, children: "React Examples Showcase" })] }), _jsx("nav", { style: styles.nav, children: ['basics', '3d', 'complex'].map((section) => {
                            const sectionLabel = section === 'basics' ? 'Basics' : section === '3d' ? '3D Animations' : 'Complex UI';
                            const sectionRoutes = routeInfo.filter((r) => r.section === section);
                            return (_jsxs("div", { children: [_jsx("div", { style: styles.navLabel, children: sectionLabel }), sectionRoutes.map((route) => (_jsx(NavLink, { to: route.path, style: ({ isActive }) => styles.navLink(isActive), children: ({ isActive }) => (_jsxs(_Fragment, { children: [_jsx("div", { style: styles.navLinkName(isActive), children: route.label }), _jsx("div", { style: styles.navLinkDesc, children: route.description })] })) }, route.path)))] }, section));
                        }) }), _jsxs("button", { style: styles.devtoolsBtn(devtoolsOpen), onClick: toggleDevTools, title: "Toggle Pulse DevTools", children: [_jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M12 20V10" }), _jsx("path", { d: "M18 20V4" }), _jsx("path", { d: "M6 20v-4" })] }), "DevTools"] }), _jsx("div", { style: styles.footer, children: "Built with @pulse/core and @pulse/react" })] }), _jsxs("main", { style: styles.main, children: [currentRoute && (_jsxs(_Fragment, { children: [_jsxs("div", { style: styles.contentHeader, children: [_jsx("h2", { style: styles.pageTitle, children: currentRoute.label }), _jsx("p", { style: styles.pageDesc, children: currentRoute.description })] }), _jsx("div", { style: styles.divider })] })), _jsx("div", { style: styles.contentBody, children: _jsx(Outlet, {}) })] })] }));
}

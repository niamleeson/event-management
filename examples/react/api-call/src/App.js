import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSignal, useEmit } from '@pulse/react';
import { searchQuery, searchResults, isSearching, selectedUserId, userDetails, isLoadingDetails, error, SearchInput, UserSelected, } from './engine';
// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const colors = {
    bg: '#f8f9fa',
    card: '#ffffff',
    primary: '#4361ee',
    primaryLight: '#eef0ff',
    text: '#1a1a2e',
    muted: '#6c757d',
    border: '#e9ecef',
    danger: '#e63946',
    success: '#2a9d8f',
};
const styles = {
    container: {
        maxWidth: 720,
        margin: '40px auto',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: '0 20px',
    },
    header: {
        textAlign: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 36,
        fontWeight: 700,
        color: colors.text,
        margin: 0,
    },
    subtitle: {
        color: colors.muted,
        fontSize: 14,
        marginTop: 4,
    },
    searchBox: {
        position: 'relative',
        marginBottom: 24,
    },
    input: {
        width: '100%',
        padding: '14px 16px 14px 44px',
        fontSize: 16,
        border: `2px solid ${colors.border}`,
        borderRadius: 12,
        outline: 'none',
        boxSizing: 'border-box',
        transition: 'border-color 0.2s',
    },
    searchIcon: {
        position: 'absolute',
        left: 16,
        top: '50%',
        transform: 'translateY(-50%)',
        color: colors.muted,
        fontSize: 18,
    },
    spinner: {
        position: 'absolute',
        right: 16,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 20,
        height: 20,
        border: `2px solid ${colors.border}`,
        borderTop: `2px solid ${colors.primary}`,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
    },
    userCard: (selected) => ({
        padding: 16,
        background: selected ? colors.primaryLight : colors.card,
        borderRadius: 12,
        border: `2px solid ${selected ? colors.primary : colors.border}`,
        cursor: 'pointer',
        transition: 'all 0.2s',
    }),
    avatar: {
        width: 48,
        height: 48,
        borderRadius: '50%',
        background: colors.primary,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: 16,
        marginBottom: 8,
    },
    userName: {
        fontWeight: 600,
        fontSize: 16,
        color: colors.text,
        margin: 0,
    },
    userRole: {
        fontSize: 13,
        color: colors.muted,
        margin: '2px 0 0',
    },
    detailsPanel: {
        marginTop: 24,
        padding: 24,
        background: colors.card,
        borderRadius: 12,
        border: `2px solid ${colors.border}`,
    },
    detailsHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginBottom: 16,
    },
    detailsAvatar: {
        width: 64,
        height: 64,
        borderRadius: '50%',
        background: colors.primary,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: 22,
        flexShrink: 0,
    },
    detailField: {
        marginBottom: 12,
    },
    detailLabel: {
        fontSize: 12,
        fontWeight: 600,
        textTransform: 'uppercase',
        color: colors.muted,
        letterSpacing: 0.5,
    },
    detailValue: {
        fontSize: 15,
        color: colors.text,
        marginTop: 2,
    },
    tag: {
        display: 'inline-block',
        padding: '4px 10px',
        background: colors.primaryLight,
        color: colors.primary,
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 600,
        marginRight: 6,
        marginTop: 4,
    },
    errorBox: {
        padding: 16,
        background: '#fef2f2',
        border: `1px solid ${colors.danger}`,
        borderRadius: 8,
        color: colors.danger,
        fontSize: 14,
        marginBottom: 16,
    },
    empty: {
        textAlign: 'center',
        padding: 40,
        color: colors.muted,
    },
    loadingOverlay: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        color: colors.muted,
    },
};
// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------
function SearchBar() {
    const emit = useEmit();
    const query = useSignal(searchQuery);
    const loading = useSignal(isSearching);
    return (_jsxs("div", { style: styles.searchBox, children: [_jsx("span", { style: styles.searchIcon, children: "\uD83D\uDD0D" }), _jsx("input", { style: styles.input, value: query, placeholder: "Search users by name, email, or role...", onChange: (e) => emit(SearchInput, e.target.value) }), loading && _jsx("div", { style: styles.spinner }), _jsx("style", { children: `@keyframes spin { to { transform: translateY(-50%) rotate(360deg); } }` })] }));
}
function UserCard({ user }) {
    const emit = useEmit();
    const selected = useSignal(selectedUserId);
    return (_jsxs("div", { style: styles.userCard(selected === user.id), onClick: () => emit(UserSelected, user.id), onMouseEnter: (e) => {
            if (selected !== user.id) {
                e.currentTarget.style.borderColor = colors.primary;
                e.currentTarget.style.transform = 'translateY(-2px)';
            }
        }, onMouseLeave: (e) => {
            if (selected !== user.id) {
                e.currentTarget.style.borderColor = colors.border;
                e.currentTarget.style.transform = 'translateY(0)';
            }
        }, children: [_jsx("div", { style: styles.avatar, children: user.avatar }), _jsx("p", { style: styles.userName, children: user.name }), _jsx("p", { style: styles.userRole, children: user.role })] }));
}
function SearchResults() {
    const results = useSignal(searchResults);
    const query = useSignal(searchQuery);
    const loading = useSignal(isSearching);
    if (loading && results.length === 0) {
        return _jsx("div", { style: styles.loadingOverlay, children: "Searching..." });
    }
    if (query.length > 0 && results.length === 0 && !loading) {
        return _jsxs("div", { style: styles.empty, children: ["No users found for \"", query, "\""] });
    }
    if (results.length === 0) {
        return (_jsx("div", { style: styles.empty, children: "Type in the search box to find users" }));
    }
    return (_jsx("div", { style: styles.grid, children: results.map((user) => (_jsx(UserCard, { user: user }, user.id))) }));
}
function UserDetailsPanel() {
    const details = useSignal(userDetails);
    const loading = useSignal(isLoadingDetails);
    const selected = useSignal(selectedUserId);
    if (!selected)
        return null;
    if (loading) {
        return (_jsx("div", { style: styles.detailsPanel, children: _jsx("div", { style: styles.loadingOverlay, children: "Loading user details..." }) }));
    }
    if (!details)
        return null;
    return (_jsxs("div", { style: styles.detailsPanel, children: [_jsxs("div", { style: styles.detailsHeader, children: [_jsx("div", { style: styles.detailsAvatar, children: details.avatar }), _jsxs("div", { children: [_jsx("h3", { style: { margin: 0, fontSize: 22, color: colors.text }, children: details.name }), _jsx("p", { style: { margin: '4px 0 0', color: colors.muted, fontSize: 14 }, children: details.email })] })] }), _jsxs("div", { style: styles.detailField, children: [_jsx("div", { style: styles.detailLabel, children: "Role" }), _jsx("div", { style: styles.detailValue, children: details.role })] }), _jsxs("div", { style: styles.detailField, children: [_jsx("div", { style: styles.detailLabel, children: "Bio" }), _jsx("div", { style: styles.detailValue, children: details.bio })] }), _jsxs("div", { style: styles.detailField, children: [_jsx("div", { style: styles.detailLabel, children: "Location" }), _jsx("div", { style: styles.detailValue, children: details.location })] }), _jsxs("div", { style: styles.detailField, children: [_jsx("div", { style: styles.detailLabel, children: "Joined" }), _jsx("div", { style: styles.detailValue, children: details.joinDate })] }), _jsxs("div", { style: styles.detailField, children: [_jsx("div", { style: styles.detailLabel, children: "Projects" }), _jsx("div", { children: details.projects.map((p) => (_jsx("span", { style: styles.tag, children: p }, p))) })] })] }));
}
function ErrorBanner() {
    const err = useSignal(error);
    if (!err)
        return null;
    return _jsx("div", { style: styles.errorBox, children: err });
}
// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
export default function App() {
    return (_jsxs("div", { style: styles.container, children: [_jsxs("div", { style: styles.header, children: [_jsx("h1", { style: styles.title, children: "User Search" }), _jsx("p", { style: styles.subtitle, children: "Async search with debounce, cancellation, and details fetching via Pulse" })] }), _jsx(ErrorBanner, {}), _jsx(SearchBar, {}), _jsx(SearchResults, {}), _jsx(UserDetailsPanel, {})] }));
}

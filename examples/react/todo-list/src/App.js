import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSignal, useEmit } from '@pulse/react';
import { todoList, activeFilter, currentText, validationError, TodoAdded, TodoRemoved, TodoToggled, TodoTextChanged, FilterChanged, } from './engine';
// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = {
    container: {
        maxWidth: 560,
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
        color: '#1a1a2e',
        margin: 0,
    },
    subtitle: {
        color: '#666',
        fontSize: 14,
        marginTop: 4,
    },
    inputRow: {
        display: 'flex',
        gap: 8,
        marginBottom: 8,
    },
    input: {
        flex: 1,
        padding: '12px 16px',
        fontSize: 16,
        border: '2px solid #e0e0e0',
        borderRadius: 8,
        outline: 'none',
        transition: 'border-color 0.2s',
    },
    addBtn: (disabled) => ({
        padding: '12px 24px',
        fontSize: 16,
        fontWeight: 600,
        border: 'none',
        borderRadius: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: disabled ? '#ccc' : '#4361ee',
        color: '#fff',
        transition: 'background 0.2s',
    }),
    errorText: {
        color: '#e63946',
        fontSize: 13,
        minHeight: 20,
        marginBottom: 16,
    },
    filterBar: {
        display: 'flex',
        gap: 8,
        marginBottom: 20,
    },
    filterBtn: (active) => ({
        padding: '6px 16px',
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        border: active ? '2px solid #4361ee' : '2px solid #e0e0e0',
        borderRadius: 20,
        background: active ? '#eef0ff' : '#fff',
        color: active ? '#4361ee' : '#666',
        cursor: 'pointer',
        transition: 'all 0.2s',
    }),
    todoItem: (completed) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        background: '#fff',
        borderRadius: 8,
        marginBottom: 8,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        transition: 'opacity 0.2s',
        opacity: completed ? 0.5 : 1,
    }),
    todoText: (completed) => ({
        flex: 1,
        fontSize: 16,
        textDecoration: completed ? 'line-through' : 'none',
        color: completed ? '#999' : '#1a1a2e',
    }),
    checkbox: {
        width: 20,
        height: 20,
        cursor: 'pointer',
        accentColor: '#4361ee',
    },
    removeBtn: {
        padding: '4px 10px',
        fontSize: 18,
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        color: '#ccc',
        transition: 'color 0.2s',
    },
    footer: {
        marginTop: 16,
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
    },
    empty: {
        textAlign: 'center',
        padding: 40,
        color: '#bbb',
        fontSize: 16,
    },
};
// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------
function TodoInput() {
    const emit = useEmit();
    const text = useSignal(currentText);
    const validation = useSignal(validationError);
    const handleAdd = () => {
        if (!validation.valid)
            return;
        const todo = {
            id: crypto.randomUUID(),
            text: text.trim(),
            completed: false,
        };
        emit(TodoAdded, todo);
        emit(TodoTextChanged, '');
    };
    const handleKeyDown = (e) => {
        if (e.key === 'Enter')
            handleAdd();
    };
    return (_jsxs("div", { children: [_jsxs("div", { style: styles.inputRow, children: [_jsx("input", { style: styles.input, value: text, placeholder: "What needs to be done?", onChange: (e) => emit(TodoTextChanged, e.target.value), onKeyDown: handleKeyDown }), _jsx("button", { style: styles.addBtn(!validation.valid), disabled: !validation.valid, onClick: handleAdd, children: "Add" })] }), _jsx("div", { style: styles.errorText, children: validation.error ?? '\u00A0' })] }));
}
function FilterBar() {
    const emit = useEmit();
    const filter = useSignal(activeFilter);
    const filters = ['all', 'active', 'completed'];
    return (_jsx("div", { style: styles.filterBar, children: filters.map((f) => (_jsx("button", { style: styles.filterBtn(filter === f), onClick: () => emit(FilterChanged, f), children: f.charAt(0).toUpperCase() + f.slice(1) }, f))) }));
}
function TodoItem({ todo }) {
    const emit = useEmit();
    return (_jsxs("div", { style: styles.todoItem(todo.completed), children: [_jsx("input", { type: "checkbox", checked: todo.completed, style: styles.checkbox, onChange: () => emit(TodoToggled, todo.id) }), _jsx("span", { style: styles.todoText(todo.completed), children: todo.text }), _jsx("button", { style: styles.removeBtn, onClick: () => emit(TodoRemoved, todo.id), onMouseEnter: (e) => (e.currentTarget.style.color = '#e63946'), onMouseLeave: (e) => (e.currentTarget.style.color = '#ccc'), children: "\u00D7" })] }));
}
function TodoList() {
    const todos = useSignal(todoList);
    const filter = useSignal(activeFilter);
    const filtered = todos.filter((t) => {
        if (filter === 'active')
            return !t.completed;
        if (filter === 'completed')
            return t.completed;
        return true;
    });
    const remaining = todos.filter((t) => !t.completed).length;
    return (_jsxs("div", { children: [filtered.length === 0 ? (_jsx("div", { style: styles.empty, children: todos.length === 0 ? 'No todos yet. Add one above!' : 'No matching todos.' })) : (filtered.map((todo) => _jsx(TodoItem, { todo: todo }, todo.id))), _jsxs("div", { style: styles.footer, children: [remaining, " item", remaining !== 1 ? 's' : '', " remaining"] })] }));
}
// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
export default function App() {
    return (_jsxs("div", { style: styles.container, children: [_jsxs("div", { style: styles.header, children: [_jsx("h1", { style: styles.title, children: "Pulse Todos" }), _jsx("p", { style: styles.subtitle, children: "All state managed through Pulse events and signals" })] }), _jsx(TodoInput, {}), _jsx(FilterBar, {}), _jsx(TodoList, {})] }));
}

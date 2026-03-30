import { createEngine } from '@pulse/core';
// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------
export const engine = createEngine();
// ---------------------------------------------------------------------------
// Event declarations
// ---------------------------------------------------------------------------
export const TodoAdded = engine.event('TodoAdded');
export const TodoRemoved = engine.event('TodoRemoved');
export const TodoToggled = engine.event('TodoToggled');
export const TodoTextChanged = engine.event('TodoTextChanged');
export const ValidationResultEvent = engine.event('ValidationResult');
export const FilterChanged = engine.event('FilterChanged');
// ---------------------------------------------------------------------------
// Pipes
// ---------------------------------------------------------------------------
// Validate text input: non-empty and minimum length of 3
engine.pipe(TodoTextChanged, ValidationResultEvent, (text) => {
    if (text.trim().length === 0) {
        return { valid: false, error: null }; // empty is not an error, just not valid
    }
    if (text.trim().length < 3) {
        return { valid: false, error: 'Todo must be at least 3 characters' };
    }
    return { valid: true, error: null };
});
// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------
// The todo list, reduced from add/remove/toggle events
export const todoList = engine.signal(TodoAdded, [], (prev, todo) => [
    ...prev,
    todo,
]);
// Also update todoList on remove
engine.signalUpdate(todoList, TodoRemoved, (prev, id) => prev.filter((t) => t.id !== id));
// Also update todoList on toggle
engine.signalUpdate(todoList, TodoToggled, (prev, id) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
// Active filter
export const activeFilter = engine.signal(FilterChanged, 'all', (_prev, filter) => filter);
// Current input text
export const currentText = engine.signal(TodoTextChanged, '', (_prev, text) => text);
// Validation state
export const validationError = engine.signal(ValidationResultEvent, { valid: false, error: null }, (_prev, result) => result);

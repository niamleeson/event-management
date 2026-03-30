import { createEngine, createSignal } from '@pulse/core';
// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------
export const engine = createEngine();
// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
export const localUser = {
    id: 'local',
    name: 'You',
    color: '#4361ee',
    avatar: 'Y',
};
export const botUsers = [
    { id: 'bot-alice', name: 'Alice', color: '#e91e63', avatar: 'A' },
    { id: 'bot-bob', name: 'Bob', color: '#ff9800', avatar: 'B' },
];
export const allUsers = [localUser, ...botUsers];
// ---------------------------------------------------------------------------
// Event declarations
// ---------------------------------------------------------------------------
export const LocalEdit = engine.event('LocalEdit');
export const RemoteEdit = engine.event('RemoteEdit');
export const CursorMoved = engine.event('CursorMoved');
export const UserJoined = engine.event('UserJoined');
export const UserLeft = engine.event('UserLeft');
export const ConflictDetected = engine.event('ConflictDetected');
export const ConflictResolved = engine.event('ConflictResolved');
export const DocumentChanged = engine.event('DocumentChanged');
export const HistoryAdded = engine.event('HistoryAdded');
// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------
const initialText = 'Welcome to the Pulse Collaborative Editor!\n\n' +
    'This document is being edited by multiple users simultaneously.\n' +
    'You can see their cursors moving in real-time.\n\n' +
    'Try typing below and watch Alice and Bob make their edits too.\n';
export const document = engine.signal(DocumentChanged, initialText, (_prev, text) => text);
export const cursors = engine.signal(CursorMoved, new Map([
    ['local', initialText.length],
    ['bot-alice', 50],
    ['bot-bob', 120],
]), (prev, payload) => {
    const next = new Map(prev);
    next.set(payload.user, payload.pos);
    return next;
});
export const activeUsers = engine.signal(UserJoined, allUsers, (prev, user) => prev.find(u => u.id === user.id) ? prev : [...prev, user]);
engine.signalUpdate(activeUsers, UserLeft, (prev, id) => prev.filter(u => u.id !== id));
export const editHistory = engine.signal(HistoryAdded, [], (prev, entry) => [entry, ...prev].slice(0, 50));
export const hasConflict = engine.signal(ConflictDetected, false, () => true);
engine.signalUpdate(hasConflict, ConflictResolved, () => false);
// Signal for spring-driven cursor position (one per user)
export const cursorSpringTargets = new Map();
for (const user of allUsers) {
    const initial = user.id === 'local' ? initialText.length : user.id === 'bot-alice' ? 50 : 120;
    const sig = createSignal(initial);
    cursorSpringTargets.set(user.id, sig);
}
// ---------------------------------------------------------------------------
// Pipes: LocalEdit -> DocumentChanged
// ---------------------------------------------------------------------------
engine.on(LocalEdit, (payload) => {
    const doc = document.value;
    let newDoc;
    if (payload.type === 'insert') {
        newDoc = doc.slice(0, payload.pos) + payload.text + doc.slice(payload.pos);
    }
    else {
        const deleteLen = payload.text.length;
        newDoc = doc.slice(0, Math.max(0, payload.pos - deleteLen)) + doc.slice(payload.pos);
    }
    engine.emit(DocumentChanged, newDoc);
    // Update local cursor
    const newPos = payload.type === 'insert'
        ? payload.pos + payload.text.length
        : Math.max(0, payload.pos - payload.text.length);
    engine.emit(CursorMoved, { user: 'local', pos: newPos });
    // Update spring target
    const target = cursorSpringTargets.get('local');
    if (target)
        target._set(newPos);
    // Add to history
    engine.emit(HistoryAdded, {
        id: crypto.randomUUID(),
        user: 'You',
        type: payload.type,
        text: payload.text.length > 20 ? payload.text.slice(0, 20) + '...' : payload.text,
        pos: payload.pos,
        timestamp: Date.now(),
    });
});
// Remote edits
engine.on(RemoteEdit, (payload) => {
    const doc = document.value;
    let newDoc;
    // Check for conflict (remote edit near local cursor)
    const localCursorPos = cursors.value.get('local') ?? 0;
    if (Math.abs(payload.pos - localCursorPos) < 5) {
        engine.emit(ConflictDetected, undefined);
        setTimeout(() => engine.emit(ConflictResolved, undefined), 1000);
    }
    if (payload.type === 'insert') {
        newDoc = doc.slice(0, payload.pos) + payload.text + doc.slice(payload.pos);
    }
    else {
        const deleteLen = payload.text.length;
        newDoc = doc.slice(0, Math.max(0, payload.pos - deleteLen)) + doc.slice(payload.pos);
    }
    engine.emit(DocumentChanged, newDoc);
    // Update remote cursor
    const newPos = payload.type === 'insert'
        ? payload.pos + payload.text.length
        : Math.max(0, payload.pos - payload.text.length);
    engine.emit(CursorMoved, { user: payload.user, pos: newPos });
    const target = cursorSpringTargets.get(payload.user);
    if (target)
        target._set(newPos);
    // History
    const userName = allUsers.find(u => u.id === payload.user)?.name ?? payload.user;
    engine.emit(HistoryAdded, {
        id: crypto.randomUUID(),
        user: userName,
        type: payload.type,
        text: payload.text.length > 20 ? payload.text.slice(0, 20) + '...' : payload.text,
        pos: payload.pos,
        timestamp: Date.now(),
    });
});
// ---------------------------------------------------------------------------
// Bot simulation: random edits every 2-5 seconds
// ---------------------------------------------------------------------------
const botPhrases = [
    'Hello! ',
    'Nice work. ',
    'I agree. ',
    'TODO: fix this. ',
    'Updated. ',
    'Looks good! ',
    'Reviewing... ',
    'Changed! ',
    'Done. ',
    'See above. ',
];
function simulateBot(botId) {
    const interval = 2000 + Math.random() * 3000;
    setTimeout(() => {
        const doc = document.value;
        if (doc.length === 0) {
            simulateBot(botId);
            return;
        }
        const action = Math.random();
        if (action < 0.7) {
            // Insert
            const pos = Math.floor(Math.random() * doc.length);
            const text = botPhrases[Math.floor(Math.random() * botPhrases.length)];
            engine.emit(RemoteEdit, { user: botId, pos, text, type: 'insert' });
        }
        else {
            // Delete (1-5 chars)
            const pos = Math.min(doc.length, Math.floor(Math.random() * doc.length) + 3);
            const len = Math.min(pos, 1 + Math.floor(Math.random() * 4));
            const text = doc.slice(pos - len, pos);
            engine.emit(RemoteEdit, { user: botId, pos, text, type: 'delete' });
        }
        simulateBot(botId);
    }, interval);
}
// Start bots
simulateBot('bot-alice');
simulateBot('bot-bob');
// Start frame loop for springs
engine.startFrameLoop();

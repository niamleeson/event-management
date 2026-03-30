import { createEngine } from '@pulse/core';
// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------
export const engine = createEngine();
// ---------------------------------------------------------------------------
// Initial data
// ---------------------------------------------------------------------------
const INITIAL_CARDS = [
    { id: 'card-1', title: 'Design system audit', description: 'Review and update component library', column: 'todo', priority: 'high' },
    { id: 'card-2', title: 'API rate limiting', description: 'Implement rate limiting middleware', column: 'todo', priority: 'medium' },
    { id: 'card-3', title: 'User onboarding flow', description: 'Create multi-step wizard', column: 'todo', priority: 'low' },
    { id: 'card-4', title: 'Database migration', description: 'Migrate user table schema', column: 'in-progress', priority: 'high' },
    { id: 'card-5', title: 'Search indexing', description: 'Set up Elasticsearch pipeline', column: 'in-progress', priority: 'medium' },
    { id: 'card-6', title: 'CI/CD pipeline', description: 'Configure GitHub Actions', column: 'done', priority: 'low' },
];
// ---------------------------------------------------------------------------
// Event declarations
// ---------------------------------------------------------------------------
export const DragStart = engine.event('DragStart');
export const DragMove = engine.event('DragMove');
export const DragEnd = engine.event('DragEnd');
export const DropTarget = engine.event('DropTarget');
export const CardMoved = engine.event('CardMoved');
export const SavePending = engine.event('SavePending');
export const SaveDone = engine.event('SaveDone');
export const SaveError = engine.event('SaveError');
export const SaveRetry = engine.event('SaveRetry');
export const AnimationComplete = engine.event('AnimationComplete');
export const CardSettled = engine.event('CardSettled');
export const UndoRequested = engine.event('UndoRequested');
export const UndoComplete = engine.event('UndoComplete');
// Status animation events
export const FlashSuccess = engine.event('FlashSuccess');
export const FlashSuccessDone = engine.event('FlashSuccessDone');
export const ShakeError = engine.event('ShakeError');
export const ShakeErrorDone = engine.event('ShakeErrorDone');
// ---------------------------------------------------------------------------
// Pipes
// ---------------------------------------------------------------------------
// DragEnd checks the last known position to determine drop target column
// We handle this in the UI layer since it needs DOM measurements
// CardMoved triggers async save
engine.pipe(CardMoved, SavePending, (move) => move.cardId);
// SaveDone -> success flash animation
engine.pipe(SaveDone, FlashSuccess, (result) => result.cardId);
// SaveError -> error shake animation + auto-retry after 2s
engine.on(SaveError, (result) => {
    engine.emit(ShakeError, result.cardId);
    // Auto-retry after 2 seconds
    setTimeout(() => {
        engine.emit(SaveRetry, result.cardId);
    }, 2000);
});
// ---------------------------------------------------------------------------
// Async: save card move to API (mock with random failures)
// ---------------------------------------------------------------------------
engine.async(CardMoved, {
    pending: null,
    done: SaveDone,
    error: SaveError,
    strategy: 'latest',
    do: async (move, { signal }) => {
        await new Promise((resolve, reject) => {
            const timer = setTimeout(resolve, 800 + Math.random() * 400);
            signal.addEventListener('abort', () => {
                clearTimeout(timer);
                reject(new DOMException('Aborted', 'AbortError'));
            });
        });
        // 30% chance of failure for demo purposes
        if (Math.random() < 0.3) {
            throw { cardId: move.cardId, success: false };
        }
        return { cardId: move.cardId, success: true };
    },
});
// Retry save: re-emit the move for the card that failed
engine.on(SaveRetry, (cardId) => {
    const card = cards.value.find((c) => c.id === cardId);
    if (card) {
        engine.emit(CardMoved, {
            cardId,
            fromColumn: card.column,
            toColumn: card.column,
        });
    }
});
// ---------------------------------------------------------------------------
// Join: [SaveDone, AnimationComplete] -> CardSettled
// Card is fully settled only after both save completes AND animation finishes
// ---------------------------------------------------------------------------
engine.join([SaveDone, FlashSuccessDone], CardSettled, {
    do: (saveResult) => saveResult.cardId,
});
// ---------------------------------------------------------------------------
// Undo: reverse a move
// ---------------------------------------------------------------------------
// Track previous positions for undo
const undoHistory = new Map();
engine.on(CardMoved, (move) => {
    undoHistory.set(move.cardId, move);
});
engine.on(UndoRequested, (cardId) => {
    const lastMove = undoHistory.get(cardId);
    if (lastMove) {
        const reverseMove = {
            cardId,
            fromColumn: lastMove.toColumn,
            toColumn: lastMove.fromColumn,
        };
        undoHistory.delete(cardId);
        engine.emit(UndoComplete, reverseMove);
        // The signal update for UndoComplete will move the card back
        // Then trigger a new save
        engine.emit(CardMoved, reverseMove);
    }
});
// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------
export const cards = engine.signal(CardMoved, INITIAL_CARDS, (prev, move) => prev.map((c) => (c.id === move.cardId ? { ...c, column: move.toColumn } : c)));
// Also handle undo reversals
engine.signalUpdate(cards, UndoComplete, (prev, move) => prev.map((c) => (c.id === move.cardId ? { ...c, column: move.toColumn } : c)));
// Drag state
export const dragState = engine.signal(DragStart, null, (_prev, info) => info);
engine.signalUpdate(dragState, DragEnd, () => null);
// Drag position
export const dragPosition = engine.signal(DragMove, { x: 0, y: 0 }, (_prev, pos) => pos);
engine.signalUpdate(dragPosition, DragStart, (_prev, info) => ({
    x: info.startX,
    y: info.startY,
}));
// Card statuses
export const cardStatuses = engine.signal(SavePending, {}, (prev, cardId) => ({ ...prev, [cardId]: 'saving' }));
engine.signalUpdate(cardStatuses, SaveDone, (prev, result) => ({
    ...prev,
    [result.cardId]: 'saved',
}));
engine.signalUpdate(cardStatuses, SaveError, (prev, result) => ({
    ...prev,
    [result.cardId]: 'error',
}));
engine.signalUpdate(cardStatuses, CardSettled, (prev, cardId) => ({
    ...prev,
    [cardId]: 'settled',
}));
// Spring-driven drag position for smooth feel
export const dragSpringX = engine.spring((() => {
    const sig = engine.signal(DragMove, 0, (_prev, pos) => pos.x);
    engine.signalUpdate(sig, DragStart, (_prev, info) => info.startX);
    return sig;
})(), { stiffness: 400, damping: 25, restThreshold: 0.5 });
export const dragSpringY = engine.spring((() => {
    const sig = engine.signal(DragMove, 0, (_prev, pos) => pos.y);
    engine.signalUpdate(sig, DragStart, (_prev, info) => info.startY);
    return sig;
})(), { stiffness: 400, damping: 25, restThreshold: 0.5 });
// Start frame loop for spring animations
engine.startFrameLoop();

import { createEngine, createSignal } from '@pulse/core';
// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------
export const engine = createEngine();
// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const categoryColors = {
    'Planning': '#4361ee',
    'Design': '#e91e63',
    'Development': '#4caf50',
    'Testing': '#ff9800',
    'Deployment': '#9c27b0',
};
export const PROJECT_START = new Date(2026, 0, 5); // Jan 5, 2026
export function dayToDate(day) {
    const d = new Date(PROJECT_START);
    d.setDate(d.getDate() + day);
    return d;
}
export function formatDate(day) {
    const d = dayToDate(day);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}`;
}
// ---------------------------------------------------------------------------
// Sample tasks
// ---------------------------------------------------------------------------
const initialTasks = [
    { id: 't1', title: 'Project Kickoff', category: 'Planning', start: 0, duration: 3, dependencies: [], color: categoryColors['Planning'] },
    { id: 't2', title: 'Requirements Gathering', category: 'Planning', start: 3, duration: 5, dependencies: ['t1'], color: categoryColors['Planning'] },
    { id: 't3', title: 'UI/UX Design', category: 'Design', start: 8, duration: 7, dependencies: ['t2'], color: categoryColors['Design'] },
    { id: 't4', title: 'Architecture Design', category: 'Design', start: 8, duration: 5, dependencies: ['t2'], color: categoryColors['Design'] },
    { id: 't5', title: 'Frontend Development', category: 'Development', start: 15, duration: 14, dependencies: ['t3'], color: categoryColors['Development'] },
    { id: 't6', title: 'Backend Development', category: 'Development', start: 13, duration: 16, dependencies: ['t4'], color: categoryColors['Development'] },
    { id: 't7', title: 'API Integration', category: 'Development', start: 29, duration: 5, dependencies: ['t5', 't6'], color: categoryColors['Development'] },
    { id: 't8', title: 'Unit Testing', category: 'Testing', start: 29, duration: 7, dependencies: ['t5'], color: categoryColors['Testing'] },
    { id: 't9', title: 'Integration Testing', category: 'Testing', start: 34, duration: 5, dependencies: ['t7', 't8'], color: categoryColors['Testing'] },
    { id: 't10', title: 'Deployment & Launch', category: 'Deployment', start: 39, duration: 3, dependencies: ['t9'], color: categoryColors['Deployment'] },
];
// ---------------------------------------------------------------------------
// Event declarations
// ---------------------------------------------------------------------------
export const TaskDragStart = engine.event('TaskDragStart');
export const TaskDragMove = engine.event('TaskDragMove');
export const TaskDragEnd = engine.event('TaskDragEnd');
export const TaskCreated = engine.event('TaskCreated');
export const TaskUpdated = engine.event('TaskUpdated');
export const DependencyAdded = engine.event('DependencyAdded');
export const ViewChanged = engine.event('ViewChanged');
export const ZoomChanged = engine.event('ZoomChanged');
export const TasksRecomputed = engine.event('TasksRecomputed');
export const DragSnap = engine.event('DragSnap');
export const DragSnapDone = engine.event('DragSnapDone');
// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------
export const tasks = engine.signal(TasksRecomputed, initialTasks, (_prev, next) => next);
engine.signalUpdate(tasks, TaskCreated, (prev, task) => [...prev, task]);
export const view = engine.signal(ViewChanged, { start: -2, end: 50 }, (_prev, range) => range);
export const zoom = engine.signal(ZoomChanged, 'day', (_prev, level) => level);
export const dragState = engine.signal(TaskDragStart, { taskId: null, type: null, startX: 0, originalStart: 0, originalDuration: 0 }, (prev, payload) => {
    const task = tasks.value.find(t => t.id === payload.id);
    if (!task)
        return prev;
    return {
        taskId: payload.id,
        type: payload.type,
        startX: 0,
        originalStart: task.start,
        originalDuration: task.duration,
    };
});
engine.signalUpdate(dragState, TaskDragEnd, () => ({
    taskId: null,
    type: null,
    startX: 0,
    originalStart: 0,
    originalDuration: 0,
}));
// Spring signal for snap animation
export const snapTarget = createSignal(0);
export const snapSpring = engine.spring(snapTarget, {
    stiffness: 300,
    damping: 30,
});
// ---------------------------------------------------------------------------
// Cascade dependencies when a task moves
// ---------------------------------------------------------------------------
function cascadeDependencies(taskList, movedTaskId) {
    const result = taskList.map(t => ({ ...t }));
    const taskMap = new Map(result.map(t => [t.id, t]));
    // BFS from moved task through dependents
    const visited = new Set();
    const queue = [movedTaskId];
    while (queue.length > 0) {
        const currentId = queue.shift();
        if (visited.has(currentId))
            continue;
        visited.add(currentId);
        const current = taskMap.get(currentId);
        if (!current)
            continue;
        // Find tasks that depend on current
        for (const task of result) {
            if (task.dependencies.includes(currentId)) {
                const depEnd = current.start + current.duration;
                if (task.start < depEnd) {
                    task.start = depEnd;
                }
                queue.push(task.id);
            }
        }
    }
    return result;
}
// ---------------------------------------------------------------------------
// Drag handling
// ---------------------------------------------------------------------------
engine.on(TaskDragMove, (payload) => {
    const state = dragState.value;
    if (!state.taskId || state.taskId !== payload.id)
        return;
    const currentTasks = tasks.value;
    const task = currentTasks.find(t => t.id === payload.id);
    if (!task)
        return;
    // Convert dx (pixels) to days based on zoom
    const zoomLevel = zoom.value;
    const dayWidth = zoomLevel === 'day' ? 40 : zoomLevel === 'week' ? 20 : 8;
    const dayDelta = Math.round(payload.dx / dayWidth);
    let updated;
    if (state.type === 'move') {
        const newStart = Math.max(0, state.originalStart + dayDelta);
        updated = { ...task, start: newStart };
    }
    else {
        // Resize
        const newDuration = Math.max(1, state.originalDuration + dayDelta);
        updated = { ...task, duration: newDuration };
    }
    // Update the single task
    let newTasks = currentTasks.map(t => t.id === payload.id ? updated : t);
    // Cascade dependencies
    newTasks = cascadeDependencies(newTasks, payload.id);
    engine.emit(TasksRecomputed, newTasks);
});
engine.on(TaskDragEnd, (payload) => {
    // Snap to grid
    const currentTasks = tasks.value;
    const task = currentTasks.find(t => t.id === payload.id);
    if (task) {
        snapTarget._set(task.start);
        engine.emit(DragSnap, undefined);
    }
});
engine.on(TaskUpdated, (updated) => {
    let newTasks = tasks.value.map(t => t.id === updated.id ? updated : t);
    newTasks = cascadeDependencies(newTasks, updated.id);
    engine.emit(TasksRecomputed, newTasks);
});
// Start frame loop for springs
engine.startFrameLoop();
// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
export { categoryColors };

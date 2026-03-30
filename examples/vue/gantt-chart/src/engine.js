import { createEngine } from '@pulse/core';
export const engine = createEngine();
/* ------------------------------------------------------------------ */
/*  Events                                                            */
/* ------------------------------------------------------------------ */
export const TaskMoved = engine.event('TaskMoved');
export const TaskResized = engine.event('TaskResized');
export const ZoomChanged = engine.event('ZoomChanged');
export const TasksUpdated = engine.event('TasksUpdated');
/* ------------------------------------------------------------------ */
/*  Initial tasks                                                     */
/* ------------------------------------------------------------------ */
const INITIAL_TASKS = [
    { id: 1, name: 'Research', start: 0, duration: 5, color: '#6c5ce7', dependsOn: [] },
    { id: 2, name: 'Design', start: 5, duration: 7, color: '#00b894', dependsOn: [1] },
    { id: 3, name: 'Frontend', start: 12, duration: 10, color: '#0984e3', dependsOn: [2] },
    { id: 4, name: 'Backend', start: 12, duration: 12, color: '#e17055', dependsOn: [2] },
    { id: 5, name: 'Database', start: 10, duration: 6, color: '#fdcb6e', dependsOn: [2] },
    { id: 6, name: 'Testing', start: 24, duration: 5, color: '#d63031', dependsOn: [3, 4] },
    { id: 7, name: 'Documentation', start: 22, duration: 8, color: '#00cec9', dependsOn: [3] },
    { id: 8, name: 'Deployment', start: 29, duration: 3, color: '#a29bfe', dependsOn: [6] },
    { id: 9, name: 'Training', start: 30, duration: 4, color: '#f368e0', dependsOn: [7] },
    { id: 10, name: 'Launch', start: 32, duration: 2, color: '#ff9f43', dependsOn: [8, 9] },
];
/* ------------------------------------------------------------------ */
/*  Signals                                                           */
/* ------------------------------------------------------------------ */
export const tasks = engine.signal(TasksUpdated, INITIAL_TASKS, (_prev, updated) => updated);
export const zoom = engine.signal(ZoomChanged, 'day', (_prev, z) => z);
/* ------------------------------------------------------------------ */
/*  Auto-shift dependents when a task is moved                        */
/* ------------------------------------------------------------------ */
function shiftDependents(taskList, movedId) {
    const result = taskList.map(t => ({ ...t }));
    const movedTask = result.find(t => t.id === movedId);
    const movedEnd = movedTask.start + movedTask.duration;
    // BFS through dependents
    const queue = [movedId];
    const visited = new Set();
    while (queue.length > 0) {
        const currentId = queue.shift();
        if (visited.has(currentId))
            continue;
        visited.add(currentId);
        const current = result.find(t => t.id === currentId);
        const currentEnd = current.start + current.duration;
        for (const dep of result) {
            if (dep.dependsOn.includes(currentId)) {
                const requiredStart = currentEnd;
                if (dep.start < requiredStart) {
                    dep.start = requiredStart;
                }
                queue.push(dep.id);
            }
        }
    }
    return result;
}
engine.on(TaskMoved, ({ id, newStart }) => {
    let updated = tasks.value.map(t => t.id === id ? { ...t, start: Math.max(0, newStart) } : { ...t });
    updated = shiftDependents(updated, id);
    engine.emit(TasksUpdated, updated);
});
engine.on(TaskResized, ({ id, newDuration }) => {
    let updated = tasks.value.map(t => t.id === id ? { ...t, duration: Math.max(1, newDuration) } : { ...t });
    updated = shiftDependents(updated, id);
    engine.emit(TasksUpdated, updated);
});
/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
export const TOTAL_DAYS = 40;
export function dayWidth(z) {
    switch (z) {
        case 'day': return 30;
        case 'week': return 12;
        case 'month': return 4;
    }
}

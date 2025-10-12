# Engagement-Based Time Tracking - Implementation Status

## Completed ✅

### 1. Domain Model (Task Entity)
- ✅ Removed `blocks` array - each task is now a single work session
- ✅ Removed `projectTag` field
- ✅ Renamed `title` to `name`
- ✅ Renamed `startedAt` to `startTime`, `endedAt` to `endTime`
- ✅ Removed `completedAt` - completion is implicit (engage with Idle)
- ✅ Using `dayjs` for all timestamps
- ✅ Added `IDLE_TASK_NAME` constant
- ✅ Added helper methods: `isActive`, `actualDuration`, `isIdle`

### 2. Task Service
- ✅ Added `engage(taskName: string)` - core engagement method
- ✅ Tracks `checkedAt` in memory for midpoint calculation
- ✅ Implements midpoint calculation on task switches
- ✅ Creates new task instances for each work session
- ✅ Added `ensureIdleTaskExists()` for initialization
- ✅ Removed old `startTask` and `completeTask` methods

### 3. Repository Layer
- ✅ Updated `ITaskRepository` interface - removed `findByStatus` and `findByProjectTag`
- ✅ Updated `TaskRepository` implementation
- ✅ Fixed TypeScript types for PouchDB integration

### 4. React Hook (useTaskService)
- ✅ Updated to use engagement-based API
- ✅ Added `engage(taskName)` function
- ✅ Added `currentTask` state
- ✅ Added helper functions: `getUniqueTaskNames`, `getTaskSessions`, `getTotalDuration`
- ✅ Initializes Idle task on app start

## Remaining Work 🔨

### 5. UI Components (Need Updates)

#### TaskList Component
**Current issues:**
- Uses `task.title` → should be `task.name`
- Uses `task.status` → no longer exists
- Uses `task.projectTag` → removed
- Has "Start" button → should be "Engage" or "Work on this"
- Filters by status → need new approach

**Required changes:**
1. Display unique task names (not individual sessions)
2. Show total duration across all sessions for each name
3. Replace "Start" with "Engage" button
4. Show Idle task prominently at top
5. Highlight currently active task
6. Remove status-based filtering or create new logic

#### TaskItem Component
**Current issues:**
- References `task.title`, `task.status`, `task.projectTag`
- Has Start/Complete buttons

**Required changes:**
1. Update all field references to new names
2. Replace buttons with single "Engage" button
3. Show if task is currently active
4. Display session count if multiple sessions exist

#### TaskTimer Component
**Current issues:**
- Uses `task.status`, `task.startedAt`

**Required changes:**
1. Use `task.isActive` instead of status check
2. Use `task.startTime` instead of `startedAt`
3. Calculate elapsed time from `startTime` to now

#### App.tsx
**Needs check:**
- Verify it works with new hook API
- May need updates for engagement-based flow

## Data Model Summary

### Before (Old Model)
```typescript
interface Task {
  id: string;
  title: string;
  projectTag?: string;
  estimatedDuration: number;
  startedAt?: Date;
  completedAt?: Date;
}
```

### After (New Model)
```typescript
interface Task {
  id: string;              // Unique per work session
  name: string;            // Task name (can repeat across sessions)
  estimatedDuration: number;
  startTime: Dayjs;        // Session start
  endTime: Dayjs | null;   // Session end (null = active)
}
```

## Key Concepts

### Multiple Sessions
- Same task name can have multiple task entries (sessions)
- Example: "Write report" at 10:00-11:00, then again at 14:00-15:00 = 2 tasks with same name

### Engagement Flow
1. User clicks "Write report" → `engage("Write report")`
2. If no current task → create new task, set startTime = now
3. If same task → just update checkedAt
4. If different task → calculate midpoint, end previous, start new

### Idle Task
- Special task named "Idle"
- Created automatically on init
- Engaging with Idle after another task implicitly completes that task

### Midpoint Calculation
```
Last engagement: 10:30
Current time: 11:00
Midpoint: 10:45

Previous task ends at 10:45
New task starts at 10:45
```

## Next Steps

1. **Update TaskList.tsx** - Main list view with engagement buttons
2. **Update TaskItem.tsx** - Individual task display
3. **Update TaskTimer.tsx** - Timer for active task
4. **Update App.tsx** - Main app component
5. **Test end-to-end** - Verify engagement flow works
6. **UI Polish** - Improve styling for active/idle states

## Testing Checklist

- [ ] Can engage with a task (creates new session)
- [ ] Can engage with same task (updates checkedAt only)
- [ ] Can switch tasks (midpoint calculation works)
- [ ] Can engage with Idle (previous task ends)
- [ ] Multiple sessions show correct total duration
- [ ] Active task is visually highlighted
- [ ] Idle task is always visible
- [ ] Timer shows correct elapsed time
- [ ] Data persists in PouchDB correctly
- [ ] Page reload restores state correctly

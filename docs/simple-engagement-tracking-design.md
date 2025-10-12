# Simple Engagement-Based Time Tracking Model

## Overview

Track only the current active task and last engagement time. When switching tasks, calculate the midpoint between last engagement and current time to determine when the switch actually happened.

## Core Concept

- **No engagement events stored in database**
- **Only track**: Current task ID + Last engagement timestamp
- **On task switch**: Calculate midpoint and update both tasks' times

## Data Model Changes

### Task Entity (Minimal Changes)

```typescript
// Task stays mostly the same
interface Task {
  id: string;
  title: string;
  projectTag?: string | null;
  estimatedDuration: number; // minutes

  // Keep existing timing fields
  startedAt?: Date | null;
  completedAt?: Date | null;
}
```

### Application State (New)

```typescript
// In-memory tracking state (React state or service state)
interface EngagementState {
  currentTaskId: string | null;
  lastEngagementTime: Date | null;

  // Optional: for better UX
  lastSwitchTime?: Date;
  isStale?: boolean; // true if no engagement for > X minutes
}
```

## Implementation Logic

### Core Service Changes

```typescript
class TaskService {
  // In-memory state
  private engagementState: EngagementState = {
    currentTaskId: null,
    lastEngagementTime: null
  };

  /**
   * Engage with a task (replaces startTask)
   * This is called when user clicks on a task
   */
  async engageTask(taskId: string): Promise<void> {
    const now = new Date();

    // Case 1: No current task (first engagement)
    if (!this.engagementState.currentTaskId) {
      const task = await this.repository.findById(taskId);
      if (!task.startedAt) {
        task.startedAt = now;
        await this.repository.update(task);
      }

      this.engagementState = {
        currentTaskId: taskId,
        lastEngagementTime: now
      };
      return;
    }

    // Case 2: Same task (update engagement time)
    if (this.engagementState.currentTaskId === taskId) {
      this.engagementState.lastEngagementTime = now;
      return;
    }

    // Case 3: Different task (task switch)
    if (this.engagementState.currentTaskId !== taskId) {
      await this.handleTaskSwitch(taskId, now);
    }
  }

  /**
   * Handle task switch with midpoint calculation
   */
  private async handleTaskSwitch(newTaskId: string, now: Date): Promise<void> {
    const previousTaskId = this.engagementState.currentTaskId;
    const lastEngagement = this.engagementState.lastEngagementTime;

    if (!previousTaskId || !lastEngagement) return;

    // Calculate midpoint between last engagement and now
    const midpoint = new Date(
      (lastEngagement.getTime() + now.getTime()) / 2
    );

    // Update previous task's end time
    const previousTask = await this.repository.findById(previousTaskId);
    if (previousTask && !previousTask.completedAt) {
      // Don't update if already completed
      // This is just ending the current work session
      // Task remains IN_PROGRESS unless explicitly completed
      // Store this as a "pause" rather than completion

      // Option A: Add a new field for last worked time
      // previousTask.lastWorkedAt = midpoint;

      // Option B: Keep it simple - task is either in progress or completed
      // We might need work sessions for this
    }

    // Start new task
    const newTask = await this.repository.findById(newTaskId);
    if (!newTask.startedAt) {
      newTask.startedAt = midpoint;
      await this.repository.update(newTask);
    }

    // Update state
    this.engagementState = {
      currentTaskId: newTaskId,
      lastEngagementTime: now,
      lastSwitchTime: midpoint
    };
  }

  /**
   * Explicitly complete a task
   */
  async completeTask(taskId: string): Promise<Task> {
    const task = await this.repository.findById(taskId);

    if (this.engagementState.currentTaskId === taskId) {
      // If this is the current task, use last engagement time
      task.completedAt = this.engagementState.lastEngagementTime || new Date();

      // Clear engagement state
      this.engagementState = {
        currentTaskId: null,
        lastEngagementTime: null
      };
    } else {
      // If not current, just mark as completed now
      task.completedAt = new Date();
    }

    return await this.repository.update(task);
  }

  /**
   * Get current engagement state (for UI)
   */
  getEngagementState(): EngagementState {
    return { ...this.engagementState };
  }

  /**
   * Check if current engagement is stale
   */
  isEngagementStale(thresholdMinutes: number = 30): boolean {
    if (!this.engagementState.lastEngagementTime) return true;

    const elapsed = Date.now() - this.engagementState.lastEngagementTime.getTime();
    return elapsed > thresholdMinutes * 60 * 1000;
  }
}
```

## Handling Work Sessions

Since tasks can be worked on multiple times, we need to track work sessions:

### Option 1: Simple (Single Session)
- Each task has one start time and one end time
- Resuming work doesn't create new sessions
- Total time = completedAt - startedAt

### Option 2: Work Sessions (Recommended)

```typescript
interface WorkSession {
  taskId: string;
  startedAt: Date;
  endedAt: Date | null;
  duration?: number; // computed
}

interface Task {
  id: string;
  title: string;
  // ... other fields

  sessions: WorkSession[]; // Track multiple work sessions

  // Computed
  get totalDuration(): number {
    return this.sessions.reduce((sum, s) => {
      if (s.endedAt) {
        return sum + (s.endedAt.getTime() - s.startedAt.getTime()) / 60000;
      }
      return sum;
    }, 0);
  }
}
```

## Simplified Algorithm with Sessions

```typescript
class SimpleEngagementService {
  private currentSession: {
    taskId: string;
    startedAt: Date;
    lastEngagement: Date;
  } | null = null;

  /**
   * User engages with a task
   */
  async engage(taskId: string): Promise<void> {
    const now = new Date();

    // Same task - just update engagement
    if (this.currentSession?.taskId === taskId) {
      this.currentSession.lastEngagement = now;
      return;
    }

    // Different task - handle switch
    if (this.currentSession) {
      // Calculate midpoint for session end
      const midpoint = new Date(
        (this.currentSession.lastEngagement.getTime() + now.getTime()) / 2
      );

      // End current session
      await this.endSession(this.currentSession.taskId, midpoint);

      // Start new session from midpoint
      await this.startSession(taskId, midpoint);
    } else {
      // No current session - start new
      await this.startSession(taskId, now);
    }

    // Update current session
    this.currentSession = {
      taskId,
      startedAt: now,
      lastEngagement: now
    };
  }

  private async startSession(taskId: string, time: Date): Promise<void> {
    const task = await this.repository.findById(taskId);

    // Add new session
    task.sessions.push({
      taskId,
      startedAt: time,
      endedAt: null
    });

    await this.repository.update(task);
  }

  private async endSession(taskId: string, time: Date): Promise<void> {
    const task = await this.repository.findById(taskId);

    // Find and close open session
    const openSession = task.sessions.find(s => !s.endedAt);
    if (openSession) {
      openSession.endedAt = time;
      await this.repository.update(task);
    }
  }

  async completeTask(taskId: string): Promise<void> {
    // End any open session
    if (this.currentSession?.taskId === taskId) {
      await this.endSession(taskId, this.currentSession.lastEngagement);
      this.currentSession = null;
    }

    // Mark task as completed
    const task = await this.repository.findById(taskId);
    task.completedAt = new Date();
    await this.repository.update(task);
  }
}
```

## UI Changes

### Current UI
```typescript
// Current: Explicit start/stop
<button onClick={() => startTask(task.id)}>Start</button>
<button onClick={() => completeTask(task.id)}>Complete</button>
```

### New UI
```typescript
// New: Engagement-based
function TaskItem({ task }) {
  const { engagementState } = useTaskService();
  const isActive = engagementState.currentTaskId === task.id;
  const isStale = isActive && isEngagementStale(engagementState);

  return (
    <div className={isActive ? 'active-task' : ''}>
      <button
        onClick={() => engageTask(task.id)}
        className={isActive ? 'engaged' : 'not-engaged'}
      >
        {isActive
          ? (isStale ? '⚠️ Resume' : '✓ Working on this')
          : 'Work on this'
        }
      </button>

      {isActive && (
        <div>
          Active for: {calculateDuration(engagementState)}
          {isStale && <span> (idle)</span>}
        </div>
      )}

      <button onClick={() => completeTask(task.id)}>
        Mark Complete
      </button>
    </div>
  );
}
```

## Benefits of Simple Approach

1. **Minimal Database Changes**: Only add sessions if needed
2. **No Event Storage**: No engagement events to store/manage
3. **Simple State**: Just track current task + last engagement
4. **Easy to Understand**: Midpoint calculation is intuitive
5. **Backward Compatible**: Can keep existing task structure

## Implementation Steps

1. **Add engagement state to TaskService**
2. **Implement `engageTask` method**
3. **Update UI to use engagement instead of start/stop**
4. **Add visual feedback for active/stale tasks**
5. **Test midpoint calculation accuracy**
6. **Consider adding work sessions if needed**

## Example Flow

```
User Actions:
1:00 PM - Click Task A
          → Start Task A at 1:00 PM
          → State: currentTask=A, lastEngagement=1:00 PM

1:15 PM - Click Task A (still working)
          → Update: lastEngagement=1:15 PM

1:30 PM - Click Task A (still working)
          → Update: lastEngagement=1:30 PM

2:00 PM - Click Task B (switch task)
          → Calculate midpoint: (1:30 PM + 2:00 PM) / 2 = 1:45 PM
          → End Task A session at 1:45 PM
          → Start Task B session at 1:45 PM
          → State: currentTask=B, lastEngagement=2:00 PM

2:30 PM - Click "Complete" on Task B
          → Complete Task B at 2:30 PM (last engagement time)
          → State: currentTask=null, lastEngagement=null
```

## Configuration

```typescript
interface EngagementConfig {
  // Consider task stale after X minutes of no engagement
  staleThresholdMinutes: number; // default: 30

  // Auto-end session after X minutes of inactivity
  autoEndSessionMinutes: number | null; // default: null (don't auto-end)

  // Minimum time between engagements to update
  minEngagementIntervalMinutes: number; // default: 1
}
```

## Next Steps

1. Decide on session handling (single vs multiple sessions)
2. Update TaskService with engagement methods
3. Add React state management for engagement tracking
4. Update UI components for engagement-based interaction
5. Test with real usage patterns
6. Fine-tune stale detection and midpoint calculation
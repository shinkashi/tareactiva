/**
 * Task Domain Entity
 * Each task represents a single work session
 */

import dayjs, { Dayjs } from 'dayjs';

/**
 * Special task name for the Idle task
 */
export const IDLE_TASK_NAME = 'Idle';

export interface TaskData {
  id: string;
  name: string;
  estimatedDuration: number; // minutes
  startTime: Dayjs;
  endTime: Dayjs | null; // null = currently active
}

export class Task {
  readonly id: string;
  name: string;
  estimatedDuration: number; // minutes
  startTime: Dayjs;
  endTime: Dayjs | null;

  constructor(data: TaskData) {
    this.id = data.id;
    this.name = data.name;
    this.estimatedDuration = data.estimatedDuration;
    this.startTime = data.startTime;
    this.endTime = data.endTime;
  }

  /**
   * Check if this task is currently active (no end time)
   */
  get isActive(): boolean {
    return this.endTime === null;
  }

  /**
   * Calculate actual duration in minutes
   * Returns 0 if task is still active
   */
  get actualDuration(): number {
    if (!this.endTime) {
      return 0;
    }
    return this.endTime.diff(this.startTime, 'minute');
  }

  /**
   * Check if this is the Idle task
   */
  get isIdle(): boolean {
    return this.name === IDLE_TASK_NAME;
  }

  /**
   * End this task session
   * @param timestamp - End time
   */
  end(timestamp: Dayjs): void {
    if (this.endTime !== null) {
      throw new Error('Task session already ended');
    }
    this.endTime = timestamp;
  }

  /**
   * Convert to plain object for persistence
   */
  toJSON(): any {
    return {
      id: this.id,
      name: this.name,
      estimatedDuration: this.estimatedDuration,
      startTime: this.startTime.toISOString(),
      endTime: this.endTime ? this.endTime.toISOString() : null,
    };
  }

  /**
   * Create a Task from a plain object
   */
  static fromJSON(data: any): Task {
    return new Task({
      id: data.id,
      name: data.name,
      estimatedDuration: data.estimatedDuration,
      startTime: dayjs(data.startTime),
      endTime: data.endTime ? dayjs(data.endTime) : null,
    });
  }
}
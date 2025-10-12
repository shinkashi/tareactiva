/**
 * Task Service
 * Application layer service containing business logic for task management
 * Implements engagement-based time tracking
 */

import dayjs, { Dayjs } from 'dayjs';
import { Task, TaskData, IDLE_TASK_NAME } from '../domain/Task';
import { ITaskRepository } from '../domain/ITaskRepository';
import { ulid } from 'ulid';

export class TaskService {
  private checkedAt: Dayjs | null = null; // Last engagement time for current task

  constructor(private repository: ITaskRepository) {}

  /**
   * Engage with a task
   * This is the core action - user clicks on a task to work on it
   */
  async engage(taskName: string): Promise<Task> {
    const now = dayjs();
    const currentTask = await this.getCurrentTask();

    // Case 1: Same task - just update checkedAt
    if (currentTask && currentTask.name === taskName) {
      this.checkedAt = now;
      return currentTask;
    }

    // Case 2: Different task - handle switch
    if (currentTask) {
      // Calculate midpoint
      const midpoint = this.calculateMidpoint(this.checkedAt || currentTask.startTime, now);

      // End current task
      currentTask.end(midpoint);
      await this.repository.update(currentTask);

      // Start new task from midpoint
      const newTask = new Task({
        id: ulid(),
        name: taskName,
        estimatedDuration: 0, // TODO: Could suggest from history
        startTime: midpoint,
        endTime: null
      });

      this.checkedAt = now;
      return await this.repository.create(newTask);
    }

    // Case 3: No current task - start new
    const newTask = new Task({
      id: ulid(),
      name: taskName,
      estimatedDuration: 0,
      startTime: now,
      endTime: null
    });

    this.checkedAt = now;
    return await this.repository.create(newTask);
  }

  /**
   * Calculate midpoint between two times
   */
  private calculateMidpoint(time1: Dayjs, time2: Dayjs): Dayjs {
    const avg = (time1.valueOf() + time2.valueOf()) / 2;
    return dayjs(avg);
  }

  /**
   * Get the current active task (endTime is null)
   */
  async getCurrentTask(): Promise<Task | null> {
    const allTasks = await this.repository.findAll();
    return allTasks.find(task => task.isActive) || null;
  }

  /**
   * Get all tasks
   */
  async getAllTasks(): Promise<Task[]> {
    return await this.repository.findAll();
  }

  /**
   * Get task by ID
   */
  async getTaskById(taskId: string): Promise<Task | null> {
    return await this.repository.findById(taskId);
  }

  /**
   * Update task details (name, estimatedDuration)
   */
  async updateTask(
    taskId: string,
    updates: Partial<Pick<TaskData, 'name' | 'estimatedDuration'>>
  ): Promise<Task> {
    const task = await this.repository.findById(taskId);

    if (!task) {
      throw new Error(`Task with id ${taskId} not found`);
    }

    if (updates.name !== undefined) task.name = updates.name;
    if (updates.estimatedDuration !== undefined) task.estimatedDuration = updates.estimatedDuration;

    return await this.repository.update(task);
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string): Promise<void> {
    await this.repository.delete(taskId);
  }

  /**
   * Get last engagement time (for UI display)
   */
  getLastEngagementTime(): Dayjs | null {
    return this.checkedAt;
  }

  /**
   * Initialize Idle task if it doesn't exist
   * Note: This only creates ONE idle task when there are none
   */
  async ensureIdleTaskExists(): Promise<void> {
    const allTasks = await this.repository.findAll();
    const idleTasks = allTasks.filter(task => task.name === IDLE_TASK_NAME);

    // Only create if no idle tasks exist at all
    if (idleTasks.length === 0) {
      const idleTask = new Task({
        id: ulid(),
        name: IDLE_TASK_NAME,
        estimatedDuration: 0,
        startTime: dayjs(),
        endTime: dayjs() // Idle starts and ends immediately
      });
      await this.repository.create(idleTask);
    }
  }
}

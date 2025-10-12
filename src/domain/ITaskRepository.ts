/**
 * Task Repository Interface
 * Defines the contract for task persistence
 */

import { Task } from './Task';

export interface ITaskRepository {
  /**
   * Save a new task
   */
  create(task: Task): Promise<Task>;

  /**
   * Update an existing task
   */
  update(task: Task): Promise<Task>;

  /**
   * Delete a task by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Find a task by ID
   */
  findById(id: string): Promise<Task | null>;

  /**
   * Find all tasks
   */
  findAll(): Promise<Task[]>;
}
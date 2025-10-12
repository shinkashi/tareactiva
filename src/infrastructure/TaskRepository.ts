/**
 * Task Repository Implementation
 * PouchDB-based implementation of the ITaskRepository interface
 */

import { Task, TaskData } from '../domain/Task';
import { ITaskRepository } from '../domain/ITaskRepository';
import { tasksDB } from './db-cdn';
import { ulid } from 'ulid';

export class TaskRepository implements ITaskRepository {
  /**
   * Create a new task
   */
  async create(task: Task): Promise<Task> {
    try {
      // Generate ID if not present
      if (!task.id) {
        task = new Task({ ...task.toJSON(), id: ulid() });
      }

      const taskData = {
        _id: task.id,
        ...task.toJSON()
      };

      await tasksDB.put(taskData);
      return task;
    } catch (error) {
      console.error('Failed to create task:', error);
      throw new Error('Failed to create task');
    }
  }

  /**
   * Update an existing task
   */
  async update(task: Task): Promise<Task> {
    try {
      // Get the existing document to preserve _rev
      const existing = await tasksDB.get(task.id);

      const taskData = {
        _id: task.id,
        _rev: existing._rev,
        ...task.toJSON()
      };

      await tasksDB.put(taskData);
      return task;
    } catch (error) {
      console.error('Failed to update task:', error);
      throw new Error('Failed to update task');
    }
  }

  /**
   * Delete a task by ID
   */
  async delete(id: string): Promise<void> {
    try {
      const doc = await tasksDB.get(id);
      await tasksDB.remove(doc);
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw new Error('Failed to delete task');
    }
  }

  /**
   * Find a task by ID
   */
  async findById(id: string): Promise<Task | null> {
    try {
      const doc = await tasksDB.get(id);
      const { _id, _rev, ...taskData } = doc;
      return Task.fromJSON(taskData as TaskData);
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      console.error('Failed to find task:', error);
      throw new Error('Failed to find task');
    }
  }

  /**
   * Find all tasks
   */
  async findAll(): Promise<Task[]> {
    try {
      const result = await tasksDB.allDocs({ include_docs: true });

      return result.rows
        .map((row: any) => {
          if (!row.doc) return null;
          const { _id, _rev, ...taskData } = row.doc;
          return Task.fromJSON(taskData as TaskData);
        })
        .filter((task: Task | null): task is Task => task !== null);
    } catch (error) {
      console.error('Failed to find tasks:', error);
      throw new Error('Failed to find tasks');
    }
  }

}

// Create and export a singleton instance
export const taskRepository = new TaskRepository();
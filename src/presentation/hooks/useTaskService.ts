/**
 * useTaskService Hook
 * React hook for integrating TaskService with components
 * Engagement-based time tracking
 */

import { useState, useEffect, useCallback } from 'react';
import { Task } from '../../domain/Task';
import { TaskService } from '../../application/TaskService';
import { taskRepository } from '../../infrastructure/TaskRepository';
import { initializeDB } from '../../infrastructure/db-cdn';

// Create a singleton instance of TaskService
console.log('Creating TaskService instance in useTaskService...');
const taskService = new TaskService(taskRepository);

export function useTaskService() {
  console.log('useTaskService hook called');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);

  // Initialize database and Idle task
  useEffect(() => {
    console.log('useTaskService: Starting database initialization...');
    const init = async () => {
      try {
        await initializeDB();
        console.log('useTaskService: Database initialized successfully');

        // Ensure Idle task exists
        await taskService.ensureIdleTaskExists();

        setInitialized(true);
      } catch (err) {
        console.error('Failed to initialize database:', err);
        setError('Failed to initialize database');
      }
    };

    init();
  }, []);

  // Load all tasks
  const loadTasks = useCallback(async () => {
    if (!initialized) return;

    try {
      setLoading(true);
      setError(null);
      const allTasks = await taskService.getAllTasks();
      setTasks(allTasks);

      // Update current task
      const active = await taskService.getCurrentTask();
      setCurrentTask(active);
    } catch (err) {
      console.error('Failed to load tasks:', err);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [initialized]);

  // Load tasks on mount and when initialized
  useEffect(() => {
    if (initialized) {
      loadTasks();
    }
  }, [initialized, loadTasks]);

  // Engage with a task (core action)
  const engage = useCallback(
    async (taskName: string) => {
      try {
        setError(null);
        const task = await taskService.engage(taskName);

        // Reload all tasks to reflect changes
        await loadTasks();

        return task;
      } catch (err) {
        console.error('Failed to engage task:', err);
        setError('Failed to engage task');
        throw err;
      }
    },
    [loadTasks]
  );

  // Update a task
  const updateTask = useCallback(
    async (
      taskId: string,
      updates: Partial<{ name: string; estimatedDuration: number }>
    ) => {
      try {
        setError(null);
        const updatedTask = await taskService.updateTask(taskId, updates);
        setTasks(prev =>
          prev.map(task => (task.id === taskId ? updatedTask : task))
        );
      } catch (err) {
        console.error('Failed to update task:', err);
        setError('Failed to update task');
        throw err;
      }
    },
    []
  );

  // Delete a task
  const deleteTask = useCallback(
    async (taskId: string) => {
      try {
        setError(null);
        await taskService.deleteTask(taskId);
        setTasks(prev => prev.filter(task => task.id !== taskId));
      } catch (err) {
        console.error('Failed to delete task:', err);
        setError('Failed to delete task');
        throw err;
      }
    },
    []
  );

  // Get unique task names (for task list display)
  const getUniqueTaskNames = useCallback(() => {
    const names = new Set(tasks.map(t => t.name));
    return Array.from(names);
  }, [tasks]);

  // Get all sessions for a task name
  const getTaskSessions = useCallback(
    (taskName: string) => {
      return tasks.filter(t => t.name === taskName);
    },
    [tasks]
  );

  // Get total duration for a task name
  const getTotalDuration = useCallback(
    (taskName: string) => {
      const sessions = getTaskSessions(taskName);
      return sessions.reduce((sum, session) => sum + session.actualDuration, 0);
    },
    [getTaskSessions]
  );

  return {
    tasks,
    loading,
    error,
    currentTask,
    engage,
    updateTask,
    deleteTask,
    getUniqueTaskNames,
    getTaskSessions,
    getTotalDuration,
    refresh: loadTasks,
  };
}

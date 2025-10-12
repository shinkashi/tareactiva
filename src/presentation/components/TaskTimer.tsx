/**
 * TaskTimer Component (Deprecated - not used in engagement-based UI)
 * Keeping as stub for compatibility
 */

import React from 'react';
import { Task } from '../../domain/Task';

interface TaskTimerProps {
  task: Task;
}

export const TaskTimer: React.FC<TaskTimerProps> = ({ task }) => {
  return (
    <div>
      {task.name}
    </div>
  );
};

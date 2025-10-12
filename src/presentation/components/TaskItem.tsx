/**
 * TaskItem Component (Deprecated - not used in engagement-based UI)
 * Keeping as stub for compatibility
 */

import React from 'react';
import { Task } from '../../domain/Task';

interface TaskItemProps {
  task: Task;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task }) => {
  return (
    <div>
      {task.name}
    </div>
  );
};

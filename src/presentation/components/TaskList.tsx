/**
 * TaskList Component
 * TaskChute-style vertical list: All tasks in sequence
 * Completed, Active, and Planned tasks all selectable
 */

import React, { useState } from 'react';
import { Task, IDLE_TASK_NAME } from '../../domain/Task';
import dayjs from 'dayjs';

interface TaskListProps {
  tasks: Task[];
  currentTask: Task | null;
  onEngage: (taskName: string) => Promise<Task>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  currentTask,
  onEngage,
}) => {
  const [newTaskName, setNewTaskName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Get all sessions (completed + active) sorted by start time
  const allSessions = tasks
    .filter(t => !t.isIdle)
    .sort((a, b) => a.startTime.valueOf() - b.startTime.valueOf());

  // Get unique task names for planned section
  const taskNames = Array.from(new Set(tasks.map(t => t.name)))
    .filter(name => name !== IDLE_TASK_NAME);

  // Planned tasks = unique names not in today's sessions yet
  const sessionNames = new Set(allSessions.map(s => s.name));
  const plannedTaskNames = taskNames.filter(name => !sessionNames.has(name));

  // Format time (HH:MM)
  const formatTime = (date: dayjs.Dayjs): string => {
    return date.format('HH:mm');
  };

  // Format duration
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Get elapsed time for active task
  const getElapsedTime = (): string => {
    if (!currentTask || currentTask.isIdle) return '';
    const elapsed = dayjs().diff(currentTask.startTime, 'minute');
    return formatDuration(elapsed);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;
    await onEngage(newTaskName.trim());
    setNewTaskName('');
    setShowCreateForm(false);
  };

  const handleEngage = async (taskName: string) => {
    await onEngage(taskName);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header with Idle and New Task buttons */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '12px' }}>
        <button
          onClick={() => handleEngage(IDLE_TASK_NAME)}
          className={`btn ${currentTask?.isIdle ? 'btn-success' : 'btn-secondary'}`}
          style={{
            flex: 1,
            padding: '12px',
            fontSize: '16px',
            backgroundColor: currentTask?.isIdle ? '#4CAF50' : '#9E9E9E',
          }}
        >
          {currentTask?.isIdle ? '✓ Idle' : '⏸️ Idle'}
        </button>

        {!showCreateForm ? (
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary"
            style={{ flex: 1, padding: '12px', fontSize: '16px' }}
          >
            + New Task
          </button>
        ) : null}
      </div>

      {/* New Task Form */}
      {showCreateForm && (
        <div style={{ marginBottom: '20px' }}>
          <form onSubmit={handleCreateTask} style={{
            border: '2px solid #2196F3',
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: '#E3F2FD'
          }}>
            <input
              type="text"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              placeholder="Task name..."
              autoFocus
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginBottom: '12px'
              }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                Start Working
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewTaskName('');
                }}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vertical List: All Sessions */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: 'bold',
          marginBottom: '12px',
          paddingBottom: '8px',
          borderBottom: '2px solid #ddd'
        }}>
          Today's Tasks
        </h2>

        {allSessions.length === 0 ? (
          <div style={{
            padding: '32px',
            textAlign: 'center',
            color: '#999',
            border: '2px dashed #ddd',
            borderRadius: '8px'
          }}>
            No tasks yet. Create one to get started!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {allSessions.map((session) => {
              const isActive = session.id === currentTask?.id;
              const isCompleted = session.endTime !== null;

              return (
                <div
                  key={session.id}
                  onClick={() => handleEngage(session.name)}
                  style={{
                    padding: '12px 16px',
                    border: `2px solid ${isActive ? '#4CAF50' : '#ddd'}`,
                    borderRadius: '4px',
                    backgroundColor: isActive ? '#E8F5E9' : isCompleted ? '#F5F5F5' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = '#2196F3';
                      e.currentTarget.style.backgroundColor = isCompleted ? '#E3F2FD' : '#F0F8FF';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = '#ddd';
                      e.currentTarget.style.backgroundColor = isCompleted ? '#F5F5F5' : 'white';
                    }
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: isActive ? 'bold' : '500',
                      color: isActive ? '#2E7D32' : isCompleted ? '#666' : '#333',
                      marginBottom: '4px'
                    }}>
                      {isActive && '▶️ '}{session.name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#888' }}>
                      {formatTime(session.startTime)}
                      {isCompleted && (
                        <>
                          {' - '}
                          {formatTime(session.endTime!)}
                          {' '}
                          <span style={{ fontWeight: '500' }}>
                            ({session.actualDuration}m)
                          </span>
                        </>
                      )}
                      {isActive && (
                        <>
                          {' - '}
                          <span style={{ fontWeight: 'bold', color: '#2E7D32' }}>
                            Now ({getElapsedTime()})
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {isCompleted && (
                    <div style={{
                      fontSize: '20px',
                      color: '#4CAF50'
                    }}>
                      ✓
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Planned Tasks Section */}
      {plannedTaskNames.length > 0 && (
        <div>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: '2px solid #ddd'
          }}>
            Planned Tasks
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {plannedTaskNames.map((taskName) => {
              return (
                <div
                  key={taskName}
                  onClick={() => handleEngage(taskName)}
                  style={{
                    padding: '12px 16px',
                    border: '2px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#2196F3';
                    e.currentTarget.style.backgroundColor = '#F0F8FF';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#ddd';
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '500',
                    color: '#333'
                  }}>
                    {taskName}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: '#888'
                  }}>
                    Not started
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Debug info */}
      <div style={{
        marginTop: '32px',
        padding: '12px',
        backgroundColor: '#f5f5f5',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#666'
      }}>
        <div>Total sessions: {tasks.length}</div>
        <div>Current task: {currentTask?.name || 'None'}</div>
      </div>
    </div>
  );
};

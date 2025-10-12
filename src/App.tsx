/**
 * Taskel - Minimal Task Management Application
 * Main App Component
 * Engagement-based time tracking
 */

import { useTaskService } from './presentation/hooks/useTaskService';
import { TaskList } from './presentation/components/TaskList';
import './App.css';

function App() {
  console.log('App component rendering...');
  const {
    tasks,
    loading,
    error,
    currentTask,
    engage,
    deleteTask,
  } = useTaskService();
  console.log('App component - loading:', loading, 'tasks:', tasks.length);

  if (loading && tasks.length === 0) {
    return (
      <div className="app-container">
        <div className="loading-state">
          <h1>Taskel</h1>
          <p>Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Taskel</h1>
        <p className="app-subtitle">Track. Execute. Learn.</p>
      </header>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      <main className="app-main">
        <TaskList
          tasks={tasks}
          currentTask={currentTask}
          onEngage={engage}
          onDeleteTask={deleteTask}
        />
      </main>
    </div>
  );
}

export default App;
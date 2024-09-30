import React, { useState, useEffect, useRef } from 'react';
import { Task } from './task.ts';

import WallClock from './WallClock.tsx';
import AddTask from './AddTask.tsx';
import TaskTable from './TaskTable.tsx';

import { taskRepo } from './task.ts';

import './App.css';



export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);

  const fetchTasks = async () => {
    const newTasks = await taskRepo.list();
    console.log({ tasks: newTasks });
    setTasks([...newTasks]);
  };

  useEffect(() => {
    fetchTasks();
  }, []);


  return (
    <>
      <h1>
        TareAct <WallClock />
      </h1>
      <AddTask trigger={fetchTasks} />
      <TaskTable
        tasks={tasks}
        trigger={fetchTasks}
      />
      {/* <h2>Events</h2> */}
      {/* <EventTable events={eventRepo.events} /> */}
    </>
  );
}

import { useState, useEffect } from 'react';
import { Task } from './task.ts';

import WallClock from './WallClock.tsx';
import AddTask from './AddTask.tsx';
import TaskTable from './TaskTable.tsx';

import { taskRepo } from './task.ts';

import './App.css';
import dayjs from 'dayjs';
import IsSameOrAfter from 'dayjs/plugin/isSameOrAfter';
dayjs.extend(IsSameOrAfter);


export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);

  const fetchTasks = async () => {
    let newTasks = await taskRepo.list();

    // filter out past completed tasks
    newTasks = newTasks.filter(t => 
      !t.endAt 
      || t.endAt.isSameOrAfter(dayjs(), "date")
    )

    // refresh planAt
    // get the expectedEnd
    let clock = dayjs();
    for (const t of newTasks) {
      const expectedEnd = t.expectedEndAt();
      if (expectedEnd && clock.isBefore(expectedEnd)) {
        clock = expectedEnd;
      }
    }

    // plan the unplanned works
    for (const t of newTasks) {
      if (t.startAt || t.scheduledAt) continue;
      t.planAt = clock;
      clock = clock.add(t.duration, "minute");
    }
    
    // sort by placeAt()
    newTasks.sort((a: Task, b: Task): number => {
      return a.placeAt().unix() - b.placeAt().unix()
    }
  );


    // console.log({ tasks: newTasks });
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

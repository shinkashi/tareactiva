import React, { useState, useEffect, useRef } from 'react';
import { Form, Button, Table } from 'react-bootstrap';
import { Task } from './task.ts';
// import { Event, eventRepo } from './event.ts';
// import { scheduleTasks } from './schedule.ts';
import dayjs from 'dayjs';

import { taskRepo } from './task.ts';

import './App.css';

function AddTask({ trigger }: { trigger: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = inputRef?.current?.value as string;
    if (!name) return;
    const task = new Task({ name });
    taskRepo.addTask(task);
    trigger();
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3" controlId="formText">
        <div className="d-flex">
          <Form.Control
            type="text"
            placeholder="Enter new task"
            ref={inputRef}
          />
          <Button variant="primary" type="submit">
            Add
          </Button>
        </div>
      </Form.Group>
    </Form>
  );
}

const WallClock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Cleanup the interval when the component is unmounted
    return () => clearInterval(timer);
  }, []);

  return <>
      {currentTime.toLocaleTimeString()}
      </>;
};



export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);

  const fetchTasks = async () => {
    const newTasks = taskRepo.listTasks();
    console.log({ tasks: newTasks });
    setTasks([...newTasks]);
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleInputChange = (index: number, field: string, value: string) => {
    const updatedTasks = [...tasks];
    (updatedTasks[index] as any)[field] = value;
    setTasks(updatedTasks);
  };


  return (
    <>
      <h1>TareAct <WallClock />
      </h1>
      <AddTask trigger={fetchTasks} />
      <TaskTable tasks={tasks} trigger={fetchTasks} onInputChange={handleInputChange}/>
      {/* <h2>Events</h2> */}
      {/* <EventTable events={eventRepo.events} /> */}
    </>
  );
}

function TaskTable({ tasks, trigger, onInputChange }: { tasks: Task[]; trigger: () => void; onInputChange: (index: number, field: string, value: string) => void }) {
  return (
    <>
      <Table hover>
        <thead>
          <tr>
          <th>Action</th>
          <th>Name</th>
          <th>ScheduledAt</th>
            <th>StartAt</th>
            <th>EndAt</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task, index) => (
            <tr key={index}>
              <td>
                <Button
                  variant="primary"
                  onClick={() => {
                    task.start(dayjs());
                    trigger();
                  }}
                >
                  ▶️
                </Button>
              </td>
              <Form.Control
                  type="text"
                  value={task.name}
                  onChange={(e) => onInputChange(index, 'name', e.target.value)}
                />
              <td>{task.scheduledAt?.format('DD/MM HH:mm')}</td>
              <td>{task.startAt?.format('DD/MM HH:mm')}</td>
              <td>{task.endAt?.format('DD/MM HH:mm')}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}

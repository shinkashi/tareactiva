import React, { useState, useEffect, useRef } from 'react';
import { Form, Button, Table } from 'react-bootstrap';
import { Task } from './task.ts';
import { Event, eventRepo } from './event.ts';
import {scheduleTasks} from "./schedule.ts";
import dayjs from 'dayjs';

function CreateTask({ trigger }: { trigger: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = inputRef?.current?.value as string;
    if (!name) return;
    const task = new Task({ name });
    await eventRepo.addTask(task);
    trigger();
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3" controlId="formText">
        <div className="d-flex">
          <Form.Control type="text" placeholder="Enter new task" ref={inputRef} />
          <Button variant="primary" type="submit">
            Add
          </Button>
        </div>
      </Form.Group>
    </Form>
  );
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);

  const fetchTasks = async () => {
    const newTasks = await eventRepo.listTasks();
    const plan = scheduleTasks(newTasks);
    setTasks(plan);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <>
      <h1>TareAct</h1>
      <h2>Tasks</h2>
      <CreateTask trigger={fetchTasks} />
      <TaskTable tasks={tasks} trigger={fetchTasks} />
      <h2>Events</h2>
      <EventTable events={eventRepo.events} />
    </>
  );
}

function TaskTable({ tasks, trigger }: { tasks: Task[], trigger: () => void }) {
  return (
    <Table hover>
      <thead>
        <tr>
        <th>Name</th>
        <th>ScheduledAt</th>
        <th>Duration</th>
        <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {tasks.map((task, index) => (
          <tr key={index}>
            <td>{task.name}</td>
            <td>{dayjs(task.scheduledAt).format("DD/MM HH:mm")}</td>
            <td>{task.duration}</td>
            <td>
              <Button variant="outline-danger"
                onClick={async () => {await eventRepo.deleteTask(task); trigger();}}>
                  <i className="bi bi-trash" />
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

function EventTable({ events }: { events: Event[] }) {
  events = [...events].reverse().slice(0,5);

  return (
    <Table hover>
      <thead>
        <tr>
          <th>Time</th>
          <th>EventType</th>
          <th>Object</th>
        </tr>
      </thead>
      <tbody>
        {events.map(event => (
          <tr key={event.id}>
            <td>{event.createdAtStr}</td>
            <td>{event.eventType}</td>
            <td>{JSON.stringify(event.object)}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}



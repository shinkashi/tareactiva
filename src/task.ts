// import { ulid } from "ulid";
import dayjs, { Dayjs } from 'dayjs';

export class Task {
  name: string = '';
  scheduledAt: Dayjs | null = null;
  startAt: Dayjs | null = null;
  endAt: Dayjs | null = null;

  duration: number = 1;
  remaining: number = 1;

  constructor(init: Partial<Task>) {
    Object.assign(this, init);
  }

  isFinished(): boolean {
    return this.endAt != null;
  }

  start(timestamp: Dayjs) {
    this.startAt = timestamp;
  }

  finish(timestamp: Dayjs) {
    this.endAt = timestamp;
  }
}

export class TaskRepo {
  tasks: Task[] = [];

  constructor(init: Partial<TaskRepo> = {}) {
    Object.assign(this, init);
  }

  listTasks(): Task[] {
    return this.tasks;
  }

  addTask(task: Task) {
    this.tasks.push(task);
  }
}

export const taskRepo = new TaskRepo();

const initialTasks = [
  new Task({
    name: '朝サプリ',
    remaining: 10,
    duration: 3,
  }),
  new Task({
    name: 'Develop tareact',
    remaining: 120,
    duration: 30,
  }),
  new Task({
    name: '日販IPS',
    remaining: 300,
    duration: 30,
  }),
  new Task({
    name: 'MCN',
    remaining: 300,
    duration: 30,
  }),
];

for (const task of initialTasks) taskRepo.addTask(task);
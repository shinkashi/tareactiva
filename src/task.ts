// import { ulid } from "ulid";
import dayjs, { Dayjs } from 'dayjs';
import { ulid } from 'ulid';
import { CosmosClient, Container } from '@azure/cosmos';

export let taskRepo: TaskRepo;

export class Task {
  id: string = ulid();
  name: string = '';
  planAt: Dayjs | null = null;
  scheduledAt: Dayjs | null = null;
  startAt: Dayjs | null = null;
  endAt: Dayjs | null = null;
  duration: number = 15;
  remaining: number = 1;

  constructor(init: Partial<Task>) {
    Object.assign(this, init);
  }

  static fromCosmos(o: any): Task {
    return new Task({
      id: o.id,
      name: o.name,
      duration: o.duration,
      planAt: o.planAt ? dayjs.unix(o.planAt) : null,
      scheduledAt: o.scheduledAt ? dayjs.unix(o.scheduledAt) : null,
      startAt: o.startAt ? dayjs.unix(o.startAt) : null,
      endAt: o.endAt ? dayjs.unix(o.endAt) : null,
    });
  }

  toCosmos(): object {
    return {
      id: this.id,
      name: this.name,
      duration: this.duration,
      planAt: this.planAt?.unix(),
      scheduledAt: this.scheduledAt?.unix(),
      startAt: this.startAt?.unix(),
      endAt: this.endAt?.unix(),
    };
  }

  status(): 'notstarted' | 'inprogress' | 'finished' {
    if (!this.startAt) {
      return 'notstarted';
    }
    if (!this.endAt) {
      return 'inprogress';
    }
    return 'finished';
  }

  isInProgress(): boolean {
    return !!this.startAt && !this.endAt;
  }

  isFinished(): boolean {
    return this.endAt != null;
  }

  async start(timestamp?: Dayjs) {
    if (this.isFinished()) {
      await this.finish();
    }

    this.startAt = timestamp || dayjs();
    await taskRepo.update(this);
  }

  async renew(timestamp?: Dayjs): Promise<Task> {
    await this.finish(timestamp);
    const newTask = new Task({
      name: this.name,
      duration: Math.ceil(this.duration),
      planAt: this.startAt?.add(1, "day")
    });
    await taskRepo.add(newTask);
    return newTask;
  }

  async finish(timestamp?: Dayjs) {
    this.endAt = timestamp || dayjs();
    await taskRepo.update(this);
  }

  async update() {
    await taskRepo.update(this);
  }

  async delete() {
    await taskRepo.delete(this);
  }
}

export class TaskRepo {
  client: CosmosClient;
  container!: Container;

  constructor() {
    this.client = new CosmosClient(
      import.meta.env.VITE_TA_COSMOS_CONNECTION_STRING,
    );
  }

  async initialize() {
    const database = this.client.database('tareactiva');
    const { container } = await database.containers.createIfNotExists({
      id: 'tasks',
    });
    this.container = container;
  }

  async list(): Promise<Task[]> {
    const { resources } = await this.container.items.readAll().fetchAll();
    return resources.map((e) => Task.fromCosmos(e));
  }

  async add(task: Task) {
    await this.container.items.create(task.toCosmos());
  }

  async update(task: Task) {
    await this.container.items.upsert(task.toCosmos());
  }

  async delete(task: Task) {
    await this.container.item(task.id).delete();
  }

  async get(id: string) {
    return await Task.fromCosmos(this.container.item(id).get());
  }
}

taskRepo = new TaskRepo();
await taskRepo.initialize();

// const initialTasks = [
//   new Task({
//     name: '朝サプリ',
//     remaining: 10,
//     duration: 3,
//   }),
//   new Task({
//     name: 'Develop tareact',
//     remaining: 120,
//     duration: 30,
//   }),
//   new Task({
//     name: '日販IPS',
//     remaining: 300,
//     duration: 30,
//   }),
//   new Task({
//     name: 'MCN',
//     remaining: 300,
//     duration: 30,
//   }),
// ];

// for (const task of initialTasks) taskRepo.addTask(task);

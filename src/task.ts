import { ulid } from "ulid";

export class Task {
  id: string;
  name: string = "";
  _ts: number = 0;
  scheduledAt: number = 0;
  plannedAt: number = 0;
  startedAt: number = 0;
  duration: number = 5 * 60 * 1000;

  constructor(init: { id?: string, name: string; }) {
    Object.assign(this, init);
    this.id ||= ulid();
  }
}

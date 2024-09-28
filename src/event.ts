import { CosmosClient, Container } from "@azure/cosmos";
import { Task } from "./task.js";
import dayjs from "dayjs";
import { ulid, decodeTime } from "ulid";

type EventType = "TaskCreated" | "TaskDeleted" | "Unknown";


export class Event {
  id: string;
  eventType: EventType = "Unknown";
  object?: Task
  _ts: number;

  constructor(init: {eventType: EventType, object: Task}) {
    Object.assign(this, init);
    this.id ??= ulid();
    this._ts ??= init?.object?._ts ?? Date.now();
  }

  get createdAt(): number {
    return decodeTime(this.id);
  }

  get createdAtStr(): string {
    return dayjs(this.createdAt).format("DD/MM HH:mm")
  }
}

export class EventRepository {
  client: CosmosClient;
  container: Container;
  events: Event[] = [];
  lastUpdated: number = 0;

  constructor() {
    this.client = new CosmosClient(import.meta.env.VITE_TA_COSMOS_CONNECTION_STRING);
    this.container = this.client.database("tareactiva").container("events");
  }

  static async init(): Promise<EventRepository> {
    const obj = new EventRepository;
    return obj
  }

  async loadEvents() {
    const { resources } = await this.container.items.readAll().fetchAll();
    this.events = resources.map(e => new Event(e));
    this.events.sort((a,b) => a.createdAt - b.createdAt);  // desc order
    console.log({events: this.events});
  }  

  async listTasks(): Promise<Task[]> {
    const taskDict: {[taskId: string]: Task} = {};

    await this.loadEvents();

    for (const event of this.events) {
      if (!event.object) continue;

      if (event.eventType == "TaskCreated") {
        taskDict[event.object.id] = event.object as Task;
      } 
      else if (event.eventType == "TaskDeleted") {
        delete taskDict[event.object.id]
      }
      else {
        console.log("Unknown event!", event)
      }
    }
    
    return Object.values(taskDict);
  }

  async addTask(task: Task) {
    const event = new Event({eventType: "TaskCreated", object: task});
    const response = await this.container.items.create(event);
    this.lastUpdated = Date.now();
    console.debug({response});
  }

  async deleteTask(task: Task) {
    const event = new Event({eventType: "TaskDeleted", object: task});
    const response = await this.container.items.create(event);
    this.lastUpdated = Date.now();
    console.debug({response});
  }
}

export const eventRepo = await EventRepository.init();


// export function EventTable({ events }: { events: Event[] }) {
//   events = [...events].reverse().slice(0,5);

//   return (
//     <Table hover>
//       <thead>
//         <tr>
//           <th>Time</th>
//           <th>EventType</th>
//           <th>Object</th>
//         </tr>
//       </thead>
//       <tbody>
//         {events.map(event => (
//           <tr key={event.id}>
//             <td>{event.createdAtStr}</td>
//             <td>{event.eventType}</td>
//             <td>{JSON.stringify(event.object)}</td>
//           </tr>
//         ))}
//       </tbody>
//     </Table>
//   );
// }



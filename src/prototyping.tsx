import dayjs, { Dayjs } from 'dayjs';
import { Table } from 'react-bootstrap';

// type Plan = {
//   task: Task;
//   name: string;
//   remaining: number;
//   duration: number;
//   planAt: Dayjs;
//   startAt: Dayjs;
//   endAt: Dayjs;
// };

class Task {

  // createPlan(planAt: Dayjs): Plan | null {
  //   if (this.remaining <= 0) {
  //     return null;
  //   }

  //   const endAt = planAt.add(this.duration, 'minute');

  //   const plan: Plan = {
  //     task: this,
  //     name: this.name,
  //     remaining: this.remaining,
  //     duration: this.duration,
  //     planAt,
  //     startAt: planAt,
  //     endAt,
  //   };

  //   this.remaining -= this.duration;
  //   if (this.remaining < 0) this.remaining = 0;
  //   this.scheduledAt = endAt;

  //   return plan;
  // }
}

function createPlan(tasks: Task[]): Task[] {
  const plans = tasks.map((t) => new Task(t));
  return plans;


  let clock = dayjs();
  const clockEnd = dayjs().add(2, "days");

  while (plans.length && clock.isBefore(clockEnd)) {
    // find the next plan
    let nextPlan: Task| null = null;
    for (const plan of plans) {
      if (plan.isFinished()) continue;
      if (!nextPlan) nextPlan = plan;
      if (
        plan.scheduledAt &&
        nextPlan.scheduledAt &&
        plan.scheduledAt.isBefore(nextPlan.scheduledAt)
      ) {
        nextPlan = plan
      }
    }

    // virtually execute
    nextPlan.start(clock);
    clock = clock.add(nextPlan.duration);
    nextPlan.finish(clock);
    console.log({nextPlan});

    // repeat task
    const nextSchedule = nextPlan.startAt?.add(1, 'day');
    const repeatPlan = new Task({...nextPlan, scheduledAt: nextSchedule})
    plans.push(repeatPlan);

    // go to morning
    if (clock.hour() < 8) {
      clock = clock.hour(8).minute(0);
    }
  }

  return plans;
}


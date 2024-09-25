import { Task } from "./task.ts";

export function scheduleTasks(tasks: Task[]): Task[] {
    const plan: Task[] = [];
    let clock = Date.now();
    const clockEnd = clock + 3600 * 1000;

    tasks.forEach(t => {t.scheduledAt = Date.now()});

    console.log({originalTasks: tasks})    ;
    
    while (clock <  clockEnd) {

        // find the next task
        let nextTask = tasks[0];
        for (const t of tasks) {
            if (!t.scheduledAt || t.scheduledAt < nextTask.scheduledAt) nextTask = t;
        }

        plan.push(new Task(nextTask));

        let duration = nextTask.duration;
        if (duration < 60 * 1000) duration = 60 * 1000;
        clock += duration;
        nextTask.scheduledAt = clock;
    }

    console.log({plan});
    return plan;
}
export type StoryTaskStatus = "TODO" | "IN_PROGRESS" | "TO_REVIEW" | "DONE";
export type StoryStatus = "TODO" | "IN_PROGRESS" | "DONE";

export type StoryTask = {
  status: StoryTaskStatus;
  assignee: {
    id: string;
    name: string | null;
    email: string;
  } | null;
};

export type StoryAssignee = NonNullable<StoryTask["assignee"]>;

export function getStoryStatus(tasks: StoryTask[]): StoryStatus {
  if (tasks.length > 0 && tasks.every((task) => task.status === "DONE")) {
    return "DONE";
  }

  if (tasks.some((task) => task.status === "IN_PROGRESS")) {
    return "IN_PROGRESS";
  }

  return "TODO";
}

export function getStoryAssignees(
  tasks: StoryTask[],
): StoryAssignee[] {
  const uniqueAssignees = new Map<string, StoryAssignee>();

  for (const task of tasks) {
    if (task.assignee) {
      uniqueAssignees.set(task.assignee.id, task.assignee);
    }
  }

  return Array.from(uniqueAssignees.values());
}


export const instant = false;

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import StatisticsDashboard from "./StatisticsDashboard";

export default async function StatisticsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { ownerId: session.user.id },
        {
          members: {
            some: { id: session.user.id },
          },
        },
      ],
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      epics: {
        select: {
          stories: {
            select: {
              tasks: {
                select: {
                  id: true,
                  status: true,
                  priority: true,
                },
              },
            },
          },
        },
      },
      sprints: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  const statistics = projects.map((project) => {
    const tasks = project.epics.flatMap((epic) =>
      epic.stories.flatMap((story) => story.tasks)
    );

    const isDone = (status: string) =>
      ["DONE", "COMPLETED"].includes(status.toUpperCase());

    const completed = tasks.filter((task) => isDone(task.status)).length;
    const todo = tasks.filter((task) =>
      ["TODO", "BACKLOG", "PLANNED"].includes(task.status.toUpperCase())
    ).length;
    const inProgress = tasks.filter((task) =>
      ["IN_PROGRESS", "INPROGRESS"].includes(task.status.toUpperCase())
    ).length;
    const toReview = tasks.filter((task) =>
      ["TO_REVIEW", "IN_REVIEW", "REVIEW"].includes(task.status.toUpperCase())
    ).length;

    const activeSprints = project.sprints.filter((sprint) =>
      ["ACTIVE", "IN_PROGRESS", "ONGOING"].includes(
        sprint.status.toUpperCase()
      )
    ).length;

    const completedSprints = project.sprints.filter((sprint) =>
      ["COMPLETED", "DONE", "FINISHED"].includes(
        sprint.status.toUpperCase()
      )
    ).length;

    const plannedSprints = project.sprints.filter((sprint) =>
      ["PLANNED", "TODO", "UPCOMING"].includes(
        sprint.status.toUpperCase()
      )
    ).length;

    return {
      id: project.id,
      name: project.name,
      totalTasks: tasks.length,
      completed,
      todo,
      inProgress,
      toReview,
      urgent: tasks.filter(
        (task) => task.priority.toUpperCase() === "URGENT"
      ).length,
      high: tasks.filter(
        (task) => task.priority.toUpperCase() === "HIGH"
      ).length,
      medium: tasks.filter(
        (task) => task.priority.toUpperCase() === "MEDIUM"
      ).length,
      low: tasks.filter(
        (task) => task.priority.toUpperCase() === "LOW"
      ).length,
      totalSprints: project.sprints.length,
      activeSprints,
      completedSprints,
      plannedSprints,
      progress:
        tasks.length > 0
          ? Math.round((completed / tasks.length) * 100)
          : 0,
    };
  });

  const totals = statistics.reduce(
    (acc, project) => ({
      tasks: acc.tasks + project.totalTasks,
      completed: acc.completed + project.completed,
      todo: acc.todo + project.todo,
      inProgress: acc.inProgress + project.inProgress,
      toReview: acc.toReview + project.toReview,
      urgent: acc.urgent + project.urgent,
      high: acc.high + project.high,
      medium: acc.medium + project.medium,
      low: acc.low + project.low,
      sprints: acc.sprints + project.totalSprints,
      activeSprints: acc.activeSprints + project.activeSprints,
      completedSprints: acc.completedSprints + project.completedSprints,
      plannedSprints: acc.plannedSprints + project.plannedSprints,
    }),
    {
      tasks: 0,
      completed: 0,
      todo: 0,
      inProgress: 0,
      toReview: 0,
      urgent: 0,
      high: 0,
      medium: 0,
      low: 0,
      sprints: 0,
      activeSprints: 0,
      completedSprints: 0,
      plannedSprints: 0,
    }
  );

  const overallProgress =
    totals.tasks > 0
      ? Math.round((totals.completed / totals.tasks) * 100)
      : 0;

  return (
    <StatisticsDashboard
      projects={statistics}
      totals={{
        ...totals,
        projects: projects.length,
        overallProgress,
      }}
    />
  );
}

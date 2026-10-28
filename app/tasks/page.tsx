
export const instant = false;

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import TasksList from "./TasksList";

export default async function TasksPage() {
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
            some: {
              id: session.user.id,
            },
          },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      epics: {
        select: {
          stories: {
            select: {
              id: true,
              title: true,
              tasks: {
                where: {
                  status: {
                    not: "DONE",
                  },
                },
                select: {
                  id: true,
                  title: true,
                  description: true,
                  status: true,
                  priority: true,
                  type: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  const tasks = projects.flatMap((project) =>
    project.epics.flatMap((epic) =>
      epic.stories.flatMap((story) =>
        story.tasks.map((task) => ({
          ...task,
          projectId: project.id,
          projectName: project.name,
          storyId: story.id,
          storyTitle: story.title,
        }))
      )
    )
  );

  return <TasksList tasks={tasks} />;
}

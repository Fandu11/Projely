
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import GlobalCalendar from "./GlobalCalendar";

export const instant = false;

export default async function CalendarPage() {
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
      sprints: {
        orderBy: {
          startDate: "asc",
        },
        select: {
          id: true,
          name: true,
          goal: true,
          startDate: true,
          endDate: true,
          status: true,
          tasks: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
            },
          },
        },
      },
    },
  });

  const events = projects.flatMap((project) =>
    project.sprints.map((sprint) => ({
      id: sprint.id,
      name: sprint.name,
      goal: sprint.goal,
      startDate: sprint.startDate.toISOString(),
      endDate: sprint.endDate.toISOString(),
      status: sprint.status,
      projectId: project.id,
      projectName: project.name,
      tasks: sprint.tasks,
    }))
  );

  return <GlobalCalendar events={events} />;
}

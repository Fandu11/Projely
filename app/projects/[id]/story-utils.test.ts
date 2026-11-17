import { describe, expect, it } from "vitest";

import {
  getStoryAssignees,
  getStoryStatus,
  type StoryTask,
} from "./story-utils";

function task(
  status: StoryTask["status"],
  assignee: StoryTask["assignee"] = null,
): StoryTask {
  return { status, assignee };
}

const alice = {
  id: "alice",
  name: "Alice",
  email: "alice@example.com",
};

const bob = {
  id: "bob",
  name: "Bob",
  email: "bob@example.com",
};

describe("getStoryStatus", () => {
  it("considers a story without subtasks as TODO", () => {
    expect(getStoryStatus([])).toBe("TODO");
  });

  it("considers a story TODO when subtasks are not started", () => {
    expect(getStoryStatus([task("TODO"), task("TO_REVIEW")])).toBe("TODO");
  });

  it("considers a story IN_PROGRESS when one subtask is in progress", () => {
    expect(getStoryStatus([task("TODO"), task("IN_PROGRESS")])).toBe(
      "IN_PROGRESS",
    );
  });

  it("considers a story DONE only when every subtask is DONE", () => {
    expect(getStoryStatus([task("DONE"), task("DONE")])).toBe("DONE");
    expect(getStoryStatus([task("DONE"), task("TO_REVIEW")])).toBe("TODO");
  });
});

describe("getStoryAssignees", () => {
  it("returns each assigned person once in first-seen order", () => {
    expect(
      getStoryAssignees([
        task("TODO", alice),
        task("IN_PROGRESS", bob),
        task("DONE", alice),
      ]),
    ).toEqual([alice, bob]);
  });

  it("ignores unassigned subtasks", () => {
    expect(getStoryAssignees([task("TODO"), task("DONE", alice)])).toEqual([
      alice,
    ]);
  });
});

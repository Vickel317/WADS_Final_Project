import { DMRestriction } from "@prisma/client";
import { canSendDirectMessage } from "@/lib/message-access";

describe("canSendDirectMessage", () => {
  const student = { userId: "s1", role: "STUDENT" as const, dmRestriction: DMRestriction.ALL };
  const lecturer = { userId: "l1", role: "LECTURER" as const, dmRestriction: DMRestriction.ALL };

  it("blocks messaging yourself", () => {
    expect(canSendDirectMessage(student, student, false)).toBe(false);
  });

  it("allows everyone when restriction is ALL", () => {
    expect(canSendDirectMessage(student, { ...lecturer, dmRestriction: DMRestriction.ALL }, false)).toBe(true);
  });

  it("requires mutual connection when restriction is CONNECTIONS", () => {
    const receiver = { ...student, userId: "s2", dmRestriction: DMRestriction.CONNECTIONS };
    expect(canSendDirectMessage(student, receiver, false)).toBe(false);
    expect(canSendDirectMessage(student, receiver, true)).toBe(true);
  });

  it("blocks all DMs when restriction is NONE", () => {
    const receiver = { ...student, userId: "s2", dmRestriction: DMRestriction.NONE };
    expect(canSendDirectMessage(student, receiver, true)).toBe(false);
  });

  it("allows only lecturers when restriction is LECTURERS", () => {
    const receiver = { ...student, userId: "s2", dmRestriction: DMRestriction.LECTURERS };
    expect(canSendDirectMessage(student, receiver, true)).toBe(false);
    expect(canSendDirectMessage(lecturer, receiver, false)).toBe(true);
  });
});

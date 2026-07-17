import { describe, it, expect } from "vitest";
import { resetDailyIntakeIfNeeded } from "../utils/resetDailyIntake.js";

describe("resetDailyIntakeIfNeeded", () => {
  it("leaves a doc with no medication tracking untouched", () => {
    const doc = { tabletsPerDay: null, todaysIntake: 0, lastIntakeDate: null };
    const result = resetDailyIntakeIfNeeded(doc);
    expect(result).toBe(doc);
    expect(result.lastIntakeDate).toBeNull();
  });

  it("resets todaysIntake and stamps lastIntakeDate on first-ever read", () => {
    const doc = { tabletsPerDay: 2, todaysIntake: 0, lastIntakeDate: null };
    resetDailyIntakeIfNeeded(doc);
    expect(doc.todaysIntake).toBe(0);
    expect(doc.lastIntakeDate).toBeInstanceOf(Date);
  });

  it("resets todaysIntake to 0 when lastIntakeDate was an earlier calendar day", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const doc = { tabletsPerDay: 2, todaysIntake: 2, lastIntakeDate: yesterday };

    resetDailyIntakeIfNeeded(doc);

    expect(doc.todaysIntake).toBe(0);
    expect(new Date(doc.lastIntakeDate).toDateString()).toBe(new Date().toDateString());
  });

  it("does NOT reset todaysIntake when lastIntakeDate is still today", () => {
    const doc = { tabletsPerDay: 2, todaysIntake: 1, lastIntakeDate: new Date() };
    resetDailyIntakeIfNeeded(doc);
    expect(doc.todaysIntake).toBe(1);
  });

  it("mutates the doc in place and does not save", () => {
    const doc = { tabletsPerDay: 1, todaysIntake: 0, lastIntakeDate: null, save: () => { throw new Error("should not be called"); } };
    expect(() => resetDailyIntakeIfNeeded(doc)).not.toThrow();
  });
});

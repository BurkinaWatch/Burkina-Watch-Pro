import { beforeEach, describe, expect, it, vi } from "vitest";

const { dbMock } = vi.hoisted(() => ({
  dbMock: {
    select: vi.fn(),
  },
}));

vi.mock("./db", () => ({ db: dbMock }));

import { storage } from "./storage";

function createSelectQuery(result: unknown, rejects = false) {
  const query = {
    from: vi.fn(),
    where: rejects ? vi.fn().mockRejectedValue(result) : vi.fn().mockResolvedValue(result),
  };
  query.from.mockReturnValue(query);
  return query;
}

describe("notification storage compatibility", () => {
  beforeEach(() => {
    dbMock.select.mockReset();
  });

  it("counts legacy notifications when the read column is missing", async () => {
    const missingReadColumn = Object.assign(
      new Error('column "read" does not exist'),
      { code: "42703" },
    );
    const failedQuery = createSelectQuery(missingReadColumn, true);
    const fallbackQuery = createSelectQuery([{ count: 2 }]);
    dbMock.select
      .mockReturnValueOnce(failedQuery)
      .mockReturnValueOnce(fallbackQuery);

    await expect(storage.getUnreadNotificationsCount("user-1")).resolves.toBe(2);

    expect(dbMock.select).toHaveBeenCalledTimes(2);
    expect(failedQuery.where).toHaveBeenCalledTimes(1);
    expect(fallbackQuery.where).toHaveBeenCalledTimes(1);
  });

  it("does not hide unrelated notification database errors", async () => {
    const databaseError = Object.assign(
      new Error('relation "notifications" does not exist'),
      { code: "42P01" },
    );
    dbMock.select.mockReturnValueOnce(createSelectQuery(databaseError, true));

    await expect(storage.getUnreadNotificationsCount("user-1")).rejects.toBe(databaseError);
    expect(dbMock.select).toHaveBeenCalledTimes(1);
  });
});
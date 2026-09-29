import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  client: {},
  settings: vi.fn(),
  find: vi.fn(),
  findOne: vi.fn(),
  updateOne: vi.fn(),
}));

vi.mock("@ufo/database", () => ({
  hasUsableMongoUri: () => true,
  getMongoClient: async () => mocks.client,
  // Like MongoClient.db(), each call can return a fresh Db wrapper for the same client.
  getDb: async () => ({
    client: mocks.client,
    databaseName: "content-test",
    collection: (name: string) =>
      name === "settings"
        ? { updateOne: mocks.settings }
        : { find: mocks.find, findOne: mocks.findOne, updateOne: mocks.updateOne },
  }),
}));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  mocks.settings.mockResolvedValue({ upsertedCount: 0 });
  mocks.find.mockReturnValue({ sort: () => ({ toArray: async () => [] }) });
  mocks.findOne.mockResolvedValue(null);
  mocks.updateOne.mockResolvedValue({ matchedCount: 1 });
});

describe("content database query costs", () => {
  it("initializes once per database and projects only library fields", async () => {
    const { listAdminPostSummaries } = await import("@/lib/content-posts");
    await Promise.all([listAdminPostSummaries(), listAdminPostSummaries()]);
    await listAdminPostSummaries();
    expect(mocks.settings).toHaveBeenCalledTimes(2);
    const projection = mocks.find.mock.calls[0]?.[1]?.projection;
    expect(projection).toMatchObject({ _id: 0, id: 1, title: 1 });
    expect(projection).not.toHaveProperty("body");
  });

  it("retries initialization after a database error", async () => {
    mocks.settings.mockRejectedValueOnce(new Error("temporary database failure"));
    const { listAdminPostSummaries } = await import("@/lib/content-posts");
    await expect(listAdminPostSummaries()).rejects.toThrow("temporary database failure");
    await expect(listAdminPostSummaries()).resolves.toEqual([]);
    expect(mocks.settings).toHaveBeenCalledTimes(3);
  });

  it("checks slug uniqueness with a targeted lookup instead of downloading all articles", async () => {
    const { saveContentPost } = await import("@/lib/content-posts");
    await saveContentPost({
      title: "یادداشت آموزشی برای برنامه مطالعه",
      slug: "reading-plan-query-test",
      excerpt: "یک خلاصه آموزشی درباره تنظیم برنامه مطالعه و نگهداری یادداشت‌های روزانه.",
      body: "متن آموزشی درباره برنامه مطالعه و ثبت یادداشت‌ها برای مرور دوباره. ".repeat(4),
      seoTitle: "یادداشت آموزشی درباره برنامه مطالعه",
      seoDescription:
        "این مقاله آموزشی به تنظیم برنامه مطالعه و ثبت یادداشت‌های روزانه کمک می‌کند و ساختار روشن متن را نمایش می‌دهد.",
    });
    expect(mocks.find).not.toHaveBeenCalled();
    expect(mocks.findOne).toHaveBeenCalledWith(
      { slug: "reading-plan-query-test" },
      { projection: { _id: 1 } },
    );
  });
});

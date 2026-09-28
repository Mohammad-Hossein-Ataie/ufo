import { afterEach, describe, expect, it, vi } from "vitest";
import { listAdminProducts } from "@/lib/admin-products";
import { listCatalogRowsForDiscovery } from "@/lib/catalog-data";

vi.mock("@/lib/admin-products", () => ({ listAdminProducts: vi.fn() }));

describe("discovery catalog snapshot", () => {
  afterEach(() => vi.restoreAllMocks());

  it("shares one catalog read across suggestions and images, then refreshes after expiry", async () => {
    let now = 10_000;
    vi.spyOn(Date, "now").mockImplementation(() => now);
    const first = [{ product: { id: "first" } }] as Awaited<ReturnType<typeof listAdminProducts>>;
    const second = [{ product: { id: "second" } }] as Awaited<ReturnType<typeof listAdminProducts>>;
    vi.mocked(listAdminProducts).mockResolvedValueOnce(first).mockResolvedValueOnce(second);

    const [suggestions, imageLookup] = await Promise.all([
      listCatalogRowsForDiscovery(),
      listCatalogRowsForDiscovery(),
    ]);
    expect(suggestions).toBe(first);
    expect(imageLookup).toBe(first);
    expect(listAdminProducts).toHaveBeenCalledTimes(1);

    now += 20_001;
    expect(await listCatalogRowsForDiscovery()).toBe(first);
    expect(await listCatalogRowsForDiscovery()).toBe(second);
    expect(listAdminProducts).toHaveBeenCalledTimes(2);
  });
});

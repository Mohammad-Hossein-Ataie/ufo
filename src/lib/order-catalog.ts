import { registerOrderCatalog } from "@ufo/orders";
import { listCatalogRows } from "@/lib/catalog-data";

export async function hydrateOrderCatalog() {
  registerOrderCatalog(await listCatalogRows());
}

import { searchProducts } from "@ufo/domain";
import type { Product } from "@ufo/types";

export interface SearchProvider {
  searchProducts(query: string): Promise<Product[]>;
}

export class MemorySearchProvider implements SearchProvider {
  async searchProducts(query: string): Promise<Product[]> {
    return searchProducts(query);
  }
}

import { describe, expect, it } from "vitest";
import { inventoryItems, releaseReservation, reserveInventory } from "@ufo/domain";

const inventoryItem = inventoryItems[0];

if (!inventoryItem) {
  throw new Error("inventory fixture is missing");
}

describe("inventory reservations", () => {
  it("prevents overselling", () => {
    expect(() =>
      reserveInventory({
        item: inventoryItem,
        quantity: inventoryItem.onHand + 1,
        channel: "retail"
      }),
    ).toThrow("oversell");
  });

  it("reserves and releases stock", () => {
    const result = reserveInventory({
      item: inventoryItem,
      quantity: 2,
      channel: "retail",
      now: new Date("2026-08-02T08:00:00.000Z")
    });
    expect(result.item.reserved).toBe(inventoryItem.reserved + 2);
    expect(releaseReservation(result.item, result.reservation).reserved).toBe(inventoryItem.reserved);
  });
});

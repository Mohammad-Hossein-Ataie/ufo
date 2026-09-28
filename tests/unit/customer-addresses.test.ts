import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createCustomerAddress,
  deleteCustomerAddress,
  getCustomerStorePath,
  listCustomerAddresses,
  updateCustomerAddress,
  upsertCustomerAccount,
} from "@ufo/orders";

describe("customer address book", () => {
  let directory: string;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), "ufo-addresses-"));
    vi.stubEnv("UFO_MOCK_DATA_DIR", directory);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    rmSync(directory, { recursive: true, force: true });
  });

  it("creates, selects and keeps a single default address", () => {
    const customer = upsertCustomerAccount({
      mobileNumber: "09123456789",
      customerType: "retail",
      profile: { firstName: "کاربر", lastName: "تست" },
    });
    const home = createCustomerAddress(customer.id, {
      label: "خانه",
      province: "تهران",
      city: "تهران",
      line1: "خیابان اول، پلاک ۱۰",
      postalCode: "1234567890",
      receiverName: "کاربر تست",
      receiverPhone: "09123456789",
    });
    const work = createCustomerAddress(customer.id, {
      label: "محل کار",
      province: "البرز",
      city: "کرج",
      line1: "میدان اصلی، پلاک ۲۰",
      receiverName: "کاربر تست",
      receiverPhone: "+989123456789",
      isDefault: true,
    });

    expect(home.isDefault).toBe(true);
    expect(work.isDefault).toBe(true);
    expect(listCustomerAddresses(customer.id)).toEqual([
      expect.objectContaining({ id: work.id, isDefault: true }),
      expect.objectContaining({ id: home.id, isDefault: false }),
    ]);
  });

  it("updates and deletes only addresses owned by the customer", () => {
    const customer = upsertCustomerAccount({
      mobileNumber: "09120000000",
      customerType: "retail",
    });
    const address = createCustomerAddress(customer.id, {
      label: "خانه",
      province: "تهران",
      city: "تهران",
      line1: "پلاک ۱",
      receiverName: "مشتری",
      receiverPhone: "09120000000",
    });

    expect(updateCustomerAddress(customer.id, address.id, { label: "خانه جدید" }).label).toBe(
      "خانه جدید",
    );
    expect(() => updateCustomerAddress("other", address.id, { label: "غیرمجاز" })).toThrow(
      "آدرس پیدا نشد",
    );
    deleteCustomerAddress(customer.id, address.id);
    expect(listCustomerAddresses(customer.id)).toEqual([]);
  });

  it("does not replace an unreadable customer file with an empty account", () => {
    const customer = upsertCustomerAccount({
      mobileNumber: "09120000000",
      customerType: "retail",
      profile: { firstName: "کاربر", lastName: "تست" },
    });
    const storePath = getCustomerStorePath();
    const saved = readFileSync(storePath, "utf8");
    writeFileSync(storePath, "{invalid-json", "utf8");

    expect(() => upsertCustomerAccount({ mobileNumber: customer.mobileNumber, customerType: "retail" })).toThrow();
    expect(readFileSync(storePath, "utf8")).toBe("{invalid-json");

    writeFileSync(storePath, saved, "utf8");
    expect(upsertCustomerAccount({ mobileNumber: customer.mobileNumber, customerType: "retail" }).id).toBe(customer.id);

    const invalidAddresses = JSON.stringify({ ...JSON.parse(saved), addresses: "invalid" });
    writeFileSync(storePath, invalidAddresses, "utf8");
    expect(() => listCustomerAddresses(customer.id)).toThrow("فایل حساب‌های مشتریان معتبر نیست");
    expect(readFileSync(storePath, "utf8")).toBe(invalidAddresses);
  });
});

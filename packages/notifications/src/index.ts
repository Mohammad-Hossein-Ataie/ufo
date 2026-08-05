import type { AnalyticsEvent } from "@ufo/types";
import { normalizeIranPhone } from "@ufo/validation";

export interface SmsProvider {
  sendOtp(phone: string, code: string): Promise<{ providerId: string }>;
  sendOrderStatus(phone: string, messageFa: string): Promise<{ providerId: string }>;
  sendRestockAlert(phone: string, productNameFa: string): Promise<{ providerId: string }>;
}

export interface AnalyticsProvider {
  track(event: AnalyticsEvent): Promise<void>;
}

export class MockSmsProvider implements SmsProvider {
  readonly sent: Array<{ phone: string; messageFa: string; type: string }> = [];

  async sendOtp(phone: string, code: string): Promise<{ providerId: string }> {
    const normalizedPhone = normalizeIranPhone(phone);
    this.sent.push({ phone: normalizedPhone, messageFa: `کد ورود شما: ${code}`, type: "otp" });
    return { providerId: `mock_sms_${this.sent.length}` };
  }

  async sendOrderStatus(phone: string, messageFa: string): Promise<{ providerId: string }> {
    const normalizedPhone = normalizeIranPhone(phone);
    this.sent.push({ phone: normalizedPhone, messageFa, type: "order_status" });
    return { providerId: `mock_sms_${this.sent.length}` };
  }

  async sendRestockAlert(phone: string, productNameFa: string): Promise<{ providerId: string }> {
    const normalizedPhone = normalizeIranPhone(phone);
    this.sent.push({
      phone: normalizedPhone,
      messageFa: `${productNameFa} دوباره موجود شد.`,
      type: "restock"
    });
    return { providerId: `mock_sms_${this.sent.length}` };
  }
}

export class MockAnalyticsProvider implements AnalyticsProvider {
  readonly events: AnalyticsEvent[] = [];

  async track(event: AnalyticsEvent): Promise<void> {
    this.events.push({
      ...event,
      properties: removeSensitiveAnalyticsProperties(event.properties)
    });
  }
}

export function removeSensitiveAnalyticsProperties(
  properties: AnalyticsEvent["properties"],
): AnalyticsEvent["properties"] {
  const blocked = new Set(["phone", "mobile", "email", "address", "name", "receiverName"]);
  return Object.fromEntries(Object.entries(properties).filter(([key]) => !blocked.has(key)));
}

import { quoteShipping } from "@ufo/domain";
import type { ShippingAddress, ShippingMethodCode, ShippingQuote } from "@ufo/types";

export interface ShippingProvider {
  quote(address: ShippingAddress, method: ShippingMethodCode): Promise<ShippingQuote>;
  createShipment(orderId: string, method: ShippingMethodCode): Promise<{ shipmentId: string; trackingCode?: string }>;
}

export interface TipaxProvider {
  createTipaxShipment(orderId: string, address: ShippingAddress): Promise<{ trackingCode: string }>;
}

export interface CourierProvider {
  createTehranCourier(orderId: string, address: ShippingAddress): Promise<{ courierId: string }>;
}

export class MockShippingProvider implements ShippingProvider {
  async quote(address: ShippingAddress, method: ShippingMethodCode): Promise<ShippingQuote> {
    return quoteShipping(address, method);
  }

  async createShipment(orderId: string, method: ShippingMethodCode): Promise<{ shipmentId: string; trackingCode?: string }> {
    return {
      shipmentId: `ship_${orderId}_${method}`,
      ...(method === "pickup" ? {} : { trackingCode: `MOCK-${orderId.slice(-6)}` })
    };
  }
}

export class MockTipaxProvider implements TipaxProvider {
  async createTipaxShipment(orderId: string, _address: ShippingAddress): Promise<{ trackingCode: string }> {
    return { trackingCode: `TIPAX-MOCK-${orderId.slice(-6)}` };
  }
}

export class MockCourierProvider implements CourierProvider {
  async createTehranCourier(orderId: string, _address: ShippingAddress): Promise<{ courierId: string }> {
    return { courierId: `TEH-MOCK-${orderId.slice(-6)}` };
  }
}

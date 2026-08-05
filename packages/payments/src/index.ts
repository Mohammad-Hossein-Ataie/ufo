export interface PaymentProvider {
  createPaymentIntent(orderId: string, totalRial: number): Promise<{ paymentId: string; instructionsFa: string }>;
  verifyReceipt(orderId: string, receiptKey: string): Promise<{ status: "pending_review"; receiptKey: string }>;
}

export class ManualCardToCardPaymentProvider implements PaymentProvider {
  async createPaymentIntent(orderId: string, totalRial: number): Promise<{ paymentId: string; instructionsFa: string }> {
    return {
      paymentId: `manual_${orderId}`,
      instructionsFa: `مبلغ ${new Intl.NumberFormat("fa-IR").format(Math.round(totalRial / 10))} تومان را کارت‌به‌کارت کنید و رسید را بارگذاری کنید.`
    };
  }

  async verifyReceipt(_orderId: string, receiptKey: string): Promise<{ status: "pending_review"; receiptKey: string }> {
    return { status: "pending_review", receiptKey };
  }
}

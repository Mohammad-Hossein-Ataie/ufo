import { confirmGatewayPayment, markGatewayPaymentFailed, type SubmittedOrder } from "@ufo/orders";
import { verifyZibalPayment } from "@/lib/zibal";
import { paymentDiagnostic } from "@/lib/payment-diagnostics";

export async function reconcileZibalOrder(
  order: SubmittedOrder,
  trackId: string,
  correlationId?: string,
): Promise<"paid" | "pending" | "failed"> {
  if (
    order.paymentMethod !== "zibal" ||
    !order.gatewayPayments?.some((attempt) => attempt.trackId === trackId)
  )
    throw new Error("تراکنش برای این سفارش ثبت نشده است.");
  const context = { orderId: order.id, correlationId };
  const result = await verifyZibalPayment(trackId, context);
  if (result.paid) {
    if (result.orderId !== order.id || result.amountRial !== order.totalRial || !result.refNumber)
      throw new Error("مشخصات تراکنش با سفارش تطابق ندارد؛ با پشتیبانی تماس بگیرید.");
    confirmGatewayPayment({
      orderId: order.id,
      trackId,
      amountRial: result.amountRial,
      refNumber: result.refNumber,
      ...(result.paidAt ? { paidAt: result.paidAt } : {}),
    });
    paymentDiagnostic("ZIBAL_VERIFY", "reconciled", { ...context, outcome: "paid" });
    return "paid";
  }
  if (result.status !== -1 && result.status !== 1 && result.status !== 2) {
    markGatewayPaymentFailed(order.id, trackId);
    paymentDiagnostic("ZIBAL_VERIFY", "reconciled", { ...context, outcome: "failed" });
    return "failed";
  }
  paymentDiagnostic("ZIBAL_VERIFY", "reconciled", { ...context, outcome: "pending" });
  return "pending";
}

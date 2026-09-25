import { confirmGatewayPayment, markGatewayPaymentFailed, type SubmittedOrder } from "@ufo/orders";
import { verifyZibalPayment } from "@/lib/zibal";

export async function reconcileZibalOrder(
  order: SubmittedOrder,
  trackId: string,
): Promise<"paid" | "pending" | "failed"> {
  if (
    order.paymentMethod !== "zibal" ||
    !order.gatewayPayments?.some((attempt) => attempt.trackId === trackId)
  )
    throw new Error("تراکنش برای این سفارش ثبت نشده است.");
  const result = await verifyZibalPayment(trackId);
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
    return "paid";
  }
  if (result.status !== -1 && result.status !== 1 && result.status !== 2) {
    markGatewayPaymentFailed(order.id, trackId);
    return "failed";
  }
  return "pending";
}

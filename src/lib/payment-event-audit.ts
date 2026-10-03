type ProviderEntity = {
  id?: unknown;
  order_id?: unknown;
  payment_id?: unknown;
  amount?: unknown;
  currency?: unknown;
  status?: unknown;
};

type WebhookLike = {
  event?: unknown;
  payload?: {
    payment?: { entity?: ProviderEntity };
    refund?: { entity?: ProviderEntity };
  };
};

function cleanEntity(entity: ProviderEntity | undefined) {
  if (!entity) return undefined;

  const cleaned: Record<string, string | number> = {};
  if (typeof entity.id === "string") cleaned.id = entity.id;
  if (typeof entity.order_id === "string") cleaned.order_id = entity.order_id;
  if (typeof entity.payment_id === "string") cleaned.payment_id = entity.payment_id;
  if (typeof entity.amount === "number" && Number.isSafeInteger(entity.amount)) cleaned.amount = entity.amount;
  if (typeof entity.currency === "string") cleaned.currency = entity.currency;
  if (typeof entity.status === "string") cleaned.status = entity.status;
  return cleaned;
}

export function paymentEventAuditPayload(payload: WebhookLike) {
  return {
    event: typeof payload.event === "string" ? payload.event : "unknown",
    ...(payload.payload?.payment?.entity
      ? { payment: cleanEntity(payload.payload.payment.entity) }
      : {}),
    ...(payload.payload?.refund?.entity
      ? { refund: cleanEntity(payload.payload.refund.entity) }
      : {}),
  };
}

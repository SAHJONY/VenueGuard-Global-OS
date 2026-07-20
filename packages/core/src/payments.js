import { randomUUID } from "node:crypto";

export class PaymentControl {
  #payments = [];

  simulateCharge({ tenantId, venueId, amount, currency = "USD", purpose, customerId }) {
    if (amount <= 0) throw new Error("INVALID_AMOUNT");
    const payment = Object.freeze({ id: randomUUID(), tenantId, venueId, amount, currency, purpose, customerId, status: "SIMULATED_CAPTURED", createdAt: new Date().toISOString() });
    this.#payments.push(payment);
    return payment;
  }

  initiateLiveCharge() {
    throw new Error("LIVE_PAYMENT_PROVIDER_NOT_CONFIGURED");
  }
}

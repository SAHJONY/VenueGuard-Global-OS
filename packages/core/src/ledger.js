import { randomUUID } from "node:crypto";

export class OperationalLedger {
  #events = [];

  append(input) {
    for (const field of ["tenantId", "venueId", "type", "source", "occurredAt"]) {
      if (!input[field]) throw new Error(`MISSING_${field.toUpperCase()}`);
    }
    if (this.#events.some(event => event.idempotencyKey === input.idempotencyKey && input.idempotencyKey)) {
      return this.#events.find(event => event.idempotencyKey === input.idempotencyKey);
    }
    const event = Object.freeze({
      id: randomUUID(),
      recordedAt: new Date().toISOString(),
      ...structuredClone(input)
    });
    this.#events.push(event);
    return event;
  }

  list({ tenantId, venueId, limit = 100 }) {
    return this.#events
      .filter(event => event.tenantId === tenantId && (!venueId || event.venueId === venueId))
      .slice(-Math.min(limit, 500));
  }

  summary({ tenantId, venueId }) {
    const events = this.list({ tenantId, venueId, limit: 500 });
    const total = type => events.filter(event => event.type === type)
      .reduce((sum, event) => sum + Number(event.amount || 0), 0);
    return {
      grossSales: total("SALE_COMPLETED"),
      refunds: total("REFUND_COMPLETED"),
      tips: total("TIP_COLLECTED"),
      inventoryVariance: total("INVENTORY_VARIANCE"),
      openAlerts: events.filter(event => event.type === "ALERT_OPENED").length,
      eventCount: events.length
    };
  }
}

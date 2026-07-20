import { randomUUID } from "node:crypto";

export class InventoryEngine {
  #items = new Map();
  #movements = [];

  receive({ tenantId, venueId, sku, name, quantity, unitCost, supplierId, lotId = randomUUID() }) {
    if (quantity <= 0 || unitCost < 0) throw new Error("INVALID_RECEIPT");
    const key = `${tenantId}:${venueId}:${sku}`;
    const current = this.#items.get(key) || { tenantId, venueId, sku, name, quantity: 0, value: 0 };
    current.quantity += quantity;
    current.value += quantity * unitCost;
    this.#items.set(key, current);
    return this.#record("RECEIVED", { tenantId, venueId, sku, quantity, unitCost, supplierId, lotId });
  }

  consume({ tenantId, venueId, sku, quantity, saleId, recipeId }) {
    const key = `${tenantId}:${venueId}:${sku}`;
    const current = this.#items.get(key);
    if (!current || current.quantity < quantity) throw new Error("INSUFFICIENT_INVENTORY");
    const averageCost = current.quantity ? current.value / current.quantity : 0;
    current.quantity -= quantity;
    current.value -= averageCost * quantity;
    return this.#record("CONSUMED", { tenantId, venueId, sku, quantity, cost: averageCost * quantity, saleId, recipeId });
  }

  stock({ tenantId, venueId }) {
    return [...this.#items.values()].filter(item => item.tenantId === tenantId && item.venueId === venueId).map(item => ({ ...item }));
  }

  trace({ tenantId, sku }) {
    return this.#movements.filter(movement => movement.tenantId === tenantId && movement.sku === sku);
  }

  #record(type, data) {
    const movement = Object.freeze({ id: randomUUID(), type, at: new Date().toISOString(), ...data });
    this.#movements.push(movement);
    return movement;
  }
}

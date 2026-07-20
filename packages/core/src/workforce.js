import { randomUUID } from "node:crypto";

export class WorkforceEngine {
  #shifts = new Map();
  #earnings = [];

  clockIn({ tenantId, venueId, employeeId, role }) {
    if ([...this.#shifts.values()].some(shift => shift.employeeId === employeeId && !shift.endedAt)) throw new Error("SHIFT_ALREADY_OPEN");
    const shift = { id: randomUUID(), tenantId, venueId, employeeId, role, startedAt: new Date().toISOString(), endedAt: null };
    this.#shifts.set(shift.id, shift);
    return { ...shift };
  }

  attributeSale({ shiftId, saleId, gross, tip = 0, commission = 0 }) {
    const shift = this.#shifts.get(shiftId);
    if (!shift || shift.endedAt) throw new Error("ACTIVE_SHIFT_REQUIRED");
    const earning = Object.freeze({ id: randomUUID(), tenantId: shift.tenantId, employeeId: shift.employeeId, shiftId, saleId, gross, tip, commission, status: "PENDING" });
    this.#earnings.push(earning);
    return earning;
  }

  closeShift(shiftId) {
    const shift = this.#shifts.get(shiftId);
    if (!shift || shift.endedAt) throw new Error("ACTIVE_SHIFT_REQUIRED");
    shift.endedAt = new Date().toISOString();
    const rows = this.#earnings.filter(row => row.shiftId === shiftId);
    return { ...shift, sales: rows.reduce((s, r) => s + r.gross, 0), tips: rows.reduce((s, r) => s + r.tip, 0), commission: rows.reduce((s, r) => s + r.commission, 0), requiresManagerReview: true };
  }

  employeeEarnings({ tenantId, employeeId }) {
    return this.#earnings.filter(row => row.tenantId === tenantId && row.employeeId === employeeId);
  }
}

import { randomUUID } from "node:crypto";

export class ArtistMarketplace {
  #offers = new Map();

  propose({ tenantId, artistId, venueId, startsAt, guarantee, ticketSharePct, merchandiseSharePct, contractTemplateId }) {
    const offer = { id: randomUUID(), tenantId, artistId, venueId, startsAt, guarantee, ticketSharePct, merchandiseSharePct, contractTemplateId, status: "PROPOSED", version: 1 };
    this.#offers.set(offer.id, offer);
    return { ...offer };
  }

  accept({ offerId, artistApproval, ownerApproval, signedContractId, depositPaymentId }) {
    const offer = this.#offers.get(offerId);
    if (!offer || offer.status !== "PROPOSED") throw new Error("OFFER_NOT_AVAILABLE");
    if (!artistApproval || !ownerApproval || !signedContractId || !depositPaymentId) throw new Error("CONTRACT_AND_APPROVAL_REQUIRED");
    Object.assign(offer, { status: "CONFIRMED", signedContractId, depositPaymentId, confirmedAt: new Date().toISOString() });
    return { ...offer };
  }

  settle({ offerId, ticketRevenue, merchandiseRevenue, documentedDeductions = [] }) {
    const offer = this.#offers.get(offerId);
    if (!offer || offer.status !== "CONFIRMED") throw new Error("CONFIRMED_OFFER_REQUIRED");
    if (documentedDeductions.some(row => !row.evidenceId)) throw new Error("DEDUCTION_EVIDENCE_REQUIRED");
    const percentage = ticketRevenue * offer.ticketSharePct / 100 + merchandiseRevenue * (100 - offer.merchandiseSharePct) / 100;
    const deductions = documentedDeductions.reduce((sum, row) => sum + row.amount, 0);
    return { offerId, artistPayable: Math.max(offer.guarantee, percentage) - deductions, deductions, requiresOwnerApproval: true, status: "DRAFT" };
  }
}

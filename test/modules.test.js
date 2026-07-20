import test from "node:test";
import assert from "node:assert/strict";
import { InventoryEngine, WorkforceEngine, TicketingEngine, ArtistMarketplace, PaymentControl } from "../packages/core/src/index.js";

test("inventory traces supplier receipt into a sale consumption", () => {
  const inventory = new InventoryEngine();
  inventory.receive({ tenantId: "t", venueId: "v", sku: "rum", name: "Rum", quantity: 25, unitCost: 2, supplierId: "s" });
  inventory.consume({ tenantId: "t", venueId: "v", sku: "rum", quantity: 1, saleId: "sale-1", recipeId: "mojito" });
  assert.equal(inventory.stock({ tenantId: "t", venueId: "v" })[0].quantity, 24);
  assert.equal(inventory.trace({ tenantId: "t", sku: "rum" }).length, 2);
});

test("employee sales produce visible pending tips", () => {
  const workforce = new WorkforceEngine();
  const shift = workforce.clockIn({ tenantId: "t", venueId: "v", employeeId: "e", role: "BARTENDER" });
  workforce.attributeSale({ shiftId: shift.id, saleId: "sale", gross: 20, tip: 4 });
  assert.equal(workforce.employeeEarnings({ tenantId: "t", employeeId: "e" })[0].tip, 4);
  assert.equal(workforce.closeShift(shift.id).requiresManagerReview, true);
});

test("ticket capacity cannot be oversold and a ticket cannot be reused", () => {
  const tickets = new TicketingEngine();
  const event = tickets.createEvent({ tenantId: "t", venueId: "v", name: "Show", startsAt: new Date().toISOString(), capacity: 2, price: 25 });
  const reservation = tickets.reserve({ eventId: event.id, customerId: "c", partySize: 2 });
  assert.throws(() => tickets.reserve({ eventId: event.id, customerId: "x", partySize: 1 }));
  const issued = tickets.purchase({ reservationId: reservation.id, paymentId: "p" });
  tickets.checkIn(issued[0].id);
  assert.throws(() => tickets.checkIn(issued[0].id));
});

test("artist booking requires contract, approvals, and deposit", () => {
  const market = new ArtistMarketplace();
  const offer = market.propose({ tenantId: "t", artistId: "a", venueId: "v", startsAt: new Date().toISOString(), guarantee: 1000, ticketSharePct: 70, merchandiseSharePct: 10, contractTemplateId: "ct" });
  assert.throws(() => market.accept({ offerId: offer.id }));
  assert.equal(market.accept({ offerId: offer.id, artistApproval: true, ownerApproval: true, signedContractId: "c", depositPaymentId: "p" }).status, "CONFIRMED");
});

test("payments remain simulated until a regulated provider is configured", () => {
  const payments = new PaymentControl();
  assert.equal(payments.simulateCharge({ tenantId: "t", venueId: "v", amount: 25, purpose: "TICKET", customerId: "c" }).status, "SIMULATED_CAPTURED");
  assert.throws(() => payments.initiateLiveCharge());
});

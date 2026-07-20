import { createHash, randomUUID } from "node:crypto";

export class TicketingEngine {
  #events = new Map();
  #tickets = new Map();
  #reservations = new Map();

  createEvent({ tenantId, venueId, name, startsAt, capacity, price }) {
    const event = { id: randomUUID(), tenantId, venueId, name, startsAt, capacity, price, sold: 0, reserved: 0 };
    this.#events.set(event.id, event);
    return { ...event };
  }

  reserve({ eventId, customerId, partySize, expiresInMinutes = 15 }) {
    const event = this.#events.get(eventId);
    if (!event || event.sold + event.reserved + partySize > event.capacity) throw new Error("CAPACITY_UNAVAILABLE");
    const reservation = { id: randomUUID(), eventId, customerId, partySize, status: "HELD", expiresAt: new Date(Date.now() + expiresInMinutes * 60000).toISOString() };
    event.reserved += partySize;
    this.#reservations.set(reservation.id, reservation);
    return { ...reservation };
  }

  purchase({ reservationId, paymentId }) {
    const reservation = this.#reservations.get(reservationId);
    if (!reservation || reservation.status !== "HELD" || Date.parse(reservation.expiresAt) < Date.now()) throw new Error("RESERVATION_INVALID");
    const event = this.#events.get(reservation.eventId);
    reservation.status = "PURCHASED";
    event.reserved -= reservation.partySize;
    event.sold += reservation.partySize;
    return Array.from({ length: reservation.partySize }, (_, index) => {
      const id = randomUUID();
      const ticket = { id, eventId: event.id, customerId: reservation.customerId, paymentId, status: "VALID", token: createHash("sha256").update(`${id}:${index}:${paymentId}`).digest("hex") };
      this.#tickets.set(ticket.id, ticket);
      return { ...ticket };
    });
  }

  checkIn(ticketId) {
    const ticket = this.#tickets.get(ticketId);
    if (!ticket || ticket.status !== "VALID") throw new Error("TICKET_INVALID");
    ticket.status = "USED";
    ticket.usedAt = new Date().toISOString();
    return { ...ticket };
  }
}

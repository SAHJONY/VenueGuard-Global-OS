export const summary = Object.freeze({
  grossSales: 14820,
  refunds: 0,
  tips: 2214,
  inventoryVariance: -84,
  openAlerts: 1,
  eventCount: 4,
  environment: "DEMO"
});

export const events = Object.freeze([
  { id: "demo-4", type: "ALERT_OPENED", source: "risk-engine", amount: 0 },
  { id: "demo-3", type: "INVENTORY_VARIANCE", source: "inventory", amount: -84 },
  { id: "demo-2", type: "TIP_COLLECTED", source: "payments", amount: 2214 },
  { id: "demo-1", type: "SALE_COMPLETED", source: "pos", amount: 14820 }
]);

export const ecosystem = Object.freeze({
  venue: { name: "VELVET TH", city: "Chicago", currency: "USD", timezone: "America/Chicago" },
  network: { venues: 4, live: 3, monthlyRevenue: 684320, monthlyGrowthPct: 18.4 },
  economics: { revenue: 37080, variableCosts: 18842, contribution: 18238, marginPct: 49.2, revenuePerGuest: 49.97 },
  forecast: { projectedClose: 42600, target: 40000, confidencePct: 91, current: 37080 },
  hourlyRevenue: [
    { hour: "8 PM", actual: 2200, forecast: 2400 }, { hour: "9 PM", actual: 5100, forecast: 4800 },
    { hour: "10 PM", actual: 8900, forecast: 8200 }, { hour: "11 PM", actual: 11200, forecast: 10500 },
    { hour: "12 AM", actual: 9680, forecast: 10100 }, { hour: "1 AM", actual: null, forecast: 4900 },
    { hour: "2 AM", actual: null, forecast: 1700 }
  ],
  opportunities: [
    { id: "opp-1", title: "Release 14 no-show VIP tables", detail: "Waitlist demand can recover otherwise lost inventory", recoverable: 2380, confidence: 0.94, urgency: 1.5, owner: "Guest Ops", action: "Release tables", severity: "critical" },
    { id: "opp-2", title: "Raise final-release ticket price", detail: "158 tickets remain; demand is 22% above baseline", recoverable: 1896, confidence: 0.88, urgency: 1.25, owner: "Revenue AI", action: "Approve +$12", severity: "high" },
    { id: "opp-3", title: "Investigate tequila variance", detail: "0.4 bottles outside recipe tolerance at Bar 2", recoverable: 84, confidence: 0.99, urgency: 1.1, owner: "Bar Lead", action: "Assign review", severity: "medium" }
  ],
  channels: [
    { label: "Bar & table service", amount: 14820, growth: 12 }, { label: "Direct tickets", amount: 22260, growth: 24 },
    { label: "Reservations", amount: 6480, growth: 9 }, { label: "Sponsorship", amount: 4200, growth: 31 }
  ],
  customer: { repeatRatePct: 38, vipGuests: 126, waitlist: 94, averageSpend: 50, capturedProfilesPct: 87 },
  modules: [
    { id: "cash", label: "Cash control", status: "live", metric: "$14,820", detail: "Sales, refunds, tips and close reconciliation" },
    { id: "inventory", label: "Inventory", status: "attention", metric: "98.6%", detail: "Supplier-to-consumption traceability" },
    { id: "workforce", label: "Workforce", status: "live", metric: "18 on shift", detail: "Employee sales, tips and amounts due" },
    { id: "tickets", label: "Tickets & reservations", status: "live", metric: "742 sold", detail: "Capacity, reservations and one-use entry" },
    { id: "artists", label: "Artists", status: "ready", metric: "3 offers", detail: "Tariffs, contracts, dates and settlements" },
    { id: "risk", label: "AI risk desk", status: "attention", metric: "1 alert", detail: "Variance detection and owner approvals" }
  ],
  cashflow: [
    { label: "Gross sales", amount: 14820 }, { label: "Tips held", amount: 2214 },
    { label: "Tax reserve", amount: -1186 }, { label: "Artist reserve", amount: -3200 },
    { label: "Processor fees", amount: -431 }, { label: "Available cash", amount: 12217 }
  ],
  inventory: [
    { sku: "BAR-TEQ-01", item: "Premium tequila", received: 48, consumed: 31.4, sold: 31, variance: -0.4, state: "review" },
    { sku: "BAR-CHP-02", item: "House champagne", received: 60, consumed: 44, sold: 44, variance: 0, state: "balanced" },
    { sku: "BAR-WTR-03", item: "Sparkling water", received: 144, consumed: 92, sold: 92, variance: 0, state: "balanced" }
  ],
  workforce: [
    { employee: "Maya R.", role: "Bartender", sales: 2840, tips: 426, due: 426 },
    { employee: "Luis A.", role: "Server", sales: 2310, tips: 381, due: 381 },
    { employee: "Nina K.", role: "VIP host", sales: 4190, tips: 612, due: 712 }
  ],
  ticketing: { event: "Velvet Saturdays", capacity: 900, sold: 742, checkedIn: 418, reservations: 36, revenue: 22260 },
  artists: [
    { artist: "Nova Rey", date: "2026-08-08", tariff: 8500, contract: "awaiting signature", settlement: "not funded" },
    { artist: "DJ Sol", date: "2026-08-15", tariff: 4200, contract: "approved", settlement: "deposit secured" },
    { artist: "Luna Norte", date: "2026-08-22", tariff: 6700, contract: "under review", settlement: "not funded" }
  ],
  controls: [
    "Owner-only payout destination changes",
    "Dual approval for refunds above $250",
    "Every sale attributed to employee, register and item",
    "No inventory adjustment without reason and evidence",
    "Ticket can be checked in only once",
    "Artist settlement cannot exceed approved contract"
  ],
  portals: {
    OWNER: { title: "Owner Command Center", subtitle: "Unrestricted tenant authority", stats: [["Controlled revenue", "$14,820"],["Open alerts", "1"],["Venues", "1"]], actions: ["Approve high-value refund", "Lock payout destination", "Export immutable audit"] },
    EMPLOYEE: { title: "Employee Shift Wallet", subtitle: "Only your own shift, sales, tips and amounts due", stats: [["My attributed sales", "$2,840"],["My tips", "$426"],["Amount due", "$426"]], actions: ["Scan sale", "View shift", "Request tip payout"] },
    CUSTOMER: { title: "Guest Experience", subtitle: "Discover, reserve and buy directly from the venue", stats: [["Upcoming tickets", "2"],["Reservations", "1"],["Reward balance", "1,240"]], actions: ["Buy tickets", "Reserve a table", "View my passes"] },
    ARTIST: { title: "Artist Tour Desk", subtitle: "Control offers, dates, merchandise and settlements", stats: [["Active offers", "3"],["Confirmed shows", "1"],["Pending settlement", "$4,200"]], actions: ["Submit tariff", "Propose show date", "Review contract"] }
  }
});

export const globalCatalog = Object.freeze({
  locales: [{ id: "en-US", label: "English" }, { id: "es-US", label: "Español" }],
  venues: [
    { id: "velvet-th", name: "VELVET TH", type: "NIGHTCLUB", city: "Chicago", country: "US", currency: "USD", timezone: "America/Chicago", status: "LIVE" },
    { id: "arena-demo", name: "Global Arena Demo", type: "ARENA", city: "Mexico City", country: "MX", currency: "MXN", timezone: "America/Mexico_City", status: "ONBOARDING" },
    { id: "restaurant-demo", name: "Velvet Dining Demo", type: "RESTAURANT", city: "Madrid", country: "ES", currency: "EUR", timezone: "Europe/Madrid", status: "ONBOARDING" }
  ],
  onboarding: ["Business identity", "Owner verification", "Venue configuration", "Payments and bank", "Inventory import", "Staff invitations", "Go-live review"],
  translations: {
    "en-US": { access: "ACCESS", operational: "Systems operational", demo: "Representative data only · no live money movement" },
    "es-US": { access: "ACCESO", operational: "Sistemas operativos", demo: "Datos representativos · sin movimiento de dinero real" }
  }
});

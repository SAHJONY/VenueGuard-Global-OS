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
  ]
});

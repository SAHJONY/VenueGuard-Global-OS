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

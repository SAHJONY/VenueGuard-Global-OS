import { reconcile, evaluateClose, auditSettlement, screenKyc, venueEconomics } from "./index.js";

const reconciliation = reconcile({
  sales: [{ gross: 10000, refund: 200 }],
  settlements: [{ net: 9800 }],
  deposits: [{ amount: 9800 }],
  inventory: [{ theoreticalCost: 2500, actualCost: 2500 }],
  tips: [{ collected: 1200, allocated: 1200 }]
});

console.log(JSON.stringify({
  reconciliation,
  close: evaluateClose({ reconciliation, requiredAccounts: ["cash", "processor", "inventory"], signedAccounts: ["cash", "processor", "inventory"] }),
  artistSettlement: auditSettlement({ eventId: "evt_1", partyId: "artist_1", grossRevenue: 10000, deductions: [{ label: "venue", amount: 2000, evidenceId: "contract_1" }], netPayable: 8000, evidence: ["contract_1"] }),
  kyc: screenKyc({ type: "BUSINESS", legalName: process.env.PILOT_VENUE_NAME || "Demo Venue", registrationNumber: "demo", registeredAddress: "demo", taxId: "demo", beneficialOwners: ["owner_1"], bankOwnershipEvidence: "demo" }),
  economics: venueEconomics({ revenue: 10000, cogs: 2500, labor: 1500, artistCost: 2000, marketing: 500, processingFees: 300, fixedCosts: 700, attendance: 400 })
}, null, 2));

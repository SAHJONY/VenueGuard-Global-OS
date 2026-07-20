const requirements = {
  INDIVIDUAL: ["legalName", "dateOfBirth", "address", "identityDocument", "taxId", "bankOwnershipEvidence"],
  BUSINESS: ["legalName", "registrationNumber", "registeredAddress", "taxId", "beneficialOwners", "bankOwnershipEvidence"]
};

export function screenKyc(subject) {
  const required = requirements[subject.type] || [];
  const missing = required.filter(field => !subject[field] || (Array.isArray(subject[field]) && subject[field].length === 0));
  const flags = [];
  if (!requirements[subject.type]) flags.push("unsupported entity type");
  if (subject.nameMismatch) flags.push("name mismatch requires review");
  if (subject.expiredDocument) flags.push("expired identity document");
  return {
    completeness: required.length ? Math.round(((required.length - missing.length) / required.length) * 100) : 0,
    missing, flags,
    recommendation: missing.length || flags.length ? "MANUAL_REVIEW" : "READY_FOR_PROVIDER_SCREENING",
    approved: false,
    disclaimer: "Preliminary completeness screening only; not KYC/AML approval."
  };
}

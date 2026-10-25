/**
 * GDPR Lawful Basis Evaluator (Article 6)
 * Helps identify and document the correct lawful basis for each processing activity.
 */

const LAWFUL_BASES = {
  consent: {
    article: "Art. 6(1)(a)",
    name: "Consent",
    description: "The data subject has given clear, affirmative consent.",
    whenToUse: ["Marketing emails", "Non-essential cookies", "Optional profiling"],
    requirements: ["Freely given", "Specific", "Informed", "Unambiguous", "Withdrawable"],
    risks: ["Withdrawal stops processing", "Requires ongoing consent management"],
  },
  contract: {
    article: "Art. 6(1)(b)",
    name: "Contract",
    description: "Processing is necessary to perform a contract with the individual, or to take pre-contractual steps.",
    whenToUse: ["Delivering a paid service", "Processing payment", "Managing an account"],
    requirements: ["Processing must be necessary — not just convenient"],
    risks: ["Cannot rely on this for processing beyond what is strictly needed for the contract"],
  },
  legal_obligation: {
    article: "Art. 6(1)(c)",
    name: "Legal Obligation",
    description: "Processing is necessary to comply with a legal duty.",
    whenToUse: ["Tax reporting", "Anti-money laundering checks", "Employee records"],
    requirements: ["The obligation must be in EU or Member State law"],
    risks: ["Must identify specific legal obligation"],
  },
  vital_interests: {
    article: "Art. 6(1)(d)",
    name: "Vital Interests",
    description: "Processing is necessary to protect someone's life.",
    whenToUse: ["Medical emergencies", "Humanitarian aid"],
    requirements: ["Only when no other basis is available"],
    risks: ["Narrow and rarely applicable"],
  },
  public_task: {
    article: "Art. 6(1)(e)",
    name: "Public Task",
    description: "Processing is necessary for a task carried out in the public interest.",
    whenToUse: ["Government functions", "Public health surveillance", "Education authorities"],
    requirements: ["Must have a clear basis in law"],
    risks: ["Not applicable to most private organisations"],
  },
  legitimate_interests: {
    article: "Art. 6(1)(f)",
    name: "Legitimate Interests",
    description: "Processing is necessary for the legitimate interests of the controller or a third party, unless overridden by the rights of the data subject.",
    whenToUse: ["Fraud prevention", "Network security", "Direct marketing to existing customers", "Internal admin"],
    requirements: ["Must complete a Legitimate Interests Assessment (LIA)", "Interests must not be overridden by individual's rights"],
    risks: ["Individuals can object (Art. 21)", "Requires documented LIA"],
  },
};

/**
 * Get details for a specific lawful basis.
 */
function getLawfulBasis(key) {
  return LAWFUL_BASES[key] || null;
}

/**
 * Get all lawful bases (for display/selection).
 */
function getAllLawfulBases() {
  return Object.entries(LAWFUL_BASES).map(([key, value]) => ({ key, ...value }));
}

/**
 * Suggest lawful bases for a given processing activity description.
 * Simple keyword matching — use as a starting point, not a definitive answer.
 */
function suggestLawfulBasis(processingDescription) {
  const desc = processingDescription.toLowerCase();
  const suggestions = [];

  if (desc.includes("market") || desc.includes("newsletter") || desc.includes("promotional"))
    suggestions.push("consent");
  if (desc.includes("payment") || desc.includes("deliver") || desc.includes("account") || desc.includes("subscription"))
    suggestions.push("contract");
  if (desc.includes("tax") || desc.includes("legal") || desc.includes("regulatory") || desc.includes("compliance"))
    suggestions.push("legal_obligation");
  if (desc.includes("fraud") || desc.includes("security") || desc.includes("analytics") || desc.includes("improve"))
    suggestions.push("legitimate_interests");
  if (desc.includes("government") || desc.includes("public health") || desc.includes("authority"))
    suggestions.push("public_task");

  return suggestions.length ? suggestions : ["legitimate_interests", "consent"];
}

module.exports = { LAWFUL_BASES, getLawfulBasis, getAllLawfulBases, suggestLawfulBasis };

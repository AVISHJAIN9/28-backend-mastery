/**
 * Data Protection Impact Assessment (DPIA) – GDPR Article 35
 * Required when processing is "likely to result in a high risk" to individuals.
 */

// Processing activities that require a DPIA (Art. 35(3) and WP29 guidelines):
const DPIA_TRIGGERS = [
  "Systematic and extensive profiling with significant effects",
  "Large-scale processing of special category data (health, biometric, etc.)",
  "Systematic monitoring of publicly accessible areas (CCTV)",
  "Innovative technology (AI, biometrics, IoT at scale)",
  "Processing that prevents access to a service or contract",
  "Large-scale processing of data relating to children",
  "Matching or combining datasets from different sources",
  "Automated decision-making with legal or similarly significant effects",
];

/**
 * Generate a DPIA template for a given processing activity.
 */
function generateDPIATemplate(activity) {
  return {
    metadata: {
      title: `DPIA – ${activity.name}`,
      version: "1.0",
      author: activity.dpoEmail || process.env.DPO_EMAIL || "dpo@example.com",
      date: new Date().toISOString().slice(0, 10),
      status: "draft",
    },
    sections: {
      "1_description": {
        title: "Description of Processing",
        questions: [
          "What personal data is collected?",
          "Who is the data subject?",
          "What is the purpose of processing?",
          "What is the lawful basis?",
          "Who has access to the data?",
          "Where is the data stored?",
          "Are there any cross-border transfers?",
        ],
        answers: activity.description || {},
      },
      "2_necessity_proportionality": {
        title: "Necessity and Proportionality",
        questions: [
          "Is the processing necessary to achieve the stated purpose?",
          "Could a less privacy-invasive approach achieve the same result?",
          "Is the volume of data collected proportionate to the purpose?",
          "What is the retention period and is it justified?",
        ],
        answers: {},
      },
      "3_risk_assessment": {
        title: "Risk Assessment",
        risks: [
          { risk: "Unauthorised access or data breach", likelihood: "medium", severity: "high", riskScore: "high" },
          { risk: "Inaccurate data leading to incorrect decisions", likelihood: "low", severity: "medium", riskScore: "low" },
          { risk: "Data used beyond stated purpose", likelihood: "low", severity: "high", riskScore: "medium" },
          { risk: "Failure to respond to data subject rights requests", likelihood: "low", severity: "medium", riskScore: "low" },
        ],
      },
      "4_measures": {
        title: "Measures to Address Risks",
        measures: [
          "Encryption at rest and in transit",
          "Role-based access control",
          "Regular security testing",
          "Staff training on data protection",
          "Data subject rights request workflow",
          "Incident response plan",
          "Data minimisation and retention policies",
        ],
      },
      "5_dpo_opinion": {
        title: "DPO Consultation",
        questions: [
          "Has the DPO been consulted?",
          "What was the DPO's opinion?",
          "Were any recommendations implemented?",
        ],
        answers: {},
      },
      "6_conclusion": {
        title: "Conclusion",
        residualRisk: "medium",
        approved: false,
        approvedBy: null,
        approvedAt: null,
        supervisoryAuthorityConsultationRequired: false,
      },
    },
  };
}

/**
 * Screen a processing activity to determine if a DPIA is required.
 * @returns {{ required: boolean, triggers: string[] }}
 */
function screenForDPIA(processingDescription) {
  const desc = processingDescription.toLowerCase();
  const matched = DPIA_TRIGGERS.filter(trigger => {
    const keywords = trigger.toLowerCase().split(" ").filter(w => w.length > 4);
    return keywords.some(kw => desc.includes(kw));
  });
  return { required: matched.length > 0, triggers: matched };
}

module.exports = { generateDPIATemplate, screenForDPIA, DPIA_TRIGGERS };

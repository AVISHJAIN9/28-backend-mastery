const { v4: uuidv4 } = require('uuid');

const domains = new Map();
const dnsRecords = new Map();

exports.registerDomain = (req, res) => {
  const { domain } = req.validatedBody;
  const domainId = uuidv4();
  
  if (domains.has(domain)) {
    return res.status(409).json({ error: 'Domain already registered' });
  }
  
  domains.set(domain, {
    id: domainId,
    domain,
    spfVerified: false,
    dkimVerified: false,
    dmarcVerified: false,
    createdAt: new Date(),
  });
  
  res.json({ success: true, id: domainId, domain });
};

exports.getSPFRecord = (req, res) => {
  const { domain } = req.params;
  const spfRecord = `v=spf1 include:sendgrid.net ~all`;
  res.json({
    success: true,
    domain,
    recordType: 'TXT',
    recordName: domain,
    recordValue: spfRecord,
    ttl: 3600,
  });
};

exports.getDKIMRecord = (req, res) => {
  const { domain, selector } = req.params;
  const dkimValue = `v=DKIM1; k=rsa; p=MIGfMA0BgkqhkiG9w0BAQEFAnotFake...`;
  res.json({
    success: true,
    domain,
    selector,
    recordType: 'TXT',
    recordName: `${selector}._domainkey.${domain}`,
    recordValue: dkimValue,
  });
};

exports.getDMARCRecord = (req, res) => {
  const { domain } = req.params;
  const dmarcRecord = `v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain}`;
  res.json({
    success: true,
    domain,
    recordType: 'TXT',
    recordName: `_dmarc.${domain}`,
    recordValue: dmarcRecord,
  });
};

exports.verifyDNS = (req, res) => {
  const { domain, recordType } = req.validatedBody;
  
  // Mock DNS verification
  const verified = Math.random() > 0.3; // 70% pass rate for demo
  
  if (verified) {
    if (!dnsRecords.has(domain)) dnsRecords.set(domain, {});
    dnsRecords.get(domain)[recordType] = true;
  }
  
  res.json({
    success: verified,
    domain,
    recordType,
    verified,
    message: verified ? 'DNS record verified' : 'DNS record not found',
  });
};

exports.getStatus = (req, res) => {
  const { domain } = req.params;
  const domainData = domains.get(domain);
  
  if (!domainData) {
    return res.status(404).json({ error: 'Domain not found' });
  }
  
  const records = dnsRecords.get(domain) || {};
  
  res.json({
    success: true,
    domain,
    spfVerified: records.SPF || false,
    dkimVerified: records.DKIM || false,
    dmarcVerified: records.DMARC || false,
    deliverability: Object.values(records).filter(Boolean).length === 3 ? 'Excellent' : 'Good',
  });
};

module.exports = {
  registerDomain,
  getSPFRecord,
  getDKIMRecord,
  getDMARCRecord,
  verifyDNS,
  getStatus,
};

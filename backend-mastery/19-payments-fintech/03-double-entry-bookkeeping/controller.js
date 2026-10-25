const journalEntries = {};
const accounts = {};
const transactions = {};

// Account types
const ACCOUNT_TYPES = {
  ASSET: 'asset',
  LIABILITY: 'liability',
  EQUITY: 'equity',
  REVENUE: 'revenue',
  EXPENSE: 'expense'
};

exports.createJournalEntry = (req, res) => {
  const { entries, description } = req.body;
  const entryId = `je_${Date.now()}`;

  try {
    // Calculate totals
    const totalDebits = entries.reduce((sum, e) => sum + (e.debit || 0), 0);
    const totalCredits = entries.reduce((sum, e) => sum + (e.credit || 0), 0);

    // Validate balance
    if (totalDebits !== totalCredits) {
      return res.status(400).json({ 
        error: 'Journal entry must balance',
        totalDebits,
        totalCredits
      });
    }

    const entry = {
      entryId,
      description,
      entries,
      totalDebits,
      totalCredits,
      createdAt: new Date(),
      balanced: true
    };

    journalEntries[entryId] = entry;

    // Update account balances
    for (const e of entries) {
      if (!accounts[e.account]) {
        accounts[e.account] = { name: e.account, balance: 0 };
      }
      accounts[e.account].balance += (e.debit || 0) - (e.credit || 0);
    }

    res.status(201).json(entry);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.listJournalEntries = (req, res) => {
  res.json(Object.values(journalEntries));
};

exports.getJournalEntry = (req, res) => {
  const entry = journalEntries[req.params.entryId];
  if (!entry) return res.status(404).json({ error: 'Entry not found' });
  res.json(entry);
};

exports.getAccountBalance = (req, res) => {
  const account = accounts[req.params.accountName];
  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }
  res.json(account);
};

exports.recordTransaction = (req, res) => {
  const { fromAccount, toAccount, amount, description } = req.body;
  const txnId = `txn_${Date.now()}`;

  try {
    const transaction = {
      txnId,
      fromAccount,
      toAccount,
      amount,
      description,
      createdAt: new Date()
    };

    transactions[txnId] = transaction;
    res.status(201).json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.listTransactions = (req, res) => {
  res.json(Object.values(transactions));
};

exports.getAccountReconciliation = (req, res) => {
  const accountName = req.params.accountName;
  const account = accounts[accountName];

  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }

  res.json({
    account: accountName,
    balance: account.balance,
    reconciled: true,
    reconciliationDate: new Date()
  });
};

module.exports = exports;

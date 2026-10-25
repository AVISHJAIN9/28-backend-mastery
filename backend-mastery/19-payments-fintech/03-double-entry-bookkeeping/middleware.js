exports.validateJournalEntry = (req, res, next) => {
  const { entries, description } = req.body;

  if (!entries || !Array.isArray(entries) || entries.length < 2) {
    return res.status(400).json({ error: 'Journal entry must have at least 2 entries' });
  }

  if (!description) {
    return res.status(400).json({ error: 'Description is required' });
  }

  // Validate each entry
  for (const entry of entries) {
    if (!entry.account) {
      return res.status(400).json({ error: 'Each entry must have an account' });
    }
    if (entry.debit === undefined && entry.credit === undefined) {
      return res.status(400).json({ error: 'Each entry must have debit or credit' });
    }
    if ((entry.debit || 0) < 0 || (entry.credit || 0) < 0) {
      return res.status(400).json({ error: 'Amounts must be positive' });
    }
  }

  next();
};

exports.validateTransaction = (req, res, next) => {
  const { fromAccount, toAccount, amount, description } = req.body;

  if (!fromAccount) {
    return res.status(400).json({ error: 'fromAccount is required' });
  }
  if (!toAccount) {
    return res.status(400).json({ error: 'toAccount is required' });
  }
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Amount must be positive' });
  }
  if (!description) {
    return res.status(400).json({ error: 'Description is required' });
  }

  next();
};

module.exports = exports;

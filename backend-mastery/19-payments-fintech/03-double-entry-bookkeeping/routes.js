const express = require('express');
const router = express.Router();
const controller = require('./controller');
const middleware = require('./middleware');

// POST: Create journal entry
router.post('/journal-entries', middleware.validateJournalEntry, controller.createJournalEntry);

// GET: List all journal entries
router.get('/journal-entries', controller.listJournalEntries);

// GET: Get specific journal entry
router.get('/journal-entries/:entryId', controller.getJournalEntry);

// GET: Get account balance
router.get('/accounts/:accountName/balance', controller.getAccountBalance);

// POST: Record transaction
router.post('/transactions', middleware.validateTransaction, controller.recordTransaction);

// GET: List transactions
router.get('/transactions', controller.listTransactions);

// GET: Account reconciliation report
router.get('/accounts/:accountName/reconciliation', controller.getAccountReconciliation);

module.exports = router;

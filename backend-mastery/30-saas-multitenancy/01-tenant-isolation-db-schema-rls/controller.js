// Controllers for tenant isolation features

const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

class TenantController {
  constructor(db) {
    this.db = db;
  }

  /**
   * Get all documents for current tenant
   * RLS automatically filters by tenant_id
   */
  async getDocuments(req, res) {
    try {
      const result = await this.db.query(
        `SELECT 
          d.id, d.title, d.content, d.owner_id, 
          d.is_public, d.created_at, d.updated_at,
          u.name as owner_name
        FROM documents d
        JOIN users u ON d.owner_id = u.id
        ORDER BY d.created_at DESC
        LIMIT 50`
      );

      logger.info('Documents retrieved', {
        tenant_id: req.tenant_id,
        count: result.rows.length
      });

      res.json(result.rows);
    } catch (error) {
      logger.error('Get documents failed', { error: error.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get single document
   * RLS prevents access to other tenant's documents
   */
  async getDocument(req, res) {
    try {
      const result = await this.db.query(
        `SELECT 
          d.id, d.title, d.content, d.owner_id, 
          d.is_public, d.created_at, d.updated_at,
          u.name as owner_name
        FROM documents d
        JOIN users u ON d.owner_id = u.id
        WHERE d.id = $1`,
        [req.params.id]
      );

      if (!result.rows.length) {
        logger.warn('Document not found', {
          document_id: req.params.id,
          tenant_id: req.tenant_id
        });
        return res.status(404).json({ error: 'Not found' });
      }

      logger.info('Document retrieved', { id: req.params.id });
      res.json(result.rows[0]);
    } catch (error) {
      logger.error('Get document failed', { error: error.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Create document for current tenant
   * Automatically associates with tenant and user
   */
  async createDocument(req, res) {
    try {
      const { title, content = '', is_public = false } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'Title required' });
      }

      // RLS will ensure document_id matches tenant
      const result = await this.db.query(
        `INSERT INTO documents 
          (tenant_id, title, content, owner_id, is_public)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, title, content, owner_id, is_public, created_at`,
        [req.tenant_id, title, content, req.user.id, is_public]
      );

      logger.info('Document created', {
        tenant_id: req.tenant_id,
        document_id: result.rows[0].id,
        user_id: req.user.id
      });

      res.status(201).json(result.rows[0]);
    } catch (error) {
      logger.error('Create document failed', { error: error.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update document
   * RLS ensures only tenant's documents can be updated
   */
  async updateDocument(req, res) {
    try {
      const { title, content } = req.body;

      // Verify ownership first
      const docCheck = await this.db.query(
        'SELECT owner_id FROM documents WHERE id = $1',
        [req.params.id]
      );

      if (!docCheck.rows.length) {
        return res.status(404).json({ error: 'Not found' });
      }

      if (docCheck.rows[0].owner_id !== req.user.id && req.user.role !== 'admin') {
        logger.warn('Unauthorized update attempt', {
          user_id: req.user.id,
          document_id: req.params.id
        });
        return res.status(403).json({ error: 'Forbidden' });
      }

      const result = await this.db.query(
        `UPDATE documents 
        SET title = COALESCE($1, title),
            content = COALESCE($2, content),
            updated_at = NOW()
        WHERE id = $3
        RETURNING *`,
        [title, content, req.params.id]
      );

      logger.info('Document updated', { id: req.params.id });
      res.json(result.rows[0]);
    } catch (error) {
      logger.error('Update document failed', { error: error.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Delete document
   * RLS ensures only tenant's documents can be deleted
   */
  async deleteDocument(req, res) {
    try {
      const docCheck = await this.db.query(
        'SELECT owner_id FROM documents WHERE id = $1',
        [req.params.id]
      );

      if (!docCheck.rows.length) {
        return res.status(404).json({ error: 'Not found' });
      }

      if (docCheck.rows[0].owner_id !== req.user.id && req.user.role !== 'admin') {
        logger.warn('Unauthorized delete attempt', {
          user_id: req.user.id,
          document_id: req.params.id
        });
        return res.status(403).json({ error: 'Forbidden' });
      }

      await this.db.query('DELETE FROM documents WHERE id = $1', [req.params.id]);

      logger.info('Document deleted', { id: req.params.id });
      res.json({ success: true });
    } catch (error) {
      logger.error('Delete document failed', { error: error.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get all users in tenant
   * RLS ensures only tenant's users visible
   */
  async getTenantUsers(req, res) {
    try {
      const result = await this.db.query(
        `SELECT id, name, email, role, created_at 
        FROM users 
        ORDER BY created_at`
      );

      logger.info('Users retrieved', {
        tenant_id: req.tenant_id,
        count: result.rows.length
      });

      res.json(result.rows);
    } catch (error) {
      logger.error('Get users failed', { error: error.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get tenant info
   */
  async getTenantInfo(req, res) {
    try {
      const result = await this.db.query(
        'SELECT id, name, subdomain, plan, created_at FROM tenants WHERE id = $1',
        [req.tenant_id]
      );

      if (!result.rows.length) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      logger.error('Get tenant failed', { error: error.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Test RLS by attempting to access document from another tenant
   * This should fail if RLS is working
   */
  async testRLS(req, res) {
    try {
      const result = await this.db.query(
        'SELECT id, title, tenant_id FROM documents LIMIT 10'
      );

      // RLS should filter this - should only see current tenant's docs
      const allBelongToTenant = result.rows.every(
        doc => doc.tenant_id === req.tenant_id
      );

      res.json({
        rls_working: allBelongToTenant,
        returned_documents: result.rows.length,
        expected_tenant_id: req.tenant_id,
        documents: result.rows
      });
    } catch (error) {
      logger.error('RLS test failed', { error: error.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = TenantController;


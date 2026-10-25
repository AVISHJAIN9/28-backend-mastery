/**
 * Controller - Module 03: CDN Integration CloudFront
 */

const AWS = require('aws-sdk');
const crypto = require('crypto');

const cloudfront = new AWS.CloudFront({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const DISTRIBUTION_ID = process.env.AWS_CLOUDFRONT_DISTRIBUTION_ID;
const CLOUDFRONT_DOMAIN = process.env.AWS_CLOUDFRONT_DOMAIN_NAME;

// ==================== Create Distribution ====================

const createDistribution = async (req, res) => {
  try {
    const { s3BucketName, priceClass, enableCache } = req.body;

    const distributionConfig = {
      CallerReference: crypto.randomBytes(16).toString('hex'),
      DefaultCacheBehavior: {
        TargetOriginId: 'S3Origin',
        ViewerProtocolPolicy: 'redirect-to-https',
        AllowedMethods: {
          Quantity: 7,
          Items: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'POST', 'PATCH', 'DELETE']
        },
        CachedMethods: { Quantity: 2, Items: ['GET', 'HEAD'] },
        ForwardedValues: {
          QueryString: false,
          Cookies: { Forward: 'none' }
        },
        MinTTL: enableCache ? 86400 : 0,
        DefaultTTL: enableCache ? 31536000 : 0,
        MaxTTL: enableCache ? 31536000 : 0
      },
      Origins: {
        Quantity: 1,
        Items: [
          {
            Id: 'S3Origin',
            DomainName: `${s3BucketName}.s3.amazonaws.com`,
            S3OriginConfig: { OriginAccessIdentity: '' }
          }
        ]
      },
      Enabled: true,
      PriceClass: priceClass || 'PriceClass_100'
    };

    const result = await cloudfront.createDistribution({
      DistributionConfig: distributionConfig
    }).promise();

    res.json({
      success: true,
      distributionId: result.Distribution.Id,
      domainName: result.Distribution.DomainName,
      status: result.Distribution.Status,
      message: 'Distribution created successfully'
    });
  } catch (error) {
    console.error('Error creating distribution:', error);
    res.status(500).json({
      error: 'Failed to create distribution',
      details: error.message
    });
  }
};

// ==================== Get Distribution Config ====================

const getDistributionConfig = async (req, res) => {
  try {
    const result = await cloudfront.getDistribution({
      Id: DISTRIBUTION_ID
    }).promise();

    res.json({
      success: true,
      distributionId: result.Distribution.Id,
      domainName: result.Distribution.DomainName,
      status: result.Distribution.Status,
      lastModifiedTime: result.Distribution.LastModifiedTime,
      cacheEnabled: result.Distribution.DistributionConfig.DefaultCacheBehavior.MinTTL > 0
    });
  } catch (error) {
    console.error('Error getting distribution:', error);
    res.status(500).json({
      error: 'Failed to get distribution',
      details: error.message
    });
  }
};

// ==================== Invalidate Cache ====================

const invalidateCache = async (req, res) => {
  try {
    const { paths } = req.body;

    if (!Array.isArray(paths) || paths.length === 0) {
      return res.status(400).json({
        error: 'paths array is required and must not be empty'
      });
    }

    const invalidationBatch = {
      Paths: {
        Quantity: paths.length,
        Items: paths
      },
      CallerReference: crypto.randomBytes(16).toString('hex')
    };

    const result = await cloudfront.createInvalidation({
      DistributionId: DISTRIBUTION_ID,
      InvalidationBatch: invalidationBatch
    }).promise();

    res.json({
      success: true,
      invalidationId: result.Invalidation.Id,
      status: result.Invalidation.Status,
      pathsInvalidated: paths.length,
      paths,
      message: 'Cache invalidation initiated'
    });
  } catch (error) {
    console.error('Error invalidating cache:', error);
    res.status(500).json({
      error: 'Failed to invalidate cache',
      details: error.message
    });
  }
};

// ==================== Get Invalidation Status ====================

const getInvalidationStatus = async (req, res) => {
  try {
    const { invalidationId } = req.params;

    const result = await cloudfront.getInvalidation({
      DistributionId: DISTRIBUTION_ID,
      Id: invalidationId
    }).promise();

    res.json({
      success: true,
      invalidationId: result.Invalidation.Id,
      status: result.Invalidation.Status,
      createTime: result.Invalidation.CreateTime,
      pathCount: result.Invalidation.InvalidationBatch.Paths.Quantity
    });
  } catch (error) {
    console.error('Error getting invalidation status:', error);
    res.status(500).json({
      error: 'Failed to get invalidation status',
      details: error.message
    });
  }
};

// ==================== Generate CDN URL ====================

const generateCdnUrl = async (req, res) => {
  try {
    const { path } = req.body;

    if (!path || typeof path !== 'string') {
      return res.status(400).json({
        error: 'path is required and must be a string'
      });
    }

    const cdnUrl = `https://${CLOUDFRONT_DOMAIN}${path.startsWith('/') ? '' : '/'}${path}`;

    res.json({
      success: true,
      path,
      cdnUrl,
      distributionId: DISTRIBUTION_ID,
      message: 'CDN URL generated successfully'
    });
  } catch (error) {
    console.error('Error generating CDN URL:', error);
    res.status(500).json({
      error: 'Failed to generate CDN URL',
      details: error.message
    });
  }
};

// ==================== Health Check ====================

const healthCheck = async (req, res) => {
  try {
    const result = await cloudfront.getDistribution({
      Id: DISTRIBUTION_ID
    }).promise();

    res.json({
      success: true,
      status: 'healthy',
      cloudfrontStatus: result.Distribution.Status,
      distributionId: DISTRIBUTION_ID,
      domainName: CLOUDFRONT_DOMAIN
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: 'CloudFront connection failed',
      details: error.message
    });
  }
};

module.exports = {
  createDistribution,
  getDistributionConfig,
  invalidateCache,
  getInvalidationStatus,
  generateCdnUrl,
  healthCheck
};

const { v4: uuidv4 } = require('uuid');

const images = new Map();

exports.uploadImage = (req, res) => {
  const { imagePath, publicId = uuidv4(), folder = 'uploads' } = req.validatedBody;
  
  const cloudinaryId = `${folder}/${publicId}`;
  const imageData = {
    publicId: cloudinaryId,
    url: `https://res.cloudinary.com/demo/image/upload/${cloudinaryId}.jpg`,
    secureUrl: `https://res.cloudinary.com/demo/image/upload/${cloudinaryId}.jpg`,
    width: 1920,
    height: 1080,
    size: Math.floor(Math.random() * 500000),
    format: 'jpg',
    uploadedAt: new Date(),
  };
  
  images.set(cloudinaryId, imageData);
  
  res.json({
    success: true,
    publicId: cloudinaryId,
    url: imageData.url,
    secureUrl: imageData.secureUrl,
  });
};

exports.transformImage = (req, res) => {
  const { publicId, width, height, crop, quality, format } = req.validatedBody;
  
  if (!images.has(publicId)) {
    return res.status(404).json({ error: 'Image not found' });
  }
  
  const image = images.get(publicId);
  const transformedUrl = `${image.url.split('.')[0]}/w_${width || 'auto'},h_${height || 'auto'},c_${crop || 'fill'},q_${quality},f_${format}`;
  
  res.json({
    success: true,
    publicId,
    originalUrl: image.url,
    transformedUrl,
    transformation: { width, height, crop, quality, format },
  });
};

exports.deleteImage = (req, res) => {
  const { publicId } = req.validatedBody;
  
  if (!images.has(publicId)) {
    return res.status(404).json({ error: 'Image not found' });
  }
  
  images.delete(publicId);
  
  res.json({
    success: true,
    publicId,
    message: 'Image deleted',
  });
};

exports.listImages = (req, res) => {
  const { prefix } = req.validatedBody;
  
  const imageList = Array.from(images.values()).filter(img => {
    if (!prefix) return true;
    return img.publicId.startsWith(prefix);
  });
  
  res.json({
    success: true,
    total: imageList.length,
    images: imageList,
    prefix,
  });
};

module.exports = {
  uploadImage,
  transformImage,
  deleteImage,
  listImages,
};

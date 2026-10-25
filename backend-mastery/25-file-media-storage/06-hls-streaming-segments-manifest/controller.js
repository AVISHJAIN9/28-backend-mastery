const crypto = require('crypto');

const streams = new Map();

const createStream = (req, res) => {
  try {
    const { name } = req.body;
    const streamId = crypto.randomBytes(8).toString('hex');
    streams.set(streamId, {
      streamId,
      name: name || `Stream-${streamId}`,
      segments: [],
      sequenceNumber: 0,
      createdAt: Date.now()
    });
    res.json({
      success: true,
      streamId,
      playlistUrl: `/api/streams/${streamId}/playlist.m3u8`,
      message: 'Stream created'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPlaylist = (req, res) => {
  const { streamId } = req.params;
  const stream = streams.get(streamId);
  if (!stream) return res.status(404).json({ error: 'Stream not found' });
  
  let m3u8 = '#EXTM3U\n#EXT-X-VERSION:3\n';
  m3u8 += '#EXT-X-TARGETDURATION:10\n';
  m3u8 += '#EXT-X-MEDIA-SEQUENCE:' + stream.sequenceNumber + '\n';
  stream.segments.forEach((seg, i) => {
    m3u8 += '#EXTINF:10.0,\n';
    m3u8 += `segment-${i}.ts\n`;
  });
  
  res.set('Content-Type', 'application/vnd.apple.mpegurl');
  res.send(m3u8);
};

const addSegment = (req, res) => {
  const { streamId } = req.params;
  const stream = streams.get(streamId);
  if (!stream) return res.status(404).json({ error: 'Stream not found' });
  
  stream.segments.push({
    duration: 10,
    timestamp: Date.now()
  });
  
  res.json({
    success: true,
    streamId,
    segmentCount: stream.segments.length
  });
};

const healthCheck = (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    module: '06 HLS Streaming',
    activeStreams: streams.size
  });
};

module.exports = { createStream, getPlaylist, addSegment, healthCheck };

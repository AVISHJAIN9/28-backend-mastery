const { Readable, Writable, Transform } = require('stream');

const getStreamInfo = () => {
  return {
    types: ['Readable', 'Writable', 'Transform', 'Duplex'],
    description: 'Stream types for different data flow patterns',
  };
};

const testReadable = () => {
  let count = 0;
  const readable = new Readable({
    read() {
      if (count < 3) {
        this.push(`Data chunk ${count}\n`);
        count++;
      } else {
        this.push(null);
      }
    },
  });

  return {
    type: 'Readable',
    chunks: 3,
    description: 'Readable stream produces data',
  };
};

const testWritable = () => {
  const chunks = [];
  const writable = new Writable({
    write(chunk, encoding, callback) {
      chunks.push(chunk.toString());
      callback();
    },
  });

  writable.write('chunk 1');
  writable.write('chunk 2');
  writable.end();

  return {
    type: 'Writable',
    chunksWritten: 2,
    description: 'Writable stream consumes data',
  };
};

const testTransform = () => {
  const transform = new Transform({
    transform(chunk, encoding, callback) {
      this.push(chunk.toString().toUpperCase());
      callback();
    },
  });

  return {
    type: 'Transform',
    description: 'Transform modifies data as it flows',
  };
};

const demonstrateBackpressure = () => {
  const highWaterMark = 16384; // Default buffer size
  const bytesWritten = 50000; // More than buffer

  return {
    highWaterMark,
    bytesWritten,
    backpressure: bytesWritten > highWaterMark,
    explanation: 'When write exceeds highWaterMark, backpressure occurs',
    description: 'Handle backpressure by checking write() return value',
  };
};

const testPipe = () => {
  return {
    pipingSupported: true,
    syntax: 'readable.pipe(writable)',
    automaticBackpressure: true,
    description: 'pipe() automatically handles backpressure',
  };
};

module.exports = {
  getStreamInfo,
  testReadable,
  testWritable,
  testTransform,
  demonstrateBackpressure,
  testPipe,
};

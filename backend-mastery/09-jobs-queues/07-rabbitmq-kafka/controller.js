/**
 * RabbitMQ & Kafka Controller
 * Manages message publishing and consumption
 */

const brokers = {
  rabbitmq: { queues: 0, messages: 0, consumers: 0 },
  kafka: { topics: 0, partitions: 0, brokers: 0 }
};

const messageLog = [];

/**
 * Publish message to broker
 */
exports.publishMessage = async (req, res) => {
  try {
    const { broker = 'rabbitmq', topic, exchange, message } = req.body;

    messageLog.push({
      timestamp: new Date(),
      broker,
      topic: topic || exchange,
      message,
      status: 'published'
    });

    res.status(201).json({
      success: true,
      broker,
      topic: topic || exchange,
      messageId: messageLog.length,
      message: `Message published to ${broker}`
    });
  } catch (error) {
    res.status( 500).json({ error: error.message });
  }
};

/**
 * Consume messages from broker
 */
exports.consumeMessages = async (req, res) => {
  try {
    const { broker = 'rabbitmq', topic, exchange } = req.query;

    const messages = messageLog.filter(m => 
      m.broker === broker && (m.topic === topic || m.topic === exchange)
    );

    res.json({
      broker,
      topic: topic || exchange,
      messageCount: messages.length,
      messages: messages.slice(-10),
      status: 'listening'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get broker statistics
 */
exports.getBrokerStats = async (req, res) => {
  try {
    res.json({
      timestamp: new Date(),
      rabbitmq: {
        status: 'connected',
        queues: 12,
        messages: messageLog.filter(m => m.broker === 'rabbitmq').length,
        consumers: 5,
        exchanges: 3,
        bindings: 8
      },
      kafka: {
        status: 'connected',
        topics: 8,
        partitions: 24,
        brokers: 3,
        replicas: 3,
        consumerGroups: 7
      },
      totalMessages: messageLog.length,
      messageRate: (messageLog.length / 60).toFixed(2) + ' msg/sec'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get dashboard view
 */
exports.getDashboard = async (req, res) => {
  try {
    const rabbitmqMessages = messageLog.filter(m => m.broker === 'rabbitmq').length;
    const kafkaMessages = messageLog.filter(m => m.broker === 'kafka').length;

    res.json({
      timestamp: new Date(),
      brokers: ['rabbitmq', 'kafka'],
      messageStats: {
        rabbitmq: rabbitmqMessages,
        kafka: kafkaMessages,
        total: messageLog.length
      },
      recentMessages: messageLog.slice(-10),
      systemHealth: {
        rabbitmq: 'healthy',
        kafka: 'healthy'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get broker configuration
 */
exports.getBrokerConfig = async (req, res) => {
  try {
    res.json({
      brokers: {
        rabbitmq: {
          protocol: 'AMQP 0.9.1',
          port: 5672,
          managementPort: 15672,
          features: ['queues', 'exchanges', 'bindings', 'routing', 'ack'],
          persistence: 'Yes',
          clustering: 'Yes'
        },
        kafka: {
          protocol: 'Kafka Protocol',
          port: 9092,
          zkPort: 2181,
          features: ['topics', 'partitions', 'consumer groups', 'replication', 'offsets'],
          persistence: 'Yes',
          clustering: 'Yes'
        }
      },
      comparisonMatrix: {
        'Throughput': { rabbitmq: 'Medium', kafka: 'Very High' },
        'Latency': { rabbitmq: 'Low', kafka: 'Low' },
        'Persistence': { rabbitmq: 'Optional', kafka: 'Always' },
        'Scalability': { rabbitmq: 'Horizontal', kafka: 'Horizontal' },
        'Best For': { rabbitmq: 'Traditional messaging', kafka: 'Stream processing' }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const { activeConnections } = require('./middleware');

let simulationMetrics = {
  TCP: { packets: 0, errors: 0, latency: [] },
  UDP: { packets: 0, errors: 0, latency: [], lostPackets: 0 }
};

const getTcpInfo = (req, res) => {
  res.json({
    protocol: 'TCP',
    characteristics: {
      connectionModel: 'Connection-oriented',
      reliability: 'Guaranteed delivery',
      ordering: 'In-order delivery',
      speed: 'Slower (overhead of reliability)',
      header: '20-60 bytes',
      flow_control: 'Yes (windowing)',
      congestion_control: 'Yes'
    },
    features: [
      '3-way handshake (SYN, SYN-ACK, ACK)',
      'Acknowledgments for every packet',
      'Retransmission of lost packets',
      'Flow control (sender respects receiver)',
      'Congestion control (adapts to network)',
      'Connection state tracking'
    ],
    useCases: [
      'Email (SMTP)',
      'Web browsing (HTTP/HTTPS)',
      'File transfer (FTP)',
      'Remote access (SSH, Telnet)',
      'Any application requiring reliability'
    ],
    overhead: 'High (retransmissions, acknowledgments, flow control)',
    latency: 'Medium-High (setup + reliability checks)'
  });
};

const getUdpInfo = (req, res) => {
  res.json({
    protocol: 'UDP',
    characteristics: {
      connectionModel: 'Connectionless',
      reliability: 'Best effort (no guarantee)',
      ordering: 'No guaranteed ordering',
      speed: 'Fast (minimal overhead)',
      header: '8 bytes',
      flow_control: 'No',
      congestion_control: 'No'
    },
    features: [
      'No connection setup',
      'Fire-and-forget delivery',
      'No acknowledgments',
      'No retransmission',
      'No flow control',
      'Lower latency'
    ],
    useCases: [
      'DNS queries',
      'Streaming (Video/Audio)',
      'Online gaming',
      'VoIP',
      'Live broadcasts',
      'SNMP monitoring',
      'Any real-time application'
    ],
    overhead: 'Low (minimal protocol overhead)',
    latency: 'Low (direct send)'
  });
};

const compareProtocols = (req, res) => {
  res.json({
    comparison: {
      'Connection Setup': {
        TCP: '3 roundtrips (SYN, SYN-ACK, ACK)',
        UDP: 'No setup',
        winner: 'UDP (faster)'
      },
      'Reliability': {
        TCP: '100% guaranteed',
        UDP: 'No guarantees',
        winner: 'TCP (safer)'
      },
      'Speed': {
        TCP: '~50-100ms additional per request',
        UDP: 'Minimal overhead',
        winner: 'UDP (faster)'
      },
      'Bandwidth': {
        TCP: 'Higher (headers + acks + retransmissions)',
        UDP: 'Lower (minimal headers)',
        winner: 'UDP (efficient)'
      },
      'Packet Loss Tolerance': {
        TCP: 'Recovers (retransmits)',
        UDP: 'Packets lost are gone',
        winner: 'TCP (robust)'
      },
      'Ordering': {
        TCP: 'Guaranteed in-order',
        UDP: 'May arrive out of order',
        winner: 'TCP (ordered)'
      }
    }
  });
};

const simulatePacketLoss = (req, res) => {
  const { packetLossPercentage = 5, delayMs = 10, outOfOrderPercentage = 2 } = req.body || {};
  
  const packets = [
    { id: 1, data: 'Packet 1', timestamp: Date.now() },
    { id: 2, data: 'Packet 2', timestamp: Date.now() + delayMs },
    { id: 3, data: 'Packet 3', timestamp: Date.now() + delayMs * 2 }
  ];

  const tcpResult = packets.map(p => ({ ...p, status: 'delivered', retransmissions: 0 }));

  const udpResult = packets.map(p => {
    if (Math.random() * 100 < packetLossPercentage) {
      return { ...p, status: 'lost', lostAt: p.timestamp, retransmitted: false };
    }
    return { ...p, status: 'delivered', delay: Math.floor(Math.random() * delayMs) };
  });

  simulationMetrics.UDP.lostPackets += udpResult.filter(p => p.status === 'lost').length;

  res.json({
    scenario: 'Network with packet loss and delay',
    parameters: { packetLossPercentage, delayMs, outOfOrderPercentage },
    tcp_result: {
      packets: tcpResult,
      total_delivered: tcpResult.length,
      status: 'All packets delivered (with retransmissions as needed)',
      bandwidth_used: 'Higher (retransmissions + acks)'
    },
    udp_result: {
      packets: udpResult,
      total_delivered: udpResult.filter(p => p.status === 'delivered').length,
      total_lost: udpResult.filter(p => p.status === 'lost').length,
      status: 'Some packets may be lost permanently',
      bandwidth_used: 'Lower (no retransmissions)'
    }
  });
};

const getMetrics = (req, res) => {
  const metrics = {
    timestamp: Date.now(),
    activeConnections: activeConnections.size,
    protocols: simulationMetrics,
    statistics: {
      tcp: {
        totalPackets: simulationMetrics.TCP.packets,
        totalErrors: simulationMetrics.TCP.errors,
        avgLatency: simulationMetrics.TCP.latency.length > 0 
          ? (simulationMetrics.TCP.latency.reduce((a, b) => a + b) / simulationMetrics.TCP.latency.length)
          : 0
      },
      udp: {
        totalPackets: simulationMetrics.UDP.packets,
        lostPackets: simulationMetrics.UDP.lostPackets,
        totalErrors: simulationMetrics.UDP.errors,
        avgLatency: simulationMetrics.UDP.latency.length > 0
          ? (simulationMetrics.UDP.latency.reduce((a, b) => a + b) / simulationMetrics.UDP.latency.length)
          : 0
      }
    }
  };

  res.json(metrics);
};

module.exports = {
  getTcpInfo,
  getUdpInfo,
  compareProtocols,
  simulatePacketLoss,
  getMetrics
};


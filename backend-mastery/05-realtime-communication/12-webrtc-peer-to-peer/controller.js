class WebRTCController {
  constructor(io) { this.io = io; this.peers = new Map(); }
  handleOffer(peerId, offer) {
    this.peers.set(peerId, { offer, createdAt: Date.now() });
    this.io.emit('webrtc:offer', { fromPeer: peerId, offer });
  }
  handleAnswer(peerId, answer) {
    const peer = this.peers.get(peerId);
    if(peer) peer.answer = answer;
    this.io.emit('webrtc:answer', { fromPeer: peerId, answer });
  }
  handleIceCandidate(peerId, candidate) {
    this.io.emit('webrtc:iceCandidate', { fromPeer: peerId, candidate });
  }
}
module.exports = WebRTCController;
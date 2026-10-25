class EphemeralController {
  constructor(io, redis) { this.io = io; this.redis = redis; }
  async sendEphemeralMessage(msgData) {
    const msgId = `msg_${Date.now()}`;
    await this.redis.setex(msgId, msgData.ttl, JSON.stringify(msgData));
    this.io.emit('message:ephemeral', { msgId, ...msgData, expiresAt: Date.now() + msgData.ttl*1000 });
    return msgId;
  }
  async getMessage(msgId) { return await this.redis.get(msgId); }
  async deleteMessage(msgId) { return await this.redis.del(msgId); }
}
module.exports = EphemeralController;
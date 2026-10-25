class PollController {
  constructor(io) { this.io = io; this.polls = new Map(); }
  createPoll(pollData) {
    const id = `poll_${Date.now()}`;
    const poll = { id, ...pollData, votes: new Map(pollData.options.map(o => [o, 0])), voters: new Set() };
    this.polls.set(id, poll);
    return poll;
  }
  vote(pollId, option, userId) {
    const poll = this.polls.get(pollId);
    if (!poll || poll.voters.has(userId)) return false;
    poll.votes.set(option, (poll.votes.get(option) || 0) + 1);
    poll.voters.add(userId);
    this.io.emit('poll:updated', { pollId, votes: Object.fromEntries(poll.votes) });
    return true;
  }
  getResults(pollId) {
    const poll = this.polls.get(pollId);
    return poll ? Object.fromEntries(poll.votes) : null;
  }
}
module.exports = PollController;
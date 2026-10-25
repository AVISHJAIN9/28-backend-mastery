const { Resend } = require('resend');
class EmailQueueController {
  constructor() { this.resend = new Resend(process.env.RESEND_API_KEY); }
  async sendEmail(emailData) {
    try {
      const result = await this.resend.emails.send({ from: 'noreply@company.com', ...emailData });
      return result;
    } catch(error) { throw error; }
  }
  async sendBatch(emails) {
    return Promise.all(emails.map(e => this.sendEmail(e)));
  }
}
module.exports = EmailQueueController;
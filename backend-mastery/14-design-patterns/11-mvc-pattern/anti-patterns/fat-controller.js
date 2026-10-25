/**
 * ANTI-PATTERN: Fat Controller (MVC Violation)
 * 
 * All logic jammed into controller.
 */

class UserControllerBad {
  async createUser(request, response) {
    // Validation
    if (!request.body.email) {
      return response.status(400).json({ error: 'Email required' });
    }

    // Database
    const user = await db.query(
      `INSERT INTO users (name, email) VALUES ('${request.body.name}', '${request.body.email}')`
    );

    // Email
    await sendEmail(user.email, 'Welcome!');

    // Logging
    logger.info(`User created: ${user.id}`);

    // Response
    response.json(user);
  }
}

console.log('=== ANTI-PATTERN: Fat Controller ===\n');
console.log('✗ Validation mixed with business logic');
console.log('✗ Database queries in controller');
console.log('✗ Email sending in controller');
console.log('✗ Hard to test');
console.log('✗ Multiple reasons to change');

module.exports = UserControllerBad;

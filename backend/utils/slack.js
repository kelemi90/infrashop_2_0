const logger = require('./logger');

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

/**
 * Send a notification to Slack using native fetch (Node.js 18+)
 * @param {string} text The message text
 * @param {object} blocks Optional Slack Block Kit blocks for rich formatting
 */
async function sendSlackNotification(text, blocks = null) {
  if (!SLACK_WEBHOOK_URL) {
    logger.warn('SLACK_WEBHOOK_URL not set, skipping notification');
    return;
  }

  try {
    const payload = { text };
    if (blocks) payload.blocks = blocks;

    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Slack API error: ${response.status} ${errorText}`);
    }

    logger.info('Slack notification sent successfully');
  } catch (err) {
    logger.error({ err: err.message }, 'Failed to send Slack notification');
  }
}

module.exports = { sendSlackNotification };

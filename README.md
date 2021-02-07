# Sentry to Telegram chat integration

## How to use?

- Create legacy integration with webhooks in Sentry, insert there your VPS address with `/sentry-telegram/issue` on the end of URL
- Install dependencies
- Fill in `projects.js` with Sentry project slug to Telegram chat ID (where you want to send notifications) and developers to mention them
- Provide TELEGRAM_TOKEN with Telegram Bot ID (message sender) in environment variables

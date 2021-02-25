# Sentry to Telegram chat integration

## How to use?

- Create legacy integration with webhooks in Sentry, insert there public address to node.js instance with this project with `/sentry-telegram/issue` on the end of URL for **error reports** and `sentry-telegram/metric` for **metric** alerts
- Install dependencies
- Fill in `projects.js` with Sentry project slug to Telegram chat ID (where you want to send notifications) and developers to mention them
- Provide TELEGRAM_TOKEN with Telegram Bot ID (message sender) in environment variables

### Example of `project.js` content:

```
module.exports = {
  "hoo-boo-frontend": {
    chatId: -1001183942336,
    developers: ["@fusion1337", "@anothercooldeveloper"],
  },
};
```

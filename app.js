require("dotenv").config();
const express = require("express");
const app = express();
const http = require("http");
const { Telegraf } = require("telegraf");

const {
  TAGS_WHITELIST,
  escapeHTML,
  chunkSubstr,
  tidyjson,
  MONITORING_ALERT_RULE_NAME,
} = require("./utils.js");
const PROJECTS_MAP = require("./projects.js");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

const generateIssueMsg = (msg, developers = []) => {
  let type;
  switch (msg.level) {
    case "error":
      type = "🛑 Error";
      break;
    case "warning":
      type = "⚠️ Warning";
      break;
    default:
      type = "📧 Message";
      break;
  }
  let env = `<b>${msg.event.environment}</b>`;
  let user;
  if (msg.event.user) {
    user = `<b>User</b> fingerprint: <code>${
      msg.event.user.id
    }</code>, session <code>${msg.event.user.username}</code>, IP: ${
      msg.event.user.ip_address
    } from ${JSON.stringify(msg.event.user.geo)}`;
  }
  const tags = msg.event.tags
    .filter((el) => TAGS_WHITELIST.includes(el[0]))
    .reduce((acc, cur) => `${acc} ${escapeHTML(cur[1])}`, "");
  const stacktrace = msg.event.stacktrace
    ? "<b>stacktrace:</b> " +
      escapeHTML(JSON.stringify(msg.event.stacktrace)) +
      "\n"
    : "";
  const context =
    msg.event.contexts &&
    msg.event.contexts.state &&
    msg.event.contexts.state.state
      ? "<b>State: </b>" +
        escapeHTML(tidyjson(msg.event.contexts.state.state)) +
        "\n"
      : "";

  const device =
    msg.event.contexts &&
    msg.event.contexts.browser &&
    msg.event.contexts.device &&
    msg.event.contexts.browser.name &&
    msg.event.contexts.browser.version &&
    msg.event.contexts.device.brand &&
    msg.event.contexts.device.model
      ? `<b>Browser:</b> ${escapeHTML(
          msg.event.contexts.browser.name
        )} ${escapeHTML(
          msg.event.contexts.browser.version
        )}, <b>device: </b> ${escapeHTML(
          msg.event.contexts.device.brand
        )} ${escapeHTML(msg.event.contexts.device.model)}`
      : "";
  let heading = "";
  if (
    msg.triggering_rules.some((rule) =>
      rule.includes(MONITORING_ALERT_RULE_NAME)
    )
  )
    heading = `<b><i>‼️MONITORING ALERT‼️</i></b> ${developers.join(" ")}\n`;
  return `${heading}
${type} in ${env}: ${escapeHTML(msg.message || msg.event.title)}
<b><a href="${msg.url}">Issue: </a></b> ${escapeHTML(
    msg.event.title
  )} ${escapeHTML(msg.culprit)}
${user}
${device}
${stacktrace}
${context}
${tags}
  `;
};

const generateMetricMsg = (msg, developers) => {
  return msg.data.description_text;
};

const sendMessage = (chatId, rawText) => {
  let message = rawText;
  chunkSubstr(message, 4096).forEach((chunk) =>
    bot.telegram.sendMessage(chatId, chunk, {
      parse_mode: "HTML",
    })
  );
};

app.post("/sentry-telegram/issue", function (req, res, next) {
  console.log(req.body);
  const chatId = PROJECTS_MAP[req.body.project_slug].chatId;
  const developers = PROJECTS_MAP[req.body.project_slug].developers;
  if (!chatId) {
    sendMessage(
      Object.values(PROJECTS_MAP)[0],
      `Cant find chat ID for project ${req.body.project_slug}`
    );
    return res.sendStatus(204);
  }
  sendMessage(chatId, generateIssueMsg(req.body, developers));
  return res.sendStatus(204);
});

app.post("/sentry-telegram/metric", function (req, res, next) {
  console.log(req.body);
  const chatId = Object.values(PROJECTS_MAP)[0].chatId;
  const developers = Object.values(PROJECTS_MAP)[0].developers;
  if (!chatId) {
    sendMessage(
      Object.values(PROJECTS_MAP)[0],
      `Cant find chat ID for project ${req.body.project_slug}`
    );
    return res.sendStatus(204);
  }
  sendMessage(chatId, generateMetricMsg(req.body, developers));
  return res.sendStatus(204);
});

app.use(function (req, res, next) {
  next(res.sendStatus(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  console.error(err);

  res.status(err.status || 500);
  sendMessage(
    Object.values(PROJECTS_MAP)[0],
    `Cant send notification, error: ${JSON.stringify(
      err,
      Object.getOwnPropertyNames(err)
    )}`
  );
});

var port = process.env.PORT || "5000";
app.set("port", port);

var server = http.createServer(app);

server.listen(port, () => {
  console.log("Listening on port ", port);
});

module.exports = app;

const MONITORING_ALERT_RULE_NAME = "monitor-alert";

const indentSpaces = 2;
const spacesPrefix = (numberOfSpaces) => " ".repeat(numberOfSpaces);
const tidyjson = (json, spaces = 0) => {
  let result = "";

  if (Array.isArray(json)) {
    if (!json.length) return "[]\n";

    result += "[\n";
    json.forEach((arrayItem) => {
      result +=
        spacesPrefix(spaces + indentSpaces) +
        tidyjson(arrayItem, spaces + indentSpaces);
    });
    result += spacesPrefix(spaces) + "]\n";
  } else if (typeof json === "object") {
    if (json === null) return "null\n";

    const keys = Object.keys(json);

    if (!keys.length) return "{}\n";

    result += "{\n";
    keys.forEach((objectKey) => {
      result +=
        spacesPrefix(spaces + indentSpaces) +
        `"${objectKey}": ` +
        tidyjson(json[objectKey], spaces + indentSpaces);
    });
    result += spacesPrefix(spaces) + "}\n";
  } else if (typeof json === "string") {
    result += `"${json}"` + "\n";
  } else {
    result += json + "\n";
  }

  return result;
};

function chunkSubstr(str, size) {
  const numChunks = Math.ceil(str.length / size);
  const chunks = new Array(numChunks);
  for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
    chunks[i] = str.substr(o, size);
  }
  return chunks;
}

function escapeHTML(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const TAGS_WHITELIST = ["sentry:user"];

module.exports = {
  TAGS_WHITELIST,
  escapeHTML,
  chunkSubstr,
  tidyjson,
  MONITORING_ALERT_RULE_NAME,
};

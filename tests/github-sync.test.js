"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appPath = path.join(__dirname, "..", "app.js");
const source = fs.readFileSync(appPath, "utf8");
const definitions = source.slice(0, source.indexOf("\ndocument.addEventListener(\"click\""));
const context = vm.createContext({
  console, crypto: crypto.webcrypto, Date, Intl, TextEncoder, TextDecoder,
  atob, btoa, navigator: { onLine: true },
  fetch: async () => { throw new Error("Unexpected fetch"); }
});
vm.runInContext(`${definitions}
render = () => {};
renderSyncStatus = () => {};
saveLocal = () => {};
toast = () => {};
globalThis.syncApi = { createInitialData, githubContentUrl, githubRequestOptions, repositoryRequest, syncWithCloud, state };`, context);

(async () => {
const { createInitialData, githubContentUrl, githubRequestOptions, repositoryRequest, syncWithCloud, state } = context.syncApi;
const config = {
  username: "LR-bot1202", token: "secret-token", repository: "bookkeeping-data",
  branch: "master", path: "data/ledger.json"
};

assert.equal(
  githubContentUrl(config, true),
  "https://api.github.com/repos/LR-bot1202/bookkeeping-data/contents/data/ledger.json?ref=master"
);
assert.equal(githubContentUrl(config, false).includes(config.token), false);

const getOptions = githubRequestOptions("GET", config.token);
assert.equal(getOptions.method, "GET");
assert.equal(getOptions.headers.Accept, "application/vnd.github+json");
assert.equal(getOptions.headers.Authorization, "Bearer secret-token");
assert.equal(getOptions.headers["X-GitHub-Api-Version"], "2022-11-28");
assert.equal("body" in getOptions, false);

const putBody = { message: "sync", content: "e30=", branch: "master", sha: "abc123" };
const putOptions = githubRequestOptions("PUT", config.token, putBody);
assert.equal(putOptions.method, "PUT");
assert.equal(putOptions.headers["Content-Type"], "application/json");
assert.deepEqual(JSON.parse(putOptions.body), putBody);

state.sync = { ...config };
let captured;
context.fetch = async (url, options) => {
  captured = { url, options };
  return { status: 200, ok: true, json: async () => ({ sha: "remote-sha" }) };
};
const remote = await repositoryRequest("GET");
assert.equal(remote.sha, "remote-sha");
assert.equal(captured.url.includes("?ref=master&_="), true);
assert.equal(captured.url.includes(config.token), false);
assert.equal(captured.options.headers.Authorization, "Bearer secret-token");
assert.equal(captured.options.cache, "no-store");

context.fetch = async () => ({ status: 404, ok: false, json: async () => ({ message: "Not Found" }) });
assert.deepEqual({ ...(await repositoryRequest("GET")) }, { missing: true });

context.fetch = async () => ({ status: 409, ok: false, json: async () => ({ message: "sha does not match" }) });
await assert.rejects(
  repositoryRequest("PUT", putBody),
  (error) => error.status === 409 && /sha/i.test(error.message)
);

state.data = createInitialData();
state.sync = { ...config };
state.syncing = false;
const remoteLedger = createInitialData();
const remoteContent = btoa(unescape(encodeURIComponent(JSON.stringify(remoteLedger))));
const requests = [];
context.fetch = async (url, options) => {
  requests.push({ url, options });
  if (options.method === "GET") {
    const attempt = requests.filter((request) => request.options.method === "GET").length;
    return { status: 200, ok: true, json: async () => ({ sha: attempt === 1 ? "stale-sha" : "fresh-sha", content: remoteContent }) };
  }
  const payload = JSON.parse(options.body);
  if (payload.sha === "stale-sha") return { status: 409, ok: false, json: async () => ({ message: "sha does not match" }) };
  return { status: 200, ok: true, json: async () => ({ content: { sha: "saved-sha" } }) };
};
await syncWithCloud();
const reads = requests.filter((request) => request.options.method === "GET");
const writes = requests.filter((request) => request.options.method === "PUT");
assert.equal(reads.length, 2);
assert.notEqual(reads[0].url, reads[1].url);
assert.equal(reads.every((request) => request.options.cache === "no-store"), true);
assert.equal(JSON.parse(writes[1].options.body).sha, "fresh-sha");
assert.equal(state.syncStatus, "ok");

console.log("GitHub sync tests passed");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

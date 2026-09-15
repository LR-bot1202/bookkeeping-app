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
  fetch: async () => { throw new Error("Unexpected fetch"); }
});
vm.runInContext(`${definitions}\nglobalThis.syncApi = { githubContentUrl, githubRequestOptions, repositoryRequest, state };`, context);

(async () => {
const { githubContentUrl, githubRequestOptions, repositoryRequest, state } = context.syncApi;
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
assert.equal(captured.url.endsWith("?ref=master"), true);
assert.equal(captured.url.includes(config.token), false);
assert.equal(captured.options.headers.Authorization, "Bearer secret-token");

context.fetch = async () => ({ status: 404, ok: false, json: async () => ({ message: "Not Found" }) });
assert.deepEqual({ ...(await repositoryRequest("GET")) }, { missing: true });

context.fetch = async () => ({ status: 409, ok: false, json: async () => ({ message: "sha does not match" }) });
await assert.rejects(
  repositoryRequest("PUT", putBody),
  (error) => error.status === 409 && /sha/i.test(error.message)
);

console.log("GitHub sync tests passed");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

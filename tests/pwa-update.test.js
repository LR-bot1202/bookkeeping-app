"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");
const workerSource = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const version = appSource.match(/const APP_VERSION = "([^"]+)";/)?.[1];

assert.ok(version, "app version is declared");
assert.match(indexSource, new RegExp(`app\\.js\\?v=${version}`));
assert.match(indexSource, new RegExp(`styles\\.css\\?v=${version}`));
assert.match(indexSource, new RegExp(`manifest\\.webmanifest\\?v=${version}`));
assert.match(workerSource, new RegExp(`const APP_VERSION = "${version}";`));
assert.match(appSource, /updateViaCache: "none"/);

const listeners = {};
const deletedCaches = [];
const navigatedClients = [];
let claimed = false;
const context = vm.createContext({
  URL,
  Request,
  fetch: async () => { throw new Error("Unexpected fetch"); },
  caches: {
    keys: async () => ["bookkeeping-v10", "bookkeeping-v12"],
    delete: async (key) => { deletedCaches.push(key); return true; },
    open: async () => ({ addAll: async () => {}, put: async () => {} }),
    match: async () => null
  },
  self: {
    location: { origin: "https://example.test" },
    addEventListener: (type, listener) => { listeners[type] = listener; },
    skipWaiting: () => {},
    clients: {
      claim: async () => { claimed = true; },
      matchAll: async () => [{
        url: "https://example.test/bookkeeping-app/",
        navigate: async (url) => { navigatedClients.push(url); }
      }]
    }
  }
});
vm.runInContext(workerSource, context);

(async () => {
  let activation;
  listeners.activate({ waitUntil: (promise) => { activation = promise; } });
  await activation;

  assert.deepEqual(deletedCaches, ["bookkeeping-v10"]);
  assert.equal(claimed, true);
  assert.deepEqual(navigatedClients, ["https://example.test/bookkeeping-app/"]);
  console.log("PWA update tests passed");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appPath = path.join(__dirname, "..", "app.js");
const source = fs.readFileSync(appPath, "utf8");
const definitions = source.slice(0, source.indexOf("\ndocument.addEventListener(\"click\""));
const context = vm.createContext({ console, crypto: crypto.webcrypto, Date, Intl, TextEncoder, TextDecoder });
vm.runInContext(`${definitions}\nglobalThis.modelApi = { createInitialData, normalizeData, mergeLedger, prepareRestoredData };`, context);

const { createInitialData, normalizeData, mergeLedger, prepareRestoredData } = context.modelApi;

const oldLedger = createInitialData();
oldLedger.schema_version = 1;
delete oldLedger.members;
delete oldLedger.deleted_members;
delete oldLedger.settings.default_member_id;
oldLedger.transactions.push({
  id: "tx-old", ledger_id: "ledger-personal", type: "expense", amount: 1234,
  category_id: "cat-food", account_id: "acc-wechat", happen_at: "2026-09-14T12:00",
  note: "旧记录", created_at: "2026-09-14T04:00:00.000Z", updated_at: "2026-09-14T04:00:00.000Z"
});

const migrated = normalizeData(oldLedger);
assert.equal(migrated.schema_version, 2);
assert.equal(migrated.members.length, 1);
assert.equal(migrated.members[0].id, "member-self");
assert.equal(migrated.transactions[0].member_id, "member-self");

const restored = prepareRestoredData(oldLedger);
assert.equal(restored.members[0].id, "member-self");
assert.equal(restored.transactions[0].member_id, "member-self");
assert.equal(restored.members[0].updated_at, restored.reset_at);

const local = normalizeData(migrated);
local.members.push({ id: "member-li", name: "小李", icon: "李", color: "#3b82a0", sort_order: 1, is_active: true, updated_at: "2026-09-14T05:00:00.000Z" });
local.transactions.push({
  id: "tx-li", ledger_id: "ledger-personal", type: "expense", amount: 2000,
  category_id: "cat-food", account_id: "acc-wechat", member_id: "member-li",
  happen_at: "2026-09-14T13:00", note: "成员记录", created_at: "2026-09-14T05:00:00.000Z", updated_at: "2026-09-14T05:00:00.000Z"
});

const remote = normalizeData(local);
remote.members = remote.members.filter((member) => member.id !== "member-li");
remote.deleted_members.push({ id: "member-li", deleted_at: "2026-09-14T06:00:00.000Z", updated_at: "2026-09-14T06:00:00.000Z" });
const merged = mergeLedger(local, remote);
assert.equal(merged.members.find((member) => member.id === "member-li").name, "小李");
assert.equal(merged.members.find((member) => member.id === "member-li").is_active, false);
assert.equal(merged.transactions.find((tx) => tx.id === "tx-li").member_id, "member-li");

const unusedLocal = normalizeData(migrated);
unusedLocal.members.push({ id: "member-unused", name: "未使用", icon: "未", color: "#778079", sort_order: 1, is_active: true, updated_at: "2026-09-14T05:00:00.000Z" });
const unusedRemote = normalizeData(unusedLocal);
unusedRemote.members = unusedRemote.members.filter((member) => member.id !== "member-unused");
unusedRemote.deleted_members.push({ id: "member-unused", deleted_at: "2026-09-14T06:00:00.000Z", updated_at: "2026-09-14T06:00:00.000Z" });
assert.equal(mergeLedger(unusedLocal, unusedRemote).members.some((member) => member.id === "member-unused"), false);

console.log("member model tests passed");

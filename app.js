"use strict";

const STORAGE_KEY = "bookkeeping.ledger.v2";
const SYNC_KEY = "bookkeeping.gitee.v1";
const APP_VERSION = "1.2.1";
const LEDGER_ID = "ledger-personal";
const DEFAULT_MEMBER_ID = "member-self";
const BUILTIN_UPDATED_AT = "2026-09-07T00:00:00.000Z";

const EXPENSE_CATEGORIES = [
  ["cat-food", "餐饮", "餐", "#e66a4e"], ["cat-transport", "交通", "行", "#3b82a0"],
  ["cat-shopping", "购物", "购", "#b05b8c"], ["cat-home", "居住", "家", "#7966a8"],
  ["cat-fun", "娱乐", "乐", "#d08a25"], ["cat-health", "医疗", "医", "#d45757"],
  ["cat-gift", "人情", "礼", "#ad6d48"], ["cat-education", "教育", "学", "#4677b8"],
  ["cat-other-expense", "其他", "其", "#778079"]
];

const INCOME_CATEGORIES = [
  ["cat-salary", "工资", "薪", "#258260"], ["cat-parttime", "兼职", "兼", "#3e8b83"],
  ["cat-investment", "理财收益", "利", "#687e32"], ["cat-redpacket", "红包", "包", "#c9564c"],
  ["cat-reimburse", "报销", "报", "#4f78a6"], ["cat-other-income", "其他收入", "其", "#778079"]
];

const ACCOUNT_PRESETS = [
  ["acc-cash", "现金", "cash", "现"], ["acc-wechat", "微信零钱", "wechat", "微"],
  ["acc-alipay", "支付宝", "alipay", "支"], ["acc-bank", "储蓄卡", "bank_card", "卡"],
  ["acc-credit", "信用卡", "credit_card", "信"]
];

const ICONS = {
  home: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/></svg>',
  list: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
  plus: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  chart: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 3v18h18M7 16v-4M12 16V7M17 16v-6"/></svg>',
  user: '<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
  left: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>',
  right: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>',
  close: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m18 6-12 12M6 6l12 12"/></svg>',
  search: '<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
  edit: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg>',
  trash: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v6M14 11v6"/></svg>',
  download: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 3v12m0 0 5-5m-5 5-5-5M5 21h14"/></svg>',
  upload: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 16V4m0 0 5 5m-5-5L7 9M5 20h14"/></svg>',
  cloud: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M17.5 19H6a4 4 0 0 1-.4-8A6.5 6.5 0 0 1 18 9a5 5 0 0 1-.5 10Z"/></svg>',
  smartphone: '<svg aria-hidden="true" viewBox="0 0 24 24"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 18h4"/></svg>',
  wallet: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 7V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h16v11H5a3 3 0 0 1-3-3V6"/><path d="M16 14h2"/></svg>',
  tag: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 13 11 22l-9-9V2h11Z"/><circle cx="7" cy="7" r="1"/></svg>',
  target: '<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg>',
  alert: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 9v4m0 4h.01M10.3 3.7 2.2 18a2 2 0 0 0 1.8 3h16a2 2 0 0 0 1.8-3L13.7 3.7a2 2 0 0 0-3.4 0Z"/></svg>'
};

const NAV_ITEMS = [
  ["home", "首页", "home"], ["list", "明细", "list"], ["add", "记一笔", "plus"],
  ["stats", "统计", "chart"], ["settings", "我的", "user"]
];

const state = {
  data: null, sync: null, page: "home", month: currentMonth(),
  filters: { type: "all", category: "all", account: "all", keyword: "" },
  memberFilter: "all", installPrompt: null, installed: false,
  syncing: false, syncStatus: "local", syncMessage: "仅保存在本机"
};
let syncTimer = null;

function nowIso() { return new Date().toISOString(); }
function shanghaiParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(date);
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}
function currentDate() { const p = shanghaiParts(); return `${p.year}-${p.month}-${p.day}`; }
function currentDateTime() { const p = shanghaiParts(); return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`; }
function currentMonth() { return currentDate().slice(0, 7); }
function uid(prefix) { return `${prefix}-${crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`}`; }

function createInitialData() {
  const createdAt = nowIso();
  const makeCategory = (item, type, index) => ({
    id: item[0], type, name: item[1], icon: item[2], color: item[3], parent_id: null,
    sort_order: index, is_builtin: true, is_active: true, updated_at: BUILTIN_UPDATED_AT
  });
  return {
    schema_version: 2, app_version: APP_VERSION, updated_at: createdAt, reset_at: null,
    ledger: { id: LEDGER_ID, name: "我的账本", type: "family", created_at: createdAt },
    transactions: [], deleted_transactions: [], deleted_categories: [], deleted_accounts: [], deleted_members: [],
    members: [{ id: DEFAULT_MEMBER_ID, name: "我", icon: "我", color: "#176b4d", sort_order: 0, is_builtin: true, is_active: true, updated_at: BUILTIN_UPDATED_AT }],
    categories: [...EXPENSE_CATEGORIES.map((item, i) => makeCategory(item, "expense", i)), ...INCOME_CATEGORIES.map((item, i) => makeCategory(item, "income", i))],
    accounts: ACCOUNT_PRESETS.map((item, index) => ({
      id: item[0], ledger_id: LEDGER_ID, name: item[1], kind: item[2], icon: item[3],
      initial_balance: 0, sort_order: index, is_builtin: true, is_active: true, updated_at: BUILTIN_UPDATED_AT
    })),
    budgets: [], settings: { default_expense_account_id: "acc-wechat", default_income_account_id: "acc-bank", default_member_id: DEFAULT_MEMBER_ID, updated_at: BUILTIN_UPDATED_AT }
  };
}

function normalizeData(raw) {
  const base = createInitialData();
  if (!raw || typeof raw !== "object") return base;
  const data = {
    ...base, ...raw, ledger: { ...base.ledger, ...(raw.ledger || {}) }, settings: { ...base.settings, ...(raw.settings || {}) },
    transactions: Array.isArray(raw.transactions) ? raw.transactions : [],
    deleted_transactions: Array.isArray(raw.deleted_transactions) ? raw.deleted_transactions : [],
    deleted_categories: Array.isArray(raw.deleted_categories) ? raw.deleted_categories : [],
    deleted_accounts: Array.isArray(raw.deleted_accounts) ? raw.deleted_accounts : [],
    deleted_members: Array.isArray(raw.deleted_members) ? raw.deleted_members : [],
    members: Array.isArray(raw.members) && raw.members.length ? raw.members : base.members,
    categories: Array.isArray(raw.categories) && raw.categories.length ? raw.categories : base.categories,
    accounts: Array.isArray(raw.accounts) && raw.accounts.length ? raw.accounts : base.accounts,
    budgets: Array.isArray(raw.budgets) ? raw.budgets : []
  };
  data.schema_version = 2; data.app_version = APP_VERSION;
  data.members = data.members.filter((member) => member && member.id && member.name).map((member, index) => ({
    color: "#176b4d", icon: String(member.name).slice(0, 1), sort_order: index, is_active: true, ...member
  }));
  if (!data.members.length) data.members = base.members;
  if (!data.members.some((member) => member.id === data.settings.default_member_id && member.is_active !== false)) {
    data.settings.default_member_id = data.members.find((member) => member.is_active !== false)?.id || data.members[0].id;
  }
  data.transactions = data.transactions.filter((tx) => tx && tx.id && ["expense", "income"].includes(tx.type)).map((tx) => ({ ...tx, member_id: tx.member_id || data.settings.default_member_id }));
  return data;
}

function loadState() {
  try { state.data = normalizeData(JSON.parse(localStorage.getItem(STORAGE_KEY))); }
  catch { state.data = createInitialData(); }
  try {
    state.sync = { username: "", token: "", repository: "bookkeeping-data", branch: "master", path: "data/ledger.json", ...JSON.parse(localStorage.getItem(SYNC_KEY)) };
  } catch { state.sync = { username: "", token: "", repository: "bookkeeping-data", branch: "master", path: "data/ledger.json" }; }
  updateSyncLabel();
}

function saveLocal({ sync = true } = {}) {
  state.data.updated_at = nowIso();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
  if (sync && syncConfigured()) {
    state.syncStatus = "pending"; state.syncMessage = "等待同步"; renderSyncStatus();
    clearTimeout(syncTimer); syncTimer = setTimeout(() => syncWithGitee({ quiet: true }), 900);
  }
}
function syncConfigured() { return Boolean(state.sync.username && state.sync.token && state.sync.repository && state.sync.path); }
function isStandalone() { return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true; }
function installDetail() {
  if (state.installed || isStandalone()) return "已安装到设备";
  if (state.installPrompt) return "可以直接安装";
  return "查看手机安装方法";
}
function updateSyncLabel() {
  if (!syncConfigured()) { state.syncStatus = "local"; state.syncMessage = "仅保存在本机"; }
  else if (state.syncStatus === "local") { state.syncStatus = "ok"; state.syncMessage = "已配置云同步"; }
}

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
function sanitizeColor(value) { return /^#[0-9a-f]{6}$/i.test(value || "") ? value : "#778079"; }
function centsToMoney(cents, signed = false) {
  const amount = Number(cents || 0) / 100;
  return `${signed && amount > 0 ? "+" : ""}¥${amount.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function moneyToCents(value) { const number = Number(value); return Number.isFinite(number) ? Math.round(number * 100) : NaN; }
function formatMonth(month) { const [year, value] = month.split("-"); return `${year}年${Number(value)}月`; }
function shiftMonth(month, delta) {
  const [year, value] = month.split("-").map(Number); const date = new Date(Date.UTC(year, value - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}
function formatDateHeading(date) {
  const [year, month, day] = date.split("-").map(Number); const today = currentDate();
  if (date === today) return `今天 · ${month}月${day}日`;
  const weekday = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][new Date(`${date}T12:00:00+08:00`).getDay()];
  return `${month}月${day}日 · ${weekday}${year !== Number(today.slice(0, 4)) ? ` · ${year}` : ""}`;
}

function categoryById(id) { return state.data.categories.find((item) => item.id === id) || { id, name: "已停用分类", icon: "其", color: "#778079", is_active: false }; }
function accountById(id) { return state.data.accounts.find((item) => item.id === id) || { id, name: "已停用账户", icon: "账", is_active: false }; }
function memberById(id) { return state.data.members.find((item) => item.id === id) || { id, name: "未知成员", icon: "?", color: "#778079", is_active: false }; }
function filterTransactionsByMember(transactions, memberId = state.memberFilter) { return memberId === "all" ? transactions : transactions.filter((tx) => tx.member_id === memberId); }
function monthTransactions(month = state.month, memberId = state.memberFilter) { return filterTransactionsByMember(state.data.transactions.filter((tx) => tx.happen_at && tx.happen_at.slice(0, 7) === month), memberId); }
function transactionSort(a, b) { return (b.happen_at || "").localeCompare(a.happen_at || "") || (b.created_at || "").localeCompare(a.created_at || ""); }
function summarize(transactions) {
  return transactions.reduce((result, tx) => { result[tx.type] += Number(tx.amount || 0); return result; }, { expense: 0, income: 0 });
}
function getMonthBudget(month) { return state.data.budgets.find((budget) => budget.period === month && !budget.category_id && Number(budget.amount) > 0) || null; }
function groupByDate(transactions) {
  const groups = new Map(); [...transactions].sort(transactionSort).forEach((tx) => {
    const key = tx.happen_at.slice(0, 10); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(tx);
  }); return groups;
}
function accountBalance(accountId) {
  const account = accountById(accountId);
  return state.data.transactions.reduce((balance, tx) => tx.account_id === accountId ? balance + (tx.type === "income" ? tx.amount : -tx.amount) : balance, Number(account.initial_balance || 0));
}

function renderNavigation() {
  const markup = NAV_ITEMS.map(([page, label, icon]) => {
    const active = page !== "add" && state.page === page ? " active" : ""; const add = page === "add" ? " add-nav" : "";
    return `<button class="nav-button${active}${add}" type="button" data-nav="${page}" aria-label="${label}"><span class="nav-icon-wrap">${ICONS[icon]}</span><span>${label}</span></button>`;
  }).join("");
  document.querySelector("#mobile-nav").innerHTML = markup; document.querySelector("#desktop-nav").innerHTML = markup;
}
function renderSyncStatus() {
  const chip = document.querySelector("#sync-chip");
  if (chip) chip.innerHTML = `<span class="sync-dot ${state.syncStatus}"></span><span>${escapeHtml(state.syncMessage)}</span>`;
  const button = document.querySelector("#top-sync-button");
  if (button) { button.disabled = !syncConfigured() || state.syncing; button.classList.toggle("spinning", state.syncing); button.title = syncConfigured() ? state.syncMessage : "请先在我的页面配置 Gitee 同步"; }
}
function render() {
  renderNavigation();
  const metadata = { home: ["首页", `${formatMonth(state.month)} · 收支总览`], list: ["收支明细", `${formatMonth(state.month)} · 按发生日期统计`], stats: ["月度统计", `${formatMonth(state.month)} · 支出结构与趋势`], settings: ["我的", "管理账本、同步与数据"] }[state.page];
  document.querySelector("#page-title").textContent = metadata[0]; document.querySelector("#page-eyebrow").textContent = metadata[1];
  const content = document.querySelector("#page-content");
  if (state.page === "home") content.innerHTML = homeTemplate();
  if (state.page === "list") content.innerHTML = listTemplate();
  if (state.page === "stats") content.innerHTML = statsTemplate();
  if (state.page === "settings") content.innerHTML = settingsTemplate();
  renderSyncStatus();
}

function monthSwitcherTemplate() {
  const isCurrent = state.month === currentMonth();
  return `<div class="month-switcher"><button class="month-button" type="button" data-action="previous-month" aria-label="上个月" title="上个月">${ICONS.left}</button><button class="text-button month-label" type="button" data-action="current-month" title="回到本月">${formatMonth(state.month)}${isCurrent ? "" : " · 回到本月"}</button><button class="month-button" type="button" data-action="next-month" aria-label="下个月" title="下个月">${ICONS.right}</button></div>`;
}

function memberFilterTemplate() {
  const members = [...state.data.members].filter((member) => member.is_active !== false || state.data.transactions.some((tx) => tx.member_id === member.id)).sort((a, b) => a.sort_order - b.sort_order);
  return `<div class="member-filter" aria-label="按记账成员筛选"><button class="member-filter-button ${state.memberFilter === "all" ? "active" : ""}" type="button" data-action="select-member" data-id="all">全部成员</button>${members.map((member) => `<button class="member-filter-button ${state.memberFilter === member.id ? "active" : ""}" type="button" data-action="select-member" data-id="${escapeHtml(member.id)}"><span class="member-dot" style="background:${sanitizeColor(member.color)}"></span>${escapeHtml(member.name)}${member.is_active === false ? "（已停用）" : ""}</button>`).join("")}</div>`;
}

function homeTemplate() {
  const transactions = monthTransactions(); const totals = summarize(transactions);
  const todayTotals = summarize(filterTransactionsByMember(state.data.transactions.filter((tx) => tx.happen_at?.slice(0, 10) === currentDate())));
  const sharedExpense = summarize(monthTransactions(state.month, "all")).expense;
  const recent = [...transactions].sort(transactionSort).slice(0, 10);
  return `${monthSwitcherTemplate()}${memberFilterTemplate()}<div class="hero-and-budget"><section class="hero-summary" aria-label="本月汇总"><p class="hero-label">本月结余</p><p class="hero-amount">${centsToMoney(totals.income - totals.expense, true)}</p><div class="hero-metrics"><div class="hero-metric"><span>本月支出</span><strong>${centsToMoney(totals.expense)}</strong></div><div class="hero-metric"><span>本月收入</span><strong>${centsToMoney(totals.income)}</strong></div></div></section><section class="section">${budgetTemplate(getMonthBudget(state.month), sharedExpense)}</section></div>
    <button class="quick-add" type="button" data-action="add-transaction">${ICONS.plus}<span>记一笔</span></button>
    <section class="section"><div class="section-heading"><div><h2>今日收支</h2><p>${currentDate()}</p></div></div><div class="summary-grid"><div class="metric-panel"><span>今日支出</span><strong class="expense">${centsToMoney(todayTotals.expense)}</strong></div><div class="metric-panel"><span>今日收入</span><strong class="income">${centsToMoney(todayTotals.income)}</strong></div></div></section>
    <section class="section"><div class="section-heading"><div><h2>最近记录</h2><p>本月最近 ${recent.length} 笔</p></div><button class="text-button" type="button" data-nav="list">查看全部</button></div>${recent.length ? transactionListTemplate(recent, false) : emptyTemplate("这个月还没有记录", "从一笔早餐、通勤或工资开始，账本会立即为你算好本月收支。", true)}</section>`;
}

function budgetTemplate(budget, spent) {
  if (!budget) return `<div class="budget-panel"><div class="section-heading"><div><h2>月度预算</h2><p>全部成员共享支出预算</p></div></div><div class="empty-state" style="padding:18px 12px"><p>尚未设置 ${formatMonth(state.month)} 的总预算</p><button class="button" type="button" data-action="manage-budget">设置预算</button></div></div>`;
  const amount = Number(budget.amount || 0); const ratio = amount > 0 ? spent / amount : 0; const remaining = amount - spent;
  const progressClass = ratio >= 1 ? "over" : ratio >= 0.8 ? "warning" : "";
  const message = ratio >= 1 ? `<p class="budget-message over">${ICONS.alert}已超支 ${centsToMoney(Math.abs(remaining))}，仍可继续记账</p>` : ratio >= .8 ? `<p class="budget-message">${ICONS.alert}已使用 ${Math.round(ratio * 100)}%，请留意后续支出</p>` : "";
  return `<div class="budget-panel"><div class="section-heading"><div><h2>月度预算</h2><p>全部成员支出预算使用进度</p></div><button class="text-button" type="button" data-action="manage-budget">调整</button></div><div class="budget-row"><strong>${centsToMoney(spent)}</strong><span>共 ${centsToMoney(amount)}</span></div><div class="progress-track"><div class="progress-fill ${progressClass}" style="width:${Math.min(ratio * 100, 100)}%"></div></div><div class="budget-row"><span>已用 ${amount ? Math.round(ratio * 100) : 0}%</span><span>${remaining >= 0 ? `剩余 ${centsToMoney(remaining)}` : `超支 ${centsToMoney(-remaining)}`}</span></div>${message}</div>`;
}

function emptyTemplate(title, description, withButton = false) {
  return `<div class="empty-state"><div class="empty-visual">¥</div><h3>${title}</h3><p>${description}</p>${withButton ? '<button class="button primary" type="button" data-action="add-transaction">记一笔</button>' : ""}</div>`;
}
function transactionListTemplate(transactions, grouped = true) {
  const groups = groupByDate(transactions); const renderRows = (items) => items.map(transactionRowTemplate).join("");
  if (!grouped) return `<div class="transaction-list">${renderRows(transactions)}</div>`;
  return `<div class="transaction-list">${[...groups.entries()].map(([date, items]) => {
    const total = summarize(items); const summary = [total.expense ? `支 ${centsToMoney(total.expense)}` : "", total.income ? `收 ${centsToMoney(total.income)}` : ""].filter(Boolean).join(" · ");
    return `<div class="date-group"><div class="date-heading"><strong>${formatDateHeading(date)}</strong><span>${summary}</span></div>${renderRows(items)}</div>`;
  }).join("")}</div>`;
}
function transactionRowTemplate(tx) {
  const category = categoryById(tx.category_id); const account = accountById(tx.account_id); const member = memberById(tx.member_id);
  const detail = [tx.note, account.name, member.name].filter(Boolean).map(escapeHtml).join(" · ");
  return `<button class="transaction-row" type="button" data-action="edit-transaction" data-id="${escapeHtml(tx.id)}"><span class="category-icon" style="color:${sanitizeColor(category.color)};background:${sanitizeColor(category.color)}18">${escapeHtml(category.icon || "其")}</span><span class="transaction-main"><strong>${escapeHtml(category.name)}</strong><small>${detail}</small></span><span class="transaction-amount ${tx.type}">${tx.type === "income" ? "+" : "-"}${centsToMoney(tx.amount)}</span></button>`;
}

function listTemplate() {
  const categories = state.data.categories.filter((item) => item.is_active !== false); const accounts = state.data.accounts.filter((item) => item.is_active !== false); const keyword = state.filters.keyword.trim().toLowerCase();
  const transactions = monthTransactions().filter((tx) => {
    if (state.filters.type !== "all" && tx.type !== state.filters.type) return false;
    if (state.filters.category !== "all" && tx.category_id !== state.filters.category) return false;
    if (state.filters.account !== "all" && tx.account_id !== state.filters.account) return false;
    return !keyword || `${tx.note || ""} ${categoryById(tx.category_id).name} ${accountById(tx.account_id).name} ${memberById(tx.member_id).name}`.toLowerCase().includes(keyword);
  }).sort(transactionSort);
  return `${monthSwitcherTemplate()}${memberFilterTemplate()}<div class="filters"><div class="search-field">${ICONS.search}<label class="sr-only" for="keyword-filter">搜索备注、分类、账户或成员</label><input id="keyword-filter" value="${escapeHtml(state.filters.keyword)}" placeholder="搜索备注、分类、账户或成员" /></div><div class="filter-row"><select id="type-filter" aria-label="按类型筛选"><option value="all">全部类型</option><option value="expense" ${state.filters.type === "expense" ? "selected" : ""}>支出</option><option value="income" ${state.filters.type === "income" ? "selected" : ""}>收入</option></select><select id="category-filter" aria-label="按分类筛选"><option value="all">全部分类</option>${categories.map((item) => `<option value="${item.id}" ${state.filters.category === item.id ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}</select><select id="account-filter" aria-label="按账户筛选"><option value="all">全部账户</option>${accounts.map((item) => `<option value="${item.id}" ${state.filters.account === item.id ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}</select></div></div><div class="section-heading"><div><h2>${transactions.length} 笔记录</h2><p>点击任意记录可编辑或删除</p></div><button class="button primary" type="button" data-action="add-transaction">${ICONS.plus}<span>新增</span></button></div>${transactions.length ? transactionListTemplate(transactions) : emptyTemplate("没有符合条件的记录", monthTransactions().length ? "试试调整筛选条件。" : "这个月还没有记录，先记下第一笔吧。", !monthTransactions().length)}`;
}

function statsTemplate() {
  const transactions = monthTransactions(); const totals = summarize(transactions);
  const previousTotals = summarize(monthTransactions(shiftMonth(state.month, -1)));
  const daysInMonth = new Date(Number(state.month.slice(0, 4)), Number(state.month.slice(5, 7)), 0).getDate();
  const averageDays = state.month < currentMonth() ? daysInMonth : state.month === currentMonth() ? Number(currentDate().slice(8, 10)) : 0;
  const average = averageDays ? Math.round(totals.expense / averageDays) : 0;
  const comparison = previousTotals.expense ? (totals.expense - previousTotals.expense) / previousTotals.expense : null;
  const categoryMap = new Map();
  transactions.filter((tx) => tx.type === "expense").forEach((tx) => categoryMap.set(tx.category_id, (categoryMap.get(tx.category_id) || 0) + tx.amount));
  const categoryRows = [...categoryMap.entries()].map(([id, amount]) => ({ category: categoryById(id), amount })).sort((a, b) => b.amount - a.amount);
  const daily = Array.from({ length: daysInMonth }, (_, index) => {
    const date = `${state.month}-${String(index + 1).padStart(2, "0")}`;
    return transactions.filter((tx) => tx.type === "expense" && tx.happen_at.startsWith(date)).reduce((sum, tx) => sum + tx.amount, 0);
  });
  const history = Array.from({ length: 6 }, (_, index) => shiftMonth(state.month, index - 5)).map((month) => ({ month, value: summarize(monthTransactions(month)).expense }));
  return `${monthSwitcherTemplate()}${memberFilterTemplate()}<div class="stats-overview">
    <div class="metric-panel"><span>本月支出</span><strong class="expense">${centsToMoney(totals.expense)}</strong>${comparisonTemplate(comparison)}</div>
    <div class="metric-panel"><span>本月收入</span><strong class="income">${centsToMoney(totals.income)}</strong></div>
    <div class="metric-panel"><span>本月结余</span><strong>${centsToMoney(totals.income - totals.expense, true)}</strong></div>
    <div class="metric-panel"><span>日均支出</span><strong>${centsToMoney(average)}</strong><span class="comparison">按 ${averageDays} 个自然日</span></div>
  </div><div class="chart-layout">
    <section class="section"><div class="section-heading"><div><h2>支出分类</h2><p>金额与本月支出占比</p></div></div>${categoryRows.length ? `<div class="donut-wrap"><div class="donut" style="background:${donutGradient(categoryRows, totals.expense)}"></div><div class="legend">${categoryRows.slice(0, 6).map((row) => `<button class="legend-row" type="button" data-action="filter-category" data-id="${row.category.id}"><span class="legend-dot" style="background:${sanitizeColor(row.category.color)}"></span><strong>${escapeHtml(row.category.name)}</strong><span>${Math.round(row.amount / totals.expense * 100)}% · ${centsToMoney(row.amount)}</span></button>`).join("")}</div></div>` : emptyTemplate("暂无支出数据", "本月新增支出后，这里会显示分类占比。")}</section>
    <section class="section"><div class="section-heading"><div><h2>每日支出</h2><p>按记录发生日期统计</p></div></div>${barChartTemplate(daily, "day")}</section>
  </div><section class="section"><div class="section-heading"><div><h2>近 6 个月趋势</h2><p>月度支出对比</p></div></div>${barChartTemplate(history.map((item) => item.value), "month", history.map((item) => item.month))}</section>`;
}

function comparisonTemplate(value) {
  if (value === null) return '<span class="comparison">上月无支出</span>';
  if (Math.abs(value) < .005) return '<span class="comparison">与上月持平</span>';
  return `<span class="comparison ${value > 0 ? "up" : "down"}">较上月${value > 0 ? "增加" : "减少"} ${Math.abs(value * 100).toFixed(1)}%</span>`;
}
function donutGradient(rows, total) {
  let cursor = 0;
  const parts = rows.map((row) => { const start = cursor; cursor += row.amount / total * 100; return `${sanitizeColor(row.category.color)} ${start}% ${cursor}%`; });
  return `conic-gradient(${parts.join(",")})`;
}
function barChartTemplate(values, mode, labels = []) {
  const max = Math.max(...values, 1); const step = mode === "day" ? (values.length > 20 ? 5 : 2) : 1;
  return `<div class="bar-chart ${mode === "month" ? "history-chart" : ""}" aria-label="${mode === "day" ? "每日支出柱状图" : "近六个月支出柱状图"}">${values.map((value, index) => {
    const label = mode === "day" ? ((index + 1 === 1 || (index + 1) % step === 0 || index === values.length - 1) ? index + 1 : "") : `${Number(labels[index].slice(5))}月`;
    const height = value ? Math.max(value / max * 100, 3) : 0;
    return `<div class="bar-column" title="${mode === "day" ? `${index + 1}日` : labels[index]}：${centsToMoney(value)}"><div class="bar-track"><div class="bar" style="height:${height}%"></div></div><span>${label}</span></div>`;
  }).join("")}</div>`;
}

function settingsTemplate() {
  const budget = getMonthBudget(state.month); const activeAccounts = state.data.accounts.filter((account) => account.is_active !== false); const activeMembers = state.data.members.filter((member) => member.is_active !== false);
  const syncDetail = syncConfigured() ? `${state.sync.username}/${state.sync.repository}` : "未配置";
  return `<div class="settings-grid"><div>
    <section class="settings-section"><h2>日常管理</h2><p>成员、预算、支付账户和分类会随账本数据一起备份。</p><div class="settings-list">
      ${settingsButton("manage-members", "成员管理", `${activeMembers.length} 位启用成员`, ICONS.user)}
      ${settingsButton("manage-budget", "月度预算", budget ? `${formatMonth(state.month)} · ${centsToMoney(budget.amount)}` : `${formatMonth(state.month)} · 未设置`, ICONS.target)}
      ${settingsButton("manage-accounts", "支付账户管理", `${activeAccounts.length} 个启用账户`, ICONS.wallet)}
      ${settingsButton("manage-categories", "分类管理", `${state.data.categories.filter((item) => item.is_active !== false).length} 个启用分类`, ICONS.tag)}
    </div></section>
    <section class="settings-section"><h2>记账默认值</h2><p>新增记录时自动选中，可随时更改。</p><div class="settings-list">
      <label class="settings-item"><span class="settings-item-main"><strong>默认记账成员</strong><small>选择“全部成员”时新增记录的归属</small></span><select id="default-member" class="settings-item-value" aria-label="默认记账成员">${memberOptions(activeMembers, state.data.settings.default_member_id)}</select></label>
      <label class="settings-item"><span class="settings-item-main"><strong>默认支出账户</strong><small>付款时优先选中</small></span><select id="default-expense-account" class="settings-item-value" aria-label="默认支出账户">${accountOptions(activeAccounts, state.data.settings.default_expense_account_id)}</select></label>
      <label class="settings-item"><span class="settings-item-main"><strong>默认收入账户</strong><small>收款时优先选中</small></span><select id="default-income-account" class="settings-item-value" aria-label="默认收入账户">${accountOptions(activeAccounts, state.data.settings.default_income_account_id)}</select></label>
    </div></section>
  </div><div>
    <section class="settings-section"><h2>同步与数据</h2><p>账目默认保存在本机；配置后自动写入你的 Gitee 私有仓库。</p><div class="settings-list">
      ${settingsButton("configure-sync", "Gitee 私有仓库", syncDetail, ICONS.cloud, syncConfigured())}
      ${settingsButton("install-app", "安装到手机", installDetail(), ICONS.smartphone)}
      ${settingsButton("export-csv", "导出本月 CSV", formatMonth(state.month), ICONS.download)}
      ${settingsButton("export-json", "导出 JSON 备份", `${state.data.transactions.length} 笔记录`, ICONS.download)}
      ${settingsButton("import-json", "从 JSON 恢复", "恢复前会自动下载当前备份", ICONS.upload)}
    </div></section>
    <section class="settings-section"><h2>关于</h2><p>数据不经过业务服务器，也未接入广告或统计 SDK。</p><div class="settings-list">
      <div class="settings-item"><span class="settings-item-main"><strong>记账助手</strong><small>本地优先 PWA</small></span><span class="settings-item-value">v${APP_VERSION}</span></div>
      <button class="settings-item" type="button" data-action="clear-data"><span class="settings-item-main"><strong style="color:var(--danger)">清空全部账本数据</strong><small>成员、分类、支付账户、预算和记录都将重置</small></span><span class="chevron">›</span></button>
    </div></section>
  </div></div>`;
}
function settingsButton(action, title, detail, icon, enabled = false) {
  return `<button class="settings-item" type="button" data-action="${action}"><span style="color:var(--brand);width:23px;display:grid">${icon}</span><span class="settings-item-main" style="flex:1"><strong>${title}</strong><small>${escapeHtml(detail)}</small></span>${action === "configure-sync" ? `<span class="status-pill ${enabled ? "on" : ""}">${enabled ? "已开启" : "本地"}</span>` : '<span class="chevron">›</span>'}</button>`;
}
function accountOptions(accounts, selected) { return accounts.map((account) => `<option value="${account.id}" ${account.id === selected ? "selected" : ""}>${escapeHtml(account.name)}</option>`).join(""); }
function memberOptions(members, selected) { return members.map((member) => `<option value="${member.id}" ${member.id === selected ? "selected" : ""}>${escapeHtml(member.name)}</option>`).join(""); }

function openInstallSheet() {
  const installed = state.installed || isStandalone();
  const localAddress = ["localhost", "127.0.0.1"].includes(location.hostname);
  const directInstall = !installed && Boolean(state.installPrompt);
  const body = `<div class="install-guide">
    <div class="install-app-mark"><img src="./assets/app-icon-192.png" alt="" /><span><strong>记账助手</strong><small>${installed ? "已作为独立应用运行" : "添加到桌面，像普通应用一样打开"}</small></span></div>
    ${localAddress ? '<div class="notice">当前是电脑本地测试地址，手机无法直接访问。部署完成后，请用手机打开公网 HTTPS 地址安装。</div>' : ""}
    ${installed ? '<div class="notice success">当前设备已经安装，无需重复操作。</div>' : ""}
    ${directInstall ? '<button class="button primary install-primary" type="button" data-action="request-install">安装到此设备</button>' : ""}
    <section class="install-platform"><h3>安卓手机</h3><ol><li>使用 Chrome 或 Edge 打开本页面。</li><li>${directInstall ? "点击上方“安装到此设备”。" : "打开浏览器菜单，选择“安装应用”或“添加到主屏幕”。"}</li><li>确认后，从手机桌面打开“记账助手”。</li></ol></section>
    <section class="install-platform"><h3>iPhone</h3><ol><li>使用 Safari 打开本页面。</li><li>点击底部“分享”按钮，选择“添加到主屏幕”。</li><li>点击右上角“添加”。</li></ol></section>
    <p class="data-note">安装版和网页使用同一份本机数据。换设备时，请在新设备重新填写 Gitee 同步配置。</p>
  </div>`;
  openSheet("安装到手机", body);
}

async function requestInstall() {
  if (!state.installPrompt) { openInstallSheet(); return; }
  const promptEvent = state.installPrompt;
  state.installPrompt = null;
  await promptEvent.prompt();
  const result = await promptEvent.userChoice;
  closeSheet(); render();
  toast(result.outcome === "accepted" ? "正在安装记账助手" : "已取消安装", result.outcome === "accepted" ? "success" : "error");
}

function openTransactionSheet(id = null) {
  const existing = id ? state.data.transactions.find((tx) => tx.id === id) : null; if (id && !existing) return;
  const type = existing?.type || "expense";
  const defaultAccount = type === "expense" ? state.data.settings.default_expense_account_id : state.data.settings.default_income_account_id;
  const defaultMember = state.memberFilter !== "all" && memberById(state.memberFilter).is_active !== false ? state.memberFilter : state.data.settings.default_member_id;
  const activeCategories = state.data.categories.filter((item) => item.type === type && item.is_active !== false).sort((a, b) => a.sort_order - b.sort_order);
  const tx = existing || { amount: "", type, category_id: activeCategories[0]?.id || "", account_id: defaultAccount, member_id: defaultMember, happen_at: currentDateTime(), note: "" };
  const body = `<form id="transaction-form" class="form-grid"><div class="segmented" aria-label="记录类型">
    <button class="segment ${type === "expense" ? "active" : ""}" type="button" data-form-type="expense" data-type="expense">支出</button><button class="segment ${type === "income" ? "active" : ""}" type="button" data-form-type="income" data-type="income">收入</button></div>
    <div class="field"><label for="transaction-amount">金额</label><div class="amount-field"><input id="transaction-amount" name="amount" type="number" inputmode="decimal" min="0.01" step="0.01" max="99999999.99" value="${existing ? (tx.amount / 100).toFixed(2) : ""}" placeholder="0.00" required /></div></div>
    <div class="field"><span class="field-label">分类</span><div id="transaction-categories" class="category-picker">${categoryChoices(type, tx.category_id)}</div><input id="transaction-category" name="category" type="hidden" value="${escapeHtml(tx.category_id)}" /></div>
    <div class="field-inline"><div class="field"><label for="transaction-date">日期</label><input id="transaction-date" name="date" type="date" value="${tx.happen_at.slice(0, 10)}" required /></div><div class="field"><label for="transaction-member">记账成员</label><select id="transaction-member" name="member" required>${memberOptionsForTransaction(tx.member_id)}</select></div></div>
    <div class="field"><label for="transaction-account">支付/收款账户</label><select id="transaction-account" name="account" required>${accountOptionsForTransaction(tx.account_id)}</select></div>
    <div class="field"><label for="transaction-note">备注</label><textarea id="transaction-note" name="note" maxlength="100" placeholder="可选，最多 100 字">${escapeHtml(tx.note || "")}</textarea><small><span id="note-count">${(tx.note || "").length}</span>/100</small></div></form>`;
  const deleteButton = existing ? `<button class="action-button" type="button" data-action="delete-transaction" data-id="${existing.id}" style="color:var(--danger)">${ICONS.trash}<span>删除</span></button>` : "";
  openSheet(existing ? "编辑记录" : "记一笔", body, `${deleteButton}<button class="action-button primary" type="submit" form="transaction-form">保存</button>`);
  const form = document.querySelector("#transaction-form"); form.dataset.type = type; form.dataset.id = existing?.id || ""; bindTransactionForm();
  setTimeout(() => document.querySelector("#transaction-amount")?.focus(), 120);
}

function categoryChoices(type, selectedId) {
  return state.data.categories.filter((item) => item.type === type && item.is_active !== false).sort((a, b) => a.sort_order - b.sort_order)
    .map((item) => `<button class="category-choice ${item.id === selectedId ? "active" : ""}" type="button" data-category-choice="${item.id}"><span class="choice-icon" style="color:${sanitizeColor(item.color)}">${escapeHtml(item.icon)}</span><span>${escapeHtml(item.name)}</span></button>`).join("");
}
function accountOptionsForTransaction(selectedId) {
  return accountOptions(state.data.accounts.filter((item) => item.is_active !== false || item.id === selectedId).sort((a, b) => a.sort_order - b.sort_order), selectedId);
}
function memberOptionsForTransaction(selectedId) {
  return memberOptions(state.data.members.filter((item) => item.is_active !== false || item.id === selectedId).sort((a, b) => a.sort_order - b.sort_order), selectedId);
}
function bindTransactionForm() {
  const form = document.querySelector("#transaction-form"); form.addEventListener("submit", saveTransactionFromForm);
  form.querySelectorAll("[data-form-type]").forEach((button) => button.addEventListener("click", () => {
    form.dataset.type = button.dataset.formType; form.querySelectorAll("[data-form-type]").forEach((item) => item.classList.toggle("active", item === button));
    const defaultCategory = state.data.categories.find((item) => item.type === button.dataset.formType && item.is_active !== false); const selectedId = defaultCategory?.id || "";
    form.elements.category.value = selectedId; document.querySelector("#transaction-categories").innerHTML = categoryChoices(button.dataset.formType, selectedId);
    form.elements.account.value = button.dataset.formType === "expense" ? state.data.settings.default_expense_account_id : state.data.settings.default_income_account_id;
  }));
  form.addEventListener("click", (event) => {
    const choice = event.target.closest("[data-category-choice]"); if (!choice) return;
    form.elements.category.value = choice.dataset.categoryChoice; form.querySelectorAll("[data-category-choice]").forEach((item) => item.classList.toggle("active", item === choice));
  });
  form.elements.note.addEventListener("input", (event) => { document.querySelector("#note-count").textContent = event.target.value.length; });
}
function saveTransactionFromForm(event) {
  event.preventDefault(); const form = event.currentTarget; const amount = moneyToCents(form.elements.amount.value); const categoryId = form.elements.category.value;
  if (!Number.isInteger(amount) || amount <= 0) return toast("请输入大于 0 的有效金额", "error");
  if (!categoryId) return toast("请选择分类", "error");
  const timestamp = nowIso(); const existing = state.data.transactions.find((tx) => tx.id === form.dataset.id); const oldTime = existing?.happen_at?.slice(11, 16) || currentDateTime().slice(11, 16);
  const next = { id: existing?.id || uid("tx"), ledger_id: LEDGER_ID, type: form.dataset.type, amount, category_id: categoryId, account_id: form.elements.account.value, member_id: form.elements.member.value, happen_at: `${form.elements.date.value}T${oldTime}`, note: form.elements.note.value.trim().slice(0, 100), source: existing?.source || "manual", created_at: existing?.created_at || timestamp, updated_at: timestamp };
  if (existing) Object.assign(existing, next); else state.data.transactions.push(next);
  saveLocal(); closeSheet(); render(); toast(existing ? "记录已更新" : "记录已保存");
}
async function deleteTransaction(id) {
  const transaction = state.data.transactions.find((tx) => tx.id === id); if (!transaction) return;
  if (!await confirmDialog("删除这笔记录？", "删除后，本月汇总、预算和统计会立即更新。", "删除")) return;
  const deletedAt = nowIso(); state.data.transactions = state.data.transactions.filter((tx) => tx.id !== id);
  state.data.deleted_transactions = upsertByTimestamp(state.data.deleted_transactions, { id, deleted_at: deletedAt, updated_at: deletedAt });
  saveLocal(); closeSheet(); render(); toast("记录已删除");
}

function openBudgetSheet() {
  const total = getMonthBudget(state.month);
  const monthExpenses = monthTransactions(state.month, "all").filter((tx) => tx.type === "expense");
  const categoryBudgets = new Map(state.data.budgets.filter((item) => item.period === state.month && item.category_id && Number(item.amount) > 0).map((item) => [item.category_id, item]));
  const categories = state.data.categories.filter((item) => item.type === "expense" && item.is_active !== false).sort((a, b) => a.sort_order - b.sort_order);
  const body = `<form id="budget-form" class="form-grid"><div class="notice">预算只统计支出，并按记录的发生日期归入自然月。</div>
    <div class="field"><label for="total-budget">${formatMonth(state.month)}总预算</label><input id="total-budget" name="total" type="number" inputmode="decimal" min="0" step="0.01" value="${total ? (total.amount / 100).toFixed(2) : ""}" placeholder="例如 3000" /></div>
    <div class="field"><span class="field-label">分类预算（可选）</span><div class="manage-list">${categories.map((category) => {
      const budget = categoryBudgets.get(category.id);
      const spent = monthExpenses.filter((tx) => tx.category_id === category.id).reduce((sum, tx) => sum + tx.amount, 0);
      const detail = budget ? (spent > budget.amount ? `已用 ${centsToMoney(spent)} · 超支 ${centsToMoney(spent - budget.amount)}` : `已用 ${centsToMoney(spent)} · 剩余 ${centsToMoney(budget.amount - spent)}`) : "留空表示不单独限制";
      return `<label class="manage-row"><span class="category-icon" style="color:${sanitizeColor(category.color)};background:${sanitizeColor(category.color)}18">${escapeHtml(category.icon)}</span><span class="manage-info"><strong>${escapeHtml(category.name)}</strong><small>${detail}</small></span><input name="category-${category.id}" aria-label="${escapeHtml(category.name)}预算" type="number" inputmode="decimal" min="0" step="0.01" value="${budget ? (budget.amount / 100).toFixed(2) : ""}" placeholder="0" style="width:98px;height:42px;border:1px solid var(--line);border-radius:8px;padding:8px" /></label>`;
    }).join("")}</div></div></form>`;
  openSheet("设置月度预算", body, '<button class="action-button primary" type="submit" form="budget-form">保存预算</button>');
  document.querySelector("#budget-form").addEventListener("submit", (event) => {
    event.preventDefault(); const stamp = nowIso();
    const existingBudgets = new Map(state.data.budgets.filter((item) => item.period === state.month).map((item) => [item.category_id || "total", item]));
    const totalCents = event.currentTarget.elements.total.value ? moneyToCents(event.currentTarget.elements.total.value) : 0;
    const totalRecord = existingBudgets.get("total");
    if (totalRecord) Object.assign(totalRecord, { amount: Math.max(totalCents, 0), updated_at: stamp });
    else state.data.budgets.push({ id: uid("budget"), ledger_id: LEDGER_ID, period: state.month, category_id: null, amount: Math.max(totalCents, 0), updated_at: stamp });
    categories.forEach((category) => {
      const value = event.currentTarget.elements[`category-${category.id}`].value; const cents = value ? moneyToCents(value) : 0;
      const existing = existingBudgets.get(category.id);
      if (existing) Object.assign(existing, { amount: Math.max(cents, 0), updated_at: stamp });
      else state.data.budgets.push({ id: uid("budget"), ledger_id: LEDGER_ID, period: state.month, category_id: category.id, amount: Math.max(cents, 0), updated_at: stamp });
    });
    saveLocal(); closeSheet(); render(); toast("预算已更新");
  });
}

function openAccountsSheet() {
  const rows = [...state.data.accounts].sort((a, b) => a.sort_order - b.sort_order).map((account) => `<div class="manage-row ${account.is_active === false ? "inactive" : ""}"><span class="category-icon" style="background:var(--brand-soft);color:var(--brand)">${escapeHtml(account.icon || "账")}</span><span class="manage-info"><strong>${escapeHtml(account.name)}</strong><small>${account.is_active === false ? "已停用 · " : ""}余额 ${centsToMoney(accountBalance(account.id), true)}</small></span><span class="manage-actions"><button type="button" data-action="edit-account" data-id="${account.id}" title="编辑账户" aria-label="编辑 ${escapeHtml(account.name)}">${ICONS.edit}</button><button type="button" data-action="remove-account" data-id="${account.id}" title="${account.is_active === false ? "启用" : "删除或停用"}" aria-label="${account.is_active === false ? "启用" : "删除或停用"} ${escapeHtml(account.name)}">${account.is_active === false ? "+" : ICONS.trash}</button></span></div>`).join("");
  openSheet("账户管理", `<button class="add-inline" type="button" data-action="add-account">${ICONS.plus}<span>新增账户</span></button><div class="manage-list">${rows}</div>`, "");
}

function openAccountEditor(id = null) {
  const account = id ? state.data.accounts.find((item) => item.id === id) : null;
  const kinds = [["cash", "现金"], ["wechat", "微信零钱"], ["alipay", "支付宝"], ["bank_card", "储蓄卡"], ["credit_card", "信用卡"], ["other", "其他"]];
  const body = `<form id="account-form" class="form-grid"><div class="field"><label for="account-name">账户名称</label><input id="account-name" name="name" maxlength="20" value="${escapeHtml(account?.name || "")}" placeholder="例如 工资卡" required /></div><div class="field"><label for="account-kind">账户类型</label><select id="account-kind" name="kind">${kinds.map(([value, label]) => `<option value="${value}" ${account?.kind === value ? "selected" : ""}>${label}</option>`).join("")}</select></div><div class="field"><label for="account-balance">期初余额</label><input id="account-balance" name="balance" type="number" inputmode="decimal" step="0.01" value="${account ? (account.initial_balance / 100).toFixed(2) : "0.00"}" /></div></form>`;
  openSheet(account ? "编辑账户" : "新增账户", body, '<button class="action-button primary" type="submit" form="account-form">保存</button>');
  document.querySelector("#account-form").addEventListener("submit", (event) => {
    event.preventDefault(); const form = event.currentTarget; const iconMap = { cash: "现", wechat: "微", alipay: "支", bank_card: "卡", credit_card: "信", other: "账" };
    const next = { id: account?.id || uid("acc"), ledger_id: LEDGER_ID, name: form.elements.name.value.trim(), kind: form.elements.kind.value, icon: iconMap[form.elements.kind.value], initial_balance: moneyToCents(form.elements.balance.value || 0), sort_order: account?.sort_order ?? state.data.accounts.length, is_builtin: account?.is_builtin || false, is_active: account?.is_active ?? true, updated_at: nowIso() };
    if (!next.name) return toast("请输入账户名称", "error");
    if (account) Object.assign(account, next); else state.data.accounts.push(next);
    saveLocal(); closeSheet(); render(); toast("账户已保存");
  });
}

async function removeAccount(id) {
  const account = state.data.accounts.find((item) => item.id === id); if (!account) return;
  if (account.is_active === false) { account.is_active = true; account.updated_at = nowIso(); saveLocal(); openAccountsSheet(); render(); return toast("账户已启用"); }
  const used = state.data.transactions.some((tx) => tx.account_id === id);
  if (state.data.accounts.filter((item) => item.is_active !== false).length <= 1) return toast("至少保留一个启用账户", "error");
  if (!await confirmDialog(used ? "停用这个账户？" : "删除这个账户？", used ? "该账户已有历史记录，将停用并保留历史数据。" : "该账户尚无记录，可以直接删除。", used ? "停用" : "删除")) return;
  if (used || account.is_builtin) { account.is_active = false; account.updated_at = nowIso(); }
  else {
    const deletedAt = nowIso(); state.data.accounts = state.data.accounts.filter((item) => item.id !== id);
    state.data.deleted_accounts = upsertByTimestamp(state.data.deleted_accounts, { id, deleted_at: deletedAt, updated_at: deletedAt });
  }
  repairDefaultAccounts(); saveLocal(); openAccountsSheet(); render(); toast(used || account.is_builtin ? "账户已停用" : "账户已删除");
}
function repairDefaultAccounts() {
  const fallback = state.data.accounts.find((item) => item.is_active !== false)?.id || "";
  if (accountById(state.data.settings.default_expense_account_id).is_active === false) state.data.settings.default_expense_account_id = fallback;
  if (accountById(state.data.settings.default_income_account_id).is_active === false) state.data.settings.default_income_account_id = fallback;
}

function openMembersSheet() {
  const rows = [...state.data.members].sort((a, b) => a.sort_order - b.sort_order).map((member) => {
    const count = state.data.transactions.filter((tx) => tx.member_id === member.id).length;
    return `<div class="manage-row ${member.is_active === false ? "inactive" : ""}"><span class="category-icon" style="color:${sanitizeColor(member.color)};background:${sanitizeColor(member.color)}18">${escapeHtml(member.icon || member.name.slice(0, 1))}</span><span class="manage-info"><strong>${escapeHtml(member.name)}</strong><small>${member.is_active === false ? "已停用 · " : ""}${count} 笔记录${member.id === state.data.settings.default_member_id ? " · 默认" : ""}</small></span><span class="manage-actions"><button type="button" data-action="edit-member" data-id="${member.id}" title="编辑成员" aria-label="编辑 ${escapeHtml(member.name)}">${ICONS.edit}</button><button type="button" data-action="remove-member" data-id="${member.id}" title="${member.is_active === false ? "启用" : "删除或停用"}" aria-label="${member.is_active === false ? "启用" : "删除或停用"} ${escapeHtml(member.name)}">${member.is_active === false ? "+" : ICONS.trash}</button></span></div>`;
  }).join("");
  openSheet("成员管理", `<div class="notice success">每笔收支都归属于一位成员；首页、明细和统计可按成员查看。</div><button class="add-inline" type="button" data-action="add-member" style="margin-top:13px">${ICONS.plus}<span>新增成员</span></button><div class="manage-list">${rows}</div>`, "");
}

function openMemberEditor(id = null) {
  const member = id ? state.data.members.find((item) => item.id === id) : null;
  const body = `<form id="member-form" class="form-grid"><div class="field"><label for="member-name">成员名称</label><input id="member-name" name="name" maxlength="12" value="${escapeHtml(member?.name || "")}" placeholder="例如 小李" required /></div><div class="field-inline"><div class="field"><label for="member-icon">头像文字</label><input id="member-icon" name="icon" maxlength="2" value="${escapeHtml(member?.icon || "")}" placeholder="李" /></div><div class="field"><label for="member-color">成员颜色</label><input id="member-color" name="color" type="color" value="${sanitizeColor(member?.color || "#3b82a0")}" style="padding:5px;height:48px" /></div></div></form>`;
  openSheet(member ? "编辑成员" : "新增成员", body, '<button class="action-button primary" type="submit" form="member-form">保存</button>');
  document.querySelector("#member-form").addEventListener("submit", (event) => {
    event.preventDefault(); const form = event.currentTarget; const name = form.elements.name.value.trim();
    if (!name) return toast("请输入成员名称", "error");
    if (state.data.members.some((item) => item.id !== member?.id && item.name === name)) return toast("已存在同名成员", "error");
    const next = { id: member?.id || uid("member"), name, icon: form.elements.icon.value.trim().slice(0, 2) || name.slice(0, 1), color: sanitizeColor(form.elements.color.value), sort_order: member?.sort_order ?? state.data.members.length, is_builtin: member?.is_builtin || false, is_active: member?.is_active ?? true, updated_at: nowIso() };
    if (member) Object.assign(member, next); else state.data.members.push(next);
    saveLocal(); closeSheet(); render(); toast("成员已保存");
  });
}

async function removeMember(id) {
  const member = state.data.members.find((item) => item.id === id); if (!member) return;
  if (member.is_active === false) { member.is_active = true; member.updated_at = nowIso(); saveLocal(); openMembersSheet(); render(); return toast("成员已启用"); }
  if (state.data.members.filter((item) => item.is_active !== false).length <= 1) return toast("至少保留一位启用成员", "error");
  const used = state.data.transactions.some((tx) => tx.member_id === id);
  if (!await confirmDialog(used ? "停用这位成员？" : "删除这位成员？", used ? "该成员已有历史记录，将停用并保留历史统计。" : "该成员尚无记录，可以直接删除。", used ? "停用" : "删除")) return;
  if (used || member.is_builtin) { member.is_active = false; member.updated_at = nowIso(); }
  else {
    const deletedAt = nowIso(); state.data.members = state.data.members.filter((item) => item.id !== id);
    state.data.deleted_members = upsertByTimestamp(state.data.deleted_members, { id, deleted_at: deletedAt, updated_at: deletedAt });
  }
  if (state.memberFilter === id) state.memberFilter = "all";
  repairDefaultMember(); saveLocal(); openMembersSheet(); render(); toast(used || member.is_builtin ? "成员已停用" : "成员已删除");
}
function repairDefaultMember() {
  const fallback = state.data.members.find((item) => item.is_active !== false)?.id || "";
  if (memberById(state.data.settings.default_member_id).is_active === false) {
    state.data.settings.default_member_id = fallback; state.data.settings.updated_at = nowIso();
  }
}

function openCategoriesSheet() {
  const group = (type, label) => `<div class="section-heading" style="margin-top:18px"><div><h2>${label}</h2></div></div><div class="manage-list">${state.data.categories.filter((item) => item.type === type).sort((a, b) => a.sort_order - b.sort_order).map((category) => `<div class="manage-row ${category.is_active === false ? "inactive" : ""}"><span class="category-icon" style="color:${sanitizeColor(category.color)};background:${sanitizeColor(category.color)}18">${escapeHtml(category.icon)}</span><span class="manage-info"><strong>${escapeHtml(category.name)}</strong><small>${category.is_builtin ? "内置" : "自定义"}${category.is_active === false ? " · 已停用" : ""}</small></span><span class="manage-actions"><button type="button" data-action="edit-category" data-id="${category.id}" title="编辑分类" aria-label="编辑 ${escapeHtml(category.name)}">${ICONS.edit}</button><button type="button" data-action="remove-category" data-id="${category.id}" title="${category.is_active === false ? "启用" : "删除或停用"}" aria-label="${category.is_active === false ? "启用" : "删除或停用"} ${escapeHtml(category.name)}">${category.is_active === false ? "+" : ICONS.trash}</button></span></div>`).join("")}</div>`;
  openSheet("分类管理", `<button class="add-inline" type="button" data-action="add-category">${ICONS.plus}<span>新增分类</span></button>${group("expense", "支出分类")}${group("income", "收入分类")}`, "");
}

function openCategoryEditor(id = null) {
  const category = id ? state.data.categories.find((item) => item.id === id) : null;
  const body = `<form id="category-form" class="form-grid"><div class="field"><label for="category-type">分类类型</label><select id="category-type" name="type" ${category ? "disabled" : ""}><option value="expense" ${category?.type !== "income" ? "selected" : ""}>支出</option><option value="income" ${category?.type === "income" ? "selected" : ""}>收入</option></select></div><div class="field-inline"><div class="field"><label for="category-name">分类名称</label><input id="category-name" name="name" maxlength="12" value="${escapeHtml(category?.name || "")}" placeholder="例如 宠物" required /></div><div class="field"><label for="category-icon">图标文字</label><input id="category-icon" name="icon" maxlength="2" value="${escapeHtml(category?.icon || "")}" placeholder="宠" required /></div></div><div class="field"><label for="category-color">分类颜色</label><input id="category-color" name="color" type="color" value="${sanitizeColor(category?.color || "#176b4d")}" style="padding:5px;height:48px" /></div></form>`;
  openSheet(category ? "编辑分类" : "新增分类", body, '<button class="action-button primary" type="submit" form="category-form">保存</button>');
  document.querySelector("#category-form").addEventListener("submit", (event) => {
    event.preventDefault(); const form = event.currentTarget; const type = category?.type || form.elements.type.value; const name = form.elements.name.value.trim();
    if (!name) return toast("请输入分类名称", "error");
    if (state.data.categories.some((item) => item.id !== category?.id && item.type === type && item.name === name)) return toast("同类型中已存在该分类", "error");
    const next = { id: category?.id || uid("cat"), type, name, icon: form.elements.icon.value.trim().slice(0, 2) || name.slice(0, 1), color: sanitizeColor(form.elements.color.value), parent_id: null, sort_order: category?.sort_order ?? state.data.categories.filter((item) => item.type === type).length, is_builtin: category?.is_builtin || false, is_active: category?.is_active ?? true, updated_at: nowIso() };
    if (category) Object.assign(category, next); else state.data.categories.push(next);
    saveLocal(); closeSheet(); render(); toast("分类已保存");
  });
}

async function removeCategory(id) {
  const category = state.data.categories.find((item) => item.id === id); if (!category) return;
  if (category.is_active === false) { category.is_active = true; category.updated_at = nowIso(); saveLocal(); openCategoriesSheet(); render(); return toast("分类已启用"); }
  const used = state.data.transactions.some((tx) => tx.category_id === id);
  if (state.data.categories.filter((item) => item.type === category.type && item.is_active !== false).length <= 1) return toast("每种收支类型至少保留一个启用分类", "error");
  if (!await confirmDialog(used ? "停用这个分类？" : "删除这个分类？", used ? "该分类已有历史记录，将停用并保留历史数据。" : "该分类尚无记录，可以直接删除。", used ? "停用" : "删除")) return;
  if (used || category.is_builtin) { category.is_active = false; category.updated_at = nowIso(); }
  else {
    const deletedAt = nowIso(); state.data.categories = state.data.categories.filter((item) => item.id !== id);
    state.data.deleted_categories = upsertByTimestamp(state.data.deleted_categories, { id, deleted_at: deletedAt, updated_at: deletedAt });
  }
  saveLocal(); openCategoriesSheet(); render(); toast(used || category.is_builtin ? "分类已停用" : "分类已删除");
}

function openSyncSheet() {
  const body = `<form id="sync-form" class="form-grid"><div class="notice">请先在 Gitee 创建一个私有仓库，并使用具有仓库读写权限的私人令牌。令牌仅保存在当前浏览器，不会写入账本文件。</div>
    <div class="field"><label for="sync-username">Gitee 用户名</label><input id="sync-username" name="username" autocomplete="username" value="${escapeHtml(state.sync.username)}" required /></div>
    <div class="field"><label for="sync-token">私人令牌</label><input id="sync-token" name="token" type="password" autocomplete="current-password" value="${escapeHtml(state.sync.token)}" required /></div>
    <div class="field-inline"><div class="field"><label for="sync-repository">私有仓库名</label><input id="sync-repository" name="repository" value="${escapeHtml(state.sync.repository)}" required /></div><div class="field"><label for="sync-branch">分支</label><input id="sync-branch" name="branch" value="${escapeHtml(state.sync.branch)}" required /></div></div>
    <div class="field"><label for="sync-path">数据文件路径</label><input id="sync-path" name="path" value="${escapeHtml(state.sync.path)}" required /><small>例如 data/ledger.json，目录会由 Gitee API 自动创建。</small></div>
    ${syncConfigured() ? '<button class="button danger" type="button" data-action="disable-sync">停用云同步并移除本机令牌</button>' : ""}
  </form>`;
  openSheet("Gitee 同步", body, '<button class="action-button primary" type="submit" form="sync-form">保存并同步</button>');
  document.querySelector("#sync-form").addEventListener("submit", async (event) => {
    event.preventDefault(); const form = event.currentTarget;
    state.sync = { username: form.elements.username.value.trim(), token: form.elements.token.value.trim(), repository: form.elements.repository.value.trim(), branch: form.elements.branch.value.trim(), path: form.elements.path.value.trim().replace(/^\/+/, "") };
    localStorage.setItem(SYNC_KEY, JSON.stringify(state.sync)); closeSheet(); render();
    await syncWithGitee();
  });
}

async function disableSync() {
  if (!await confirmDialog("停用 Gitee 同步？", "本机账本数据会保留，仅移除当前浏览器中的同步配置和令牌。", "停用")) return;
  localStorage.removeItem(SYNC_KEY); state.sync = { username: "", token: "", repository: "bookkeeping-data", branch: "master", path: "data/ledger.json" };
  updateSyncLabel(); closeSheet(); render(); toast("已停用云同步");
}

function giteeUrl() {
  const owner = encodeURIComponent(state.sync.username); const repo = encodeURIComponent(state.sync.repository);
  const path = state.sync.path.split("/").map(encodeURIComponent).join("/");
  return `https://gitee.com/api/v5/repos/${owner}/${repo}/contents/${path}`;
}
function encodeBase64Utf8(value) {
  const bytes = new TextEncoder().encode(value); let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); }); return btoa(binary);
}
function decodeBase64Utf8(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  const binary = atob(value.replace(/\s/g, "")); const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0)); return new TextDecoder().decode(bytes);
}

async function giteeRequest(method, body = null) {
  const options = { method, headers: { Accept: "application/json", "Content-Type": "application/json" } };
  if (body) options.body = JSON.stringify({ access_token: state.sync.token, ...body });
  const separator = giteeUrl().includes("?") ? "&" : "?";
  const url = method === "GET" ? `${giteeUrl()}${separator}access_token=${encodeURIComponent(state.sync.token)}&ref=${encodeURIComponent(state.sync.branch)}` : giteeUrl();
  const response = await fetch(url, options);
  if (method === "GET" && response.status === 404) return { missing: true };
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || payload.error || `Gitee 请求失败 (${response.status})`);
  return payload;
}

function updatedTime(item) { return item?.updated_at || item?.deleted_at || item?.created_at || ""; }
function upsertByTimestamp(items, incoming, key = (item) => item.id) {
  const map = new Map(items.map((item) => [key(item), item]));
  const current = map.get(key(incoming)); if (!current || updatedTime(incoming) >= updatedTime(current)) map.set(key(incoming), incoming);
  return [...map.values()];
}
function mergeCollection(localItems, remoteItems, key = (item) => item.id) {
  return [...localItems, ...remoteItems].reduce((result, item) => upsertByTimestamp(result, item, key), []);
}
function mergeLedger(local, remote) {
  const merged = normalizeData(updatedTime(remote) > updatedTime(local) ? remote : local);
  const resetCandidates = [local.reset_at, remote.reset_at].filter(Boolean).sort();
  const resetAt = resetCandidates[resetCandidates.length - 1] || null;
  const sinceReset = (items) => resetAt ? items.filter((item) => updatedTime(item) >= resetAt) : items;
  merged.reset_at = resetAt;
  merged.transactions = mergeCollection(sinceReset(local.transactions), sinceReset(remote.transactions));
  merged.deleted_transactions = mergeCollection(sinceReset(local.deleted_transactions || []), sinceReset(remote.deleted_transactions || []));
  const tombstones = new Map(merged.deleted_transactions.map((item) => [item.id, item]));
  merged.transactions = merged.transactions.filter((tx) => !tombstones.has(tx.id) || updatedTime(tx) > updatedTime(tombstones.get(tx.id)));
  merged.deleted_categories = mergeCollection(sinceReset(local.deleted_categories || []), sinceReset(remote.deleted_categories || []));
  merged.deleted_accounts = mergeCollection(sinceReset(local.deleted_accounts || []), sinceReset(remote.deleted_accounts || []));
  merged.deleted_members = mergeCollection(sinceReset(local.deleted_members || []), sinceReset(remote.deleted_members || []));
  merged.categories = mergeCollection(sinceReset(local.categories), sinceReset(remote.categories));
  merged.accounts = mergeCollection(sinceReset(local.accounts), sinceReset(remote.accounts));
  merged.members = mergeCollection(sinceReset(local.members), sinceReset(remote.members));
  const deletedCategories = new Map(merged.deleted_categories.map((item) => [item.id, item]));
  const deletedAccounts = new Map(merged.deleted_accounts.map((item) => [item.id, item]));
  const deletedMembers = new Map(merged.deleted_members.map((item) => [item.id, item]));
  merged.categories = merged.categories.filter((item) => !deletedCategories.has(item.id) || updatedTime(item) > updatedTime(deletedCategories.get(item.id)));
  merged.accounts = merged.accounts.filter((item) => !deletedAccounts.has(item.id) || updatedTime(item) > updatedTime(deletedAccounts.get(item.id)));
  const referencedMembers = new Set(merged.transactions.map((tx) => tx.member_id));
  merged.members = merged.members.flatMap((item) => {
    const tombstone = deletedMembers.get(item.id);
    if (!tombstone || updatedTime(item) > updatedTime(tombstone)) return [item];
    return referencedMembers.has(item.id) ? [{ ...item, is_active: false, updated_at: updatedTime(tombstone) }] : [];
  });
  merged.budgets = mergeCollection(sinceReset(local.budgets), sinceReset(remote.budgets), (item) => `${item.period}:${item.category_id || "total"}`);
  merged.settings = updatedTime(remote.settings) > updatedTime(local.settings) ? { ...remote.settings } : { ...local.settings };
  merged.updated_at = nowIso(); return normalizeData(merged);
}

async function syncWithGitee({ quiet = false, retry = true } = {}) {
  if (!syncConfigured() || state.syncing || !navigator.onLine) {
    if (!navigator.onLine && syncConfigured()) { state.syncStatus = "pending"; state.syncMessage = "离线，等待同步"; renderSyncStatus(); }
    return;
  }
  state.syncing = true; state.syncStatus = "pending"; state.syncMessage = "正在同步"; renderSyncStatus();
  try {
    const remoteFile = await giteeRequest("GET"); let sha = null;
    if (!remoteFile.missing) {
      sha = remoteFile.sha;
      const remoteText = decodeBase64Utf8(remoteFile.content).trim();
      if (remoteText) {
        let remote;
        try { remote = JSON.parse(remoteText); }
        catch { throw new Error("Gitee 数据文件不是有效的 JSON，请清空文件后重试"); }
        if (!remote || !Array.isArray(remote.transactions) || !Array.isArray(remote.categories) || !Array.isArray(remote.accounts)) {
          throw new Error("Gitee 数据文件不是记账助手账本，请清空文件后重试");
        }
        state.data = mergeLedger(state.data, normalizeData(remote)); saveLocal({ sync: false }); render();
      }
    }
    const body = { message: `同步账本 ${new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}`, content: encodeBase64Utf8(JSON.stringify(state.data, null, 2)), branch: state.sync.branch };
    if (sha) body.sha = sha;
    await giteeRequest(sha ? "PUT" : "POST", body);
    state.syncStatus = "ok"; state.syncMessage = `已同步 ${new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
    if (!quiet) toast("Gitee 同步完成");
  } catch (error) {
    if (retry && /409|conflict|sha/i.test(error.message)) {
      state.syncing = false; return syncWithGitee({ quiet, retry: false });
    }
    state.syncStatus = "error"; state.syncMessage = "同步失败";
    if (!quiet) toast(error.message || "同步失败，请检查配置和网络", "error");
  } finally { state.syncing = false; renderSyncStatus(); }
}

function csvCell(value) { return `"${String(value ?? "").replaceAll('"', '""')}"`; }
function exportCsv() {
  const headers = ["日期", "类型", "成员", "分类", "账户", "金额(元)", "备注", "创建时间", "更新时间"];
  const rows = monthTransactions().sort(transactionSort).map((tx) => [tx.happen_at.slice(0, 10), tx.type === "expense" ? "支出" : "收入", memberById(tx.member_id).name, categoryById(tx.category_id).name, accountById(tx.account_id).name, (tx.amount / 100).toFixed(2), tx.note || "", tx.created_at, tx.updated_at]);
  downloadBlob(`记账助手-${state.month}.csv`, `\ufeff${[headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")}`, "text/csv;charset=utf-8");
  toast(`已导出 ${rows.length} 笔记录`);
}
function exportJson({ silent = false } = {}) {
  downloadBlob(`记账助手-备份-${currentDate()}-${Date.now()}.json`, JSON.stringify(state.data, null, 2), "application/json;charset=utf-8");
  if (!silent) toast("JSON 备份已导出");
}
function downloadBlob(filename, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type })); const anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename; document.body.appendChild(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function prepareRestoredData(raw) {
  const restored = normalizeData(raw); const restoredAt = nowIso();
  restored.app_version = APP_VERSION; restored.reset_at = restoredAt; restored.updated_at = restoredAt;
  ["transactions", "categories", "accounts", "members", "budgets", "deleted_transactions", "deleted_categories", "deleted_accounts", "deleted_members"].forEach((key) => {
    restored[key] = restored[key].map((item) => ({ ...item, updated_at: restoredAt }));
  });
  restored.settings = { ...restored.settings, updated_at: restoredAt };
  return restored;
}
async function importJson(file) {
  try {
    const parsed = JSON.parse(await file.text());
    if (!parsed || !Array.isArray(parsed.transactions) || !Array.isArray(parsed.categories) || !Array.isArray(parsed.accounts)) throw new Error("备份文件结构不正确");
    if (!await confirmDialog("恢复这份备份？", "恢复前会自动下载当前数据备份，随后用所选文件替换本机账本。", "恢复")) return;
    exportJson({ silent: true }); clearTimeout(syncTimer);
    state.data = prepareRestoredData(parsed);
    const latestTransaction = [...state.data.transactions].sort(transactionSort)[0];
    if (/^\d{4}-\d{2}/.test(latestTransaction?.happen_at || "")) state.month = latestTransaction.happen_at.slice(0, 7);
    state.filters = { type: "all", category: "all", account: "all", keyword: "" }; state.memberFilter = "all"; state.page = "home";
    saveLocal(); render(); window.scrollTo({ top: 0, behavior: "smooth" });
    toast(`账本数据已恢复，共 ${state.data.transactions.length} 笔记录`);
  } catch (error) { toast(error.message || "无法读取备份文件", "error"); }
}
async function clearAllData() {
  if (!await confirmDialog("清空全部账本数据？", "记录、成员、预算、自定义分类和支付账户都会重置。此操作无法撤销，建议先导出备份。", "全部清空")) return;
  state.data = createInitialData();
  state.data.reset_at = state.data.updated_at;
  state.data.categories.forEach((item) => { item.updated_at = state.data.reset_at; });
  state.data.accounts.forEach((item) => { item.updated_at = state.data.reset_at; });
  state.data.members.forEach((item) => { item.updated_at = state.data.reset_at; });
  state.data.settings.updated_at = state.data.reset_at;
  saveLocal(); state.month = currentMonth(); state.memberFilter = "all"; render(); toast("账本已清空");
}

function openSheet(title, body, actions = "") {
  document.querySelector("#sheet-root").innerHTML = `<div class="sheet-backdrop" data-action="backdrop-close"><section class="sheet" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}"><header class="sheet-header"><button class="icon-button" type="button" data-action="close-sheet" aria-label="关闭" title="关闭">${ICONS.close}</button><h2>${escapeHtml(title)}</h2><span></span></header><div class="sheet-body">${body}</div>${actions ? `<footer class="sheet-actions">${actions}</footer>` : ""}</section></div>`;
  document.body.style.overflow = "hidden";
}
function closeSheet() { document.querySelector("#sheet-root").innerHTML = ""; document.body.style.overflow = ""; }
function confirmDialog(title, message, confirmText = "确定") {
  return new Promise((resolve) => {
    const root = document.querySelector("#dialog-root");
    root.innerHTML = `<div class="dialog-backdrop"><section class="dialog" role="alertdialog" aria-modal="true"><div class="dialog-body"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p></div><div class="dialog-actions"><button class="button" type="button" data-dialog="cancel">取消</button><button class="button danger" type="button" data-dialog="confirm">${escapeHtml(confirmText)}</button></div></section></div>`;
    const finish = (value) => { root.innerHTML = ""; resolve(value); };
    root.querySelector("[data-dialog=cancel]").addEventListener("click", () => finish(false)); root.querySelector("[data-dialog=confirm]").addEventListener("click", () => finish(true));
  });
}
function toast(message, type = "success") {
  const root = document.querySelector("#toast-root"); root.innerHTML = `<div class="toast ${type}">${escapeHtml(message)}</div>`;
  clearTimeout(toast.timer); toast.timer = setTimeout(() => { root.innerHTML = ""; }, 2600);
}

function handleNavigation(page) {
  if (page === "add") return openTransactionSheet();
  state.page = page; render(); window.scrollTo({ top: 0, behavior: "smooth" });
}
function handleAction(action, element, event) {
  const actions = {
    "previous-month": () => { state.month = shiftMonth(state.month, -1); render(); },
    "next-month": () => { state.month = shiftMonth(state.month, 1); render(); },
    "current-month": () => { state.month = currentMonth(); render(); },
    "add-transaction": () => openTransactionSheet(), "edit-transaction": () => openTransactionSheet(element.dataset.id),
    "delete-transaction": () => deleteTransaction(element.dataset.id), "manage-budget": () => openBudgetSheet(),
    "select-member": () => { state.memberFilter = element.dataset.id; render(); },
    "manage-members": () => openMembersSheet(), "add-member": () => openMemberEditor(), "edit-member": () => openMemberEditor(element.dataset.id), "remove-member": () => removeMember(element.dataset.id),
    "manage-accounts": () => openAccountsSheet(), "add-account": () => openAccountEditor(), "edit-account": () => openAccountEditor(element.dataset.id), "remove-account": () => removeAccount(element.dataset.id),
    "manage-categories": () => openCategoriesSheet(), "add-category": () => openCategoryEditor(), "edit-category": () => openCategoryEditor(element.dataset.id), "remove-category": () => removeCategory(element.dataset.id),
    "configure-sync": () => openSyncSheet(), "disable-sync": () => disableSync(), "install-app": () => openInstallSheet(), "request-install": () => requestInstall(), "export-csv": () => exportCsv(), "export-json": () => exportJson(),
    "import-json": () => document.querySelector("#json-import").click(), "clear-data": () => clearAllData(), "close-sheet": () => closeSheet(),
    "filter-category": () => { state.filters.category = element.dataset.id; state.filters.type = "expense"; state.page = "list"; render(); },
    "backdrop-close": () => { if (element === event.target) closeSheet(); }
  };
  actions[action]?.();
}

document.addEventListener("click", (event) => {
  const nav = event.target.closest("[data-nav]"); if (nav) return handleNavigation(nav.dataset.nav);
  const action = event.target.closest("[data-action]"); if (action) handleAction(action.dataset.action, action, event);
});
document.addEventListener("change", (event) => {
  if (event.target.id === "type-filter") { state.filters.type = event.target.value; render(); }
  if (event.target.id === "category-filter") { state.filters.category = event.target.value; render(); }
  if (event.target.id === "account-filter") { state.filters.account = event.target.value; render(); }
  if (event.target.id === "default-member") { state.data.settings.default_member_id = event.target.value; state.data.settings.updated_at = nowIso(); saveLocal(); toast("默认记账成员已更新"); }
  if (event.target.id === "default-expense-account") { state.data.settings.default_expense_account_id = event.target.value; state.data.settings.updated_at = nowIso(); saveLocal(); toast("默认支出账户已更新"); }
  if (event.target.id === "default-income-account") { state.data.settings.default_income_account_id = event.target.value; state.data.settings.updated_at = nowIso(); saveLocal(); toast("默认收入账户已更新"); }
  if (event.target.id === "json-import" && event.target.files[0]) { importJson(event.target.files[0]); event.target.value = ""; }
});
document.addEventListener("input", (event) => {
  if (event.target.id !== "keyword-filter") return; state.filters.keyword = event.target.value;
  clearTimeout(event.target.filterTimer); event.target.filterTimer = setTimeout(render, 180);
});
document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeSheet(); });
document.querySelector("#top-sync-button").addEventListener("click", () => syncWithGitee());
window.addEventListener("online", () => syncWithGitee({ quiet: true }));
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") syncWithGitee({ quiet: true }); });
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault(); state.installPrompt = event;
  if (state.page === "settings") render();
});
window.addEventListener("appinstalled", () => {
  state.installPrompt = null; state.installed = true; render(); toast("记账助手已安装到设备");
});

state.installed = isStandalone(); loadState(); render();
if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("./sw.js").catch(() => {});
if (syncConfigured()) setTimeout(() => syncWithGitee({ quiet: true }), 500);

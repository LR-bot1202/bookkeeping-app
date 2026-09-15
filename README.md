# 记账助手

一个本地优先的移动端记账 PWA，按照 `docs/requirements.md` 实现。无需构建步骤或业务服务器，账本默认保存在浏览器 `localStorage`，可选同步到用户自己的 GitHub 私有仓库。

线上地址：<https://lr-bot1202.github.io/bookkeeping-app/>

## 本地运行

在项目目录启动任意静态文件服务，例如：

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

然后访问 `http://127.0.0.1:4173`。使用 HTTP 服务而不是直接双击 `index.html`，才能启用 Service Worker 和离线缓存。

## 已实现功能

- 支出和收入的新增、编辑、二次确认删除，金额以分存储
- 家庭成员管理，每笔记录可指定成员，首页、明细和统计支持按成员筛选
- 首页月度汇总、今日收支、预算进度与最近记录
- 明细按日期分组，支持月份、类型、分类、账户与关键词筛选
- 分类占比、每日支出、上月对比与近 6 个月趋势
- 月度总预算和分类预算，80% 提示与超支提示
- 内置及自定义成员、支付账户、分类，历史数据关联项使用停用策略
- 设置默认支出账户和默认收入账户
- 当月 CSV、完整 JSON 备份、恢复前自动备份和清空数据
- GitHub 私有仓库自动拉取、按更新时间合并和回写
- 响应式手机/桌面布局及 PWA 离线应用壳
- 应用内手机安装入口、原生安装按钮及安卓/iPhone 分平台指引

旧版账本首次打开时会自动创建默认成员“我”，并将没有成员字段的历史记录归到该成员。预算保持为整本家庭共享口径，不随成员筛选改变；CSV 会导出当前所选成员范围并包含“成员”列。

## GitHub 同步

程序仓库 `bookkeeping-app` 必须保持公开以提供 GitHub Pages，账本则存放在独立的私有仓库 `bookkeeping-data`，不要把 `data/ledger.json` 提交到程序仓库。

1. 在 GitHub 创建一个私有数据仓库，例如 `bookkeeping-data`。
2. 进入 GitHub 的 `Settings -> Developer settings -> Personal access tokens -> Fine-grained tokens` 创建令牌。
3. 将 `Repository access` 设为 `Only select repositories`，只选择数据仓库。
4. 在 `Repository permissions` 中将 `Contents` 设为 `Read and write`，其余权限保持默认。
5. 在应用的“我的 -> GitHub 私有仓库”中填写用户名、令牌、仓库名、分支和文件路径。
6. 保存后会立即同步，之后新增、修改和删除会自动回写；应用启动、恢复前台或网络恢复时会拉取并合并。

令牌只保存在当前浏览器的独立本地配置 `bookkeeping.github.v1` 中，不会进入账本 JSON、导出文件或任何 Git 仓库。静态页面需要直连 GitHub Contents API，请使用只授权数据仓库、有效期尽可能短的专用令牌。

## 部署

仓库根目录通过 GitHub Pages 的 `master / (root)` 发布。生产环境使用 HTTPS，以保证 Service Worker 和 PWA 安装能力正常工作。

## 安装到手机

用手机打开线上 HTTPS 地址，也可以进入“我的 -> 安装到手机”查看当前设备对应的安装方法：

- 安卓：使用 Chrome 或 Edge 打开，点击应用内“安装到此设备”；若按钮不可用，则从浏览器菜单选择“安装应用”或“添加到主屏幕”。
- iPhone：使用 Safari 打开，点击“分享 -> 添加到主屏幕 -> 添加”。

安装版与当前浏览器共享本机账本。GitHub 令牌不会进入发布仓库；换手机后需要在新设备重新填写一次同步配置。

# Uptime Monitor

<div align="center">
  <img src="https://img.shields.io/badge/Status-Operational-success?style=for-the-badge" alt="Status">
  <img src="https://img.shields.io/badge/Cloudflare-Workers-orange?style=for-the-badge&logo=cloudflare" alt="Cloudflare Workers">
  <img src="https://img.shields.io/badge/Vue.js-3.0-4FC08D?style=for-the-badge&logo=vue.js" alt="Vue.js">
</div>

<br>

**Uptime Monitor** 是基于 Cloudflare 生态（Workers + Pages + D1）构建的轻量级网站监控系统。完全免费（利用 Cloudflare 免费额度），支持多站点监控、SSL 证书检测、域名过期提醒、钉钉机器人告警，以及可配置的告警频率控制。

[查看演示](https://uptime.nianshu2022.cn) | [部署文档](DEPLOY.md)

## 📸 界面预览

<div align="center">
  <img src="img/Uptime-Monitor-pc.png" alt="PC Status Page" width="100%"/>
  <br><em>公开状态页</em>
</div>

<br>

<div align="center">
  <img src="img/Uptime-Monitor-admin.png" alt="Admin Dashboard" width="100%"/>
  <br><em>管理后台</em>
</div>

<br>

<div align="center">
  <img src="img/Uptime-Monitor-app.png" alt="Mobile" width="45%"/>
  <img src="img/Uptime-Monitor-down.png" alt="Down Alert" width="45%"/>
  <br><em>移动端适配 & 故障状态</em>
</div>

---

## ✨ 核心特性

- **多站点监控**：HTTP/HTTPS 连通性检测，支持自定义检查间隔与关键词验证。
- **SSL 证书监控**：自动检测证书有效期，支持泛域名证书，可独立开关。
- **域名过期提醒**：自动查询 RDAP 获取域名注册到期时间，可独立开关。
- **钉钉告警**：Markdown 格式通知，含故障原因、SSL/域名剩余天数；HMAC-SHA256 加签安全验证。
- **告警频率控制**：可用性、SSL、域名三项检测各自独立的静默窗口（1h \~ 72h），避免频繁打扰。
- **重试防抖**：连续失败 3 次才触发 DOWN 告警，减少误报。
- **Dark OLED 界面**：Plus Jakarta Sans 字体、玻璃卡片、绿色强调色，深色/浅色模式切换。
- **Serverless 架构**：Workers + D1 + Pages，零服务器成本。

## 🚀 快速开始

1. 创建 D1 数据库 `uptime-db`
2. 配置 `worker/wrangler.toml`（数据库 ID、钉钉 Token、管理密码）
3. `cd worker && npx wrangler d1 execute uptime-db --remote --file=schema.sql`
4. `npx wrangler deploy` 部署后端
5. 修改前端 `API_BASE` 地址，`npx wrangler pages deploy . --project-name uptime-monitor`

详细步骤见 [DEPLOY.md](DEPLOY.md)。

## 🛠️ 技术栈

| 层 | 技术 |
|---|---|
| Runtime | Cloudflare Workers |
| Framework | Hono |
| Database | Cloudflare D1 (SQLite) |
| Frontend | Vue 3 (CDN) + TailwindCSS + Plus Jakarta Sans |
| Tools | Wrangler · crt.sh · rdap.org |

## 📝 版权信息

&copy; 2025 [念舒](https://nianshu2022.cn). All Rights Reserved.

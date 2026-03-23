# Uptime Monitor 功能规格说明

## 1. 系统架构

| 层 | 技术 |
|---|---|
| 后端 | Cloudflare Workers + Hono 框架 |
| 数据库 | Cloudflare D1 (SQLite) |
| 前端 | Cloudflare Pages + Vue 3 + TailwindCSS |
| 通知 | 钉钉群机器人（Webhook + HMAC-SHA256 加签） |
| 外部 API | `crt.sh`（SSL 查询）、`rdap.org`（域名过期查询） |

---

## 2. 核心监控功能

### 2.1 连通性监测
- 每分钟 Cron 触发，检查所有启用站点的 HTTP 状态码及响应关键词。
- **重试防抖**：首次失败 → `RETRYING`，连续失败 3 次 → `DOWN` + 触发告警，恢复后发送恢复通知。
- **暂停/恢复**：支持单独暂停某个监控项，暂停期间不检测、不告警。

### 2.2 SSL 证书监控
- 每日自动刷新，支持泛域名证书识别（优先取当前有效证书）。
- 可独立开关（`check_ssl`），开关后不发送 SSL 相关告警。

### 2.3 域名过期监控
- 每日自动查询 RDAP 获取域名注册过期时间。
- 可独立开关（`check_domain`）。

### 2.4 自定义 User-Agent
- 支持为每个监控项单独设置 UA，模拟不同客户端访问。

---

## 3. 告警通知

- **告警时机**：DOWN（达到重试阈值）、恢复 UP、SSL/域名临期（≤30天提醒，≤7天紧急，已过期立即告警）。
- **告警静默窗口**：三项检测各自独立的静默窗口（`alert_silence_uptime` / `alert_silence_ssl` / `alert_silence_domain`），避免同一问题重复打扰。
- **格式**：钉钉 Markdown，包含站点名称、URL、状态、耗时/剩余天数、故障原因。

---

## 4. 前端页面

### 4.1 公开状态页（index.html）
- 免登录访问，30 秒自动刷新。
- Dark OLED 主题 + Plus Jakarta Sans 字体 + 玻璃卡片。
- 三态横幅：Operational / Degraded / Disrupted。
- 展示：站点名称、URL、状态徽章、SSL 剩余天数、上次检测时间。

### 4.2 管理后台（admin.html）
- 密码认证（SessionStorage 持久化）。
- 统计概览卡片：总数、在线、故障、暂停。
- 添加监控：名称、URL、关键词、UA、SSL/域名检测开关。
- 监控列表：暂停/恢复、配置（功能开关 + 各项告警静默窗口）、日志查看、删除。
- 日志抽屉：最近检测记录（状态码、耗时、结果）。
- 配置抽屉：三项静默窗口独立选择（1h / 4h / 12h / 24h / 72h）。

---

## 5. 数据库设计

### monitors 表

| 字段 | 类型 | 说明 |
|---|---|---|
| id | INTEGER PK | 自增 ID |
| name | TEXT | 站点名称 |
| url | TEXT | 监控 URL |
| method | TEXT | 请求方法（默认 GET） |
| interval | INTEGER | 检查间隔（秒） |
| status | TEXT | UP / DOWN / RETRYING / PAUSED |
| retry_count | INTEGER | 当前重试次数 |
| last_check | DATETIME | 上次检查时间 |
| keyword | TEXT | 关键词验证（可选） |
| user_agent | TEXT | 自定义 UA（可选） |
| domain_expiry | DATETIME | 域名过期时间 |
| cert_expiry | DATETIME | SSL 证书过期时间 |
| paused | INTEGER | 0=正常 1=已暂停 |
| check_ssl | INTEGER | SSL 到期检测开关（默认 1） |
| check_domain | INTEGER | 域名到期检测开关（默认 1） |
| alert_silence_uptime | INTEGER | 可用性告警静默时长（小时，默认 24） |
| alert_silence_ssl | INTEGER | SSL 告警静默时长（小时，默认 24） |
| alert_silence_domain | INTEGER | 域名告警静默时长（小时，默认 24） |
| last_alert_uptime | TEXT | 可用性最近告警时间 |
| last_alert_ssl | TEXT | SSL 最近告警时间 |
| last_alert_domain | TEXT | 域名最近告警时间 |
| created_at | DATETIME | 创建时间 |

### logs 表

| 字段 | 类型 | 说明 |
|---|---|---|
| id | INTEGER PK | 自增 ID |
| monitor_id | INTEGER FK | 关联 monitor.id |
| status_code | INTEGER | HTTP 状态码 |
| latency | INTEGER | 响应耗时（ms） |
| is_fail | BOOLEAN | 是否失败 |
| reason | TEXT | 失败原因 |
| created_at | DATETIME | 记录时间 |

---

## 6. API 接口

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| GET | `/monitors/public` | 无 | 公开状态数据 |
| GET | `/monitors` | ✓ | 所有监控详情 |
| POST | `/monitors` | ✓ | 添加监控 |
| DELETE | `/monitors/:id` | ✓ | 删除监控及日志 |
| PATCH | `/monitors/:id/pause` | ✓ | 暂停/恢复 |
| PATCH | `/monitors/:id/config` | ✓ | 更新功能开关与静默窗口 |
| GET | `/monitors/:id/logs` | ✓ | 查看检测日志 |
| POST | `/test-alert` | ✓ | 测试钉钉通知 |

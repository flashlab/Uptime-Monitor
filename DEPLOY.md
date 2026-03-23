# Uptime Monitor 部署指南

## 一、环境准备

- **Cloudflare 账号**：用于托管 Worker、Pages 和 D1 数据库。
- **Node.js v18+**：本地开发依赖。
- **Wrangler CLI**：
  ```bash
  npm install -g wrangler
  ```

---

## 二、首次部署

### 1. 登录 Cloudflare
```bash
npx wrangler login
```

### 2. 创建 D1 数据库
```bash
npx wrangler d1 create uptime-db
```
执行后记录返回的 `database_id`。

### 3. 配置 Worker

编辑 `worker/wrangler.toml`，填入：

| 配置项 | 说明 |
|---|---|
| `database_id` | 上一步获得的 D1 数据库 ID |
| `DINGTALK_ACCESS_TOKEN` | 钉钉机器人 Webhook Token |
| `DINGTALK_SECRET` | 钉钉机器人加签密钥 |
| `ADMIN_PASSWORD` | 后台管理密码 |

### 4. 初始化数据库

```bash
cd worker
npx wrangler d1 execute uptime-db --remote --file=schema.sql
```

> `schema.sql` 包含完整的表结构，无需执行任何额外迁移脚本。

### 5. 部署后端 (Worker)
```bash
cd worker
npx wrangler deploy
```
部署成功后获得 Worker 地址（如 `https://uptime-worker.xxx.workers.dev`）。  
**建议绑定自定义域名**（见第三节），国内访问更稳定。

### 6. 配置前端

打开 `frontend/index.html` 和 `frontend/admin.html`，将：
```js
const API_BASE = 'https://uptime-worker.xxx.workers.dev';
```
修改为你的 Worker 地址（推荐使用自定义域名）。

### 7. 部署前端 (Pages)
```bash
cd frontend
npx wrangler pages deploy . --project-name uptime-monitor
```

---

## 三、绑定自定义域名（推荐）

### Worker 域名（API）
1. Dashboard → **Workers & Pages** → 选择 `uptime-worker`
2. **Settings** → **Triggers** → **Custom Domains** → Add
3. 填入如 `api.yourdomain.com`，等待生效后更新前端 `API_BASE`

### Pages 域名（前端）
1. Dashboard → **Workers & Pages** → 选择 `uptime-monitor`
2. **Custom Domains** → Set up a custom domain
3. 填入如 `status.yourdomain.com`

---

## 四、维护与更新

### 更新后端
```bash
cd worker && npx wrangler deploy
```

### 更新前端
```bash
cd frontend && npx wrangler pages deploy . --project-name uptime-monitor
```

### 数据库操作

**查看监控项**：
```bash
npx wrangler d1 execute uptime-db --remote --command="SELECT * FROM monitors"
```

**清理旧日志**：
```bash
npx wrangler d1 execute uptime-db --remote --command="DELETE FROM logs WHERE created_at < datetime('now', '-30 days')"
```

---

## 五、常见问题

**Q: 手机端无法加载列表？**  
A: 检查 `API_BASE` 是否使用了 `workers.dev` 域名，该域名在国内常被阻断，请绑定自定义域名。

**Q: 钉钉收不到消息？**  
A: 检查 `wrangler.toml` 中 Token 和 Secret 是否正确，重新 deploy 后用 `POST /test-alert` 接口测试。

**Q: SSL 证书显示过期或不正确？**  
A: 证书信息每日自动刷新一次。可在 D1 Console 将该 monitor 的 `cert_expiry` 置空，触发重新获取。

**Q: 后台登录后没反应？**  
A: 检查浏览器 Console 报错。如遇 401，清除 SessionStorage 后重试。

---

## 六、目录结构

```
.
├── frontend/
│   ├── index.html       # 公开状态页
│   └── admin.html       # 管理后台
├── worker/
│   ├── src/index.ts     # Worker 核心逻辑
│   ├── schema.sql       # 完整数据库结构
│   └── wrangler.toml    # Worker 配置
├── img/                 # README 截图
├── README.md
└── DEPLOY.md
```

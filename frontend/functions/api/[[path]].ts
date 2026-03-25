/**
 * Cloudflare Pages Functions — API 反向代理
 *
 * 将前端对 /api/* 的请求透传到后端 Worker。
 * 这样前端通过 *.pages.dev 域名访问，无需翻墙。
 *
 * 环境变量（在 Cloudflare Pages 项目的 Settings → Environment Variables 中设置）：
 *   WORKER_URL = https://uptime-worker.<your-account-id>.workers.dev
 */

interface Env {
  WORKER_URL: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;

  const workerUrl = env.WORKER_URL;
  if (!workerUrl) {
    return new Response(
      JSON.stringify({ error: 'WORKER_URL environment variable is not set' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 拼接目标 URL：把 /api/monitors/1/logs → /monitors/1/logs
  const path = (params.path as string[] | undefined)?.join('/') ?? '';
  const url = new URL(request.url);
  const targetUrl = `${workerUrl.replace(/\/$/, '')}/${path}${url.search}`;

  // 透传请求（方法、请求头、请求体）
  const proxyRequest = new Request(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
  });

  const response = await fetch(proxyRequest);

  // 透传响应，追加 CORS 头（Pages 和 Worker 同属一个账号，理论上不需要，保留更稳健）
  const newHeaders = new Headers(response.headers);
  newHeaders.set('Access-Control-Allow-Origin', '*');
  newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
};

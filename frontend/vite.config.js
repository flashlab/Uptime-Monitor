import { resolve } from 'path';
import { defineConfig, loadEnv } from 'vite';

/**
 * 条件注入插件 —— 根据环境变量有条件地注入第三方脚本
 * 如果对应的环境变量未设置或为空，则不注入该脚本
 */
function conditionalScripts(env) {
  return {
    name: 'conditional-scripts',
    transformIndexHtml(html) {
      const adsenseClient = env.VITE_ADSENSE_CLIENT || '';
      const cfToken = env.VITE_CF_ANALYTICS_TOKEN || '';

      // Google AdSense（仅当配置了 client ID 时注入）
      html = html.replace(
        '<!-- __ADSENSE_SCRIPT__ -->',
        adsenseClient
          ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}" crossorigin="anonymous"></script>`
          : ''
      );

      // Cloudflare Web Analytics（仅当配置了 token 时注入）
      html = html.replace(
        '<!-- __CF_ANALYTICS_SCRIPT__ -->',
        cfToken
          ? `<script defer src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "${cfToken}"}'></script>`
          : ''
      );

      return html;
    },
  };
}

export default defineConfig(({ mode }) => {
  // 加载 .env 文件中的环境变量
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [conditionalScripts(env)],

    // 多页面入口
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          admin: resolve(__dirname, 'admin.html'),
        },
      },
    },

    // 开发代理 —— /api/* 转发到后端 Worker（默认 8787 端口）
    server: {
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8787',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  };
});

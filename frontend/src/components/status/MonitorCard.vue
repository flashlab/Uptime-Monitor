<template>
  <div class="glass-card rounded-2xl px-6 pt-5 pb-4 status-line cursor-default group"
    :class="[
      monitor.paused ? 'opacity-40 status-line-gray' : '',
      monitor.status === 'UP' && !monitor.paused ? 'status-line-green' : '',
      monitor.status === 'DOWN' ? 'status-line-red' : '',
      monitor.status === 'RETRYING' ? 'status-line-yellow' : '',
    ]"
    :style="{ animationDelay: (index * 0.06) + 's' }">

    <!-- 第一行：名称 + 核心指标 -->
    <div class="flex items-center justify-between gap-3 mb-2 monitor-row1">
      <div class="flex items-center gap-3.5 min-w-0 pl-3">
        <div class="relative shrink-0">
          <div class="w-2.5 h-2.5 rounded-full"
            :class="{
              'bg-emerald-400': monitor.status === 'UP' && !monitor.paused,
              'bg-red-400': monitor.status === 'DOWN',
              'bg-yellow-400': monitor.status === 'RETRYING',
              'bg-slate-400 dark:bg-slate-600': monitor.paused,
            }"></div>
          <div v-if="monitor.status === 'UP' && !monitor.paused" class="absolute inset-0 rounded-full bg-emerald-400/40 pulse-dot"></div>
        </div>
        <h3 class="font-bold text-slate-900 dark:text-white text-base truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">{{ monitor.name }}</h3>
      </div>
      <div class="flex items-center gap-1.5 sm:gap-2.5 shrink-0 monitor-meta">
        <div v-if="monitor.latency != null && !monitor.paused" class="latency-badge flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-mono font-medium border cursor-default"
          :class="latencyClass(monitor.latency)">
          <svg class="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/></svg>
          {{ monitor.latency }}ms
        </div>
        <div v-if="monitor.uptime_24h != null && !monitor.paused" class="px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-mono font-bold border"
          :class="monitor.uptime_24h >= 99.9 ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/8 border-emerald-200 dark:border-emerald-500/20' : monitor.uptime_24h >= 95 ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-500/8 border-yellow-200 dark:border-yellow-500/20' : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/8 border-red-200 dark:border-red-500/20'">
          {{ monitor.uptime_24h }}%
        </div>
        <span class="inline px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[9px] sm:text-[11px] font-bold font-mono tracking-[0.1em] border transition-all duration-300"
          :class="monitor.status === 'UP' && !monitor.paused ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : monitor.status === 'DOWN' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20' : monitor.status === 'RETRYING' ? 'bg-yellow-50 dark:bg-yellow-400/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-400/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'">
          {{ monitor.paused ? 'PAUSED' : monitor.status === 'UP' ? 'ONLINE' : monitor.status === 'DOWN' ? 'OFFLINE' : 'RETRYING' }}
        </span>
      </div>
    </div>

    <!-- 第二行：URL + SSL + 迷你折线图 -->
    <div class="flex flex-wrap items-center justify-between gap-2 sm:gap-4 mb-3 pl-[26px] monitor-row2">
      <div class="flex items-center gap-2 sm:gap-3 min-w-0 flex-wrap flex-1">
        <a :href="monitor.url" target="_blank" rel="noopener" class="text-[11px] sm:text-[13px] font-mono text-slate-400 dark:text-slate-500 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors truncate max-w-[200px] sm:max-w-[320px] cursor-pointer flex items-center gap-1.5 group/link">
          {{ monitor.url }}
          <svg class="w-2.5 h-2.5 opacity-0 group-hover/link:opacity-100 transition-all duration-300 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/></svg>
        </a>
        <div v-if="monitor.cert_expiry" class="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[11px] font-mono" :class="getExpiryClass(monitor.cert_expiry)">
          <svg class="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/></svg>
          SSL {{ formatExpiry(monitor.cert_expiry) }}
        </div>
        <span class="text-[9px] sm:text-[11px] font-mono text-slate-400 dark:text-slate-600">{{ formatDate(monitor.last_check) }}</span>
      </div>
      <!-- 迷你延迟折线（computed 缓存，单次遍历） -->
      <div v-if="sparkline && !monitor.paused" class="sparkline-wrap block shrink-0">
        <svg class="w-[80px] sm:w-[120px] h-[20px] sm:h-[28px]" :class="monitor.status === 'DOWN' ? 'text-red-500' : 'text-emerald-500'" viewBox="0 0 120 28" preserveAspectRatio="none">
          <path :d="sparkline.area" class="sparkline-area" fill="currentColor"/>
          <path :d="sparkline.line" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>
          <circle :cx="sparkline.dot.x" :cy="sparkline.dot.y" r="2.5" fill="currentColor" opacity="0.9"/>
        </svg>
      </div>
    </div>

    <!-- 第三行：90天可用性条 -->
    <UptimeBar v-if="monitor.daily_stats && monitor.daily_stats.length > 0 && !monitor.paused" :monitor="monitor" />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { formatDate, getExpiryClass, formatExpiry, latencyClass } from '../../utils/format';
import UptimeBar from './UptimeBar.vue';

const props = defineProps({
    monitor: { type: Object, required: true },
    index:   { type: Number, required: true },
});

/**
 * 一次遍历计算所有 sparkline 路径数据（line + area + dot），
 * 避免原先三个函数各自独立遍历 + 重复计算 min/max/range 的开销。
 * 使用 computed 保证响应式缓存，数据不变时不重新计算。
 */
const sparkline = computed(() => {
    const lats = props.monitor.recent_latencies;
    if (!lats || lats.length < 3) return null;

    const W = 120, H = 28, P = 2;
    const max = Math.max(...lats), min = Math.min(...lats);
    const range = max - min || 1;

    const pts = lats.map((v, i) => ({
        x: P + (i / (lats.length - 1)) * (W - 2 * P),
        y: H - P - ((v - min) / range) * (H - 2 * P),
    }));

    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const ptStr = pts.map(p => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
    const area = `M${ptStr[0]} L${ptStr.join(' L')} L${(W - P).toFixed(1)} ${H} L${P} ${H} Z`;

    return { line, area, dot: pts[pts.length - 1] };
});
</script>

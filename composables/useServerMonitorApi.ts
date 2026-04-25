import { ElMessage } from "element-plus";
import { computed } from "vue";

/**
 * 振动监测-服务器监控：对接独立监控服务（/api/v1，见 frontend-api.md）
 * 开发/部署时相对路径 /m-api 由 server/middleware/00-m-api-proxy 转发为上游 /api/v1
 * 也可设 NUXT_PUBLIC_SERVER_MONITOR_BASE 为完整 /api/v1 基址直连（与代理二选一由 baseUrl 逻辑决定）
 */
export function useServerMonitorApi() {
  const config = useRuntimeConfig();

  const baseUrl = computed(() => {
    const b = (config.public as { serverMonitorBase?: string }).serverMonitorBase;
    if (b && b.length > 0) {
      return b.replace(/\/$/, "");
    }
    const prefix = (config.public as { serverMonitorApiPrefix?: string })
      .serverMonitorApiPrefix || "/m-api";
    return prefix.replace(/\/$/, "");
  });

  function joinPath(path: string) {
    const p = path.startsWith("/") ? path : `/${path}`;
    return `${baseUrl.value}${p}`;
  }

  function notifyError(e: unknown, fallback: string) {
    const anyErr = e as { status?: number; statusCode?: number; data?: { detail?: string } } | null;
    const st = anyErr?.statusCode ?? anyErr?.status;
    if (st === 409) {
      ElMessage.warning("检测任务正在执行中，请稍后重试。");
      return;
    }
    if (st === 422) {
      ElMessage.error("参数不合法，请检查阈值范围（0~100）。");
      return;
    }
    if (st === 500) {
      ElMessage.error("服务内部异常，请联系后端查看日志。");
      return;
    }
    ElMessage.error(fallback);
  }

  async function getOverview() {
    return await $fetch(joinPath("system/overview"));
  }

  async function getSystemThresholds() {
    return await $fetch(joinPath("system/thresholds"));
  }

  async function putSystemThresholds(body: Record<string, unknown>) {
    return await $fetch(joinPath("system/thresholds"), {
      method: "PUT",
      body
    });
  }

  async function getSummary() {
    return await $fetch(joinPath("monitor/summary"));
  }

  async function postMonitorRun() {
    return await $fetch(joinPath("monitor/run"), { method: "POST" });
  }

  async function getHealth() {
    return await $fetch(joinPath("health"));
  }

  return {
    baseUrl,
    joinPath,
    getOverview,
    getSystemThresholds,
    putSystemThresholds,
    getSummary,
    postMonitorRun,
    getHealth,
    notifyError
  };
}

/**
 * 字节格式化为带单位的字符串（供监控页展示）
 */
export function formatBytes(bytes: number | undefined, fractionDigits = 2): string {
  if (bytes == null || Number.isNaN(bytes)) {
    return "—";
  }
  const u = ["B", "KB", "MB", "GB", "TB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(fractionDigits)} ${u[i]}`;
}

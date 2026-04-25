import { getRequestURL, proxyRequest } from "h3";

/**
 * 将浏览器请求 `/m-api/*` 转发到「监控服务」的 `/api/v1/*`（与 frontend-api.md 一致），
 * 避免仅依赖 devProxy 时 Nuxt 对未知路径返回 404、而本机 curl 直打 8.153:8080/api/v1 却正常 的不一致问题。
 * 在 dev（nuxt dev）与 node 方式部署时均会执行。
 */
export default defineEventHandler((event) => {
  const url = getRequestURL(event);
  if (!url.pathname.startsWith("/m-api")) {
    return;
  }

  const config = useRuntimeConfig(event);
  const origin = (config as { monitorServiceOrigin?: string }).monitorServiceOrigin;
  if (!origin) {
    return;
  }

  const pathWithQuery =
    url.pathname.replace(/^\/m-api/, "/api/v1") + (url.search || "");
  const target = `${String(origin).replace(/\/$/, "")}${pathWithQuery}`;

  return proxyRequest(event, target);
});

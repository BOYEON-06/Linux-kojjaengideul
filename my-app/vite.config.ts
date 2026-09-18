import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const BACKEND_URL = "http://34.22.71.200:80";

function rewriteSetCookie(cookie: string) {
  let nextCookie = cookie;

  // localhost + HTTP 개발 환경에서는 Secure 쿠키가 저장/전송되지 않을 수 있음
  nextCookie = nextCookie.replace(/;\s*Secure/gi, "");

  // 백엔드 IP/도메인 기준 Domain이 붙어 있으면 localhost 쿠키로 저장되지 않을 수 있음
  nextCookie = nextCookie.replace(/;\s*Domain=[^;]+/gi, "");

  // Path가 /api/auth 등으로 내려오면 다른 요청에는 쿠키가 안 붙을 수 있음
  if (/;\s*Path=/i.test(nextCookie)) {
    nextCookie = nextCookie.replace(/;\s*Path=[^;]+/gi, "; Path=/");
  } else {
    nextCookie += "; Path=/";
  }

  // HTTP localhost 개발 환경에서는 SameSite=None + Secure 조합 문제가 생길 수 있음
  if (/;\s*SameSite=/i.test(nextCookie)) {
    nextCookie = nextCookie.replace(/;\s*SameSite=[^;]+/gi, "; SameSite=Lax");
  } else {
    nextCookie += "; SameSite=Lax";
  }

  return nextCookie;
}

function rewriteResponseCookies(proxyRes: any, req: any, label: string) {
  const setCookieHeader = proxyRes.headers["set-cookie"];

  console.log(`[${label} proxyRes] URL:`, req.url);
  console.log(`[${label} proxyRes] status:`, proxyRes.statusCode);
  console.log(`[${label} proxyRes] original set-cookie:`, setCookieHeader);

  if (!setCookieHeader) return;

  proxyRes.headers["set-cookie"] = setCookieHeader.map((cookie: string) =>
    rewriteSetCookie(cookie)
  );

  console.log(
    `[${label} proxyRes] rewritten set-cookie:`,
    proxyRes.headers["set-cookie"]
  );
}

function attachRequestCookie(proxyReq: any, req: any, label: string) {
  proxyReq.setHeader("X-Requested-With", "XMLHttpRequest");

  if (req.headers.cookie) {
    proxyReq.setHeader("Cookie", req.headers.cookie);
    console.log(`[${label} proxyReq] Cookie 전달:`, req.headers.cookie);
  } else {
    console.log(`[${label} proxyReq] Cookie 없음:`, req.url);
  }
}

export default defineConfig({
  plugins: [react()],
  define: {
    global: "window",
  },
  server: {
    proxy: {
      "/api": {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
        xfwd: true,

        cookieDomainRewrite: "",
        cookiePathRewrite: "/",

        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            attachRequestCookie(proxyReq, req, "api");
          });

          proxy.on("proxyRes", (proxyRes, req) => {
            rewriteResponseCookies(proxyRes, req, "api");
          });
        },
      },

      "/ws-stomp": {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
        ws: true,
        xfwd: true,

        cookieDomainRewrite: "",
        cookiePathRewrite: "/",

        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            attachRequestCookie(proxyReq, req, "ws-stomp");
          });

          proxy.on("proxyReqWs", (proxyReq, req) => {
            if (req.headers.cookie) {
              proxyReq.setHeader("Cookie", req.headers.cookie);
              console.log("[ws-stomp proxyReqWs] Cookie 전달:", req.headers.cookie);
            } else {
              console.log("[ws-stomp proxyReqWs] Cookie 없음:", req.url);
            }

            proxyReq.setHeader("Origin", BACKEND_URL);
          });

          proxy.on("proxyRes", (proxyRes, req) => {
            rewriteResponseCookies(proxyRes, req, "ws-stomp");
          });

          proxy.on("error", (error, req) => {
            console.error("[ws-stomp proxy error]", req.url, error);
          });
        },
      },
    },
  },
});
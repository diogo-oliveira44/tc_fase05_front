import { serve } from "bun";
import index from "./index.html";

const apiUrl = process.env.API_URL ?? "http://localhost:3000";

async function proxy(req: Request) {
  const url = new URL(req.url);
  const headers = new Headers(req.headers);
  headers.delete("host");

  try {
    const res = await fetch(new URL(url.pathname + url.search, apiUrl), {
      method: req.method,
      headers,
      body: req.method === "GET" || req.method === "HEAD" ? undefined : await req.arrayBuffer(),
      redirect: "manual",
    });

    const responseHeaders = new Headers(res.headers);
    // Without this the uppload breaks sometimes
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-length");

    return new Response(res.status === 204 ? null : res.body, { status: res.status, headers: responseHeaders });
  } catch {
    return Response.json(
      {
        error: { code: "API_UNREACHABLE", message: `Could not reach the API at ${apiUrl}`, details: [], requestId: "" },
      },
      { status: 502 },
    );
  }
}

serve({
  port: Number(process.env.PORT ?? 3001),

  routes: {
    "/api/*": proxy,
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

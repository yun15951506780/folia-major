// api-ts/cors.ts

// 安卓壳（Capacitor WebView 的 origin 是 https://localhost）等跨源客户端访问 /api/* 时，
// 同源假设不成立，必须回 CORS。策略：回显请求的 Origin 而不是固定 `*`，
// 不放宽 credentials 语义；同源请求没有 Origin 头，此时退回 `*`，行为与原来一致。
// 只开放真实用到的方法与头，避免把接口暴露给任意站点的表单类请求。

const CORS_METHODS = 'GET, POST, OPTIONS';
const CORS_HEADERS = 'Content-Type, X-QQ-Session';

const corsHeadersFor = (req: Request): Record<string, string> => ({
    'Access-Control-Allow-Origin': req.headers.get('origin') || '*',
    Vary: 'Origin',
    'Access-Control-Allow-Methods': CORS_METHODS,
    'Access-Control-Allow-Headers': CORS_HEADERS,
    'Access-Control-Max-Age': '86400',
});

/** OPTIONS 预检的统一应答；非预检请求返回 null，由调用方继续原有流程。 */
export const handleCorsPreflight = (req: Request): Response | null => (
    req.method === 'OPTIONS'
        ? new Response(null, { status: 204, headers: corsHeadersFor(req) })
        : null
);

/** 给实际响应补 CORS 头：后端闭包返回的 Response 不可变，这里克隆出带头版本。 */
export const applyCors = (req: Request, response: Response): Response => {
    const headers = new Headers(response.headers);
    Object.entries(corsHeadersFor(req)).forEach(([key, value]) => headers.set(key, value));
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
};

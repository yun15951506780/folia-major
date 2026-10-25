// worker/cors.ts

// 与 api-ts/cors.ts 同一套策略（回显 Origin、只开真实用到的方法与头）：
// worker/index.ts 在路由层统一给 /api/* 应答补 CORS，安卓壳（origin https://localhost）
// 等跨源客户端才能直接调用部署实例的 API；同源静态资源路径不受影响。

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

/** 给实际响应补 CORS 头：handler 返回的 Response 不可变，这里克隆出带头版本。 */
export const applyCors = (req: Request, response: Response): Response => {
    const headers = new Headers(response.headers);
    Object.entries(corsHeadersFor(req)).forEach(([key, value]) => headers.set(key, value));
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
};

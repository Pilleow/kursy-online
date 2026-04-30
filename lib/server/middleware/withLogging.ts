import { NextRequest, NextResponse } from "next/server";
import logger from "../logger";

type RouteHandler = (req: NextRequest) => Promise<NextResponse>;

export function withLogging(handler: RouteHandler): RouteHandler {
  return async (req: NextRequest): Promise<NextResponse> => {
    const requestId = crypto.randomUUID();
    const start = Date.now();

    const headers = new Headers(req.headers);
    headers.set("x-request-id", requestId);
    const reqWithId = new NextRequest(req.url, {
      method: req.method,
      headers,
      body: req.body,
    });

    const response = await handler(reqWithId);

    const durationMs = Date.now() - start;
    const schoolId = req.headers.get("x-school-id") ?? undefined;
    const userId = req.headers.get("x-user-id") ?? undefined;

    logger.info(
      {
        requestId,
        method: req.method,
        path: new URL(req.url).pathname,
        statusCode: response.status,
        durationMs,
        ...(schoolId && { schoolId }),
        ...(userId && { userId }),
      },
      "request completed",
    );

    response.headers.set("x-request-id", requestId);
    return response;
  };
}

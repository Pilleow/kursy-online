import pino from "pino";

// pino-pretty uses worker_threads, which Next.js's webpack bundler cannot
// resolve at runtime. Only enable it outside of Next.js (e.g. the BullMQ
// worker process, where NEXT_RUNTIME is not set).
const usePretty =
  process.env.NODE_ENV !== "production" && !process.env.NEXT_RUNTIME;

const logger = pino({
  base: { service: "eduflow" },
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  ...(usePretty && {
    transport: {
      target: "pino-pretty",
      options: { colorize: true, ignore: "pid,hostname" },
    },
  }),
});

export default logger;

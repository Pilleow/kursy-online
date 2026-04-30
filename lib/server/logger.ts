import pino from "pino";

const logger = pino(
  {
    base: { service: "eduflow" },
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    ...(process.env.NODE_ENV !== "production" && {
      transport: {
        target: "pino-pretty",
        options: { colorize: true, ignore: "pid,hostname" },
      },
    }),
  },
);

export default logger;

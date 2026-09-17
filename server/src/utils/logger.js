const ts = () => new Date().toISOString();

const line = (level, msg, meta) => {
  const base = `[${ts()}] [${level.toUpperCase()}] ${msg}`;
  return meta ? `${base} ${JSON.stringify(meta)}` : base;
};

export const logger = {
  info: (msg, meta) => console.log(line("info", msg, meta)),
  warn: (msg, meta) => console.warn(line("warn", msg, meta)),
  error: (msg, meta) => console.error(line("error", msg, meta)),
  debug: (msg, meta) => {
    if (process.env.NODE_ENV !== "production") {
      console.log(line("debug", msg, meta));
    }
  },
};

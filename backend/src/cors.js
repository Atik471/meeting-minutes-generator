const allowedOrigins = new Set([
  "http://localhost:3000",
  "http://localhost:4173",
  "http://localhost:5000",
  "https://meeting-minutes-generator-qrzk.vercel.app",
]);

export const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
};

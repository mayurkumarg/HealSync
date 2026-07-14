const REQUIRED_VARS = ["MONGO_URI", "JWT_SECRET", "SALTROUNDS", "ENCRYPTION_KEY"];

export function validateEnv() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(
      `❌ Missing required environment variable(s): ${missing.join(", ")}.\n` +
      `   Copy .env.example to .env and fill these in before starting the server.`
    );
    process.exit(1);
  }
}

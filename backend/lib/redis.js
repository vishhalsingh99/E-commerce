import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config({ path: "./backend/.env" })// Load env variables

export const redis = new Redis(process.env.UPSTASH_REDIS_URL, {
  tls: {}, // Secure connection required for Upstash
});

redis.on("connect", () => {
  console.log("✅ Connected to Redis Cloud!");
});

redis.on("error", (err) => {
  console.error("❌ Redis connection error:", err);
});







import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { MongoClient } from "mongodb";
import { bearer } from "better-auth/plugins";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined");
}

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET is not defined");
}

function extractDbName(uri: string): string {
  try {
    const url = new URL(uri);
    const dbName = url.pathname.replace(/^\//, '').split('?')[0];
    return dbName || 'dailymanagament';
  } catch {
    return 'dailymanagament';
  }
}

const dbName = extractDbName(process.env.MONGODB_URI);

const client = new MongoClient(process.env.MONGODB_URI);
client.connect().catch((err) => console.error("Better Auth MongoClient error:", err));

const db = client.db(dbName);

export const auth = betterAuth({
  database: mongodbAdapter(db),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3005",
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    bearer()
  ]
});

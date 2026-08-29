import "server-only";
import mongoose, { type Mongoose } from "mongoose";

import { env } from "@/config/env";

/**
 * Serverless-safe connection cache: keep one connection (and one in-flight
 * connect promise) on `globalThis` so warm invocations and hot reloads reuse it
 * instead of opening a new pool each time. Never disconnect in a request.
 */

interface Cache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

const globalForMongoose = globalThis as typeof globalThis & { _mongoose?: Cache };
const cache: Cache = globalForMongoose._mongoose ?? { conn: null, promise: null };
globalForMongoose._mongoose = cache;

export async function connectToDatabase(): Promise<Mongoose> {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    mongoose.set("strictQuery", true);
    cache.promise = mongoose.connect(env.MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10_000,
    });
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }
  return cache.conn;
}

export { mongoose };

import { MongoClient } from 'mongodb';

const state = globalThis as typeof globalThis & { campusMongo?: MongoClient };

export function campusDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is missing');
  const client = state.campusMongo ??= new MongoClient(uri, {
    maxPoolSize: 16,
    ignoreUndefined: true,
    maxIdleTimeMS: 30_000,
    serverSelectionTimeoutMS: 5000,
  });
  return client.db(process.env.MONGODB_DB || 'campusquest');
}

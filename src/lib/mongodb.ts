import { MongoClient, MongoServerSelectionError } from 'mongodb';

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

// Keep database diagnostics in server logs and omit connection strings and user details.
export function logCampusDatabaseError(operation: string, error: unknown) {
  const code = (value: unknown) => {
    const candidate = (value as { code?: unknown } | null)?.code;
    return typeof candidate === 'number' || (typeof candidate === 'string' && /^[A-Z0-9_]+$/.test(candidate))
      ? candidate : undefined;
  };
  const network = error instanceof MongoServerSelectionError && error.reason
    ? [...error.reason.servers.values()].map(server => ({
      name: server.error?.name,
      code: code(server.error?.cause) ?? code(server.error),
    }))
    : undefined;
  console.error(operation, {
    name: error instanceof Error ? error.name : 'UnknownError',
    code: code(error),
    configured: !!process.env.MONGODB_URI,
    network,
  });
}

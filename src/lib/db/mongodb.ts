import { MongoClient, type Db } from 'mongodb';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const options = {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000,
};

// Temp file shared across all Next.js worker processes
const URI_CACHE_FILE = join(process.cwd(), '.next', 'mongodb-memory-uri.txt');

let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

async function createClientPromise(): Promise<MongoClient> {
  let uri = process.env.MONGODB_URI;
  const isMemory = !uri || uri.includes('localhost') || uri === 'memory';

  if (isMemory) {
    if (existsSync(URI_CACHE_FILE)) {
      uri = readFileSync(URI_CACHE_FILE, 'utf-8').trim();
    } else {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
      try { writeFileSync(URI_CACHE_FILE, uri); } catch { }
    }
  }

  try {
    const client = new MongoClient(uri!, options);
    const connectedClient = await client.connect();
    // Verify connection is alive
    await connectedClient.db().command({ ping: 1 });
    return connectedClient;
  } catch (err) {
    if (isMemory && existsSync(URI_CACHE_FILE)) {
      console.warn('[MongoDB] Cached URI failed, retrying with fresh server...');
      const { unlinkSync } = await import('fs');
      try { unlinkSync(URI_CACHE_FILE); } catch { }
      return createClientPromise();
    }
    throw err;
  }
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = createClientPromise();
  }
  clientPromise = global._mongoClientPromise;
} else {
  if (!process.env.MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }
  const client = new MongoClient(process.env.MONGODB_URI, options);
  clientPromise = client.connect();
}

export default clientPromise;

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db();
}

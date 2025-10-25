import sampleItems from '../../data/sample-items.json' assert { type: 'json' };
import { json, options } from '../lib/responses.js';

const DEFAULT_OBJECT_KEY = 'aggregates/robot_counts.json';

async function fetchFromR2(bucket, objectKey) {
  const object = await bucket.get(objectKey, { type: 'json' });
  if (!object) {
    throw new Error(`Object "${objectKey}" was not found in the bound R2 bucket.`);
  }
  return object;
}

function normalizeItems(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.items)) {
      return payload.items;
    }
    if (Array.isArray(payload.data)) {
      return payload.data;
    }
    if (Array.isArray(payload.results)) {
      return payload.results;
    }
    if (payload.counts && typeof payload.counts === 'object' && !Array.isArray(payload.counts)) {
      const timestamp = typeof payload.updatedAt === 'string' ? payload.updatedAt : null;
      return Object.entries(payload.counts).map(([name, count]) => {
        const numericCount = typeof count === 'number' ? count : Number(count);
        const row = {
          name,
          count: Number.isFinite(numericCount) ? numericCount : count
        };

        if (timestamp) {
          row.updatedAt = timestamp;
        }

        return row;
      });
    }
  }

  throw new Error('R2 object does not contain a JSON array of records.');
}

export const onRequestGet = async ({ env }) => {
  const bucket = env.INVENTORY_BUCKET;
  const objectKey = env.R2_OBJECT_KEY || DEFAULT_OBJECT_KEY;

  if (bucket) {
    try {
      const payload = await fetchFromR2(bucket, objectKey);
      const items = normalizeItems(payload);
      return json({ items, source: 'r2', objectKey });
    } catch (err) {
      console.error('Unable to load data from R2:', err);
      return json({
        items: normalizeItems(sampleItems),
        source: 'sample-fallback',
        objectKey,
        error: err.message
      });
    }
  }

  return json({
    items: normalizeItems(sampleItems),
    source: 'sample',
    objectKey: DEFAULT_OBJECT_KEY
  });
};

export const onRequestOptions = () => options();

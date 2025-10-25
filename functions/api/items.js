import sampleItems from '../../data/sample-items.json' assert { type: 'json' };
import { json, error, options } from '../lib/responses.js';

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
  }

  throw new Error('R2 object does not contain a JSON array of records.');
}

export const onRequestGet = async ({ env }) => {
  const bucket = env.INVENTORY_BUCKET;
  const objectKey = env.R2_OBJECT_KEY || DEFAULT_OBJECT_KEY;

  try {
    if (bucket) {
      const payload = await fetchFromR2(bucket, objectKey);
      const items = normalizeItems(payload);
      return json({ items, source: 'r2', objectKey });
    }
  } catch (err) {
    console.error('Unable to load data from R2:', err);
    return error(502, 'Failed to read inventory from R2.', err.message);
  }

  return json({
    items: normalizeItems(sampleItems),
    source: 'sample',
    objectKey: DEFAULT_OBJECT_KEY
  });
};

export const onRequestOptions = () => options();

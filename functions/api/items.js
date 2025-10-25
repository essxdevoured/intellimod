import sampleItems from '../../data/sample-items.json' assert { type: 'json' };
import { json, error, options } from '../lib/responses.js';

const DEFAULT_OBJECT_KEY = 'items.json';

async function fetchFromR2(bucket, objectKey) {
  const object = await bucket.get(objectKey, { type: 'json' });
  if (!object) {
    throw new Error(`Object "${objectKey}" was not found in the bound R2 bucket.`);
  }
  return object;
}

export const onRequestGet = async ({ env }) => {
  const bucket = env.INVENTORY_BUCKET;
  const objectKey = env.R2_OBJECT_KEY || DEFAULT_OBJECT_KEY;

  try {
    if (bucket) {
      const items = await fetchFromR2(bucket, objectKey);
      return json({ items, source: 'r2', objectKey });
    }
  } catch (err) {
    console.error('Unable to load data from R2:', err);
    return error(502, 'Failed to read inventory from R2.', err.message);
  }

  return json({
    items: sampleItems,
    source: 'sample',
    objectKey: DEFAULT_OBJECT_KEY
  });
};

export const onRequestOptions = () => options();

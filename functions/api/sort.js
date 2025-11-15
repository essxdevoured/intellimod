import { json, error, options } from '../lib/responses.js';

const OPENAI_URL = 'https://api.openai.com/v1/responses';
const MODEL = 'gpt-4.1-mini';

async function readRequestBody(request) {
  try {
    return await request.json();
  } catch (err) {
    throw new Error('Request body must be valid JSON.');
  }
}

function buildPromptPayload(items, instruction) {
  return {
    model: MODEL,
    input: [
      {
        role: 'system',
        content: [
          {
            type: 'text',
            text: [
              'You are an assistant that sorts product data.',
              'Return ONLY valid JSON representing the sorted array of items.',
              'Preserve every field from the original items.',
              'If the instruction is unclear, make a reasonable assumption and describe it in a "notes" property alongside the array.'
            ].join(' ')
          }
        ]
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: JSON.stringify({ instruction, items })
          }
        ]
      }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'sorted_items',
        schema: {
          type: 'object',
          required: ['items'],
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object'
              }
            },
            notes: {
              type: 'string'
            }
          }
        }
      }
    }
  };
}

async function callOpenAI(apiKey, body) {
  const response = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI request failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  const message = data.output?.[0]?.content?.[0]?.text;

  if (!message) {
    throw new Error('Unexpected OpenAI response structure.');
  }

  return JSON.parse(message);
}

export const onRequestPost = async ({ request, env }) => {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    return error(500, 'OPENAI_API_KEY binding is not configured.');
  }

  let body;
  try {
    body = await readRequestBody(request);
  } catch (err) {
    return error(400, err.message);
  }

  const { items, instruction } = body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return error(400, 'The request body must include a non-empty "items" array.');
  }

  try {
    const payload = buildPromptPayload(items, instruction || 'Sort by relevance');
    const result = await callOpenAI(apiKey, payload);
    return json(result);
  } catch (err) {
    console.error('OpenAI sort failed:', err);
    return error(502, 'Failed to sort items with OpenAI.', err.message);
  }
};

export const onRequestOptions = () => options();

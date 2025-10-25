# Roblox Robot Counts Explorer

A Cloudflare Pages site that reads Roblox robot count aggregates from an R2 bucket (via a Pages Function binding) and lets visitors reorder the dataset with a ChatGPT-powered sort prompt.

## Features

- **Cloudflare-native architecture** – static assets are served from Pages while `/api/*` routes run as Functions with access to bound resources.
- **R2 integration** – `GET /api/items` streams the `aggregates/robot_counts.json` manifest from the bound R2 bucket (or falls back to local sample data during preview).
- **ChatGPT sorting** – `POST /api/sort` sends the records and a natural-language instruction to the OpenAI Responses API with JSON-schema enforcement for deterministic output.
- **Responsive, spreadsheet-style UI** – vanilla JavaScript renders the dataset in an Excel-inspired table, adapts to whatever fields are present, and surfaces errors without reloading the page.

## Prerequisites

- [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) 3.0 or newer.
- A Cloudflare R2 bucket named `roblox-archive` containing the `aggregates/robot_counts.json` object (a JSON array of robot count records).
- An OpenAI API key with access to the `gpt-4.1-mini` Responses model.

## Local development (Pages preview)

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `wrangler.toml` (or update the provided example) with an R2 binding named `INVENTORY_BUCKET`:

   ```toml
   name = "intellimod"
   pages_build_output_dir = "public"
   compatibility_date = "2024-05-01"

   [[r2_buckets]]
   binding = "INVENTORY_BUCKET"
   bucket_name = "roblox-archive"
   preview_bucket_name = "roblox-archive"
   ```

   Cloudflare Pages automatically injects the binding as `env.INVENTORY_BUCKET`. During local preview you can omit the bucket (the site falls back to `data/sample-items.json`).

3. Provide secrets. Use `wrangler secret put` (recommended) or set environment variables before running the dev server:

   ```bash
   wrangler secret put OPENAI_API_KEY
   wrangler secret put R2_OBJECT_KEY   # optional, defaults to aggregates/robot_counts.json
   ```

4. Review the bindings and variables that the Pages Functions expect:

   | Name               | Type        | Required | Default value                    | Description |
   | ------------------ | ----------- | -------- | -------------------------------- | ----------- |
   | `INVENTORY_BUCKET` | R2 binding  | ✅       | —                                | R2 bucket that stores `aggregates/robot_counts.json` (configured in `wrangler.toml`). |
   | `OPENAI_API_KEY`   | Secret      | ✅       | —                                | OpenAI API key used by `/api/sort` when calling the Responses API. |
   | `R2_OBJECT_KEY`    | Secret/env  | ❌       | `aggregates/robot_counts.json`   | Override the object path if the data file lives elsewhere in the bucket. |

5. Start the Pages dev server:

   ```bash
   npm run dev
   ```

6. Open http://127.0.0.1:8788 and click **Load records**. The page displays whether records were sourced from R2 or the bundled sample. Enter a sorting instruction (e.g., “Sort by highest count, then show the largest positive delta”) and click **Sort records** to invoke ChatGPT.

## Deployment (Cloudflare Pages)

1. Create a new Pages project pointing to this repository.
2. In the Pages dashboard, add a production R2 binding named `INVENTORY_BUCKET` and any required environment variables/secrets:
   - `OPENAI_API_KEY` (secret)
   - `R2_OBJECT_KEY` (optional, defaults to `aggregates/robot_counts.json`)
3. Deploy. Pages automatically builds the static assets from `public/` and deploys the Functions in `functions/`.

## API reference

- `GET /api/items`
  - Returns `{ items: Record<string, unknown>[], source: "r2" | "sample", objectKey: string }`.
  - Responds with HTTP 502 if the R2 binding is configured but the object cannot be read or does not contain an array.
- `POST /api/sort`
  - Accepts `{ items: Record<string, unknown>[], instruction?: string }`.
  - Returns the JSON schema-enforced structure from the OpenAI Responses API (`{ items: Record<string, unknown>[], notes?: string }`).
  - Responds with HTTP 500 when the `OPENAI_API_KEY` binding is missing and 502 when the OpenAI request fails.

## Repository layout

```
public/                Static HTML/CSS/JS for the catalog UI
functions/api/items.js Pages Function that reads from R2 (or fallback data)
functions/api/sort.js  Pages Function that proxies sorting to OpenAI
data/sample-items.json Sample robot count records used when R2 is not bound
```

## Troubleshooting

- **403/404 from `/api/items`** – ensure the R2 object exists and the binding name matches `INVENTORY_BUCKET`.
- **502 from `/api/sort`** – verify `OPENAI_API_KEY` is set and the account has access to the chosen model.
- **CORS issues** – both functions send permissive `Access-Control-Allow-*` headers for use from any origin. If deploying in a locked-down environment, adjust `functions/lib/responses.js` accordingly.

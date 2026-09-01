# Payload MCP

`@payloadcms/plugin-mcp` is wired into `apps/app/src/payload.config.ts`. It exposes
`POST /api/mcp` (Streamable HTTP) so an MCP client — Claude Code included — can
create, update, and look up documents in a few collections directly:

| Collection   | Capabilities        | Why                                             |
| ------------ | -------------------- | ------------------------------------------------ |
| `blog`       | create, find, update | draft/edit posts                                  |
| `authors`    | find                  | pick a value for a post's `author` relationship   |
| `categories` | find                  | pick values for a post's `categories` relationship|
| `media`      | find                  | pick an existing upload for `featuredImage`       |

No collection has `delete` enabled, and no other collection is exposed. Access is
still gated per API key (see below) — enabling a capability here only lets an
admin *choose* to grant it to a key, it does not grant it automatically.

## One-time setup (per environment)

1. Deploy with this branch merged so `/api/mcp` exists.
2. Log into `/admin` as a user, open **API Keys** (under the **MCP** admin group),
   and create a new key.
3. On that key, enable `blog: create, find, update` (and `authors`/`categories`/
   `media: find`) to match the writer workflow. Leave everything else off.
4. Copy the generated key value — it is only shown once.
5. Set two environment variables wherever the MCP client runs (e.g. this repo's
   Claude Code environment secrets):
   - `PAYLOAD_MCP_URL` — the full endpoint, e.g. `https://amueai.com/api/mcp`
   - `PAYLOAD_MCP_API_KEY` — the key from step 4

`.mcp.json` at the repo root already declares the `payload` MCP server and reads
both of those from the environment, so no further client-side config is needed
once the env vars are set.

## Drafting a post

The `createBlog` tool defaults to `draft: false` (publishes immediately). The
daily blog Routine is configured to always pass `draft: true`, so posts land in
Payload as drafts for a human to review and publish from `/admin`. Required
`blog` fields: `title`, `slug`, `excerpt` (<=300 chars), `featuredImage` (a
`media` id — find one first, or ask a human to upload one), `author` (an
`authors` id), and `content` (Lexical richtext JSON).

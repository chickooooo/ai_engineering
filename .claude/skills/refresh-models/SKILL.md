---
name: refresh-models
description: Refresh the LLM provider and model catalogue in the llm_models table from the vendors' own published pricing pages, then log what changed. Use this whenever the user asks to refresh, update, check or sync models or token prices, mentions that a new model has shipped, asks whether the prices in the database are current, wonders what a model costs per million tokens, or asks to review the model catalogue — even if they do not name the table or the providers. Three providers are in scope: Anthropic, OpenAI and Google Gemini.
---

# Refresh models and prices

The `llm_models` table is what every cost total in this app is computed
from. A rate that is stale, or invented, silently corrupts every number
downstream — and nobody notices, because a wrong price looks exactly like
a right one. So the rule that matters more than any other here is: **every
figure you write must come from a page you fetched in this run.** Not from
memory, not from the previous log file, not from a blog post that quotes
the vendor. If you cannot fetch it, say so and leave the row alone.

The work runs in four phases: read what we have, fetch what the vendors
publish, show the user a diff and stop, then apply only what they approve.

## 1. Read the current state

The backend serves the catalogue. If it is not up, start it.

```bash
make docker up
curl -fsS http://127.0.0.1:8080/providers
curl -fsS http://127.0.0.1:8080/models
```

Keep the ids — you need them to patch or retire a row later. Prices come
back as decimal strings per million tokens (`"1.000000"`).

## 2. Fetch what the vendors publish

Fetch all three. These are the pages that carry the price tables; two of
them redirect, so go straight to the final URL:

| Provider | Prices | Model identifiers |
| --- | --- | --- |
| Anthropic | `https://platform.claude.com/docs/en/about-claude/pricing` | `https://platform.claude.com/docs/en/about-claude/models/overview` |
| OpenAI | `https://developers.openai.com/api/docs/pricing` | `https://developers.openai.com/api/docs/models` |
| Gemini | `https://ai.google.dev/gemini-api/docs/pricing` | `https://ai.google.dev/gemini-api/docs/models` |

Anthropic also publishes retirements at
`https://platform.claude.com/docs/en/about-claude/model-deprecations`.

Two things about these pages that will trip you up if you are not ready
for them:

**The price table names models the way marketing does; the database
stores the API identifier.** Anthropic's table says "Claude Haiku 4.5"
but the string the SDK needs is `claude-haiku-4-5-20251001`. That is why
the models page is in the table above — fetch it too and map display name
to identifier. Writing a display name into `llm_models.name` would make
the row useless, because that column is what gets passed to the provider.

**A page may have changed shape since this skill was written.** If the
table you find does not look like what is described here, trust the page
and tell the user what changed. Do not force the new layout into the old
assumptions.

### Verifying

Cross-check each provider's prices against a second page on that vendor's
own domain — `claude.com/pricing`, `openai.com/api/pricing`, or the Vertex
AI pricing page for Gemini. Aggregators and blogs do not count, however
confident they sound. If two vendor pages disagree, prefer the developer
documentation and say in the summary that they disagreed.

Then sanity-check every row before you show it. These catch transcription
slips, which are the realistic failure here:

- output costs more than input (true of every model these vendors sell)
- cached input costs less than input
- no figure is negative
- cache write is either zero or at least the input rate

A row that fails one of these is probably a misread column, not a
surprising price. Go back to the page.

### Scope

Track every current text-generation model each provider lists. Leave out
anything the vendor marks retired or deprecated, and leave out embedding,
image, audio, video and moderation models — this table prices chat
completions and nothing else.

"Current" is easy for Anthropic and Google, which publish a lifecycle
status per model. OpenAI does not: its price list keeps selling models
several generations old without marking any of them deprecated, so a
literal reading would add thirty-odd rows nobody intends to call. Take
the models OpenAI features on its models page, and offer the rest as a
question rather than adding them.

## 3. Normalise into our four columns

The table has exactly four price columns, all USD per million tokens:
`input_price`, `cached_input_price`, `cache_write_price`, `output_price`.
The vendors publish more than that, so apply these rules:

- **Two providers quote two cache-write rates.** Anthropic splits them by
  cache lifetime (5-minute and 1-hour); OpenAI splits them by context
  length (short and long). Record the cheaper, default one in both cases —
  the 5-minute rate and the short-context rate. The other is roughly
  double, so recording it would overstate every cached call.
- **Gemini tiers some models by prompt size** (≤200k vs >200k tokens).
  Record the ≤200k tier.
- **Promotional prices with an end date**: record the price in effect
  today, and note the scheduled change in the summary so the user knows a
  future refresh will move it.
- **Batch, fast-mode and data-residency rates are out of scope.** Record
  the standard rate.
- **No published per-token cache-write charge**: record `0`. Gemini bills
  caching by the hour of storage rather than per token written, and
  OpenAI's older models predate cache writes entirely. Say so in the
  summary rather than leaving the user to wonder whether you forgot.
- **A model listed but not priced** is not a free model. Ask before
  recording `0` — a wrong zero makes every call on that model cost
  nothing, which is the one error no cost report will ever reveal.

Anything the page publishes that none of these rules covers goes in the
"needs your call" section. Do not quietly pick one.

## 4. Show the diff and stop

Print this and go no further. The user reviews before anything is
written; that is the whole point of the workflow.

```
# Model refresh — <today's date>

Fetched today:
  ANTHROPIC  <url>
  OPENAI     <url>
  GEMINI     <url>

## Add (n)
| Provider | Model | Input | Cached | Cache write | Output |

## Update (n)
| Provider | Model | Field | From | To |

## Retire (n)
| Provider | Model | Why |

## Unchanged (n)
<provider>: <model>, <model>, …

## Needs your call (n)
- <provider> <model>: <what the page published that we cannot store,
  and what you recorded instead>

Nothing has been written. Tell me which of these to apply.
```

Keep "unchanged" to one line per provider — it is there so the user can
see the run covered everything, not to be read row by row.

**Never retire a model just because it is missing from a page.** A fetch
can fail, or a table can move. Retire only when the vendor says so: a
deprecation page, or a "retired" marker in the price table. If a model in
our table simply did not appear anywhere, list it under "needs your call"
and explain that you could not find it.

## 5. Apply what the user approved

Write through the REST API, not SQL. The endpoints enforce the uniqueness
and non-negative-price rules the database depends on, and a mistake comes
back as a 4xx instead of a corrupt row.

```bash
# A provider that does not exist yet
curl -fsS -X POST http://127.0.0.1:8080/providers \
  -H 'content-type: application/json' \
  -d '{"name": "ANTHROPIC"}'

# A new model
curl -fsS -X POST http://127.0.0.1:8080/models \
  -H 'content-type: application/json' \
  -d '{"provider_id": 1, "name": "claude-haiku-4-5-20251001",
       "input_price": "1.00", "cached_input_price": "0.10",
       "cache_write_price": "1.25", "output_price": "5.00"}'

# A price change — send only the fields that moved
curl -fsS -X PATCH http://127.0.0.1:8080/models/10 \
  -H 'content-type: application/json' \
  -d '{"output_price": "10.00"}'

# Retire
curl -fsS -X DELETE http://127.0.0.1:8080/models/10
```

`DELETE` sets `is_active` to false rather than removing the row, because
recorded usage in `llm_messages` points at it and that cost history has to
stay readable. If the user asks to bring a model back, `PATCH` it with
`{"is_active": true}`.

Provider names in this table are the uppercase enum names — `ANTHROPIC`,
`OPENAI`, `GEMINI` — because `app.seed` and the price lookups match on
them.

Check each response. If one comes back 409 or 422, stop and report it
rather than carrying on; a conflict usually means the catalogue moved
under you and the diff you showed is no longer accurate.

## 6. Append to the log

`backend/model_changes.txt` is the history of what this table has held
over time, which is what lets someone reconstruct why an old cost total
says what it says. Append a block; never rewrite or reformat what is
already there. Create the file with no header if it does not exist.

```
================================================================
2026-09-12  refresh
sources:
  ANTHROPIC  https://platform.claude.com/docs/en/about-claude/pricing
  OPENAI     https://developers.openai.com/api/docs/pricing
  GEMINI     https://ai.google.dev/gemini-api/docs/pricing

added:
  OPENAI  gpt-5-nano  in 0.05  cached 0.005  write 0  out 0.40
updated:
  ANTHROPIC  claude-sonnet-5  output_price  15.00 -> 10.00
retired:
  ANTHROPIC  claude-opus-4-1  (retired by Anthropic)
notes:
  GEMINI  gemini-3.1-pro-preview  tiered input, recorded <=200k tier
================================================================
```

Write only what was actually applied. If the user approved three of five
changes, the log records three. Omit a section that is empty rather than
writing "none", and skip the log entirely if nothing was applied — an
empty entry is noise in a file whose whole value is signal.

Leave committing to the user; they review their own diffs.

## Things worth knowing

The API keys in `backend/.env` are placeholders today, so `models.list()`
on any of the three SDKs returns 401. That is why this skill reads the
docs rather than asking the providers what they serve. If the user puts
real keys in, listing models through the SDK becomes a useful
cross-check on which models their account can actually reach — but it
still will not give you prices. No provider publishes those over its API.

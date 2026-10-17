# ISO 20022 Academy · Translator API (hybrid: rules engine + AI)

**Rules engine first, AI as the fallback.** Every request goes to the rules engine (`app/engine/`), which
translates and repairs by the published field rules: instant, free, the same answer every time. The AI
(Google ADK agents on Gemini, `app/agents.py`) is called only when the engine declines (a structure it doesn't
cover, a message it can't read) or its result breaks a rule the source didn't already break. If the AI is
unavailable (no key, limit reached, outage), the engine's result is returned with its flags instead.

Every result, from either side, gets the same checks: validation, the pair's field rules
(`mappings.pair_findings`) and the value comparison (`checks.compare_values`). The response says which side
did the work (`engine: "rules" | "ai"`) and, for the AI, why (`fallbackReason`).

## The rules engine

| Piece | What it does |
|---|---|
| `engine/io.py` | XML and MT readers that remember what they used (anything unused is listed as dropped, never lost silently), writers, party/address handling, amount and date formats |
| `engine/mx_to_mt.py` | pacs.008→MT103, pacs.004→MT103 RETN, pain.001→MT101, pain.008→MT104, camt.053→MT940, camt.054→MT900/910, camt.056→MT192, pacs.002/pain.002→MT199 |
| `engine/mt_to_mx.py` | MT103→pacs.008, MT103 RETN→pacs.004, MT101→pain.001, MT104→pain.008, MT940→camt.053, MT900/910→camt.054, MT192→camt.056 |
| `engine/repair.py` | Provable fixes only (counts, control sums, unambiguous dates, decimals, MT amount commas, header addresses, missing :23B:). What only the sender knows is reported as unresolved; `needs_ai` marks damage an AI could untangle (broken XML, garbled fields) |

The engine declines rather than guesses: several transactions where the MT takes one, mixed currencies in an
MT104, a missing mandatory value. A decline goes to the AI.

## How a result is kept honest

1. The target format's spec **and the field rules for that pair** (`app/mappings.py`: which source
   field goes where, header blocks, /ROC/, charge codes…) go into the prompt, and the agent answers once. Our checks run on
   that answer; only if they find problems does the agent get a second attempt with the exact
   findings. At most two model calls per request, so results come back in seconds.
2. Its answer is forced into a typed shape (ADK `output_schema`): the message, the corrections when fixing
   (or list of changes for a repair), and the fields it had to fill in or drop.
3. **The API re-runs the same checks on the final message** and returns them with the result:
   - `validation`: structure, namespace, mandatory MT fields, IBAN checksum, BIC format, dates,
     currency precision, NbOfTxs, CtrlSum (and the official XSD when it's in `schemas/`).
   - `fidelity`: every amount, currency, BIC, account, date and reference in the output must
     exist in the source. Anything else is listed under `invented` and shown in red.
     BICs are compared at full length, so an invented branch code (even in block 1/2) is caught.
     For a repair, a value may only change if the agent declared that change.
   - rule checks (`mappings.pair_findings`): e.g. pacs.008 → MT103 `:20:` must be the InstrId,
     the EndToEndId must ride in `:70:` as `/ROC/`, `:52A:` is the debtor agent, the UETR is kept,
     and block 1/2 addresses are well formed. A broken rule triggers the retry with that exact rule.

## Endpoints

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/api/health` | | `{ ok, configured }` |
| POST | `/api/check` | `{ source }` | detected type, version, equivalent, validation (no AI) |
| POST | `/api/translate` | `{ source, target, sourceType?, fix? }` | `engine`, `fallbackReason`, message, fixed, unresolved, `repairedSource`, filled, dropped, notes, `carried`, validation, fidelity |
| POST | `/api/repair` | `{ source, sourceType?, rejectReason? }` | `engine`, message, changes, unresolved, summary, validationBefore, validation, fidelity |

Only the direct equivalent is accepted as a target (MT103 → pacs.008, never MT103 → pain.001).

## Owner dashboard (`/insights/`)

`GET /api/admin/traffic?days=1|7|30` (Cloudflare Web Analytics, cached 5 minutes) and `GET /api/admin/service`
(Translator counts since the instance started) need the `X-Admin-Key` header to equal `ADMIN_KEY`. Ten wrong keys
in ten minutes lock that address out for a while. Env vars: `ADMIN_KEY`, `CF_API_TOKEN` (Account Analytics: Read),
`CF_ACCOUNT_ID`, optional `CF_SITE_TAG` / `SITE_HOST`. Nothing about visitors is stored by this service.

## Limits and privacy

- Rules engine: `ENGINE_PER_MINUTE` (30) per visitor, no daily cap (it costs nothing).
- AI calls only: per visitor `RATE_PER_MINUTE` (6) and `RATE_PER_DAY` (40); site-wide `DAILY_REQUEST_CAP` (500).
- Messages up to 20,000 characters. XML is parsed with entities, DTDs and network access disabled.
- Message contents are never logged or stored; each request's agent session is deleted after it answers.
- Messages are sent to Google's Gemini API. On the **free tier, Google may use prompts to improve its
  products**; use a paid (billing-enabled) key before real traffic, and keep the site's
  "don't paste real customer data" note.

## Run locally

```bash
cd ai-api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env            # put your Gemini key in .env
set -a && source .env && set +a
uvicorn app.main:app --reload --port 8000
pytest -q                       # runs without a key: the AI is stubbed
```

Point the site at it by changing `AI_API` at the top of `assets/js/translator.js` to `http://localhost:8000`.

## Deploy (Render)

New → Web Service → this repository → **Root Directory `ai-api`** → Runtime **Docker**.
Under Environment add `GOOGLE_API_KEY` (and optionally the other variables in `.env.example`).
The site expects it at `https://iso20022academy-ai-api.onrender.com`; if Render gives a different
URL, update `AI_API` in `assets/js/translator.js`.


## Token budget

- The model writes only the message and short `filled` / `dropped` / `fixed` lists. Which values were
  carried over is worked out by `checks.compare_values`, not written by the model.
- `THINKING_LEVEL=MINIMAL` by default (thinking tokens are billed as output); `MAX_OUTPUT_TOKENS` caps an answer.
- `fix: true` corrects the source and translates it in **one** call, instead of a repair call plus a translate call.
- Answers for the site's own samples (`app/sample_hashes.json`) are kept in memory and reused, so trying the
  sample costs one model call per restart, not one per visitor. Visitors' own messages are never cached.
- A second attempt happens only when our checks find an error in the first answer (`MAX_ATTEMPTS=1` turns it off).

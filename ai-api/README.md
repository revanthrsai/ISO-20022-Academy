# ISO 20022 Academy · AI API

The service behind the Translator's **AI Translate** and **AI Repair** buttons.
Python, [Google ADK](https://google.github.io/adk-docs/) and Gemini. Deployed separately from the
static site, the same way `/transform-api` is.

```
Browser ──▶ POST /api/translate ─┐
        ──▶ POST /api/repair   ──┤   FastAPI
                                 ▼
                     ADK agent (translator | repairer), spec in the prompt
                       checks → one retry with the findings if needed
                                 ▼
                     re-check: validate() + compare_values()  ──▶ JSON to the browser
```

## How a result is kept honest

1. The target format's spec **and the field rules for that pair** (`app/mappings.py`: which source
   field goes where, header blocks, /ROC/, charge codes…) go into the prompt, and the agent answers once. Our checks run on
   that answer; only if they find problems does the agent get a second attempt with the exact
   findings. At most two model calls per request, so results come back in seconds.
2. Its answer is forced into a typed shape (ADK `output_schema`): the message, a field mapping
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
| POST | `/api/translate` | `{ source, target, sourceType? }` | message, mapping, filled, dropped, notes, `direct`, validation, fidelity |
| POST | `/api/repair` | `{ source, sourceType?, rejectReason? }` | message, changes, unresolved, summary, validationBefore, validation, fidelity |

`direct` is false when source and target aren't real equivalents (for example MT103 → pain.001).
The agent still produces the closest rebuild and explains what changed in meaning.

## Limits and privacy

- Per visitor: `RATE_PER_MINUTE` (6) and `RATE_PER_DAY` (40). Site-wide: `DAILY_REQUEST_CAP` (500).
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

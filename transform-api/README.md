# ISO 20022 Academy — Transform API

A small **Spring Boot** service that transforms between legacy SWIFT **MT** and
**ISO 20022 MX** messages — starting with **MT103 ⇄ pacs.008**. MT parsing uses
**Prowide Core** (Apache 2.0); the field mapping is coded explicitly, so no
commercial translator is required.

This is a **separate deployable** from the static Academy site (which is on
GitHub Pages and can't run a backend). Give it its own repo and host, then point
the Playground's Transform view at its URL.

## Run locally

Requires JDK 17+ and Maven.

```bash
cd transform-api
mvn spring-boot:run
# → http://localhost:8080
```

Health check:

```bash
curl http://localhost:8080/api/health
```

## The endpoint

`POST /api/transform`

```json
{ "source": "<MT text or pacs.008 XML>", "direction": "AUTO" }
```

`direction` is `AUTO` (detect from content), `MT_TO_MX`, or `MX_TO_MT`.

Example (MT103 → pacs.008):

```bash
curl -X POST http://localhost:8080/api/transform \
  -H 'Content-Type: application/json' \
  -d '{ "direction": "MT_TO_MX", "source": ":20:BOB-INV0042\n:23B:CRED\n:32A:260627USD400,00\n:50K:Bob Marsh\n:52A:EBILAEAD\n:57A:HDFCINBB\n:59:Sweety Rao\n:70:Invoice 0042\n:71A:SHA" }'
```

Response:

```json
{ "ok": true, "result": "<?xml ... pacs.008 ...>", "sourceFormat": "MT103", "targetFormat": "pacs.008" }
```

## Deploy (free-ish options)

Any of these work; all read `$PORT` automatically:

- **Render** — New → Web Service → connect the repo → Runtime: Docker (uses the `Dockerfile`). Free tier sleeps when idle.
- **Railway** — New → Deploy from repo → it detects the Dockerfile.
- **Google Cloud Run** — `gcloud run deploy --source .` (has a generous free tier, scales to zero).

After deploy, note the public URL (e.g. `https://transform-api.onrender.com`) and
set it as `TRANSFORM_API` in the Playground (Phase 4).

## CORS

`WebConfig` allows `https://iso20022academy.in` (and localhost). Add any other
origin you serve the site from.

## Scope & next steps

- **v1:** MT103 ⇄ pacs.008, common fields (references, amount/ccy/date, debtor,
  creditor, agents, remittance, charges).
- **Extend:** add more fields, more pairs (MT202 ⇄ pacs.009, MT940 ⇄ camt.053),
  and optionally pull in `com.prowidesoftware:pw-iso20022` for typed MX models
  instead of hand-built XML.
- The mapping is deliberately explicit and auditable — accuracy over cleverness.

## Licensing note

Prowide **Core** (`pw-swift-core`) and **pw-iso20022** are Apache 2.0 (free).
Prowide's **Translator** (automatic MT↔MX) is commercial and is **not** used here.

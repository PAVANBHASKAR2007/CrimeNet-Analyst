# CrimeNet — SIH26189 AI-Powered Criminal Network Analysis System
## Setup & Run Instructions

This backup contains the complete working project as of this checkpoint: a
FastAPI backend (auth, case management, file upload, NLP entity extraction,
relationship detection, insight generation) and a React frontend (Landing,
Login, Dashboard, Case Management, Case Detail, Report Upload — Network
Analysis, Search, and Investigation Insights are still placeholder pages).

---

## 1. Prerequisites

- Python 3.12 (or close to it)
- Node.js 18+ and npm
- ~200MB free disk space (mostly for the spaCy language model)

---

## 2. Backend setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # on Windows: venv\Scripts\activate

pip install -r requirements.txt
```

The spaCy English model (`en_core_web_sm`) is pinned directly as a URL in
`requirements.txt` and will install automatically with the command above —
you do not need to run `python -m spacy download` separately.

### Run the backend

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The API will be live at `http://localhost:8000`, with interactive docs at
`http://localhost:8000/docs`.

A demo investigator account is seeded automatically on first startup:
- **Username:** `investigator`
- **Password:** `sih2026`

The SQLite database file (`crimenet.db`) is included in this backup with the
demo data already loaded (cases, extracted entities, relationships, and
insights from the synthetic case reports in `data/`). Delete `crimenet.db`
before first run if you'd rather start from an empty database — it will be
recreated automatically.

---

## 3. Frontend setup

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

The app will be live at `http://localhost:5173`. It expects the backend to
be running at `http://localhost:8000` (hardcoded in `src/api/client.js` —
change `API_BASE` there if you need a different backend address).

---

## 4. Reproducing the demo scenario from scratch

If you deleted `crimenet.db` and want to reproduce the "hidden cross-case
connection" demo:

1. Log in with the seeded investigator account.
2. Create two cases, e.g. `FIR-2026-0112` and `FIR-2026-0148`.
3. Upload `data/case_001_theft.txt` to the first case, and
   `data/case_002_fraud.txt` to the second, via the Report Upload page.
4. Open either case's Case Detail page — you'll see a high-severity
   cross-case insight reporting that the two cases share several entities
   (a person, a phone number, an account number, and a location).
5. A third file, `data/case_003_assault.txt`, demonstrates a case that is
   mostly independent, with only one weak overlap — useful for showing the
   system doesn't over-connect everything.

---

## 5. Project structure

```
backend/
  app/
    main.py           # FastAPI app, all API routes
    database.py        # SQLAlchemy models (7 tables) + DB session
    schemas.py          # Pydantic request/response schemas
    auth.py              # JWT auth + password hashing
    nlp/
      extractor.py       # spaCy NER + regex entity extraction
      analyzer.py         # relationship building + insight generation
      file_parser.py       # PDF/TXT/CSV -> plain text
  data/                     # synthetic demo case reports (.txt)
  requirements.txt
  crimenet.db                # SQLite database (demo data included)

frontend/
  src/
    api/client.js           # API wrapper (axios), matches backend exactly
    components/               # AppShell, badges, shared loading/error/empty states
    pages/                      # Landing, Login, Dashboard, Case Management,
                                  # Case Detail, Report Upload (built);
                                  # Network Analysis, Search, Investigation
                                  # Insights (placeholders, not yet built)
    App.jsx                       # routing
  package.json
```

---

## 6. Known limitations (by design, for a 2-day prototype)

- All data is synthetic/demo data — no real police databases or live feeds.
- Relationship detection is co-occurrence-based (two entities in the same
  report = related), not deep relation classification.
- Insights are rule-based (repeated entity, cross-case link, central figure),
  not a machine-learned "risk score" — intentionally, so every insight is
  explainable back to source text.
- CSV parsing is a simple row-flattening approach; messy/irregular CSVs
  (e.g. multi-line cell values) can produce imperfect entity extraction.
- No real production security hardening (rate limiting, refresh tokens,
  audit logging) — adequate for a demo, not for real case data.

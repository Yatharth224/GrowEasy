# GrowEasy CSV Importer

An AI-powered CSV importer that intelligently extracts CRM lead information from any CSV format — regardless of column names, layout, or source (Facebook Lead Export, Google Ads Export, real estate CRM exports, manually created spreadsheets, etc).

Built as part of the GrowEasy Software Developer assignment.

---

## Tech Stack

**Frontend:** Next.js (App Router), plain CSS, PapaParse (CSV parsing)
**Backend:** Django + Django REST Framework
**AI:** Groq (Llama 3.3 70B) for intelligent field mapping

---

## Features

- Drag & drop or click-to-browse CSV upload
- Client-side CSV preview (sticky header, scrollable table) before any AI processing happens
- Confirm step — AI is only called after the user explicitly confirms
- Batched AI processing (20 rows per batch) to handle large files reliably
- Intelligent field mapping regardless of the original column names
- Enforces CRM business rules (allowed status values, allowed data source values, date format, multiple email/phone handling, skip logic for invalid rows)
- Results view styled like a real CRM leads table, with colour-coded status badges and expandable rows for full lead details
- Skipped records shown separately with the reason they were skipped
- Responsive layout, loading states, and basic error handling

---

## Project Structure

```
groweasy/
├── config/                  # Django project settings
├── importer/                # Django app - all CSV/AI logic
│   ├── services.py          # AI prompt building, batching, cleaning rules
│   ├── serializers.py       # Request validation
│   ├── views.py             # API endpoints
│   └── urls.py
├── manage.py
├── requirements.txt
├── .env                     # GROQ_API_KEY (not committed)
└── groweasy-frontend/       # Next.js app
    └── app/
        └── page.tsx          # Upload -> Preview -> Confirm -> Result flow
```

---

## How It Works

1. User uploads a CSV (drag & drop or file picker)
2. The file is parsed entirely on the client using PapaParse - no data is sent to the backend yet
3. A preview table is shown so the user can verify the data before importing
4. On clicking **Confirm Import**, the raw rows are sent to `POST /api/import/`
5. The backend splits the rows into batches of 20 and sends each batch to the Groq API with a prompt describing the target CRM schema and business rules
6. The AI returns every row mapped into CRM fields (including ones it couldn't fully fill in)
7. The backend - not the AI - makes the final call on whether a row should be imported or skipped, based on the presence of an email or mobile number, and validates that `crm_status` / `data_source` only contain allowed values
8. The final result (imported records + skipped records with reasons) is returned to the frontend and displayed

---

## Local Setup

### Prerequisites
- Python 3.12+
- Node.js 18+
- A free Groq API key from https://console.groq.com

### Backend Setup

```bash
git clone <repo-url>
cd groweasy

python -m venv venv
source venv/bin/activate      # On Windows: venv\Scripts\activate

pip install -r requirements.txt
```

Create a `.env` file in the project root:

```
GROQ_API_KEY=your_groq_api_key_here
```

Run the server:

```bash
python manage.py runserver
```

Backend will be available at `http://localhost:8000`

### Frontend Setup

```bash
cd groweasy-frontend
npm install
npm run dev
```

Frontend will be available at `http://localhost:3000`

---

## API

### `GET /api/check/`
Health check endpoint.

### `POST /api/import/`
Accepts CSV rows and returns AI-mapped CRM records.

**Request body:**
```json
{
  "rows": [
    { "Full Name": "John Doe", "Email": "john@example.com", "Phone": "9876543210" }
  ]
}
```

**Response:**
```json
{
  "imported": [ { "name": "John Doe", "email": "john@example.com", "...": "..." } ],
  "skipped": [ { "row": { "...": "..." }, "reason": "No email or mobile number found" } ],
  "total_imported": 1,
  "total_skipped": 0
}
```

---

## Environment Variables

| Variable | Where | Description |
|---|---|---|
| `GROQ_API_KEY` | Backend `.env` | API key for Groq (free tier) |
| `NEXT_PUBLIC_API_URL` | Frontend `.env.local` | Backend base URL (used in production) |

---

## Live Demo

- Frontend: https://grow-easy-pied.vercel.app
- Backend: https://groweasy-6kdy.onrender.com

---

## Submission

**Position applied for:** _Intern / Full-Time_ (update as applicable)
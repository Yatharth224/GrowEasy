import os
import json
from groq import Groq

# Load the API key from environment variables (.env file)
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))


# Only these values are allowed for crm_status, as per the assignment rules
ALLOWED_STATUS = [
    "GOOD_LEAD_FOLLOW_UP",
    "DID_NOT_CONNECT",
    "BAD_LEAD",
    "SALE_DONE",
]

# Only these values are allowed for data_source
ALLOWED_SOURCE = [
    "leads_on_demand",
    "meridian_tower",
    "eden_park",
    "varah_swamy",
    "sarjapur_plots",
]


def make_batches(rows, batch_size=20):
    """
    Splits all rows into smaller groups.
    Example: if there are 50 rows and batch_size=20,
    this creates 3 batches: 20, 20, 10
    """
    batches = []
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i + batch_size]
        batches.append(batch)
    return batches


def build_prompt(rows):
    """
    Builds the instruction (prompt) that we send to the AI.

    IMPORTANT: unlike before, we now ask the AI to return EVERY row,
    even ones that don't have an email or mobile number. We do the
    skip/keep decision ourselves in Python (see clean_record below).
    This way we never "lose" a row silently - every input row shows
    up in either the imported list or the skipped list.
    """
    instructions = """
You are a data extraction assistant. You will receive raw CSV rows with unknown column names.
Your job is to map EACH AND EVERY row into the following CRM fields, in the same order
they were given to you. Do not skip or drop any row, even if it looks incomplete or invalid -
just fill in whatever fields you can, leave the rest empty.

created_at, name, email, country_code, mobile_without_country_code, company,
city, state, country, lead_owner, crm_status, crm_note, data_source,
possession_time, description

Rules you MUST follow:

1. crm_status must be exactly one of these values, or leave it empty if unsure:
GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE

2. data_source must be exactly one of these values, or leave it empty if unsure:
leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots

3. created_at must be in a format that works with JavaScript's new Date(created_at)

4. If a row has multiple emails, use the first one as "email" and put the rest inside "crm_note".
If a row has multiple mobile numbers, use the first one as "mobile_without_country_code"
and put the rest inside "crm_note".

5. Return ALL rows, in the same order as the input. Do NOT drop or skip any row yourself -
even rows with no email and no mobile number must still appear in the output
(just leave email and mobile_without_country_code empty for those).

6. Return ONLY a valid JSON object with a key "records" containing the array. No explanation, no extra text.

Return the result like this:
{
  "records": [
    {
      "created_at": "...",
      "name": "...",
      "email": "...",
      "country_code": "...",
      "mobile_without_country_code": "...",
      "company": "...",
      "city": "...",
      "state": "...",
      "country": "...",
      "lead_owner": "...",
      "crm_status": "...",
      "crm_note": "...",
      "data_source": "...",
      "possession_time": "...",
      "description": "..."
    }
  ]
}

Here is the raw data (as JSON):
"""
    raw_data = json.dumps(rows)
    full_prompt = instructions + raw_data
    return full_prompt


def call_ai(rows):
    """
    Sends one batch of rows to the AI and returns the parsed JSON response.
    """
    prompt = build_prompt(rows)

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
        )
        ai_reply = response.choices[0].message.content
    except Exception as error:
        # If the AI call itself fails (network issue, rate limit, etc.)
        print("AI call failed:", error)
        return []

    try:
        parsed = json.loads(ai_reply)
    except json.JSONDecodeError:
        # If the AI returned invalid JSON, don't crash - just return an empty list
        print("AI returned invalid JSON:", ai_reply[:200])
        return []

    if isinstance(parsed, list):
        return parsed

    # The prompt asks for {"records": [...]}, so extract that list
    if isinstance(parsed, dict):
        for value in parsed.values():
            if isinstance(value, list):
                return value

    return []


def clean_record(record):
    """
    This is where WE (not the AI) decide if a record should be imported
    or skipped. The AI just maps fields - the actual business rule
    enforcement happens here, so it can never be silently skipped
    without us knowing about it.
    """
    if record.get("crm_status") not in ALLOWED_STATUS:
        record["crm_status"] = ""

    if record.get("data_source") not in ALLOWED_SOURCE:
        record["data_source"] = ""

    has_email = bool(record.get("email"))
    has_mobile = bool(record.get("mobile_without_country_code"))

    # Rule: at least one of email or mobile must be present
    if not has_email and not has_mobile:
        return None

    return record


def process_all_rows(all_rows):
    """
    Main function - this is what views.py calls.
    Handles batching, AI calls, and cleaning, all in one place.
    """
    imported = []
    skipped = []

    batches = make_batches(all_rows, batch_size=20)

    for batch in batches:
        ai_result = call_ai(batch)

        for record in ai_result:
            cleaned = clean_record(record)
            if cleaned is None:
                skipped.append({
                    "row": record,
                    "reason": "No email or mobile number found"
                })
            else:
                imported.append(cleaned)

    return {
        "imported": imported,
        "skipped": skipped,
        "total_imported": len(imported),
        "total_skipped": len(skipped),
    }
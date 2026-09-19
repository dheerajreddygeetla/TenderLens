import re

TENDER_ID_RE = re.compile(r"\b[A-Z]{2,6}-\d{4}-\d{3,6}\b")
AMOUNT_RE = re.compile(
    r"(?:INR|Rs\.?|₹)\s?([0-9][0-9,]*(?:\.\d+)?)\s?(crore|lakh|lakhs|cr)?",
    re.IGNORECASE,
)
DATE_DMY_RE = re.compile(r"\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b")
DATE_LONG_RE = re.compile(
    r"\b\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b",
    re.IGNORECASE,
)
COMPANY_RE = re.compile(
    r"\b[A-Z][A-Za-z0-9&.,()\- ]{2,80}?"
    r"(Pvt\.?\s?Ltd\.?|Private Limited|Limited|Ltd\.?|LLP|Inc\.?|Corp\.?)\b"
)


def extract_entities(text: str) -> dict:
    sample = text[:200_000]  # cap for safety

    tenders = sorted(set(TENDER_ID_RE.findall(sample)))

    amounts: list[dict] = []
    for raw, unit in AMOUNT_RE.findall(sample):
        try:
            num = float(raw.replace(",", ""))
        except ValueError:
            continue
        mult = {"crore": 1e7, "cr": 1e7, "lakh": 1e5, "lakhs": 1e5, None: 1, "": 1}.get(
            (unit or "").lower(), 1
        )
        amounts.append({"raw": raw.strip(), "unit": (unit or "").lower(), "value": num * mult})

    dates = sorted(set(DATE_DMY_RE.findall(sample) + DATE_LONG_RE.findall(sample)))

    companies = sorted(
        {c.strip().rstrip(".,;:") for c in COMPANY_RE.findall(sample) if len(c.strip()) > 5}
    )

    return {
        "tender_ids": tenders[:200],
        "amounts": amounts[:200],
        "dates": dates[:200],
        "companies": companies[:100],
    }

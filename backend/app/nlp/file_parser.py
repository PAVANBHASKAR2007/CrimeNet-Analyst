import csv
import io
import pdfplumber


def parse_file(filename: str, content: bytes) -> str:
    lower = filename.lower()
    if lower.endswith(".pdf"):
        text_parts = []
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    text_parts.append(t)
        return "\n".join(text_parts)
    elif lower.endswith(".csv"):
        decoded = content.decode("utf-8", errors="ignore")
        reader = csv.reader(io.StringIO(decoded))
        rows = [", ".join(row) for row in reader]
        return "\n".join(rows)
    else:  # .txt or anything else -> treat as plain text
        return content.decode("utf-8", errors="ignore")

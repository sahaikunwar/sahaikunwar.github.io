"""Convert a CSV export of your Google Sheet into data/videos.json.

Usage:

1. Create a Google Sheet with columns: title,topic,category,platform,url
2. In Google Sheets: File -> Download -> Comma-separated values (.csv)
3. Save that file as tools/videos.csv (in this project)
4. Run this script from the project root:

   python tools/sheet_to_json_from_csv.py

5. It will create/overwrite data/videos.json
6. Commit and push changes to GitHub to update the website.
"""

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "tools" / "videos.csv"
JSON_PATH = ROOT / "data" / "videos.json"


def csv_to_json():
    if not CSV_PATH.exists():
        raise FileNotFoundError(f"CSV file not found: {CSV_PATH} (export your sheet as videos.csv into the tools folder)")

    videos = []
    with CSV_PATH.open(newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        # Expecting headers: title, topic, category, platform, url
        for row in reader:
            title = (row.get("title") or "").strip()
            url = (row.get("url") or "").strip()
            if not title or not url:
                # skip incomplete rows
                continue
            videos.append({
                "title": title,
                "topic": (row.get("topic") or "").strip(),
                "category": (row.get("category") or "").strip(),
                "platform": (row.get("platform") or "").strip() or "Unknown",
                "url": url,
            })

    JSON_PATH.parent.mkdir(parents=True, exist_ok=True)
    with JSON_PATH.open("w", encoding="utf-8") as f:
        json.dump(videos, f, indent=2, ensure_ascii=False)

    print(f"Written {len(videos)} videos to {JSON_PATH}")


if __name__ == "__main__":
    csv_to_json()

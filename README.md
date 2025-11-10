# Sahai Academy (Embedded Videos Version)

A static website to host a curated collection of educational videos from YouTube, Facebook, Instagram, and other platforms.  
Designed for free hosting on GitHub Pages and organised into four categories:

- GK
- Maths and Science
- Kids
- Health and Medicines

Videos are shown **embedded on the page** whenever possible (YouTube, Facebook, Instagram), with a backup link to open in a new tab.

## Structure

- `index.html` - home page with links to each category
- `gk.html` - GK videos
- `maths-science.html` - Maths and Science videos
- `kids.html` - Kids videos
- `health-medicines.html` - Health and Medicines videos
- `assets/css/styles.css` - basic styling
- `assets/js/app.js` - JavaScript to load and display videos for each category page, with embedded players
- `data/videos.json` - list of all videos (title, topic, category, platform, url)
- `tools/sheet_to_json_from_csv.py` - helper script to regenerate `data/videos.json` from a CSV export of a Google Sheet
- `tools/videos.csv` - (you create this) CSV export from your Google Sheet

## Hosting on GitHub Pages

1. Log in to GitHub and create a repository named `sahaikunwar.github.io`.
2. Download this folder and upload all files to that repository (or clone & copy).
3. Commit and push.
4. In GitHub, go to **Settings → Pages** and enable GitHub Pages on the `main` branch.
5. The site will be live at `https://sahaikunwar.github.io`.

## Managing videos with Google Sheets

1. Create a Google Sheet with columns:

   - `title`
   - `topic`
   - `category` (use exactly one of: GK, Maths and Science, Kids, Health and Medicines)
   - `platform`
   - `url`

2. Each row in the sheet is one video.

3. When you want to update the site:

   - In Google Sheets: **File → Download → Comma-separated values (.csv)**.
   - Save that file into the `tools` folder as `videos.csv`.

4. On your computer, from the project root, run:

   ```bash
   python tools/sheet_to_json_from_csv.py
   ```

   This will read `tools/videos.csv` and write `data/videos.json`.

5. Commit and push the updated `data/videos.json` to GitHub.
6. Refresh the site; the new videos will appear automatically under the correct category pages.

## Notes

- The site does not store or host the videos. It only embeds or links to them from the original platforms.
- YouTube links are converted to their `/embed/` form for inline playback.
- Facebook links are embedded using the Facebook video plugin URL.
- Instagram links are converted to their `/embed` form when possible.
- Some sites may block embedding in an iframe; in those cases, the "Open video in new tab" button will still work.
- Everything is static: no database, no server, and no ongoing hosting costs.

# Job Signal

A lightweight, static MVP that turns current public job listings into a fast market snapshot.

## What it does
- Fetches current jobs from the Arbeitnow Germany and UK public Job Board APIs.
- Searches across title, company, location, tags and description.
- Calculates matching listings, remote share, seniority, freshness, recurring skills, locations and hiring companies.
- Generates a one-click LinkedIn summary.
- Falls back to clearly labeled demo data if a public API cannot be reached from the browser.

## Run locally
Because browsers can be stricter with `file://` pages, serve the folder with any static server:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Deploy
This is a static site. You can deploy the folder directly to Vercel, Netlify, GitHub Pages or Cloudflare Pages.

## Data scope
The MVP does **not** claim to represent the entire job market. Metrics are computed only from the public listings successfully loaded into the page. The UI labels the number of listings scanned.

Data source: Arbeitnow public Job Board API.

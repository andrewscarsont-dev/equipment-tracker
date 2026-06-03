# Equipment Tracker

Web app for tracking jobsite rental equipment week-by-week. Single-page HTML with a tiny Netlify Functions backend for shared cloud storage.

Live at: [https://equipment-tracker-7641.netlify.app/](https://equipment-tracker-7641.netlify.app/) Hosted on Netlify, deployed via git push to GitHub.

## File layout

index.html              The whole frontend — HTML/CSS/JS in one file

netlify.toml            Netlify build config

package.json            Declares @netlify/blobs dependency for the function

netlify/functions/

  data.mjs              GET/POST /api/data — reads/writes shared data

## Data model

One shared blob stored in Netlify Blobs under store "equipment-tracker", key "equip\_report". Shape (v2 — multi-job):

{

  version: 2,

  currentJobId: "j\_xxx",            // active job

  jobs: {

    "j\_xxx": {

      id: "j\_xxx",

      meta: { project, reportNum, super, notes },   // project = the job's display name

      currentWeek: "2026-05-16",    // YYYY-MM-DD of active Saturday

      weeks: {

        "2026-05-09": { rows: \[...\] },

        "2026-05-16": { rows: \[...\] },

      }

    }

  },

  lastSavedAt: "ISO-string"         // set by the function on every write

}

Each job is fully self-contained — its own weeks, rows, and meta. Switching jobs (the Job dropdown in the UI) swaps which job is active; equipment never crosses between jobs.

Backward compatibility: the frontend auto-migrates the old single-project shape (top-level `currentWeek` / `meta` / `weeks`, no `jobs`) into one job on load via `migrateToDb()`, then re-uploads. Internally the JS keeps a `db` object (all jobs) and a `store` variable that points at the active job — so existing per-week code still reads `store.currentWeek` / `store.meta` / `store.weeks`.

Each row:

{

  id, desc, equip, company, start, release,

  days: \[bool,bool,bool,bool,bool,bool,bool\],  // Mon-Sun on-site

  startHrs, endHrs, cost

}

## How sync works

- Frontend debounces saves (1.5s after last edit) then POSTs the full db (all jobs)  
- Frontend auto-refreshes every 30s, but skips refresh if user is focused on any input or has a pending save — prevents typing collisions  
- Sync status pill in the header shows: Loading / Saving / Saved / Error  
- Cloud-only — no localStorage fallback, no offline mode

## Conventions

- Week-ending dates are always the Saturday of that week (YYYY-MM-DD)  
- Hours carry over: when you switch to an empty future week, the most recent prior week's End Hrs become the new Start Hrs (handled client-side in switchToWeek \-\> carryRows)  
- Week dropdown auto-shows the last 9 Saturdays plus any older archived weeks  
- No login, no auth — anyone with the URL can read/write

## Design

- Dark theme, IBM Plex fonts, amber accent (\#f0a500), green for "saved"/positive, red for "error"/warnings  
- Desktop: 15-column table at \>= 768px  
- Mobile: stacked cards with fields one per row, sticky bottom action bar  
- Print stylesheet outputs a clean PDF via window.print()

## When changing things

- Don't break the data shape — coworkers may have data in the live blob  
- Don't add a build step. This must stay as a single static HTML \+ one function  
- Always test locally with `netlify dev` before pushing if possible  
- `git push` auto-deploys to the live URL — small changes are safe, big refactors should be tested first  
- Keep the file standalone; no external deps beyond Google Fonts and @netlify/blobs in the function

## Workflow

\# make changes...

git add .

git commit \-m "what changed"

git push

\# Netlify auto-deploys in \~60 seconds  

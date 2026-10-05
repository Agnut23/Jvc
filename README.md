# Anijelia

React + Vite + Tailwind streaming-catalogue front end (anime & movies).

## Run
```
npm install
npm run dev      # development
npm run build    # production build -> dist/ (single HTML file)
```

## Configure
- `src/config/site.js` — site name and tagline.
- Report / Contact form: copy `.env.example` to `.env` and set `VITE_REPORT_ENDPOINT`
  to your own backend URL (receives JSON: name, email, subject, message),
  or set `contactEmail` in `site.js` to use the visitor's mail app.
  Do not put secret URLs or keys in the front-end code — they become public.

## Content
- `src/data/info.json` — titles, covers, ratings.
- `src/data/movies/movies.json` and `src/data/anime/<id>/season-N/episodes.json` — video IDs, subtitles, download links.
- Subtitle files go in `public/subs/` (`.vtt`).
- Use only images and videos you have the rights to.

## Hosting
Uses client-side routing: configure the host to serve `index.html` for all routes
(e.g. Netlify `/* /index.html 200`, Vercel rewrites, nginx `try_files`).

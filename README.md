# Arazel Dashboard

Responsive dark dashboard for GitHub Pages.

## Features
- 36 demo accounts
- 15 high ranks with Full Access
- 21 lower ranks with Locker Access
- Permission Logs
- Gang / Locker Logs
- Rank Up / Rank Down controls
- Colored rank/access badges
- Responsive PC + mobile layout
- No backend required for the demo
- Structured so a real TeamSpeak/API layer can be connected later

## GitHub Pages
Upload the contents of this folder to a GitHub repository, then enable:
Settings → Pages → Deploy from branch → main → / (root).

The site is static and works on phones through the GitHub Pages URL.

## TeamSpeak integration later
Replace the demo arrays/actions in `assets/app.js` with calls to your backend API. Do not put TeamSpeak credentials directly in browser JavaScript.

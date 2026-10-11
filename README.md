# Maintenance Tracker

A team-wise task tracker for a mechanical maintenance department.
Front-end is a static site (GitHub Pages). Data lives in **your Google Sheet**; drawings and photos are stored in **your Google Drive**.

## Features

- **Dashboard** – totals, overdue count, overall progress, progress per team, status chart, "needs attention" list, recent updates
- **Teams board** – each team with supervisor, lead, members, and its tasks with status and progress
- **All tasks table** – sortable, searchable, filter by team / status / overdue
- **Timeline** – bar chart of planned dates against today
- **Task panel** – description, drawing no., responsible people (tap member chips), days required, dates, status, progress, priority, remarks
- **Progress updates log** – post a dated update with note, new progress/status and photos; full history kept per task
- **Attachments** – upload drawings (PDF, DWG, DXF, Office files) or take a photo from the phone camera; images are shrunk before upload
- **Daily report** – one tap builds a WhatsApp-ready summary of every team
- **CSV export**, dark mode, mobile layout
- **Two PINs** – an Edit PIN for you and an optional View PIN (read-only) for supervisors or management

## Setup (about 10 minutes)

### 1. Create the Google Sheet and backend

1. Create a new Google Sheet (e.g. "Maintenance Tracker Data").
2. **Extensions → Apps Script**. Delete the sample code and paste the contents of `apps-script/Code.gs`.
3. (Optional) Project Settings → tick *Show "appsscript.json" manifest file* and replace its contents with `apps-script/appsscript.json` to set the Asia/Dhaka time zone.
4. Select the function **`setup`** in the toolbar and click **Run**. Approve the permissions (Sheets and Drive).
   - This creates the `Teams`, `Tasks` and `Updates` tabs and a Drive folder for attachments.
   - A popup in the sheet shows your generated **Edit PIN**.
5. **Project Settings → Script properties**: change `EDIT_PIN` to something you will remember, and optionally add `VIEW_PIN` for read-only users.
6. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Copy the **Web app URL** (ends in `/exec`).

> "Anyone" is required because the site cannot sign users in to Google. Access is protected by the PINs. Do not share the URL publicly.

### 2. Connect the front-end

Open `js/config.js` and paste the URL:

```js
API_URL: "https://script.google.com/macros/s/XXXXXXXX/exec",
```

### 3. Publish on GitHub

1. Create a repository and upload all files from this folder (keep the folder structure).
2. **Settings → Pages → Build and deployment → Deploy from a branch → `main` / root → Save**.
3. Open `https://<your-username>.github.io/<repo>/`, enter your name and PIN.

### 4. Load your existing task list

On first sign-in the app is empty. Click **Load starter data (Teams A–F)** to import the teams, members and tasks from your current task list. Progress percentages and statuses in that starter data are estimates; correct them in the app.

## Try it without a backend

With `API_URL` left empty the app runs in **demo mode**, saving data only in that browser. Open `index.html` in a browser (or use any static server) to preview.

## Notes

- **Updating the backend:** after editing `Code.gs`, use *Deploy → Manage deployments → Edit → New version*. The URL stays the same.
- **Attachments** are shared "anyone with the link can view" so thumbnails display. If your Google Workspace blocks link sharing, files still upload, but viewers need Drive access to open them.
- **Editing the sheet directly** is fine. Keep the header row and the `id` column unchanged. Dates are stored as `yyyy-mm-dd`.
- **Auto-refresh** runs every 60 seconds (`REFRESH_SECONDS` in `config.js`) and is paused while a panel is open.
- If two people save the same task at the same moment, the last save wins.
- Maximum attachment size is 12 MB per file.

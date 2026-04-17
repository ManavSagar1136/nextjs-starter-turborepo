# CMS Browser Extension

A Chrome extension that gives users access to their CMS workspace directly from the browser toolbar — authentication via OAuth popup, profile display, and workspace switching.

## Features

- **OAuth login** — opens the CMS web app login page and detects completion automatically
- **Profile view** — shows the signed-in user's name, email, and current workspace
- **Workspace switcher** — lists all workspaces the user belongs to and switches with one click
- **Persistent session** — a content script relays the JWT from the web app so users who are already logged in are authenticated in the extension immediately

---

## Prerequisites

| Requirement         | Version         |
| ------------------- | --------------- |
| Node.js             | 18+             |
| Yarn                | 1.22+           |
| Chrome              | 110+            |
| `apps/user` running | port 3101 (dev) |

---

## Setup

### 1. Install dependencies

Run from the **monorepo root**:

```bash
yarn install
```

Or from this directory:

```bash
cd apps/extension
yarn install
```

### 2. Configure environment

Copy the example env file and set your API URL:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# URL of the running user app (no trailing slash)
VITE_API_URL=http://localhost:3101

# Path the web app redirects to after login
VITE_DASHBOARD_ROUTE=/dashboard
```

### 3. Add extension icons

Chrome requires icon files to load the extension. Add PNG files at these exact paths:

```
public/
  icons/
    icon16.png    (16×16 px)
    icon32.png    (32×32 px)
    icon48.png    (48×48 px)
    icon128.png   (128×128 px)
```

Any square PNG works during development. Use your brand icon for production.

---

## Running in Development

### Step 1 — Build in watch mode

```bash
yarn dev
```

This runs `vite build --watch` and outputs the extension to `dist/`. It rebuilds automatically on every file save.

### Step 2 — Load in Chrome

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the `dist/` folder inside `apps/extension`

The CMS extension icon appears in your Chrome toolbar.

### Step 3 — Reload after changes

After each rebuild (watch mode triggers this automatically), click the **reload icon** on the extension card at `chrome://extensions`, or press the reload shortcut from the Extensions panel.

> **Tip:** Pin the extension to the toolbar for easier access during development.

---

## Building for Production

```bash
yarn build
```

Output is in `dist/`. To publish:

1. Update `public/manifest.json` — replace `https://YOUR_PRODUCTION_DOMAIN/*` in `host_permissions` with your actual domain
2. Zip the `dist/` folder
3. Upload to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)

---

## How Authentication Works

The extension uses a **JWT header** strategy (`x-extension-token`) rather than cookies, because the MV3 service worker cannot reliably read localhost or HttpOnly cookies via `chrome.cookies`. Instead, a content script relays the token using same-origin fetch.

```
User clicks "Sign in"
        │
        ▼
Background opens /login tab
        │
        ▼
User authenticates via Buildbase OAuth (web app handles everything)
        │
        ▼
Web app sets JWT as HttpOnly cookie on its domain
        │
        ▼
Content script (injected into the web app page) calls
/api/auth/extension-token via same-origin fetch
HttpOnly cookies are sent automatically
        │
        ▼
Server returns JWT value in response body
Content script relays it: chrome.runtime.sendMessage({ type: "CMS_JWT_RECEIVED" })
        │
        ▼
Background stores JWT in chrome.storage.session
Used as x-extension-token header on all API calls
        │
        ▼
Background broadcasts AUTH_DETECTED → Popup shows authenticated state
```

The server (`packages/helpers/src/auth/auth-middleware.ts`) accepts `x-extension-token` as a valid credential alongside the normal cookie path. CSRF protection is skipped for extension tokens because `chrome.storage` is inaccessible to web pages.

---

## Project Structure

```
apps/extension/
├── public/
│   ├── manifest.json        Chrome extension manifest (MV3)
│   └── icons/               PNG icons (add your own — see Setup)
├── src/
│   ├── background/
│   │   └── service-worker.ts  All API calls, auth tab detection, JWT management
│   ├── popup/
│   │   ├── App.tsx            State machine: loading → login / dashboard / workspace-select
│   │   ├── main.tsx           React entry point
│   │   ├── index.css          Tailwind CSS imports
│   │   ├── views/
│   │   │   ├── LoginView.tsx           Sign-in button + waiting state
│   │   │   ├── DashboardView.tsx       Profile, workspace card, open dashboard
│   │   │   └── WorkspaceSelectView.tsx Scrollable workspace list
│   │   ├── hooks/
│   │   │   ├── useAuth.ts      Session state, login, logout, AUTH_DETECTED listener
│   │   │   └── useWorkspaces.ts  Fetch and switch workspaces
│   │   └── components/
│   │       ├── Avatar.tsx      User avatar with initials fallback
│   │       └── LoadingState.tsx  Spinner with message
│   ├── types/
│   │   └── messages.ts        Typed message contracts between popup ↔ background
│   └── vite-env.d.ts          TypeScript types for import.meta.env
├── popup.html                 Extension popup HTML entry
├── vite.config.ts             Dual-entry build: popup + background service worker
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
└── .env.example
```

---

## Adding API Calls to the Extension

All requests to the user app must go through the **background service worker** (not directly from the popup) because only the service worker holds the JWT in `chrome.storage.session`.

### Pattern

1. Add a message type to `src/types/messages.ts`
2. Handle it in `src/background/service-worker.ts` using the `apiFetch` helper
3. Call `sendMessage({ type: 'YOUR_TYPE' })` from a popup hook

### Example — fetching data

```typescript
// src/types/messages.ts — add to ExtMessage and ExtResponse unions
| { type: "GET_API_KEYS" }
| { type: "API_KEYS_RESULT"; data: ApiKey[] }

// src/background/service-worker.ts — add a case in the message router
case "GET_API_KEYS": {
  const res = await apiFetch("/api/v1/api-keys");
  const data = await res.json();
  return { type: "API_KEYS_RESULT", data: data.apiKeys ?? [] };
}

// popup hook
const res = await sendMessage({ type: "GET_API_KEYS" });
if (res.type === "API_KEYS_RESULT") setKeys(res.data);
```

Any route protected by `withAuth` or `withPermissionCheck` will accept the `x-extension-token` header automatically.

---

---

## Making the Extension Production Ready

All placeholder values are listed below with the exact file and line to change.
Work through each section in order before submitting to the Chrome Web Store.

---

### 1. App name and description

Every place the generic name "CMS" appears must be replaced with your product name.

| File                                           | What to change                                                       |
| ---------------------------------------------- | -------------------------------------------------------------------- |
| `public/manifest.json` → `"name"`              | Extension name shown in Chrome toolbar tooltip and Web Store listing |
| `public/manifest.json` → `"description"`       | One-line description shown on the Web Store                          |
| `popup.html` → `<title>`                       | Browser tab title when popup is detached                             |
| `src/popup/views/LoginView.tsx` → `<h1>`       | Heading inside the login view                                        |
| `src/popup/views/LoginView.tsx` → button label | "Sign in with CMS" button text                                       |

**Example — `public/manifest.json`:**

```json
"name": "Acme Dashboard",
"description": "Access your Acme workspace from the browser toolbar."
```

**Example — `src/popup/views/LoginView.tsx`:**

```tsx
<h1 className="...">Acme</h1>
...
Sign in with Acme
```

---

### 2. Production domain

Two files hardcode the localhost URL and the `YOUR_PRODUCTION_DOMAIN` placeholder.
Replace both with your real app domain (no trailing slash).

**`public/manifest.json`** — `host_permissions` and `content_scripts.matches`:

```json
"host_permissions": [
  "https://app.yourdomain.com/*"
],
"content_scripts": [
  {
    "matches": ["https://app.yourdomain.com/*"],
    ...
  }
]
```

Remove the `http://localhost:3101/*` entry from production builds (or keep it only in a dev manifest).

**`.env`** (create from `.env.example`):

```env
VITE_API_URL=https://app.yourdomain.com
VITE_DASHBOARD_ROUTE=/dashboard
```

---

### 3. Extension icons

The current icons are solid indigo squares generated as placeholders.
Replace all four files with your actual brand icon before publishing.

```
public/icons/
  icon16.png    — 16×16 px   (favicon-size, toolbar)
  icon32.png    — 32×32 px   (Windows taskbar)
  icon48.png    — 48×48 px   (Extensions management page)
  icon128.png   — 128×128 px (Chrome Web Store listing)
```

Requirements:

- PNG format, square, transparent background recommended
- All four sizes must exist — Chrome will not load the extension without them
- Use the same art at all sizes (Chrome scales as needed, but providing all avoids blur)

---

### 4. Version number

`public/manifest.json` → `"version"` must follow Chrome's `major.minor.patch` format.
Keep this in sync with `package.json` → `"version"`.

```json
// public/manifest.json
"version": "1.0.0"

// package.json
"version": "1.0.0"
```

Increment the version every time you publish an update to the Web Store —
Chrome rejects uploads with a version number equal to or lower than the current live version.

---

### 5. Logo / brand icon in the popup

The login view uses a generic grid SVG as a logo placeholder.
Replace it with your own SVG or `<img>` tag pointing to a bundled asset.

**`src/popup/views/LoginView.tsx`** — the `{/* Logo placeholder */}` block (lines 18–33):

```tsx
{
  /* Replace the SVG below with your brand logo */
}
<div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg">
  <img src="/icons/icon48.png" alt="Logo" className="h-8 w-8" />
</div>;
```

Or swap the indigo background color to match your brand:

```tsx
<div className="... bg-[#YOUR_BRAND_HEX] ...">
```

---

### 6. Primary color

The popup uses `indigo-600` (#4F46E5) as its primary color throughout.
To change it globally, search for `indigo` across all popup files and replace:

```bash
# From apps/extension/
grep -r "indigo" src/popup/
```

Common classes to replace: `bg-indigo-600`, `text-indigo-600`, `hover:bg-indigo-700`,
`bg-indigo-100`, `text-indigo-700`, `border-indigo-600`, `ring-indigo-...`

---

### 7. Pre-publish checklist

Run through this before uploading to the Chrome Web Store:

- [ ] `"name"` in `manifest.json` is your product name (not "CMS")
- [ ] `"description"` in `manifest.json` is filled in
- [ ] `"version"` in `manifest.json` is set correctly
- [ ] `host_permissions` contains only your production domain (localhost removed)
- [ ] `content_scripts.matches` contains only your production domain
- [ ] `.env` has `VITE_API_URL` pointing to your production app URL
- [ ] All four icon PNGs are your real brand icons (not the indigo placeholders)
- [ ] Logo in `LoginView.tsx` is your brand (not the generic grid SVG)
- [ ] Run `yarn build` — build completes with no errors
- [ ] Load the built `dist/` as unpacked in Chrome and test the full login flow
- [ ] Test workspace switching with a real account that has multiple workspaces
- [ ] Zip the `dist/` folder and upload to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)

---

## Troubleshooting

**Extension doesn't appear after loading unpacked**

- Make sure `dist/` contains `manifest.json`, `popup.html`, and `background.js`
- Run `yarn build` (or `yarn dev`) first

**"Not authenticated" after logging in on the web app**

- Confirm `VITE_API_URL` in `.env` matches the running user app URL exactly (no trailing slash)
- Confirm `host_permissions` in `public/manifest.json` includes that URL
- Reload the extension at `chrome://extensions` after rebuilding

**Extension still shows "not logged in" after completing login**

- Make sure you navigated away from `/login` on the web app — the content script fires on the destination page, not on the login page itself
- Open the service worker DevTools (click "Service Worker" link at `chrome://extensions`) and check the console for `CMS_JWT_RECEIVED`

**Workspace list is empty**

- Ensure the user has been added to at least one workspace in the web app
- Check the service worker console for API errors

**TypeScript errors in VS Code**

- Run `yarn check-types` to see all errors
- Make sure `@types/chrome` is installed (`yarn install` from monorepo root)

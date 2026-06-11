# Deploying to Firebase Hosting → waglegroup.com (DNS on Cloudflare)

This site is a **static export** (`output: "export"` in `next.config.ts`). `next build`
writes plain HTML/CSS/JS to `out/`, which Firebase Hosting serves directly — no Cloud
Functions, no server, free tier is plenty.

---

## ✅ Already done

- **Firebase project created:** `waglegroup` (separate from your other projects).
- **Deployed and LIVE:** <https://waglegroup.web.app>
- `.firebaserc` already points the default project at `waglegroup`.

**To redeploy after any change:**

```bash
npm run deploy        # = next build && firebase deploy --only hosting
```

**What's left:** point your custom domain **waglegroup.com** at this site — sections 3–5
below (Firebase Console + Cloudflare DNS). Sections 0–2 are only needed on a fresh machine.

---

## 0. One-time tooling

```bash
npm install -g firebase-tools   # or: npx firebase-tools <cmd>
firebase login                  # opens a browser, log in with your Google account
```

## 1. Pick a Firebase project — you do NOT need a new one

A Firebase project holds **many products at once** — Firestore, Auth, Functions, **and**
Hosting all live in the same project. Adding Hosting to a project that already has
Firestore **does not touch your data**, and `firebase deploy --only hosting` only ever
writes to Hosting (never Firestore/Functions/other apps). So **reuse an existing project**.

1. Point this repo at it:

   ```bash
   firebase use --add        # pick your existing project, give it an alias (e.g. "prod")
   ```

   That writes the project ID into [`.firebaserc`](.firebaserc) for you. (Or edit it by hand:
   `{ "projects": { "default": "your-existing-project-id" } }`.)

### ⚠️ Which Hosting *site* will this deploy to?

A project can hold **multiple Hosting sites**, each with its own `*.web.app` URL and custom
domains. Check what already exists:

```bash
firebase hosting:sites:list
```

- **If the default site is unused** → nothing to do; the deploy in step 2 uses it.
- **If the default site already serves another app** → make a dedicated site so you never
  overwrite it, then pin this config to it:

  ```bash
  firebase hosting:sites:create waglegroup     # creates waglegroup.web.app
  ```

  Add **one line** to [`firebase.json`](firebase.json) inside `"hosting"`:

  ```json
  "hosting": {
    "site": "waglegroup",
    "public": "out",
    ...
  }
  ```

  Now `firebase deploy --only hosting` targets *only* the `waglegroup` site and can't
  clobber a sibling app.

## 2. Build + deploy

```bash
npm run deploy
```

That runs `next build` (→ `out/`) and `firebase deploy --only hosting`. When it finishes
you'll get a live URL like `https://your-project-id.web.app` — open it and confirm the
site looks right **before** touching DNS.

> First deploy only: if `firebase deploy` says hosting isn't initialized, run
> `firebase init hosting` once and choose **"Use an existing project"**, public dir
> **`out`**, configure as a **single-page app: No**, and **do not** overwrite
> `index.html` / `404.html`. The repo already ships a correct `firebase.json`, so you
> can also just keep it and deploy.

---

## 3. Connect waglegroup.com (Firebase side)

1. Firebase Console → **Hosting** → your site → **Add custom domain**.
2. Enter **`waglegroup.com`**. (Tick "Redirect `www` ..." if you also want www → apex,
   or add `www.waglegroup.com` as a second custom domain afterwards.)
3. Firebase will show you records to create. There are two stages:
   - **Verify ownership** — usually a `TXT` record on `@`.
   - **Go live** — usually **two `A` records** on `@` pointing at Firebase IPs
     (e.g. `199.36.158.100` and `199.36.158.101`, or a pair of `151.101.x.x`).
     Use the exact values Firebase gives you.

Leave this tab open — you'll come back after adding the records in Cloudflare.

---

## 4. Add the records in Cloudflare (DNS side)

Cloudflare Dashboard → select **waglegroup.com** → **DNS → Records**.

1. **Remove/replace** any existing `A`/`AAAA`/`CNAME` on `@` (and `www` if used) that
   currently point waglegroup.com somewhere else (old Pages site, parking, etc.).
2. **Add the TXT** verification record from Firebase (Name `@`, the value Firebase gave).
3. **Add the two A records** from Firebase:
   - Type `A`, Name `@`, IPv4 = first Firebase IP
   - Type `A`, Name `@`, IPv4 = second Firebase IP
4. **Set Proxy status to "DNS only" (grey cloud)** on these A records.

   > ⚠️ This is the #1 Cloudflare + Firebase gotcha. While the cloud is **orange
   > (proxied)**, Firebase can't complete its `Let's Encrypt` SSL challenge and the
   > domain gets stuck on "needs setup." Keep it **grey (DNS only)** until Firebase shows
   > the domain as **Connected** with a valid cert (can take 15 min–24 h).

5. For `www`: easiest is a `CNAME` Name `www` → `your-project-id.web.app` (DNS only),
   or let Firebase's www custom domain tell you what to add.

Back in the Firebase tab, click **Verify** / **Finish**. Firebase will provision the
certificate automatically.

---

## 5. (Optional) Re-enable Cloudflare's proxy/CDN

Once Firebase shows **Connected** and `https://waglegroup.com` loads with a valid cert:

1. You can flip the A records back to **Proxied (orange cloud)** to use Cloudflare's CDN,
   WAF, and analytics.
2. **Required if you proxy:** Cloudflare → **SSL/TLS → Overview → Full (strict)**.
   (`Flexible` causes infinite redirect loops with Firebase — don't use it.)
3. Keep **Always Use HTTPS** on; Firebase already redirects HTTP→HTTPS too.

If you hit any weirdness (stale content, redirect loop), set the cloud back to grey,
confirm it works, then re-proxy with Full (strict).

---

## 6. Redeploys

Any time you change the site:

```bash
npm run deploy
```

Cloudflare caches static assets aggressively; `_next/static/**` is content-hashed so it
updates automatically. If you ever need to force-refresh the HTML, purge the Cloudflare
cache for `waglegroup.com` (Caching → Purge Everything) after a deploy.

---

## Quick reference

| Thing | Value |
|-------|-------|
| Hosting | Firebase Hosting (static) |
| Build output | `out/` (from `next build`) |
| Deploy command | `npm run deploy` |
| Apex domain | `waglegroup.com` → 2× Firebase `A` records |
| Cloudflare proxy during setup | **DNS only (grey)** |
| Cloudflare SSL mode if proxied | **Full (strict)** |
| Firebase default URL | `https://<project-id>.web.app` |

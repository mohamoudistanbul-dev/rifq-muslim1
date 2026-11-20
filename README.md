# RIFQ Muslim (رِفْق مسلم)

**Your Faith, Your Daily Companion** — Made by Eng Mohamud Yusuf

A complete Islamic companion application: authentic Quran and Hadith content,
real GPS-based prayer times, Athan notifications, Qibla compass, worship
tracking, community and a secure admin dashboard — in a deep-emerald and gold
brand identity with English, Arabic (RTL) and Somali support.

---

## Stack

| Layer | Technology |
| --- | --- |
| Client | React 19 + TypeScript + Vite, custom emerald/gold design system |
| API | Express (Node 22 LTS), SQLite file store with atomic writes |
| Auth | Server-side sessions (HttpOnly cookies), scrypt password hashing, email verification, password reset |
| Content | AlQuran Cloud (Uthmani text + translations), hadith-api on jsDelivr, BigDataCloud/Nominatim reverse geocoding, Overpass (mosques/halal places), gold-api.com (metal prices) |
| Packaging | Web/PWA today; Capacitor Android wrapper — see [`docs/ANDROID_BUILD.md`](docs/ANDROID_BUILD.md) |

Nothing in the app fabricates scripture: Quran text, translations and hadith
always come from the upstream provider named in each API response, and the
client shows an explicit error state rather than inventing content.

---

## Run locally

```bash
npm install
npm run dev          # client on :5173, proxying /api to the API server
npm start            # API + built client on :3000 (production mode)
```

```bash
npm run typecheck    # tsc --noEmit
npm run build        # vite build -> dist/
```

The server serves `dist/` and the API on the same port, so a single container
runs the whole application.

---

## Environment variables

All optional locally; set them in Settings → Environment variables when
deploying. Names only — never commit values.

| Name | Purpose |
| --- | --- |
| `PORT` | Server port (default `3000`, supplied by the platform) |
| `DB_PATH` | SQLite file location (default `data/rifq.db`) |
| `ADMIN_EMAIL` | Owner/admin account (default `mohamoudistanbul@gmail.com`) |
| `SESSION_SECRET` | Session signing secret (generated and persisted if unset) |
| `PUBLIC_URL` | Absolute base URL used in verification/reset emails |
| `RESEND_API_KEY`, `MAIL_FROM` | Real email delivery for verification, reset and contact messages |
| `OPENAI_API_KEY`, `ASSISTANT_MODEL` | Enables model-backed answers in the AI assistant; without a key the assistant answers only from its curated, referenced knowledge base and says so |
| `VITE_API_BASE` | API base for packaged Android/iOS builds (default `/api`) |

Without `RESEND_API_KEY` the contact form reports honestly that email delivery
is not configured instead of claiming a message was sent, and the assistant
labels its answers as knowledge-base results.

---

## Feature map

| Area | Route | Notes |
| --- | --- | --- |
| Home | `/` | Greeting, Hijri + Gregorian date, GPS city, next prayer countdown, all five prayers + sunrise, daily ayah, hadith, reminder, worship progress |
| Quran | `/quran` | All 114 surahs, Uthmani text, translations, reciters, per-verse audio, bookmarks, search, font size, offline cache |
| Prayer | `/prayer` | Calculation method, Asr (Standard/Hanafi), high-latitude rule, mosque comparison, monthly table |
| Tasbih | `/tasbih` | Tap counter, haptics, presets, custom dhikr, targets, daily totals, saved progress |
| Qibla | `/qibla` | Real coordinates → Kaaba bearing, device orientation, accuracy and calibration guidance |
| Hadith | `/hadith` | Six collections, Arabic + English, numbers, grading, search, bookmarks, sharing |
| Duas | `/duas` | Morning/evening, sleep, home, mosque, food, travel, protection — Arabic, translation, reference |
| Calendar | `/calendar` | Hijri/Gregorian calendar, Islamic occasions, Ramadan suhoor/iftar, fasting tracker |
| Zakat | `/zakat` | Cash, gold, silver, business, savings, liabilities, nisab, live metal prices, full breakdown |
| Places | `/places` | Nearby mosques, halal restaurants and shops via OpenStreetMap, distance and directions |
| Kids | `/kids` | Arabic alphabet, short surahs, manners, prophets' stories, quizzes, parent controls |
| Hajj & Umrah | `/hajj` | Step-by-step rites, ihram, tawaf, sa'i, duas, checklists |
| Assistant | `/assistant` | Q&A in English/Arabic/Somali with references, clearly not a mufti |
| Tracker | `/tracker` | Prayers, Quran, dhikr, fasting, good deeds, goals, weekly/monthly progress |
| Quiz | `/quiz` | Quran, hadith, prophets, history, worship — three difficulty levels with explanations |
| Community | `/community` | Moderated posts, reporting, blocking, guidelines, privacy controls |
| Account | `/auth`, `/profile` | Sign up, login, email verification, password reset, profile editing, account deletion |
| Admin | `/admin` | Owner-only: users, content, notifications, contact messages, moderation, activity, settings, audit log |
| Invite / Contact / Settings / About / Privacy | `/invite`, `/contact`, `/settings`, `/about`, `/privacy` | Sharing + QR, real contact channels, language/theme/calculation settings, brand and privacy pages |

Navigation: bottom bar with Home, Quran, Prayer, Tasbih, More; every screen is
reachable, and Android hardware back navigation is handled by the router.

---

## Security

- Passwords are hashed with scrypt; sessions are HttpOnly cookies with
  rotation on login and secure logout.
- Admin is role-gated on the server for every administrative route; there is no
  public admin registration, and the owner account is seeded from
  `ADMIN_EMAIL`.
- User records are scoped to the authenticated user; community posts are
  moderated and support reporting/blocking.
- Secrets stay in the environment; no key or credential is shipped to the
  client bundle.

---

## Android

See [`docs/ANDROID_BUILD.md`](docs/ANDROID_BUILD.md) for the Capacitor project,
`com.rifqmuslim.app` identity, permissions, splash/icon, signing keystore and
`assembleRelease` / `bundleRelease` commands.

**Status:** this sandbox has no Android SDK, Gradle Android plugin or signing
keystore, so no APK/AAB was produced here. Source, configuration and
reproducible build instructions are complete; the Gradle build must run on a
machine with the Android toolchain.

---

## Deployment

`Dockerfile` builds the client and runs the Express server as a non-root user
on Node 22 Alpine (port 3000, bound to `0.0.0.0`). The SQLite database lives in
`data/`, which must persist across restarts.

---

## Native Android application

RIFQ Muslim also ships as a real standalone Android app (`com.rifqmuslim.app`),
built with the official Android Gradle Plugin — not a PWA, browser shortcut or
Chrome wrapper. The complete project is in [`android/`](android/): Kotlin shell
with no browser chrome, branded emerald/gold icon and splash screen, native
Athan notification channel with prayer alarms, Android back navigation, GPS and
notification permissions, and HTTPS-only networking. The app's existing
features, saved data, navigation and design are preserved.

```bash
cd android
./gradlew assembleDebug     # installable debug APK
./gradlew bundleRelease     # Play Store AAB (needs keystore.properties)
```

**Build status:** the source project is complete, but no APK or AAB has been
compiled yet — the authoring environment has no Android SDK or device. Full
prerequisites, signing steps, install commands and a post-install verification
checklist are in [`docs/ANDROID_BUILD.md`](docs/ANDROID_BUILD.md).

---

Made by **Eng Mohamud Yusuf** · Contact: mohamoudistanbul@gmail.com · +252-612215593

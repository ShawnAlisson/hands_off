# Hands Off — Demo Guide

A self-running AI company that finds UK businesses, diagnoses problems, sends outreach, closes deals, and ships fixes — with sponsor integrations at every step.

## Quick start

```bash
cp .env.example .env   # or use the pre-filled .env
npm install
npm run dev
```

Open **http://localhost:3000**. Check the header status dots: **Manus ● Supabase ● Wassist ● PayPal** should be green when configured.

1. Click **Reset** (fresh state)
2. Click **Start**
3. Watch the **Live activity** feed — one step every ~18s (28s when Manus is on)
4. When outreach arrives, open the **offer portal** link
5. Chat with James, pay via **PayPal Sandbox**, return to dashboard for build + ship

---

## Pipeline steps — what really happens

Each event in the feed shows a **sponsor badge** (who powers that step) and metadata chips.

| Step | Agent | Sponsor | What happens under the hood |
|------|-------|---------|----------------------------|
| **Start** | — | Cursor | Civilization loop starts. Five agents (Maya, James, Priya, Alex, Sam) are ready. |
| **Lead** | Maya | Cursor | Picks a random UK business from `uk-businesses.json`. Estimates deal value from problem difficulty. |
| **Problem** | Maya | Supabase | Records the gap (e.g. “no online booking”). State saved to Supabase Storage (`hands-off` bucket). |
| **Solution** | Alex | Manus AI | Rule-based solution text (booking widget, site rebuild, etc.). Persisted on the deal. |
| **Outreach** | James | Wassist + Manus | **Manus** writes the full outreach email (structured LLM). **Wassist** verifies API / sends WhatsApp if `WASSIST_DEMO_PHONE` is set. Pipeline **pauses** at `awaiting_owner`. |
| **Reply** | James | Manus AI | Owner chats on `/offer/[dealId]`. Each message → **Manus chat** (James persona) with deal context; fallback rules if Manus is off. |
| **Payment** | James | PayPal | Owner pays via **PayPal Sandbox** buttons. Server creates order → capture → `acceptOwnerOffer()` advances pipeline. |
| **Revenue** | — | PayPal + Supabase | Company budget + total revenue updated; ledger persisted. |
| **Build** | Sam | Manus AI | **Manus** generates fixed website copy (`siteContent`). Sam starts project with deliverables. Site preview flips to “Fixed · Manus AI”. |
| **Shipped** | Sam | Manus AI | Build summary event; live URL on `/site/[dealId]`. |
| **Won** | — | Hands Off | Deal archived; company looks for the next lead. |

### LLM usage (Manus)

| When | Function | Fallback if no `MANUS_API_KEY` |
|------|----------|--------------------------------|
| Outreach | `manusGenerateOutreach` | Template email in `civilization.ts` |
| Owner chat | `manusChat` via `replyAsSalesAgent` | Keyword-based replies |
| Site fix copy | `manusGenerateSiteFix` | Sector/problem-based template |
| Build deliverables | `manusGenerateDeliverables` | Solution text as strategy |

Look for **“Manus AI”** badges on the offer page and **“Fixed · Manus AI”** on the site preview after build.

---

## Offer portal walkthrough

URL: `/offer/[dealId]` (linked from the Outreach event)

**Left:** Before-fix website preview (missing feature highlighted).

**Right:**
- Outreach message (Manus badge if AI-written)
- Chat with James (Manus-powered replies)
- PayPal Sandbox checkout (£ deal value)

### PayPal Sandbox test

Use PayPal’s **sandbox buyer** account (not your business account):

1. Click the PayPal button on the offer page
2. Log in with a **Personal** sandbox buyer
3. Approve payment
4. Dashboard resumes: Payment → Revenue → Build → Shipped → Won

Sandbox credentials are in your PayPal Developer dashboard under **Sandbox → Accounts**. The hackathon app uses the **REST app Client ID + Secret** in `.env`.

### Without PayPal

If PayPal env vars are missing, the offer page shows **“Accept offer (demo — no PayPal)”** instead.

---

## Wassist (WhatsApp outreach)

With `WASSIST_API_KEY` and `WASSIST_DEMO_PHONE` set:

1. **Restart dev server** after changing `.env` (`npm run dev`)
2. **Deploy your agent** at [wassist.app](https://wassist.app) — agent must be connected to WhatsApp
3. **Test directly:**
   ```bash
   curl -X POST http://localhost:3000/api/wassist/test
   ```
   Or open `GET http://localhost:3000/api/wassist/test` to see agents + connection status.

### Why you might not receive a message

WhatsApp Business API rules:

| Situation | Fix |
|-----------|-----|
| **Cold outreach** (they never messaged you) | You need an **approved message template**. Set `WASSIST_TEMPLATE_NAME` in `.env` to your template name from WhatsApp Business Manager. |
| **24-hour window** | Easiest demo fix: **message your Wassist WhatsApp number first** from `+447751947291`, then Reset → Start and wait for Outreach. Free-form messages work inside the 24h window. |
| **Agent not deployed** | In wassist.app → Deploy agent to WhatsApp |
| **Duplicate API key in .env** | Only one `WASSIST_API_KEY` line — the last one wins |

The outreach event `wassist` meta chip now shows the **exact error** if sending failed (e.g. `401`, `template required`).

### What the code does now

1. Finds or creates a conversation (`POST /conversations/`)
2. Sends your outreach via `POST /conversations/{id}/messages/` (direct text)
3. Falls back to agent **trigger** (agent composes & sends)
4. Falls back to **template** if `WASSIST_TEMPLATE_NAME` is set

---

## Website preview

URL: `/site/[dealId]`

- **Before payment:** Broken site — dashed “missing feature” box
- **After build tick:** Manus-generated hero, CTA, feature block, testimonial
- Polls every 5s so you see the fix appear without refresh

---

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `MANUS_API_KEY` | Recommended | Real AI for outreach, chat, site copy |
| `NEXT_PUBLIC_SUPABASE_*` + `SUPABASE_SERVICE_ROLE_KEY` | Recommended | Cloud persistence |
| `WASSIST_API_KEY` | Optional | WhatsApp / Wassist demo |
| `WASSIST_AGENT_ID` | Optional | Specific agent UUID |
| `WASSIST_DEMO_PHONE` | Optional | Live WhatsApp recipient |
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` | Recommended | Server-side orders |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | Recommended | PayPal buttons in browser |
| `NEXT_PUBLIC_APP_URL` | Recommended | Links in outreach (use ngrok URL for remote demos) |

---

## Demo script (~5 minutes)

1. **Reset → Start** — “This is a company with no humans. Five AI specialists run the pipeline.”
2. **Lead / Problem / Solution** — Point at sponsor badges: Cursor dataset, Supabase persistence, Manus solution.
3. **Outreach** — Expand message. “James wrote this with Manus; Wassist can deliver it on WhatsApp.” Open offer portal.
4. **Chat** — Ask “How long will this take?” Show Manus reply.
5. **Pay** — PayPal Sandbox. “Real payment capture, sandbox money.”
6. **Dashboard** — Payment, revenue, build events. Open site preview — “Manus rewrote the site copy; Sam shipped it.”
7. **Won** — “Fully autonomous loop. Next lead starts automatically.”

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Stuck on “Loading civilization” | Check Supabase keys; app falls back to `.data/state.json` |
| Manus ○ in header | Set `MANUS_API_KEY`; chat/outreach use templates |
| PayPal ○ | Set all three PayPal vars; restart `npm run dev` |
| Wassist ○ | Create an agent at wassist.app; verify API key |
| Pipeline paused | Normal at Outreach — owner must accept on offer portal |
| Site not “fixed” after pay | Wait one more tick (~18–28s) for Build phase |
| PayPal button missing | `NEXT_PUBLIC_PAYPAL_CLIENT_ID` must be set (client-side) |

---

## Security note

API keys and PayPal secrets in chat should be rotated if exposed. Keep secrets in `.env` only (gitignored).

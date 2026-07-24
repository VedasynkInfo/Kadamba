# START HERE — New Chat Prompts (Token-Saving)

> Use **one packed chunk per new chat**. Do **not** paste the full ERP vision.  
> Cursor only needs: this starter + primary PRD + `active_chunk.md`.

---

## How to use (every chat)

1. Open a **new Agent chat** (fresh context).  
2. Copy the **Chat N** prompt below for the pack you are building.  
3. Attach / `@` only these files (max 3):
   - the primary PRD listed in that prompt  
   - `active_chunk.md`  
   - optionally `documents/prompts_status.md`  
4. When done: mark **Done** in `prompts_status.md`, rewrite `active_chunk.md` for next pack, start a **new** chat.

### Rules to keep tokens low

- Never paste all PRDs into one chat.  
- Never re-explain the whole Boutique ERP story.  
- Prefer packed chats (A–E features) over tiny one-feature chats when features share the same surfaces.  
- Prefer `@path` over pasting file contents.  
- Stop when acceptance criteria pass.

---

## Priority legend

| Priority | Meaning |
|----------|---------|
| **P0** | Core ops (mostly Done) |
| **P1** | Owner + customer engagement / sync (NOW) |
| **P2** | Reports depth |
| **P3** | Future roadmap |

---

## Build order (updated)

| Chat # | Priority | Pack | Primary PRD | Status |
|--------|----------|------|-------------|--------|
| 1–8 | P0 | Measurements → Portal | older modules | **Done** |
| 16 | P1 | Engagement · Owner + Portal + Website | `18_Engagement_Owner_Portal_Polish.md` | **Done** |
| **17** | **P1** | **Notifications depth (optional)** | `16_Notifications.md` | Optional |
| **18** | **P1** | **Settings full + SMTP templates** | `14_Settings.md` | **Done** |
| **19** | **P1** | **Website CMS / SEO leftover polish** | `11` + `12` | **← NEXT** |
| 20 | P2 | Reports & Analytics depth | `13_Reports_Analytics.md` | After Finance data |
| — | P3 | Future | `17_Future_Roadmap.md` | Later |

**Chat 19 CMS + SEO is Done. Prefer Chat 20 (Reports) next; optional Chat 17 Notifications depth.**

---

## What Chat 16 improves (quick map)

| Surface | Updates |
|---------|---------|
| **Admin / owner** | Live dashboard metrics; WhatsApp from leads/orders; email alerts; **WebSocket notify sync** (leads, measurements, payments, badges) |
| **User portal** | Dashboard engagement cards; **WebSocket notify sync** (order status, measurement approved, payment, chat badges) |
| **Website** | Settings-driven contact; stronger Request + WhatsApp CTAs; how-it-works strip |

---

## Copy-paste prompts

### Chat 16 — P1 Engagement pack ✅ Done

```text
(Completed — do not re-run unless fixing regressions)
```

### Chat 17 — P1 Notifications depth (optional follow-up)

```text
@documents/prd/16_Notifications.md @active_chunk.md @documents/prompts_status.md

Finish ONLY remaining Notification gaps after Module 18.
SMTP templates + test email. No WhatsApp Business API. No rebuild.
```

### Chat 18 — P1 Settings full

```text
@documents/prd/14_Settings.md @active_chunk.md @documents/prompts_status.md

Expand Settings ONLY per PRD (SEO defaults, social, SMTP secrets masked, theme caution).
Public site already partially synced in Chat 16 — complete remaining fields. No redesign.
```

### Chat 19 — P1 CMS + SEO leftover

```text
@documents/prd/11_Website_CMS.md @documents/prd/12_SEO_Management.md @active_chunk.md

ONLY remaining CMS Phase 2 + SEO automation gaps. Reuse admin/components. No rebuild.
```

### Chat 20 — P2 Reports

```text
@documents/prd/13_Reports_Analytics.md @active_chunk.md @documents/prompts_status.md

Implement ONLY Reports depth using Finance/Orders data. CSV export v1 OK.
```

---

## Older P0 prompts (archive — modules Done)

Chat 1–8 (Measurements → Portal) and related ops are **Done**. Do not re-run those prompts unless fixing regressions.

---

## Before switching packs (30-second checklist)

```text
1. Update documents/prompts_status.md → mark current pack Done
2. Rewrite active_chunk.md for the NEXT pack
3. Sync current_chunk.md + documents/current_chunk.md
4. Open a NEW chat and paste Chat N+1 only
```

## Ultra-short continue (same pack, context full)

```text
@active_chunk.md @documents/prd/18_Engagement_Owner_Portal_Polish.md @documents/prompts_status.md

Continue ONLY the active engagement pack (including A2 WebSocket notify sync for admin + portal). Do not expand scope. Finish remaining acceptance criteria, then stop.
```

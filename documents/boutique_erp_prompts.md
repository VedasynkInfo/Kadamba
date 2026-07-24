# Kadamba Boutique ERP — Complete Feature Prompts Pack

> **Use this file** as the single source of truth for *what to build*.  
> **Use** `documents/prd/*.md` for deep module specs.  
> **Use** `active_chunk.md` for the *current* implementation slice.  
> **New chat / token saving:** `documents/START_HERE.md` — priorities + copy-paste Chat 1…15 prompts (one module per chat).  
> **Brand:** Kadamba's Designer Studio · Kurnool · bridal & women's ethnic tailoring · maggam work · designer blouses.

---

## 0. What We Are Building (Understanding Lock)

### Confirmed product scope

Kadamba is evolving from a **marketing website + CMS** into a **complete boutique operations platform**:

| Layer | What it covers |
|-------|----------------|
| Website CMS | Gallery, Services, Portfolio, Blogs, Banners, SEO, Settings (existing + Phase 2 polish) |
| ERP Ops | Orders, Measurements, Staff, Products, Finance, Reports |
| CRM | Customers, enquiries, notes, communication history |
| Customer Portal | Post-confirmation account: dashboard, orders, measurements, chat, invoices |

### What this is *not*

- Not a rebuild of the existing site  
- Not an interior-design studio product  
- Not a generic e-commerce storefront (inventory may come later)  

### Core business identity (always)

Kadamba's Designer Studio in Kurnool is a **women's boutique and custom tailoring** shop specializing in:

- Custom **bridal & party wear** (heavy embroidery / maggam)  
- **Designer blouses** matched to sarees  
- Personalized fitting, trials, premium finishing for ethnic & festive outfits  
- Area context: near Kurnool Bazar / Prakash Nagar (beside Gulf Cafe), Kurnool, AP  

---

## 1. Module Checklist (All Features Requested)

### A. Measurement System (START HERE — separate admin page)

- [ ] Dedicated **Measurements** admin page (not buried inside orders only)  
- [ ] Select **product / garment type** (lehenga, blouse, etc.)  
- [ ] Auto-populate **full measurement form** for that garment  
- [ ] Complete ladies/girls product catalog for a Kurnool bridal boutique  
- [ ] Per-field: label, unit (in/cm), required/optional, min/max, help text  
- [ ] Admin can add custom product types + customize templates (no code change)  
- [ ] Multiple measurement **profiles per customer**  
- [ ] Reuse / update for future orders  
- [ ] Version history + notes + reference images  
- [ ] Customer can request updates (admin approval optional)  
- [ ] Printable measurement sheet for staff  

### B. Staff Management

- [ ] Personal details, contact, address, locality  
- [ ] Work experience, previous workplaces  
- [ ] Expertise / specializations (maggam, cutting, stitching, finishing, etc.)  
- [ ] Employment type, joining date, photo, ID proofs  
- [ ] Salary records (manual entry for Finance)  
- [ ] Workload / assigned orders (ready for future attendance)  
- [ ] Performance notes  

### C. Finance

- [ ] Successful / all orders finance views  
- [ ] Payments complete data  
- [ ] Revenue totals + monthly revenue  
- [ ] Revenue by product / service  
- [ ] Manual expenses  
- [ ] Manual staff salaries  
- [ ] Profit & Loss report (revenue − expenses − salaries)  
- [ ] Downloadable reports (future-ready)  

### D. Orders

- [ ] Full order lifecycle page(s)  
- [ ] Individual order detail page  
- [ ] Status workflow: enquiry → confirmed → measurements → production → trial → delivery  
- [ ] Link to customer, products, measurements, payments, staff  

### E. Customer / Enquiry (no login initially)

- [ ] Public enquiry without login  
- [ ] Collect email, mobile, basic details, product interest  
- [ ] Capture garment type / size context for clarity  
- [ ] On order received + confirmed: emails to customer  
- [ ] On confirm: issue **Reference ID** for portal login  
- [ ] Strict Reference ID verification → set password → customer dashboard  

### F. Customer Portal (after activation)

- [ ] Dashboard with complete order info  
- [ ] Current + previous orders  
- [ ] Set / request own measurements by product  
- [ ] Chat with boutique (requirements, measurement doubts)  
- [ ] Browse more products/services and request from account  
- [ ] Payments + invoices visible to user and admin  
- [ ] Notifications  

### G. Settings expansion + website sync

- [ ] Company name, logo, contact, address  
- [ ] SEO defaults, social links, image/banner sizes  
- [ ] Staff/roles section (or link)  
- [ ] Email SMTP / templates  
- [ ] Theme colors/fonts (careful — preserve brand)  
- [ ] **Public website must sync** contact/address/company info from settings  

### H. Website CMS Phase 2 (already partially in flight)

- [ ] Admin dashboard metrics & charts  
- [ ] SEO automation (slug, meta, OG, Twitter, image alt/title/caption)  
- [ ] Global image upload + crop/resize/compress component  
- [ ] Banner size guides  
- [ ] Gallery / Services / Portfolio / Blog UX upgrades  
- [ ] Tags chips, filters, skeletons, confirm dialogs  

### I. Roles & Notifications & Reports

- [ ] Admin / Staff / Customer roles & permissions  
- [ ] Email (+ SMS/WhatsApp-ready) notifications  
- [ ] Business reports & analytics  

---

## 2. Cursor Implementation Rules (every chat)

Copy this block into implementation chats:

```text
You are extending Kadamba's Designer Studio (existing React+Vite frontend, Express+Mongo backend).
DO NOT rebuild. DO NOT replace working features. Extend architecture.
Brand: women's boutique & tailoring in Kurnool — bridal, maggam, designer blouses.
Follow documents/prd/ for the active module. Follow active_chunk.md for scope.
Keep response envelope { success, message, data }, JWT auth, existing admin layout.
Reuse frontend/src/pages/admin/components/* where possible.
```

---

## 3. Per-Module Cursor Starter Prompts

### 3.1 Measurement System (ACTIVE)

```text
Implement Module 05 — Measurement System per documents/prd/05_Measurement_System.md
and active_chunk.md.

Deliver:
1) Admin page: Measurements list + create/edit
2) Product-type selector that auto-loads the correct measurement template
3) Seed complete ladies garment catalog + field definitions from the PRD
4) Backend models/APIs: templates, measurement profiles, versions
5) Printable sheet view
6) Wire to customer record (create customer stub if needed)

Do not build Staff/Finance/Portal in this chunk. Keep CMS pages intact.
```

### 3.2 Staff

```text
Implement Module 09 — Staff Management per documents/prd/09_Staff_Management.md.
Employee profiles with personal details, locality, experience, and boutique-specific
specializations (maggam, cutting, stitching, finishing, trials, etc.).
```

### 3.3 Finance

```text
Implement Module 08 — Finance per documents/prd/08_Finance.md.
Payments, monthly revenue, revenue by product/service, manual expenses,
staff salaries, and Profit & Loss. Depend on Orders existing.
```

### 3.4 Orders

```text
Implement Module 03 — Order Management per documents/prd/03_Order_Management.md.
Full lifecycle, individual order pages, links to measurements, payments, staff.
```

### 3.5 Customer Portal

```text
Implement Module 10 — Customer Portal per documents/prd/10_Customer_Portal.md.
Enquiry without login → confirm → Reference ID → password → dashboard,
orders, measurements, chat, invoices. Strict reference verification.
```

### 3.6 Settings Sync

```text
Expand Settings per documents/prd/14_Settings.md.
Public website contact/address/company fields must read from settings API.
```

---

## 4. Acceptance Gate (any module)

Before marking a module complete:

1. Matches PRD acceptance criteria  
2. Responsive admin UI (mobile/tablet/desktop)  
3. Accessible labels + keyboard focus  
4. Validated APIs + typed frontend services  
5. No regression on existing CMS / public site  
6. `prompts_status.md` updated  
7. `active_chunk.md` / `current_chunk.md` advanced to next module  

---

## 5. Related Files

- PRD index: `documents/prd/00_INDEX.md`  
- Status: `documents/prompts_status.md`  
- References: `documents/references.md`  
- QA prompts (lint/security style): `documents/complete_prompts.md`  

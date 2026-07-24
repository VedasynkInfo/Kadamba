# Module 02 — Admin Dashboard

## Purpose

Specify the **Admin Dashboard** as the daily operations home for Kadamba's Designer Studio staff and owners. It surfaces business health (leads, revenue, pending work, deliverables), trend charts, and one-click shortcuts into CMS and ERP create flows — without replacing the existing dashboard shell.

Many headline metrics **depend on Orders and Finance** modules. Until those ship, the dashboard must degrade gracefully (placeholders, leads-only metrics, or “coming online” empty states) rather than inventing fake numbers.

## Business Goal

Give boutique owners a single glance view of: how many enquiries are waiting, how revenue is trending, which garments are in production, and what content still needs publishing — so they can act without opening five different screens.

## Objectives

- Show actionable boutique metrics, not vanity-only analytics  
- Support monthly lead and revenue trends once data exists  
- Visualize order/project status mix for floor planning  
- Surface lead sources for marketing decisions  
- Keep visitor analytics **future-ready** (hook points only until analytics is wired)  
- Provide quick actions for common CMS creates (Service, Gallery, Portfolio, Blog, Banner, Testimonial)  
- Extend the existing `DashboardPage`; do not rebuild a new admin home  

## Features

### 1. Metric cards (primary row)

| Metric | Source module | Notes |
|--------|---------------|-------|
| New / open leads | Existing Leads | Count + link to leads list |
| Pending enquiries | Leads / Orders (enquiry status) | Needs attention badge |
| Active orders / projects | Orders | Confirmed → pre-delivery |
| Deliverables due (trials / delivery) | Orders | Next 7–14 days |
| Revenue (MTD / selected period) | Finance | INR; hide or stub until Finance exists |
| Outstanding balance | Finance + Orders | Advance vs balance due |

Each card: label, primary number, optional delta vs prior period, click-through to filtered list.

### 2. Charts

| Chart | Type | Dependency |
|-------|------|------------|
| Monthly leads | Line or bar | Leads (exists) |
| Monthly revenue | Line or bar | Finance / paid orders |
| Project / order status distribution | Donut or stacked bar | Orders |
| Lead sources | Horizontal bar / pie | Leads `source` field |
| Visitors / page views | Line | **Future-ready** — empty state + API stub |

Charts must respect date range (default: last 6 or 12 months). Use existing design tokens; avoid purple-default chart kits that clash with brand.

### 3. Operational lists (secondary)

- Recent leads / enquiries (5–10 rows)  
- Orders needing action (stuck status, overdue trial/delivery)  
- Optional: low-staff workload warning when Staff module exists  

### 4. Quick actions

Buttons / tiles that deep-link to create flows:

- Add Service  
- Add Gallery item  
- Add Portfolio project  
- Add Blog post  
- Add Banner  
- Add Testimonial (if testimonials CMS exists; otherwise link to settings/content stub)

Optional ERP quick actions (when modules live): New Order, New Customer, New Measurement.

### 5. Graceful degradation

When Orders/Finance are not yet deployed:

- Show leads + CMS quick actions fully  
- Revenue / order charts show EmptyState: “Connects when Orders & Finance go live”  
- Do not crash on missing endpoints; feature-flag or soft-fail API calls  

## Workflow

1. Admin logs in → lands on `/admin` (or existing dashboard route)  
2. Dashboard fetches metrics for selected date range  
3. Admin clicks a metric → filtered list (leads/orders/finance)  
4. Admin uses quick action → create form for that CMS entity  
5. After Orders/Finance ship, same widgets light up with real data — no redesign required  

## UI Requirements

- Extend `frontend/src/pages/admin/DashboardPage.tsx` and related API services  
- Reuse `MetricCard`, `Skeleton`, `EmptyState`, `QuickActions` from admin components  
- Layout: metrics row → charts grid → recent lists + quick actions  
- Responsive: cards stack on mobile; charts scroll or simplify  
- Loading: skeleton cards/charts; errors: inline retry  
- Brand microcopy: boutique language (“orders”, “trials”, “deliveries”) not “projects” alone — “projects” OK as synonym for active garment jobs if labeled clearly  

## Forms / Fields

Dashboard itself has light controls:

| Field | Type | Notes |
|-------|------|-------|
| Date range | Preset or from–to | Default last 30 days or MTD |
| Refresh | Action | Manual refresh optional if polling not used |

No heavy forms on this page.

## Tables / Columns

### Recent leads (example)

| Column | Notes |
|--------|-------|
| Name | Customer / lead name |
| Contact | Phone or email |
| Interest | Service / product interest |
| Source | Lead source |
| Status | New / contacted / converted |
| Created | Relative or date |

### Orders needing action (when Orders exist)

| Column | Notes |
|--------|-------|
| Reference / Order # | Link to order detail |
| Customer | Name |
| Status | Current lifecycle status |
| Due | Trial or delivery date |
| Assigned | Staff short name |

## Filters / Search / Actions

**Filters:** date range only on dashboard (deep lists have their own filters).

**Search:** none on dashboard; search lives on module list pages.

**Actions:**

- Click metric → navigate  
- Quick action → navigate to create  
- Retry failed widget  
- Optional “View all reports” → Module 13  

## Validations

- Date range: end ≥ start; max range sane (e.g. 24 months)  
- Metrics must not show NaN/undefined — coerce to 0 or “—”  
- Role-aware: Staff may see limited metrics per Module 15 (e.g. no P&L)  
- Never expose customer PII beyond what the role allows  

## Data Model (high level)

Prefer aggregated API responses rather than loading full collections client-side:

```
DashboardSummary {
  range: { from, to }
  metrics: { leadsOpen, enquiriesPending, ordersActive, deliverablesDue, revenueMtd, outstandingBalance }
  series: { leadsByMonth[], revenueByMonth[], ordersByStatus[], leadsBySource[] }
  recentLeads[]
  actionOrders[]
  visitors?: future stub
}
```

Reuse existing Lead model; add Order/Payment aggregations when those collections exist.

## API Requirements

Suggested endpoint (extend existing dashboard controller if present):

- `GET /api/admin/dashboard/summary?from=&to=`  
  - Auth: admin (and staff with scoped fields)  
  - Returns `DashboardSummary` in `{ success, message, data }`  

Partial responses allowed while modules roll out (`revenueMtd: null`, `ordersByStatus: []`).

Charts should not require a separate analytics SaaS in v1; visitor series may return `{ enabled: false }`.

## Relationships

| Module | Relationship |
|--------|--------------|
| Leads (existing) | Primary early metric source |
| 03 Orders | Active orders, status chart, due deliverables |
| 08 Finance | Revenue & outstanding balance |
| 04 Customers | Conversion context |
| 09 Staff | Optional workload widgets later |
| 11 CMS | Quick actions targets |
| 13 Reports | Deeper analytics |
| 15 Roles | Metric visibility |

## Acceptance Criteria

- [ ] Existing dashboard still loads; no blank screen when Orders/Finance APIs missing  
- [ ] Leads metric and recent leads work against current backend  
- [ ] Quick actions navigate to correct admin create routes  
- [ ] Skeletons / empty states for dependent charts  
- [ ] Date range updates metrics without full page reload  
- [ ] Staff role can be restricted from financial numbers  
- [ ] Copy reflects boutique operations (orders, trials, deliveries)  

## Future Enhancements

- Real visitor analytics (privacy-friendly)  
- Customizable widget layout per user  
- WhatsApp enquiry funnel chart  
- Trial calendar week view on dashboard  
- Alerts for overdue maggam / embroidery stages  

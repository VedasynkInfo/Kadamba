# Module 13 — Reports & Analytics

## Purpose

Specify **business reports and analytics** for Kadamba's Designer Studio owners: revenue, orders, product/service mix, staff output, customer acquisition, and outstanding balances. Most reports **depend on Orders and Finance** (and benefit from Customers, Products, Staff). Until those modules exist, ship the report shell with empty states rather than fake data.

## Business Goal

Replace ad-hoc Excel tracking with trustworthy boutique reports so the owner can see which garments make money, which stages bottleneck, and whether advances cover work-in-progress — supporting decisions for bridal season and maggam capacity.

## Objectives

- Provide a Reports hub under admin with clear categories  
- Cover orders, revenue, product/service performance, staff workload, and customer metrics  
- Support date-range filtering and export-ready tables (CSV download can be phase 1.5)  
- Respect role permissions (Staff may see limited operational reports, not full P&L)  
- Align definitions with Finance (revenue recognized rules) and Orders (status)  
- Keep visitor web analytics future-ready (link to Dashboard stub)  

## Features

### 1. Reports hub

Route suggestion: `/admin/reports`

Categories:

| Report | Depends on |
|--------|------------|
| Orders by status / period | Orders |
| Deliveries & trials calendar summary | Orders |
| Revenue MTD / monthly trend | Finance |
| Revenue by product type | Finance + Products |
| Revenue by service | Finance + Services |
| Outstanding balances / advances | Finance + Orders |
| Expenses & salaries summary | Finance |
| Profit & Loss | Finance |
| Lead sources & conversion | Leads + Customers/Orders |
| Staff workload / completions | Staff + Orders |
| Customer repeat rate | Customers + Orders |

### 2. Interactive controls

- Date range presets: MTD, last 30/90 days, custom  
- Group by: day / week / month where applicable  
- Optional filters: product category, staff, locality  

### 3. Visuals + tables

- Each report: chart (where helpful) + downloadable table  
- Reuse chart approach from Dashboard for consistency  

### 4. Definitions (lock early)

- **Revenue:** sum of recorded customer payments in range (or invoiced — choose one; default **payments received**)  
- **Outstanding:** quoted/total agreed − paid on open orders  
- **Conversion:** leads → confirmed orders in range  

Document the chosen definition in UI helper text.

### 5. Export

- CSV export for tabular reports (priority after on-screen tables)  
- PDF later (Roadmap)  

## Workflow

1. Admin opens Reports  
2. Selects report type + date range + filters  
3. Views chart/table  
4. Optionally exports CSV  
5. Drills into an order/customer via row link  

## UI Requirements

- New admin nav item “Reports” (role-gated)  
- Card grid of report types → report detail view  
- Skeleton loading; EmptyState when dependencies missing (“Available after Orders & Finance”)  
- Mobile: tables horizontally scroll  

## Forms / Fields

Report parameter form:

| Field | Required | Notes |
|-------|----------|-------|
| Report type | Yes | From catalog |
| From / To | Yes | |
| Group by | No | |
| Product category | No | |
| Staff | No | |
| Locality | No | |

## Tables / Columns

Example — Revenue by product type:

| Column | Notes |
|--------|-------|
| Product code | |
| Product name | |
| Orders count | |
| Gross payments | INR |
| Outstanding | INR |
| % of total | |

Example — Orders by status:

| Status | Count | % |
|--------|-------|---|
| … | … | … |

## Filters / Search / Actions

**Filters:** as parameter form above.

**Search:** within result table (client or server).

**Actions:** run report, reset filters, export CSV, open linked record.

## Validations

- Date range required; max span (e.g. 36 months)  
- Staff users blocked from P&L / salary detail per Module 15  
- No division-by-zero in % columns  

## Data Model (high level)

Prefer aggregation endpoints; no separate Report collection required in v1.

Optional saved report configs later:

```
SavedReport {
  userId, type, params, name, createdAt
}
```

## API Requirements

- `GET /api/admin/reports/orders-by-status?from&to`  
- `GET /api/admin/reports/revenue-by-product?from&to`  
- `GET /api/admin/reports/revenue-by-service?from&to`  
- `GET /api/admin/reports/outstanding?asOf=`  
- `GET /api/admin/reports/pnl?from&to`  
- `GET /api/admin/reports/leads-conversion?from&to`  
- `GET /api/admin/reports/staff-workload?from&to`  
- `GET /api/admin/reports/export/:type` — CSV  

All auth-protected; envelope standard.

## Relationships

| Module | Relationship |
|--------|--------------|
| 03 Orders | Core operational data |
| 08 Finance | Revenue, expenses, P&L |
| 06 Products / 07 Services | Dimensions |
| 09 Staff | Workload |
| 04 Customers / Leads | Conversion |
| 02 Dashboard | Lightweight subset of same metrics |
| 15 Roles | Access control |

## Acceptance Criteria

- [ ] Reports hub renders with clear dependency empty states before Orders/Finance  
- [ ] After Orders/Finance: at least orders-by-status, revenue trend, revenue-by-product, outstanding, P&L  
- [ ] Date range filtering works  
- [ ] Row links navigate to order/customer where applicable  
- [ ] Staff cannot access restricted financial reports  
- [ ] Definitions shown in UI match Finance module  

## Future Enhancements

- Scheduled email reports  
- PDF export  
- Bridal season comparison YoY  
- Maggam stage cycle-time analytics  
- Visitor analytics integration  

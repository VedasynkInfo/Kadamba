# Kadamba Boutique ERP — PRD Index

> **Brand:** Kadamba's Designer Studio · Kurnool · women's boutique & custom tailoring (bridal, maggam work, designer blouses).  
> **Principle:** Extend the existing website + admin CMS. Do **not** rebuild. Preserve auth, APIs, DB patterns, and design system.

## Vision Summary

This is **not only a boutique marketing website**. The product is a **Boutique ERP + CRM + Order Management + Tailoring Management + Customer Portal**, purpose-built for Kadamba's Designer Studio.

Comparable systems: Tailor Management ERP · Bridal Boutique ERP · Zoho-style boutique ops · Order tracking portal.

## Document Map

| # | File | Module | Priority | Status |
|---|------|--------|----------|--------|
| 01 | [01_Project_Overview.md](./01_Project_Overview.md) | System vision & architecture rules | P0 | Ready |
| 02 | [02_Admin_Dashboard.md](./02_Admin_Dashboard.md) | Business overview widgets & charts | P1 | Ready |
| 03 | [03_Order_Management.md](./03_Order_Management.md) | Full order lifecycle | P0 | Ready |
| 04 | [04_Customer_Management.md](./04_Customer_Management.md) | Customer CRM | P0 | Ready |
| 05 | [05_Measurement_System.md](./05_Measurement_System.md) | Dynamic garment measurements | **P0 — START HERE** | **Active** |
| 06 | [06_Product_Catalog.md](./06_Product_Catalog.md) | Boutique product types | P0 | Ready |
| 07 | [07_Service_Management.md](./07_Service_Management.md) | Boutique services (CMS + ops) | P1 | Ready |
| 08 | [08_Finance.md](./08_Finance.md) | Revenue, expenses, salaries, P&L | P0 | Ready |
| 09 | [09_Staff_Management.md](./09_Staff_Management.md) | Employees, skills, workload | P0 | Ready |
| 10 | [10_Customer_Portal.md](./10_Customer_Portal.md) | Customer account after confirmation | P0 | Ready |
| 11 | [11_Website_CMS.md](./11_Website_CMS.md) | Existing CMS Phase 2 enhancements | P1 | Ready |
| 12 | [12_SEO_Management.md](./12_SEO_Management.md) | SEO automation | P1 | Ready |
| 13 | [13_Reports_Analytics.md](./13_Reports_Analytics.md) | Business reports | P2 | Ready |
| 14 | [14_Settings.md](./14_Settings.md) | Expanded settings + public site sync | P1 | Ready |
| 15 | [15_User_Roles.md](./15_User_Roles.md) | Admin / staff / customer roles | P0 | Ready |
| 16 | [16_Notifications.md](./16_Notifications.md) | Email / SMS / WhatsApp-ready | P1 | Ready |
| 17 | [17_Future_Roadmap.md](./17_Future_Roadmap.md) | Inventory, GST, attendance, etc. | P3 | Ready |
| 18 | [18_Engagement_Owner_Portal_Polish.md](./18_Engagement_Owner_Portal_Polish.md) | Packed owner + portal + website engagement | **P1 — NEXT CHAT** | **Active** |

## Implementation Order (current)

1. ~~P0 core (Measurements → Portal + Finance invoices)~~ ✅  
2. **Module 18 Engagement pack** ← **active chunk / Chat 16**  
3. Notifications depth → Settings full → CMS/SEO leftover → Reports  
4. P3 Future (17)  

### Legacy early order (historical)

1. Measurement System  
2. Product Catalog (ties templates to products)  
3. Staff Management  
4. Customer Management  
5. Order Management  
6. Finance  
7. Customer Portal + User Roles  
8. Notifications  
9. Admin Dashboard (metrics depend on orders/finance)  
10. Website CMS / SEO / Settings polish  
11. Reports  
12. Future roadmap items  

## Sync Files (must stay aligned)

| File | Role |
|------|------|
| `documents/START_HERE.md` | **Priorities + copy-paste new-chat prompts (token saving)** |
| `documents/boutique_erp_prompts.md` | Master feature + Cursor prompt pack |
| `documents/prompts_status.md` | Per-module completion status |
| `documents/references.md` | Architecture + brand + module links |
| `documents/current_chunk.md` | Documents-folder current chunk |
| `active_chunk.md` (repo root) | Active implementation brief for Cursor |
| `current_chunk.md` (repo root) | Short status mirror |
| `chunk_summary.md` (repo root) | Roadmap overview including ERP phases |

## Standard PRD Section Template

Every module PRD follows:

1. Purpose  
2. Business Goal  
3. Objectives  
4. Features  
5. Workflow  
6. UI Requirements  
7. Forms / Fields  
8. Tables / Columns  
9. Filters / Search / Actions  
10. Validations  
11. Data Model (high level)  
12. API Requirements  
13. Relationships  
14. Acceptance Criteria  
15. Future Enhancements  

## Non-Negotiable Rules for Cursor

- Do **not** rebuild the app or replace working CMS pages wholesale.  
- Extend existing folders: `backend/src/{models,services,controllers,routes}`, `frontend/src/pages/admin/*`.  
- Keep JWT auth, MongoDB/Mongoose, Cloudinary, response envelope `{ success, message, data }`.  
- Brand copy: women's boutique & tailoring in Kurnool — never interior design.  
- Prefer reusable admin components already under `frontend/src/pages/admin/components/`.  

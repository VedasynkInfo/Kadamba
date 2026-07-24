# Module 17 — Future Roadmap

## Purpose

Capture **deferred capabilities** for Kadamba Boutique ERP that are valuable but explicitly **out of scope** for the current implementation sequence. This keeps Cursor and stakeholders from derailing active modules (Measurements → Orders → Finance → Portal) while preserving a coherent long-term vision.

## Business Goal

Give the boutique a clear growth path — inventory, GST-compliant invoicing, attendance, deeper WhatsApp, Telugu UI — without pretending these are required for the first operational release.

## Objectives

- List future modules with rough priority and dependencies  
- Clarify what must remain stable in v1 so future work can extend cleanly  
- Avoid building half-finished inventory/GST now  
- Align with brand expansion possibilities (still boutique/tailoring, not interiors)  

## Features (future backlog)

### 1. Inventory & SKUs (P3)

- Fabric rolls, ready-made pieces, accessories  
- Stock in/out against orders  
- Low-stock alerts  
- Supplier records  
- Depends on: Products, Orders, Finance  

### 2. GST invoicing & compliance (P3)

- GSTIN, HSN/SAC codes  
- Tax invoices / credit notes  
- GSTR-oriented export  
- Depends on: Finance, Orders, Settings  

### 3. Attendance & payroll automation (P3)

- Daily attendance, shifts  
- Overtime  
- Auto salary calculations from attendance  
- Depends on: Staff, Finance  

### 4. WhatsApp deep integration (P2–P3)

- WhatsApp Business API  
- Enquiry capture from WhatsApp  
- Template messages for confirm / trial / delivery  
- Chat sync into portal thread  
- Depends on: Notifications provider interface, Customers, Orders  

### 5. Telugu UI / localization (P3)

- Admin + portal i18n  
- Telugu templates for SMS/email  
- Depends on: stable English UI strings first  

### 6. Multi-branch / multi-outlet (P3)

- If Kadamba expands beyond single Kurnool location  
- Branch-scoped inventory, staff, reports  
- Depends on: Settings, Roles, almost all ERP modules  

### 7. Advanced measurement tools (P3)

- Customer self-measure guided video  
- QR codes on printed sheets linking to order  
- Digitize old measurement books via OCR (experimental)  

### 8. Marketing & CRM automation (P3)

- Campaigns for festival seasons  
- Anniversary/bridal follow-ups  
- Abandoned enquiry nudges  

### 9. E-commerce lite (P3)

- Catalog of ready-made / boutique pieces online  
- Cart + payment gateway  
- Still secondary to custom tailoring core  

### 10. Analytics depth (P2–P3)

- Privacy-friendly visitor analytics  
- Bridal season YoY  
- Stage cycle-time (especially maggam)  

## Workflow

Not an implementation workflow. Use this document when prioritizing after Reports are live:

1. Validate v1 ERP adoption with real boutique staff  
2. Pick next pain: usually WhatsApp or GST depending on owner need  
3. Write a dedicated PRD (18+) before coding  
4. Extend — never rewrite — provider interfaces and models from v1  

## UI Requirements

- No dedicated Future UI in production admin beyond optional “Coming soon” notes on Dashboard/Reports empty states  
- Do not clutter nav with disabled modules  

## Forms / Fields

N/A for roadmap items until promoted to their own PRD.

## Tables / Columns

Priority snapshot:

| Item | Priority | Depends on |
|------|----------|------------|
| WhatsApp deep integration | P2–P3 | Notifications, Orders |
| Visitor analytics | P2 | Dashboard stub |
| Inventory | P3 | Products, Orders |
| GST invoicing | P3 | Finance |
| Attendance | P3 | Staff, Finance |
| Telugu UI | P3 | Stable v1 strings |
| Multi-branch | P3 | Broad |
| E-commerce lite | P3 | Products, Payments |

## Filters / Search / Actions

N/A.

## Validations

Process validations:

- Do not implement roadmap items inside Measurement/Order chunks unless explicitly reprioritized in `active_chunk.md`  
- Any early spike must remain behind feature flags and not break CMS  

## Data Model (high level)

Design guidance for v1 to stay forward-compatible:

- Prefer `provider` interfaces for messaging and payments  
- Keep `productType` separate from future `sku` / `stockItem`  
- Store money fields with explicit tax-exclusive placeholders later  
- User/roles matrix should allow new permissions without schema rewrite  

## API Requirements

- Version additive APIs  
- Avoid hard-deleting fields needed for GST/inventory later  
- Notification provider stubs already required in Module 16  

## Relationships

| Current module | Future extension |
|----------------|------------------|
| 06 Products | Inventory SKUs |
| 08 Finance | GST invoices, automated payroll |
| 09 Staff | Attendance |
| 16 Notifications | WhatsApp API |
| 11/14 CMS/Settings | i18n, multi-branch |
| 02/13 Analytics | Visitor + season reports |

## Acceptance Criteria

- [ ] Roadmap documented and referenced from Project Overview  
- [ ] Implementation order in `00_INDEX.md` excludes these until promoted  
- [ ] v1 modules note “out of scope” where they touch inventory/GST/attendance  
- [ ] Notification & payment seams left extensible  

## Future Enhancements

This entire document *is* the future enhancements list. When an item is selected, split it into its own PRD (`18_Inventory.md`, `19_GST_Invoicing.md`, etc.) following the standard template and update `00_INDEX.md` + `prompts_status.md`.

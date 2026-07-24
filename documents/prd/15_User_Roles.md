# Module 15 — User Roles & Permissions

## Purpose

Define authentication roles and a **permissions matrix** for Kadamba Boutique ERP: **Admin**, **Staff** (limited), and **Customer** (portal). Clarify that public **enquiry does not require login**, while the customer portal activates only after **Reference ID verification** and password setup.

Extend the existing JWT auth model; do not introduce a parallel auth stack.

## Business Goal

Protect financial and customer data while letting floor staff update orders/measurements efficiently, and giving confirmed customers a safe portal — without forcing login barriers on first-time enquiries.

## Objectives

- Formalize three primary roles: `admin`, `staff`, `customer`  
- Provide a clear permissions matrix for CMS vs ERP modules  
- Support staff accounts linked to Staff profiles (Module 09)  
- Support customer accounts linked to Customer records (Module 04) via Reference ID flow (Module 10)  
- Keep public marketing + enquiry routes open  
- Enforce authorization on API routes, not only UI hiding  

## Features

### 1. Roles

| Role | Who | Access style |
|------|-----|--------------|
| Admin | Owner / manager | Full CMS + ERP + settings + roles |
| Staff | Employees | Limited ops: orders, measurements, customers (configurable); no settings SMTP/secrets; limited finance |
| Customer | Confirmed clients | Portal only; own data |

Optional future: `manager` subclass — defer to Roadmap unless easily folded into admin flags.

### 2. Enquiry without login

- Public contact / request-service / lead forms remain anonymous  
- Creates Lead (and optionally Customer stub) without User account  
- No password at this stage  

### 3. Portal activation (high level; detail in Module 10)

1. Order confirmed → Reference ID issued  
2. Customer receives email with Reference ID  
3. Portal “Activate” : enter Reference ID + phone/email match → set password  
4. Strict verification: Reference ID must exist, match customer, not already bound to another user (policy), order in confirmed+ state  
5. JWT issued with role `customer`  

### 4. Staff invites

- Admin creates staff user (email/phone + temp password or invite link)  
- Link to Staff employee record  
- Assign permission preset (default Staff)  

### 5. Permissions matrix (v1)

Legend: Full / Limited / Own / None / Link-only

| Area | Admin | Staff | Customer |
|------|-------|-------|----------|
| CMS (blog/gallery/portfolio/services/banners) | Full | Limited (edit content if granted; default read or edit per config) | None |
| Dashboard metrics | Full | Limited (hide P&L/salaries) | None |
| Customers | Full | Full ops (no hard delete) | Own profile |
| Orders | Full | Update status/notes/assign; no destructive cancel unless granted | Own orders read |
| Measurements | Full | Full ops | Own read + request update |
| Products | Full | Read | Read active (portal) |
| Services CMS | Full | Limited | Read public |
| Finance | Full | Limited (record payment if granted; no P&L) | Own invoices |
| Staff mgmt | Full | Own profile read | None |
| Reports | Full | Operational only | None |
| Settings | Full | None | None |
| Roles / users | Full | None | None |
| Notifications admin | Full | None | Own in-app |
| Portal chat | Monitor all | Reply if granted | Own threads |

Default Staff preset: customers + orders + measurements + read products; CMS read; finance payments optional flag; no settings.

### 6. UI route guards

- Admin layout routes check role  
- Portal layout separate  
- Hide nav items user cannot access  

## Workflow

### Staff login

1. Admin creates user → staff logs into `/admin/login`  
2. JWT includes `role: staff` + permissions claims or server-side lookup  
3. APIs reject forbidden actions with 403  

### Customer activation

1. No account during enquiry  
2. After confirm + Reference ID → activate on portal  
3. Customer uses portal login thereafter  

## UI Requirements

- Admin: Users & Roles page (or Settings link) listing admin/staff users  
- Permission checkboxes for staff presets  
- Portal: activate + login screens (Module 10 owns UX detail)  
- Never show admin nav to customers  

## Forms / Fields

### Create staff user

| Field | Required |
|-------|----------|
| Name | Yes |
| Email | Yes |
| Phone | No |
| Password / invite | Yes |
| Linked staffId | Recommended |
| Permission preset | Yes |

### Activate customer

| Field | Required |
|-------|----------|
| Reference ID | Yes |
| Phone or email | Yes (must match) |
| Password | Yes (strength rules) |
| Confirm password | Yes |

## Tables / Columns

Users admin table:

| Column | Notes |
|--------|-------|
| Name | |
| Email | |
| Role | |
| Linked staff/customer | |
| Status | active/disabled |
| Last login | |
| Actions | Edit, disable |

## Filters / Search / Actions

**Filters:** role, status.

**Search:** name, email.

**Actions:** create, edit permissions, reset password, disable, unlink.

## Validations

- Unique email for users  
- Strong password policy for portal and staff  
- Reference ID verification strict (constant-time compare where applicable; rate limit attempts)  
- Disabled users cannot login  
- Customer cannot access `/api/admin/*`  
- Staff cannot PATCH settings or roles  

## Data Model (high level)

```
User {
  _id
  email
  phone?
  passwordHash
  role            // admin | staff | customer
  permissions[]   // optional fine-grained overrides
  staffProfileId?
  customerId?
  status          // active | disabled
  lastLoginAt?
  createdAt, updatedAt
}

ReferenceBinding {
  referenceId
  orderId
  customerId
  usedByUserId?
  usedAt?
}
```

May live on Order + User instead of separate collection.

## API Requirements

- Extend existing auth routes: login, me, logout  
- `POST /api/auth/portal/activate` — Reference ID flow  
- `POST /api/auth/portal/login`  
- `GET/PATCH /api/admin/users` — admin only  
- Middleware: `requireAuth`, `requireRole('admin')`, `requirePermission('finance:read')`  
- Rate limit activate + login  

## Relationships

| Module | Relationship |
|--------|--------------|
| Existing admin auth | Base to extend |
| 09 Staff | staffProfileId link |
| 04 Customers / 10 Portal | customer users |
| 03 Orders | Reference ID |
| 16 Notifications | Credential emails |
| All admin APIs | Enforcement |

## Acceptance Criteria

- [ ] Three roles enforced on API and UI  
- [ ] Enquiry works without login  
- [ ] Portal activation requires valid Reference ID + identity match  
- [ ] Staff cannot access Settings secrets or role admin  
- [ ] Customer JWT cannot call admin endpoints  
- [ ] Permissions matrix implemented at least at module granularity  
- [ ] Existing admin login continues to work for current admin users  

## Future Enhancements

- Manager role  
- Per-field finance permissions  
- 2FA for admin  
- SSO later  
- Audit log of permission changes  

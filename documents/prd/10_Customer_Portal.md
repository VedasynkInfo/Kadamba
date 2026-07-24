# Module 10 — Customer Portal

## Purpose

The Customer Portal gives Kadamba clients a secure account **after order confirmation** to track orders, manage measurements (with admin oversight), view invoices/payments, chat with the boutique, and request new work — without needing admin access.

Public enquiry requires **no login**. Portal access starts only after confirmation + Reference ID verification.

## Business Goal

Improve trust and communication for bridal and custom orders: customers always know status, can clarify measurements, and reduce repetitive phone calls for the boutique.

## Objectives

- Enquiry without login  
- Collect useful order/communication details  
- Email on received + confirmed  
- Issue strict **Reference ID** on confirm  
- Verify Reference ID → set password → dashboard  
- Orders, measurements, chat, payments, invoices  
- Request more products/services from account  

## Public Enquiry Flow (No Login)

Entry points: Request Service page, product/service CTAs, portal “Enquire” for guests.

### Required fields

| Field | Required | Why |
|-------|----------|-----|
| fullName | yes | Identity |
| email | yes | Notifications + portal |
| mobile | yes | Primary boutique contact (WhatsApp-ready) |
| city / locality | yes | Kurnool / outstation planning |
| productInterest | yes | Lehenga, blouse, gown, etc. |
| garmentType / size context | yes | Clarity for admin (link product catalog codes) |
| occasionDate | no | Wedding / function date |
| budgetRange | no | Qualification |
| fabricStatus | no | customer has fabric / needs sourcing |
| message / requirements | yes | Free text |
| reference images | no | Upload |

On submit → create **Lead/Enquiry** + soft **Customer** stub → email admin + acknowledgement email to customer.

## Confirmation & Reference ID

When admin marks enquiry/order **confirmed**:

1. Create/update Order  
2. Generate Reference ID: `KDS-YYYY-####` (unique, strict)  
3. Email customer: confirmation + Reference ID + activation link  
4. Email admin copy  

### Activation

1. Customer opens `/portal/activate`  
2. Enters Reference ID + registered email or mobile  
3. System verifies match (strict)  
4. Set password (min rules)  
5. Login → `/portal/dashboard`  

Failed verification: generic error (no user enumeration), rate limit attempts.

## Customer Dashboard

Show:

- Welcome + Reference ID  
- Active orders summary  
- Next trial / delivery dates if set  
- Pending measurement actions  
- Unread chat count  
- Quick actions: View orders, Measurements, Chat, New request  

## Portal Modules

### Orders

- Current + previous orders  
- Status timeline (aligned with Order Management statuses)  
- Items / garment types  
- Assigned trial notes (customer-safe fields only)  

### Measurements

- View approved profiles  
- Submit new / update request by product type (dynamic form from Measurement templates)  
- Status: pending_approval → admin approves  

### Chat

- Thread per order (or per customer)  
- Text messages + image attachments  
- Admin replies from admin chat UI  
- Notifications on new message  

### Payments & Invoices

- List payments  
- Outstanding balance  
- Invoice view (simple PDF/HTML) — same data admin sees (customer-safe)  

### Browse & Request

- View published products/services  
- “Request this” creates linked enquiry under logged-in customer  

## Workflow Summary

```text
Guest enquiry → Admin review → Confirm order
  → Email + Reference ID → Customer activates
  → Portal dashboard → track / measure / chat / pay visibility
```

## UI Requirements

- Separate portal layout (not admin chrome)  
- Brand: Kadamba luxury tokens, mobile-first  
- Telugu-friendly future (English v1)  
- Clear status badges  
- Accessible forms  

Routes (suggested):

- `/portal/login`  
- `/portal/activate`  
- `/portal/dashboard`  
- `/portal/orders` `/portal/orders/:id`  
- `/portal/measurements`  
- `/portal/chat`  
- `/portal/payments`  
- `/portal/requests`  

## Validations

- Reference ID format + active order/customer match  
- Password strength  
- Chat rate limits  
- Measurement submit uses template required fields  

## Data Model

```text
CustomerAccount { customerId, email, mobile, passwordHash, referenceId, activatedAt, status }
PortalMessage { customerId, orderId?, senderRole, body, attachments[], createdAt, readAt }
Invoice (optional v1): derive from Order + Payments
```

Reference ID stored on Order and/or CustomerAccount.

## API Requirements

Public:

- `POST /api/enquiries` (existing leads pattern — extend fields)  

Portal (customer JWT):

- `POST /api/portal/activate/verify`  
- `POST /api/portal/activate/set-password`  
- `POST /api/portal/login`  
- `GET /api/portal/dashboard`  
- `GET /api/portal/orders`  
- `GET/POST /api/portal/measurements`  
- `GET/POST /api/portal/chat`  
- `GET /api/portal/payments`  

Admin:

- Approve measurement requests  
- Chat reply endpoints  
- Confirm order → triggers Reference ID + emails  

## Relationships

- Enquiry/Lead → Customer → Orders  
- Order → Reference ID → CustomerAccount  
- Measurements Module 05 templates reused  
- Finance payments visible read-only  
- Notifications Module 16 sends mail  

## Acceptance Criteria

- [ ] Enquiry works without login with garment type fields  
- [ ] Confirm sends email with Reference ID  
- [ ] Invalid Reference ID cannot activate  
- [ ] After password set, dashboard shows orders  
- [ ] Customer can submit measurement request  
- [ ] Chat works both sides  
- [ ] Payments/invoices visible  
- [ ] Admin CMS unchanged  

## Future Enhancements

- WhatsApp OTP login  
- Online advance payment gateway  
- Push notifications  
- Reorder one-click  

## Cursor Prompt

```text
Implement documents/prd/10_Customer_Portal.md with Module 15 roles.
Enquiry without login; confirmation Reference ID KDS-YYYY-####;
strict activate → password → dashboard; orders, measurements, chat, payments.
Reuse measurement templates from Module 05.
```

# Module 16 — Notifications

## Purpose

Specify multi-channel notifications for Kadamba Boutique ERP: **email** for enquiry received and order confirmed (including **Reference ID**), **SMS/WhatsApp-ready** architecture for later providers, and **in-app** notifications for customer portal chat and status updates.

Build on Settings SMTP/templates (Module 14). Do not block v1 on WhatsApp Business API approval — design provider interfaces now.

## Business Goal

Assure customers that their bridal/enquiry request was received and, when confirmed, give them a clear Reference ID path into the portal — while letting staff see communication status on the order/customer timeline.

## Objectives

- Send reliable emails for key lifecycle events  
- Include Reference ID and activation instructions on order confirmation  
- Log notification attempts (success/fail) against orders/customers  
- Abstract SMS/WhatsApp behind a provider interface (stub OK)  
- Support in-app portal notifications for chat messages and status changes  
- Allow admin to resend confirmation email  

## Features

### 1. Email events (v1 must-have)

| Event | Trigger | Audience | Key content |
|-------|---------|----------|-------------|
| Enquiry received | Lead/enquiry created | Customer email if provided; optional admin BCC | Thank you, boutique name, expected follow-up |
| Order confirmed | Status → `confirmed` | Customer | Reference ID, what happens next, activate portal CTA/link |
| Optional: status update | Selected status changes | Customer | New status, trial/delivery hints |
| Optional: portal chat | New staff message | Customer in-app + email digest optional | Snippet + link |

Admin notification: email or in-admin badge when new enquiry arrives (reuse leads dashboard if present).

### 2. Template variables

Common variables: `customerName`, `referenceId`, `orderTitle`, `status`, `boutiqueName`, `phone`, `address`, `portalActivateUrl`, `year`.

Templates editable in Settings.

### 3. SMS / WhatsApp ready

```
NotificationProvider {
  sendEmail(payload)
  sendSms?(payload)      // stub
  sendWhatsApp?(payload) // stub
}
```

- Config flags: `smsEnabled`, `whatsappEnabled` default false  
- Same event bus calls providers when enabled  
- Do not hardcode a single vendor in domain logic  

### 4. In-app (portal)

- Notification collection per user  
- Unread count in portal header  
- Types: `chat`, `status`, `system`  
- Mark read / mark all read  

### 5. Delivery log

- Store last email status on order (sentAt, error)  
- Admin “Resend confirmation” action  

## Workflow

1. Visitor submits enquiry with email → `enquiry_received` email queued/sent  
2. Admin confirms order → generate Reference ID → `order_confirmed` email with ID + activate link  
3. Customer activates portal (Module 10/15)  
4. Staff replies in chat → in-app notification (+ optional email)  
5. If WhatsApp enabled later → same events fan out  

## UI Requirements

- Minimal admin UI: resend buttons on order detail; delivery status badge  
- Settings templates editor (Module 14)  
- Portal bell icon + list (Module 10 shell)  
- No separate heavy “notification marketing suite” in v1  

## Forms / Fields

Template editor:

| Field | Required |
|-------|----------|
| Key | Yes (system) |
| Subject | Yes |
| Body HTML/text | Yes |
| Enabled | Yes |

Resend action: confirm dialog.

## Tables / Columns

Notification log (admin optional page):

| Column | Notes |
|--------|-------|
| At | |
| Channel | email/sms/whatsapp/in-app |
| Event | |
| Recipient | |
| Status | queued/sent/failed |
| Error | |
| Entity | order/lead/customer link |

## Filters / Search / Actions

**Filters:** channel, status, date, event.

**Actions:** resend, view template, mark in-app read (portal).

## Validations

- Do not send order_confirmed without Reference ID  
- Skip customer email silently (log) if address missing; warn admin  
- Rate-limit resend  
- Sanitize template HTML  
- Portal in-app only for authenticated customer’s own userId  

## Data Model (high level)

```
NotificationLog {
  _id
  channel
  eventKey
  recipient
  userId?
  customerId?
  orderId?
  leadId?
  status
  providerResponse?
  createdAt
}

InAppNotification {
  _id
  userId
  type
  title
  body
  link?
  readAt?
  createdAt
}
```

## API Requirements

- Internal service: `notificationService.send(eventKey, context)`  
- Called from lead create + order status handlers  
- `POST /api/admin/orders/:id/resend-confirmation`  
- `GET /api/portal/notifications`  
- `POST /api/portal/notifications/:id/read`  
- `POST /api/portal/notifications/read-all`  
- Admin test: via Settings test-email  

## Relationships

| Module | Relationship |
|--------|--------------|
| 14 Settings | SMTP + templates |
| 03 Orders | Confirm trigger + Reference ID |
| Leads | Enquiry trigger |
| 10 Portal | In-app + activate URL |
| 15 Roles | Who can resend |
| 04 Customers | Recipient identity |

## Acceptance Criteria

- [ ] Enquiry with email sends enquiry_received (when SMTP configured)  
- [ ] Order confirm sends email containing Reference ID  
- [ ] Failed sends logged; admin can resend  
- [ ] SMS/WhatsApp interfaces exist but can be disabled stubs  
- [ ] Portal user receives in-app notification for chat (when chat ships)  
- [ ] No secrets in logs  
- [ ] Missing SMTP yields clear admin warning, not app crash  

## Future Enhancements

- WhatsApp template messages for status + trial reminders  
- SMS OTP for portal activate  
- Digest emails  
- Staff push notifications  
- Multilingual templates (Telugu)  

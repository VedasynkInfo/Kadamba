# Module 08 — Finance

## Purpose

The Finance module gives Kadamba's Designer Studio a clear view of money in and out: order payments, revenue by period and by product/service, manual expenses, staff salaries, and a Profit & Loss report.

## Business Goal

Replace scattered notebooks/spreadsheets with one admin finance area tied to real orders and staff, so the owner can see monthly performance and profitability.

## Objectives

- Track all payments against orders  
- Show total / monthly / yearly revenue  
- Break down revenue by product type and service  
- Allow manual expense entry  
- Allow manual salary payments  
- Generate Profit & Loss (Revenue − Expenses − Salaries)  
- Keep GST / advanced accounting as future  

## Features

### Orders Finance View

- List successful / paid / partially paid / unpaid orders  
- Individual order payment panel (advances, balance, mode)  
- Payment history timeline per order  

### Payments

| Field | Notes |
|-------|-------|
| orderId | required |
| amount | required |
| paidAt | required |
| method | cash / upi / bank / card / other |
| reference | UPI ref / receipt no |
| notes | optional |
| recordedBy | admin/staff |

### Revenue Dashboards

- Total revenue (all time)  
- Revenue this month  
- Revenue this year  
- Monthly revenue chart (12 months)  
- Revenue by product type  
- Revenue by service  
- Pending balance (sum of unpaid order balances)  

### Expenses (manual)

| Field | Notes |
|-------|-------|
| title | required |
| category | fabric / embroidery materials / rent / utilities / marketing / misc |
| amount | required |
| spentAt | required |
| notes | optional |
| attachmentUrl | optional bill photo |

### Staff Salaries (manual)

| Field | Notes |
|-------|-------|
| staffId | required |
| period (month/year) | required |
| amount | required |
| paidAt | required |
| notes | optional |

### Profit & Loss Page

```text
Net Profit/Loss = Total Revenue (selected period)
                − Total Expenses (period)
                − Total Salaries (period)
```

- Date range filter (month / quarter / custom)  
- Breakdown tables  
- Export CSV/PDF (v1 CSV acceptable)  

## Workflow

1. Order confirmed → advances recorded as Payments  
2. Delivery → final payment recorded  
3. Owner adds monthly rent/utilities as Expenses  
4. Owner records staff salaries  
5. Open P&L for the month → review  

## UI Requirements

Routes (suggested):

- `/admin/finance` — overview cards  
- `/admin/finance/payments`  
- `/admin/finance/expenses`  
- `/admin/finance/salaries`  
- `/admin/finance/profit-loss`  
- Order detail embeds payment widget  

Design: clean metric cards, simple charts, accessible tables. Reuse admin MetricCard / DataTable patterns when present.

## Tables

### Payments list

Order ref, Customer, Amount, Method, Date, Actions  

### Expenses list

Title, Category, Amount, Date, Actions  

### Salaries list

Staff, Period, Amount, Paid date, Actions  

## Validations

- Payment amount > 0  
- Payment cannot exceed remaining balance without confirm override  
- Expense/salary amounts > 0  
- Period required for salary  

## Data Model

```text
Payment { orderId, amount, method, paidAt, reference, notes, recordedBy }
Expense { title, category, amount, spentAt, notes, attachmentUrl, createdBy }
SalaryPayment { staffId, year, month, amount, paidAt, notes, createdBy }
```

Revenue is **derived** from Payments (and/or order totals — pick one source of truth: prefer sum of Payments for cash reality, show Order value separately).

## API Requirements

| Method | Path |
|--------|------|
| GET/POST | `/api/finance/payments` |
| GET/POST | `/api/finance/expenses` |
| GET/PUT/DELETE | `/api/finance/expenses/:id` |
| GET/POST | `/api/finance/salaries` |
| GET | `/api/finance/summary?from=&to=` |
| GET | `/api/finance/revenue-by-product?from=&to=` |
| GET | `/api/finance/profit-loss?from=&to=` |

Admin only.

## Relationships

- Payment → Order → Customer  
- SalaryPayment → Staff  
- Dashboard widgets consume `/finance/summary`  
- Reports module reuses same endpoints  

## Acceptance Criteria

- [ ] Record multiple payments per order  
- [ ] Monthly revenue visible  
- [ ] Revenue by product/service visible  
- [ ] Manual expenses + salaries CRUD  
- [ ] P&L correct for selected range  
- [ ] No break to existing leads/CMS  

## Future Enhancements

- GST invoices  
- Bank reconciliation  
- Vendor bills  
- Auto salary from attendance  

## Cursor Prompt

```text
Implement documents/prd/08_Finance.md after Orders + Staff exist.
Payments, expenses, salaries, summary, and Profit & Loss pages.
```

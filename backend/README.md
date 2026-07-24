# Kadamba Boutique ERP — Module 05 Measurement System

This module adds the **Measurement Management System** to Kadamba's Designer Studio boutique ERP.

## Overview

The Measurement Management System digitizes handwritten measurement books: every customer's measurements are stored securely, versioned, reusable across orders, editable with audit history, and printable for cutting/stitching staff.

## Features

- Admin Measurements module (list, create, edit, print)
- Product-type catalog (ladies/girls boutique)  
- Dynamic forms from templates
- Measurement profiles linked to customer
- Version history + notes + reference images
- Seed data for all garment templates

## APIs

All endpoints return `{ success, message, data }` envelope.

### Templates (`/api/measurement-templates`)
- `GET` - List templates with pagination/filter
- `GET /:code` - Get single template
- `POST` - Create template (admin)
- `PUT /:code` - Update template (admin)
- `PATCH /:code/archive` - Archive/activate template (admin)

### Profiles (`/api/measurements`)
- `GET` - List profiles with pagination/filter
- `GET /:id` - Get profile + history
- `POST` - Create profile (admin)
- `PUT /:id` - Update profile (admin)
- `PATCH /:id/archive` - Archive/activate profile (admin)
- `POST /:id/duplicate` - Clone profile (admin)

## Frontend

Admin page: `/admin/measurements`

- List of measurement profiles with filters and search
- Create / edit / duplicate / archive measurements
- Product selector auto-loads template fields
- Reference image upload per profile
- Version history view per profile
- Print preview (A4 sheet)

## Brand

**Kadamba's Designer Studio** · Kurnool · women's boutique & custom tailoring (bridal, maggam work, designer blouses).

## Tech Stack

- Backend: Node.js + Express + MongoDB + Mongoose
- Frontend: React + Vite
- Authentication: JWT (admin required)
- Patterns: existing models/services/controllers/routes, reusable admin components

## Seed Data

Run `POST /api/measurement-templates/seed` and `POST /api/measurements/seed` to populate:
- 13 product templates (BR-LH, BL-MG, BL-SR, KT-ST, etc.)
- 5 measurement profiles (sample data)

## Testing

All existing tests pass. New tests for measurement endpoints can be added under `backend/src/__tests__/`.

## Next Chunks

After Measurement System:
1. Product Catalog hardening (ties templates to products)
2. Staff Management
3. Customer Management
4. Order Management
5. Finance
6. Customer Portal + User Roles
7. Notifications
8. Admin Dashboard metrics
9. Website CMS / SEO / Settings polish
10. Reports
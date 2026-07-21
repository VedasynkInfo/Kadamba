# Active Chunk: Phase 13 — Backend APIs

## Brand
**Kadamba's Designer Studio** · Kurnool · women's traditional & bridal wear boutique & tailoring.

## Objective
Production REST APIs with validation, pagination, search/filter; wire admin off localStorage.

## Endpoint map (`/api`)

### Auth
| Method | Path | Access |
|--------|------|--------|
| POST | `/auth/register` | public (rate-limited) |
| POST | `/auth/login` | public (rate-limited) |
| GET | `/auth/me` | JWT |
| POST | `/auth/refresh` | JWT |
| PATCH | `/auth/profile` | JWT (name + optional password) |

### Gallery / Services / Portfolio / Blogs
| Method | Path | Access |
|--------|------|--------|
| GET | `/gallery` | public (published) / admin (all) |
| GET | `/gallery/:idOrSlug` | public (published) / admin |
| POST | `/gallery` | admin |
| PUT | `/gallery/:id` | admin |
| DELETE | `/gallery/:id` | admin |

Same pattern for `/services`, `/portfolio`, `/blogs`.

Query: `page`, `limit`, `q`, `category`, `published`, `featured`, `sort`.

### Leads
| Method | Path | Access |
|--------|------|--------|
| POST | `/leads` | public (request-service, rate-limited) |
| GET | `/leads` | admin |
| GET | `/leads/export` | admin (CSV) |
| GET | `/leads/:id` | admin |
| PATCH | `/leads/:id` | admin (status/assignee) |
| POST | `/leads/:id/notes` | admin |

### Upload / Settings
| Method | Path | Access |
|--------|------|--------|
| POST | `/upload` | admin (image/video) |
| GET | `/settings` | public |
| PUT | `/settings` | admin |

## Response shape
```json
{ "success": true, "message": "...", "data": { "items": [], "pagination": { "page", "limit", "total", "pages" } } }
```
IDs: Mongo `_id` → `id`. Dates as ISO strings.

## Patterns
`models/` → `services/` → `controllers/` → `routes/` + `express-validator` + `ApiError`.

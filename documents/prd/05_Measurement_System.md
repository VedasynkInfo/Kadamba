# Module 05 — Measurement Management System

## Purpose

The Measurement Management System is the central repository for customer body measurements at **Kadamba's Designer Studio** (Kurnool). The boutique specializes in bridal wear, designer blouses, heavy maggam work, and customized women's ethnic tailoring. Accurate, reusable measurements are critical to garment quality.

This module digitizes handwritten measurement books: every customer's measurements are stored securely, versioned, reusable across orders, editable with audit history, and printable for cutting/stitching staff.

## Business Goal

Eliminate measurement errors, speed up repeat orders, standardize forms per garment type, and enable future customer self-service — without requiring code changes when the boutique adds new product styles.

## Objectives

- Reduce measurement mistakes and remakes  
- Improve stitching accuracy for bridal & maggam work  
- Save time for repeat customers  
- Auto-load correct fields when a product is selected  
- Support multiple profiles per customer  
- Preserve history / versions  
- Print sheets for floor staff  
- Allow admin-defined templates (no deploys)  
- Integrate later with Orders + Customer Portal  

## Scope for First Implementation Chunk

**In scope**

- Admin Measurements module (list, create, edit, print)  
- Product-type catalog (ladies/girls boutique)  
- Dynamic forms from templates  
- Measurement profiles linked to customer  
- Version history + notes + reference images  
- Seed data for all garment templates  

**Out of scope (later modules)**

- Full Order workflow UI (Orders module)  
- Customer portal self-edit UI (Portal module)  
- Staff attendance  

---

## Features

### 1. Dedicated Measurements Admin Page

Route suggestion: `/admin/measurements`

- List of measurement profiles  
- Filters by customer, product type, date, status  
- Search by customer name / phone / reference  
- Create new profile  
- Edit existing  
- Duplicate profile  
- Print / export sheet  
- Soft delete (archive)  

### 2. Product Selection → Auto Form

Admin flow:

1. Select or create customer  
2. Select **Product Category** (Bridal, Ethnic Blouse, Kurti, etc.)  
3. Select **Product / Garment Type** (e.g. Bridal Lehenga)  
4. System **auto-populates** all required measurement fields for that garment  
5. Staff fills values + optional notes + photos  
6. Save as profile (optionally attach to an order later)  

### 3. Template Engine

- Each garment type has a `MeasurementTemplate`  
- Template contains ordered fields with validation  
- Admin can clone / edit templates  
- Admin can create new garment types  
- Inactive templates hidden from new profiles but preserve old data  

### 4. Customer Profiles

- Multiple profiles per customer (e.g. "Bridal lehenga 2026", "Daily blouse")  
- Mark one as **primary** per garment family  
- Reuse on new orders  
- Compare versions  

### 5. History & Versioning

On every update:

- Snapshot previous values  
- Timestamp  
- Actor (admin/staff user id)  
- Optional change reason  

### 6. Reference Media

- Upload sketch / inspiration / previous garment photos  
- Use global ImageUpload component when available  

### 7. Printable Sheet

- A4-friendly print layout  
- Brand header: Kadamba's Designer Studio · Kurnool  
- Customer name, phone, product, date, measured by  
- All fields + notes  
- Signature / trial checkbox lines  

### 8. Units

- Default: **inches** (common in Indian boutique practice)  
- Optional display toggle to cm (store canonical inches; convert on display)  
- Store `unit` on profile for clarity  

---

## Measurement Categories & Products

> Complete ladies/girls catalog for a Kurnool bridal & ethnic boutique.

### Bridal Collection

| Code | Product |
|------|---------|
| BR-LH | Bridal Lehenga |
| BR-BL | Bridal Blouse |
| BR-SR | Bridal Saree Stitching / Fall Pico (service fields light) |
| BR-RG | Reception Gown |
| BR-WG | Wedding Gown |
| BR-HS | Half Saree / Langa Voni |
| BR-DP | Designer Dupatta (length/width + work notes) |

### Ethnic / Designer Blouses

| Code | Product |
|------|---------|
| BL-SR | Saree Blouse |
| BL-DS | Designer Blouse |
| BL-MG | Maggam Blouse |
| BL-PT | Pattu Blouse |
| BL-CT | Cotton Blouse |
| BL-PC | Princess Cut Blouse |
| BL-HN | High Neck Blouse |
| BL-BN | Boat Neck Blouse |
| BL-CL | Collar Blouse |
| BL-BK | Backless / Deep Back Blouse |
| BL-KP | Katori / Cup Blouse |
| BL-PK | Peplum Blouse |

### Kurtis & Tunics

| Code | Product |
|------|---------|
| KT-ST | Straight Kurti |
| KT-AN | Anarkali |
| KT-AL | A-Line Kurti |
| KT-UM | Umbrella Kurti |
| KT-JK | Jacket Kurti |
| KT-LN | Long Kurti / Kurta Set |

### Dresses & Gowns

| Code | Product |
|------|---------|
| DR-LG | Long Gown |
| DR-PG | Party Gown |
| DR-MX | Maxi Dress |
| DR-IW | Indo-Western Dress |
| DR-EV | Evening Dress |
| DR-SH | Short Party Dress |

### Salwar / Suit Collection

| Code | Product |
|------|---------|
| SL-CH | Churidar Suit |
| SL-PJ | Punjabi Suit |
| SL-PT | Patiala |
| SL-PL | Palazzo Set |
| SL-SH | Sharara |
| SL-GH | Gharara |
| SL-DR | Dhoti Pants Set |

### Skirts & Bottoms

| Code | Product |
|------|---------|
| SK-LH | Lehenga Skirt (non-bridal / festive)  
| SK-PL | Palazzo |
| SK-SR | Sharara Skirt |
| SK-PN | Pant / Cigarette Pant |
| SK-HL | Half Saree Skirt |

### Kids Wear (Girls)

| Code | Product |
|------|---------|
| KD-LH | Kids Lehenga |
| KD-GW | Kids Gown |
| KD-FR | Kids Frock |
| KD-BL | Kids Blouse |
| KD-AN | Kids Anarkali |

### Custom Tailoring

| Code | Product |
|------|---------|
| CU-DR | Custom Dress |
| CU-BL | Custom Blouse |
| CU-SK | Custom Skirt |
| CU-OT | Custom Other (admin-defined fields) |

---

## Field Libraries (Reusable Field Groups)

Use groups so templates stay consistent.

### Group A — Upper Body (Blouse / Kurti / Gown bodice)

| Field Key | Label | Unit | Required | Notes |
|-----------|-------|------|----------|-------|
| bust | Bust | in | yes | Fullest bust |
| under_bust | Under Bust | in | no | For katori / padded |
| waist_upper | Waist | in | yes | Natural waist |
| shoulder | Shoulder | in | yes | Seam to seam |
| shoulder_to_bust | Shoulder to Bust Point | in | no | |
| front_length | Front Length | in | yes | Shoulder to hem (kurti/gown) or blouse length |
| back_length | Back Length | in | no | |
| sleeve_length | Sleeve Length | in | conditional | Required if sleeves ≠ sleeveless |
| armhole | Armhole | in | yes | |
| bicep | Upper Arm / Bicep | in | no | |
| elbow | Elbow | in | no | |
| wrist | Wrist / Sleeve Opening | in | no | |
| neck_depth_front | Front Neck Depth | in | yes | |
| neck_depth_back | Back Neck Depth | in | yes | |
| neck_width | Neck Width | in | no | |
| cross_front | Cross Front | in | no | |
| cross_back | Cross Back | in | no | |
| apex | Apex (Bust Point Gap) | in | no | |
| cup_size | Cup Size | text | no | A/B/C or custom |
| padding | Padding | enum | no | none / light / heavy |
| blouse_hooks | Hook Count / Closing | text | no | |

### Group B — Lower Body (Lehenga / Skirt / Palazzo)

| Field Key | Label | Unit | Required | Notes |
|-----------|-------|------|----------|-------|
| waist_lower | Waist | in | yes | |
| hip | Hip | in | yes | Fullest hip |
| seat | Seat | in | no | |
| skirt_length | Skirt / Lehenga Length | in | yes | Waist to floor or desired |
| flare | Flare / Bottom Circumference | in | no | Or kali count notes |
| thigh | Thigh | in | no | For pants/palazzo |
| crotch | Crotch Depth | in | no | Pants |
| knee | Knee | in | no | |
| ankle | Ankle / Bottom Opening | in | no | |
| inseam | Inseam | in | no | Pants |
| outseam | Outseam | in | no | |
| can_can | Can-Can / Net Layers | enum/text | no | yes/no + layers |
| waistband_style | Waistband Style | enum | no | elastic / drawstring / fitted / belt |
| lining | Lining | enum | no | full / partial / none |

### Group C — Full Length / Gown

| Field Key | Label | Unit | Required |
|-----------|-------|------|----------|
| full_length | Full Length (shoulder to floor) | in | yes |
| train_length | Train Length | in | no |
| slit_length | Slit Length | in | no |

### Group D — Salwar / Bottom Set Extra

| Field Key | Label | Unit | Required |
|-----------|-------|------|----------|
| salwar_length | Salwar / Pant Length | in | yes |
| bottom_style | Bottom Style | text | no |
| dupatta_length | Dupatta Length | in | no |
| dupatta_width | Dupatta Width | in | no |

### Group E — Kids Adjustments

Same as adult groups with lower min validation; add:

| Field Key | Label | Notes |
|-----------|-------|-------|
| age_approx | Approx Age | years |
| growth_ease | Extra Ease for Growth | in |

### Group F — Work / Style Preferences (all bridal & maggam)

| Field Key | Label | Type |
|-----------|-------|------|
| fabric_provided | Fabric Provided By | enum: customer / boutique / both |
| fabric_notes | Fabric Notes | text |
| embroidery_type | Embroidery Type | enum: maggam / zardosi / aari / machine / none / mixed |
| embroidery_notes | Embroidery / Motif Notes | text |
| lining_fabric | Lining Fabric | text |
| trial_required | Trial Required | boolean |
| delivery_notes | Delivery / Occasion Date Notes | text |
| special_instructions | Special Instructions | textarea |

---

## Template Composition Rules

| Product | Field Groups |
|---------|--------------|
| Bridal Lehenga | B + F + blouse optional link (separate profile) |
| Bridal Blouse / Maggam Blouse / all BL-* | A + F |
| Reception / Wedding / Party Gown | A + C + B(hip/waist) + F |
| Half Saree | B + A(blouse linked) + F |
| Straight / A-Line / Umbrella Kurti | A (+ B if pant set) |
| Anarkali | A + C + flare notes + F |
| Churidar / Punjabi / Patiala / Palazzo / Sharara / Gharara | A (kameez) + D + B subset + F |
| Kids * | Corresponding adult groups + E |
| Custom * | Admin selects groups or freeform fields |

**Example — Bridal Lehenga auto form must include at minimum:**

waist_lower, hip, skirt_length, flare, can_can, waistband_style, lining, embroidery_type, special_instructions, trial_required  

**Example — Maggam Blouse auto form must include at minimum:**

bust, under_bust, waist_upper, shoulder, front_length, sleeve_length, armhole, neck_depth_front, neck_depth_back, cup_size, padding, embroidery_type, special_instructions  

---

## Workflow

### Admin creates measurement

1. Open `/admin/measurements` → **Add Measurement**  
2. Search/select customer (or quick-create)  
3. Choose category → product type  
4. Form fields load from template  
5. Enter values; upload references  
6. Save → creates profile v1  

### Admin updates measurement

1. Open profile → Edit  
2. Change values + reason  
3. Save → v1 archived in history, v2 current  

### Attach to order (later Orders module)

- Order line selects existing profile or creates new  

### Print

- Open profile → Print → browser print CSS  

### Customer request (Portal — later)

- Customer submits draft → status `pending_approval` → admin approve/reject  

---

## UI Requirements

### List page

- Table: Customer, Product, Updated, Measured by, Status, Actions  
- Mobile: card list  
- Empty state: “No measurements yet — add the first profile”  
- Skeleton loaders  

### Form page

- Sticky product header (customer + product name)  
- Sections collapsed by group (Upper / Lower / Style)  
- Inline help tooltips per field  
- Unit label beside inputs  
- Side panel: history + images on desktop  

### Accessibility

- Every input labeled  
- Error text linked with `aria-describedby`  
- Keyboard navigable sections  
- Focus visible  

---

## Forms — Profile Header Fields

| Field | Required | Notes |
|-------|----------|-------|
| customerId | yes | |
| productTypeCode | yes | from catalog |
| profileName | yes | default: `{Product} — {date}` |
| measuredAt | yes | default now |
| measuredBy | yes | current staff/admin |
| unit | yes | inches default |
| status | yes | draft / active / archived / pending_approval |
| notes | no | |
| orderId | no | optional link |

Plus dynamic measurement map: `{ [fieldKey]: number | string | boolean }`  

---

## Tables — List Columns

| Column | Sort | Filter |
|--------|------|--------|
| Customer name | yes | search |
| Phone | no | search |
| Product type | yes | filter |
| Profile name | yes | search |
| Updated at | yes | date range |
| Measured by | yes | staff filter |
| Status | yes | filter |
| Actions | — | view/edit/print/archive |

---

## Validations

- Required template fields must be filled when status = `active`  
- Numeric fields: min 0, max 100 (inches) unless kids template overrides  
- Sleeve fields required unless sleeve_style = sleeveless  
- Duplicate profileName per customer discouraged (warn, allow)  
- Cannot delete profile linked to open order (archive only)  

---

## Data Model (high level)

```text
MeasurementTemplate
  code, name, category, fieldDefs[], active, version

MeasurementFieldDef
  key, label, type (number|text|enum|boolean), unit, required,
  min, max, options[], helpText, group, sortOrder

MeasurementProfile
  customerId, productTypeCode, profileName, unit, status,
  values (Mixed/Map), notes, orderId?, measuredBy, measuredAt,
  referenceImages[], currentVersion

MeasurementVersion
  profileId, version, values, notes, changedBy, changedAt, reason
```

---

## API Requirements

Base: `/api/measurements` (admin JWT)  
Templates: `/api/measurement-templates`

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/measurement-templates` | List templates |
| GET | `/measurement-templates/:code` | One template |
| POST | `/measurement-templates` | Admin create |
| PUT | `/measurement-templates/:code` | Admin update |
| GET | `/measurements` | List profiles (paginate, filter) |
| GET | `/measurements/:id` | Detail + history |
| POST | `/measurements` | Create profile |
| PUT | `/measurements/:id` | Update (version bump) |
| POST | `/measurements/:id/duplicate` | Clone |
| PATCH | `/measurements/:id/archive` | Archive |
| GET | `/measurements/:id/print` | Print payload / HTML |

Public/customer endpoints deferred to Portal module.

---

## Relationships

- **Customer** 1—N MeasurementProfile  
- **ProductType / Template** 1—N Profiles  
- **Order** 0—1 or 1—N Profiles (later)  
- **Staff/User** measuredBy  
- **Customer Portal** read/request update (later)  

---

## Acceptance Criteria

- [ ] Selecting “Bridal Lehenga” loads lehenga fields automatically  
- [ ] Selecting “Maggam Blouse” loads blouse fields automatically  
- [ ] All catalog products listed in this PRD are seedable  
- [ ] Profiles save, edit with version history  
- [ ] Print view usable on A4  
- [ ] Search/filter works on list  
- [ ] Responsive + accessible form  
- [ ] Existing CMS routes unaffected  

## Future Enhancements

- Body diagram hotspots  
- OCR from handwritten sheets  
- Suggested ease based on fabric  
- WhatsApp share of measurement PDF  
- Multi-language labels (Telugu/English)  

## Cursor Prompt (copy)

```text
Implement documents/prd/05_Measurement_System.md as the active chunk.
Create admin Measurements pages + APIs + seed templates for the full ladies catalog.
Dynamic form from product type. Version history. Print sheet.
Do not implement Portal/Finance/Staff in this chunk.
```

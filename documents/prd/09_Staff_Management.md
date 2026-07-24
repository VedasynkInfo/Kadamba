# Module 09 — Staff Management

## Purpose

The Staff Management module is the employee system for **Kadamba's Designer Studio**. It lets the owner maintain employee records, skills, localities, experience, and specializations so work can be assigned correctly for bridal, maggam, blouse, and finishing workflows.

Supports permanent and freelance staff across cutting, stitching, embroidery/maggam, finishing, QC, trials, customer service, and administration.

## Business Goal

Know who can do which work, balance workload, keep salary records for Finance, and improve delivery quality by matching orders to the right expertise.

## Objectives

- Maintain complete employee profiles  
- Capture locality and contact for coordination  
- Record work experience and prior workplaces  
- Tag boutique-specific expertise  
- Support salary entry for Finance  
- Track assigned / completed orders (workload-ready)  
- Prepare for future attendance  

## Features

### Employee Profile

- Full name, photo, phone, email, emergency contact  
- Residential address + **locality** (Kurnool areas)  
- Date of birth, joining date, employment type (`permanent` / `freelance` / `intern`)  
- Identity proofs (Aadhaar/PAN refs — store securely / last-4 only where possible)  
- Languages (Telugu, English, Hindi, etc.)  
- Education / certifications (tailoring diplomas)  
- Years of experience + previous workplaces  
- Active / inactive status  

### Specializations (multi-select)

Boutique-relevant skills:

- Blouse stitching  
- Bridal lehenga tailoring  
- Maggam embroidery  
- Hand embroidery / Zardosi / Aari  
- Machine embroidery  
- Pattern making / Cutting  
- Finishing / Alteration  
- Fabric selection  
- Customer consultation  
- Trial management  
- Quality inspection  
- Admin / Front desk  

### Experience & Locality

- Structured experience entries (role, years, notes)  
- Locality tags for pickup/trial coordination  
- Preferred work types  

### Workload (basic in v1)

- Count of open assigned orders  
- List of current assignments (from Orders module when available)  
- Performance notes (free text, dated)  

### Salary Link

- Monthly salary amount / rate type (monthly / per-piece / freelance)  
- Finance module records actual salary payments  

## Workflow

1. Admin opens `/admin/staff` → Add Staff  
2. Fills personal + locality + expertise  
3. Saves profile  
4. Later: assign staff on Order detail  
5. Finance: record salary payments against staff  

## UI Requirements

- List: name, role/title, locality, skills chips, status, workload badge  
- Detail: tabs — Profile | Skills | Experience | Assignments | Notes | Salary  
- Mobile-friendly cards  
- Empty / skeleton states  
- Confirm before deactivate  

## Forms

| Field | Required |
|-------|----------|
| fullName | yes |
| phone | yes |
| email | no |
| locality | yes |
| address | no |
| joiningDate | yes |
| employmentType | yes |
| specializations[] | yes (at least one) |
| yearsExperience | no |
| previousWorkplaces | no |
| languages[] | no |
| photoUrl | no |
| emergencyContactName/Phone | no |
| salaryType | no |
| salaryAmount | no |
| notes | no |
| status | yes |

## Tables

| Column | Filter/Search |
|--------|---------------|
| Name | search |
| Phone | search |
| Locality | filter |
| Employment type | filter |
| Skills | filter (contains) |
| Status | filter |
| Open assignments | sort |
| Actions | edit / deactivate |

## Validations

- Phone unique among active staff  
- At least one specialization  
- Salary amount ≥ 0 if provided  

## Data Model

```text
Staff
  fullName, phone, email, photoUrl, locality, address,
  joiningDate, employmentType, specializations[],
  yearsExperience, previousWorkplaces[], languages[],
  emergencyContact, salaryType, salaryAmount, status,
  performanceNotes[], userId? (if login enabled)
```

## API Requirements

| Method | Path |
|--------|------|
| GET/POST | `/api/staff` |
| GET/PUT/PATCH | `/api/staff/:id` |
| PATCH | `/api/staff/:id/status` |

Admin JWT required. Optional later: staff self login via User Roles.

## Relationships

- Staff → Orders (assignee)  
- Staff → MeasurementProfile.measuredBy  
- Staff → Finance salary expenses  
- Staff → User (optional portal/admin login)  

## Acceptance Criteria

- [ ] CRUD staff with skills & locality  
- [ ] Filter by specialization (e.g. maggam)  
- [ ] Deactivate without deleting history  
- [ ] Ready for order assignment fields  

## Future Enhancements

- Attendance & leave  
- Piece-rate auto calculation  
- Skill certification uploads  
- WhatsApp staff alerts  

## Cursor Prompt

```text
Implement documents/prd/09_Staff_Management.md.
Admin staff module with personal details, locality, experience, and boutique specializations.
Do not build full attendance or payroll automation yet.
```

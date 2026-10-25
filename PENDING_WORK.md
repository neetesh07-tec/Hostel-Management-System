# Hostel Management System – Pending Work Checklist

This document summarizes the current state of the project and the remaining work that can be completed next. It is based on the code in the current repository.

## 1. Project status snapshot

The project already includes a large part of the full-stack hostel management system:

- Backend API with Express and PostgreSQL integration
- Session-based authentication and role protection
- Admin dashboard stats
- Room, floor, section, and building management screens
- Student CRUD and management screens
- Booking management flows
- Fee and payment management
- Student portal with profile, booking, fees, payments, and password change
- Frontend routing and protected access based on role

The app is structurally strong and many routes and controllers are already in place. The remaining work is mostly about validation, consolidation, polish, and production-readiness.

---

## 2. What is already implemented

### Frontend
- Login screen and auth flow
- Role-based redirection for admin and student
- Dashboard with summary cards
- Rooms management page with building/floor/section hierarchy
- Students management page
- Bookings management page
- Fees management page
- Account settings page
- Student portal page

### Backend
- `/api/health` endpoint
- `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`
- Admin endpoints for buildings, floors, sections, rooms, students, bookings, dashboard, fees, payments
- Student-only portal endpoints for profile, booking, fees, and payments
- Password and email self-service routes for authenticated users

### Database
- Structured schema and demo seed data
- Tables for buildings, floors, sections, rooms, users, students, bookings, fees, payments
- A room occupancy view and seeded sample records

---

## 3. Pending work to complete

### Priority 1 – Validate route and feature completeness

#### Task 1: Verify every API route against the actual DB schema
- Check that each controller matches the real database columns and constraints from `database/schema.sql`.
- Confirm the frontend is calling the exact backend endpoints that exist.
- Validate route names, request parameter names, and HTTP methods.

Suggested checks:
- `GET /api/buildings`, `/api/floors/building/:buildingId`, `/api/sections/floor/:floorId`
- `POST` and `PUT` operations for all admin entities
- Student portal endpoints for `profile`, `booking`, `fees`, and `payments`
- All booking status transitions (`confirm`, `cancel`, `check-in`, `check-out`)

Acceptance criteria:
- Every frontend action successfully hits a valid backend route.
- All API calls return expected JSON and proper error messages.

#### Task 2: Run an end-to-end feature verification pass
- Test login as admin and as student.
- Verify admin dashboard values are accurate.
- Verify room creation and updates reflect correctly in the UI and DB.
- Ensure student management works end-to-end.
- Confirm booking actions update room occupancy correctly.

Acceptance criteria:
- Login/logout works reliably.
- Core CRUD features work without broken state.

### Priority 2 – Strengthen business logic and validation

#### Task 3: Finish room and occupancy validation rules
The code already contains occupancy checks, but the full transaction rules should be reviewed carefully.

Check:
- room capacity cannot fall below current peak occupancy
- room status and occupancy rules are consistent
- room cost/booking logic does not allow impossible states

Acceptance criteria:
- A room cannot be made too small for active bookings.
- Booking and room updates never create impossible occupancy totals.

#### Task 4: Review booking lifecycle rules
The booking controller likely contains the main business logic and should be checked thoroughly.

Validate:
- a booking cannot be confirmed if no room is available
- duplicate or overlapping bookings are prevented where required
- check-in and check-out transitions are valid
- cancelled, completed, and checked-in bookings cannot be reused incorrectly

Acceptance criteria:
- All booking lifecycle states are consistent and protected by logic.
- Invalid transitions return clear errors.

#### Task 5: Check fee and payment consistency
The fee management logic should be reviewed for correctness across all states.

Validate:
- balances update correctly after payments
- due dates and overdue states are computed consistently
- partial payments are tracked correctly
- payment history is tied to the right student and fee record

Acceptance criteria:
- Outstanding due calculations match DB totals.
- UI displays accurate due and paid values.

### Priority 3 – Improve user experience and reliability

#### Task 6: Polish forms and UI feedback
The frontend already contains many forms, but the user experience should be improved.

Add or improve:
- inline validation messages for empty/invalid input
- loading spinners on save actions
- confirmation dialogs before delete/deactivate actions
- disabled submit buttons while requests are in flight
- better empty states for tables and filters

Acceptance criteria:
- Users get immediate visual feedback for invalid actions.
- No confusing or silent failures.

#### Task 7: Add table searching, sorting, and filters
The app is functional but still basic. Add filter/search support across:
- students
- bookings
- rooms
- fees
- payments

Acceptance criteria:
- Admin can quickly find records by name, room, code, status, or date.

#### Task 8: Review navigation and repeated logic
The app uses repeated patterns for navbars, cards, tables, forms, and stat blocks.

Improve:
- reuse common UI patterns instead of duplicated markup
- unify page headers and cards
- ensure navigation is consistent across all pages

Acceptance criteria:
- Code is easier to maintain and less repetitive.

### Priority 4 – Production-readiness and deployment checks

#### Task 9: Add environment and deployment docs
The project already has a basic README, but it still needs a final operational checklist.

Add:
- full setup steps for PostgreSQL and local run
- `.env` examples for all services
- database migration/seed reset instructions
- backend/frontend deployment notes
- troubleshooting section for common errors

Acceptance criteria:
- A new developer can set up the project with minimal guesswork.

#### Task 10: Add automated tests
This project is good for unit and integration tests.

Recommended first tests:
- authentication flow
- invalid login cases
- room capacity validation
- booking transitions
- fee balance calculation
- student portal access restrictions

Acceptance criteria:
- Major business rules are covered by tests.
- Bugs are caught before release.

#### Task 11: Harden security and application configuration
The app has basic session auth, but it should be hardened before deployment.

Improve:
- secure environment variable handling
- production session cookie settings
- request validation for all inputs
- consistent error handling without leaking DB details
- CORS settings and origin restrictions

Acceptance criteria:
- The app is safer for staging and production usage.

---

## 4. Recommended work order

Complete the work in this order:

1. Validate all routes and DB mappings
2. Verify booking lifecycle and room occupancy rules
3. Validate fee/payment balance logic
4. Polish admin UI interactions and forms
5. Test student portal and account settings flows
6. Add search/filtering and cleaner UX
7. Add automated tests
8. Finalize the deployment documentation

---

## 5. Best next task for a beginner

If you want a manageable first task, start here:

### Beginner milestone: route and feature verification checklist
- Open the frontend pages and compare them against backend routes.
- Validate every action button in the UI with a corresponding API call.
- Log success/error responses and document mismatches.
- Fix any broken route, missing controller method, or invalid request payload.

This is the best entry point because it gives immediate feedback and reduces the chance of building on a broken feature.

---

## 6. Suggested completion checklist

Use the following checklist while working through the pending tasks:

- [ ] Backend routes match frontend API usage
- [ ] All auth flows work correctly
- [ ] Booking rules are validated
- [ ] Room occupancy stays consistent
- [ ] Fee and payment values remain accurate
- [ ] Student portal access is restricted correctly
- [ ] Forms show clear validation and loading states
- [ ] Search/filtering is added where needed
- [ ] Testing is in place for critical business logic
- [ ] Deployment/setup docs are complete

---

## 7. Final note

The project is already a strong foundation and clearly structured for further development. Most remaining work is not “start from scratch” work; it is mainly cleanup, logic validation, and production hardening. The most valuable next step is to verify the existing routes and business flows end-to-end before expanding features further.

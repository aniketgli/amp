AMP — System Architecture

1. Overview

AMP (Access Management Portal) is a role-based access management application for managing WII personnel access requisitions and their multi-stage approval and provisioning workflow.

The application uses:

React + Vite for the frontend

Express + TypeScript for the backend

MySQL for persistent data

JWT-based authentication

Role-based authorization

Repository-based database access

Automated tests with Vitest

GitHub Actions for CI and security validation

2. High-Level Architecture

Browser
|
| HTTP / JSON
v
Frontend API Layer
(src/api + apiClient)
|
v
Express Server
(server/index.ts)
|
+----------------------+
| |
v v
Middleware Routes
Auth / RBAC API Endpoints
Validation
Rate Limit
Error Handling
| |
+----------+-----------+
|
v
Controllers
Request / Response Handling
|
v
Services
Business / Workflow Logic
|
v
Repositories
Database Operations
|
v
MySQL
Persistent Application Data

3. Frontend Architecture

Frontend source code is organized under src/.

src/
├── app/
│ ├── App.tsx
│ ├── routes.tsx
│ └── providers.tsx
├── features/
│ ├── auth/
│ ├── dashboard/
│ ├── applicant/
│ ├── requisition/
│ ├── workflow/
│ ├── admin/
│ └── helpdesk/
├── components/
│ ├── ui/
│ ├── layout/
│ └── common/
├── hooks/
├── lib/
├── services/
├── types/
├── utils/
├── constants/
└── styles/

Frontend responsibilities

src/app/

Application bootstrap, route handling and global providers.

src/features/

Feature-specific pages and components.

src/components/

Reusable UI, layout and common components.

src/api/

Centralized frontend API communication.

src/types/

Shared TypeScript domain types.

src/lib/

Application-level utility and compatibility logic.

4. Backend Architecture

Backend source code is organized under server/.

server/
├── index.ts
├── config/
│ ├── env.ts
│ └── constants.ts
├── middleware/
│ ├── auth.ts
│ ├── authorization.ts
│ ├── validation.ts
│ ├── rateLimit.ts
│ └── errorHandler.ts
├── routes/
│ ├── auth.routes.ts
│ ├── users.routes.ts
│ ├── requisition.routes.ts
│ ├── workflow.routes.ts
│ ├── admin.routes.ts
│ └── helpdesk.routes.ts
├── controllers/
├── services/
├── repositories/
└── db/
├── connection.ts
└── queries/

Backend layer responsibilities

server/index.ts

Application entry point.

Initializes Express, middleware, API routes, database connectivity and static/frontend serving where applicable.

server/routes/

Defines HTTP endpoints and attaches authentication/authorization middleware.

Routes should remain focused on request validation, access control, service/controller invocation and HTTP responses.

server/controllers/

Handles HTTP request/response concerns and delegates business operations to services.

server/services/

Contains business rules and workflow logic.

Examples include:

authentication

requisition processing

workflow transitions

profile operations

audit operations

email operations

server/repositories/

Contains database-specific operations.

Repositories isolate SQL/database access from business logic.

server/db/

Contains database connection and query-related infrastructure.

5. Authentication Architecture

Authentication is implemented using JWT-based sessions.

The general flow is:

Login Request
|
v
POST /api/login
|
v
Authentication Service
|
+-- Validate credentials
+-- Validate account status
+-- Resolve active role
|
v
JWT issued
|
v
Frontend API client
|
v
Authorization header
|
v
authenticateToken middleware

The authenticated identity is established server-side.

Client-controlled role or actor information must not be trusted for privileged workflow operations.

6. Authorization Architecture

Authorization is implemented separately from authentication.

Authentication
|
v
JWT identity
|
v
authenticateToken
|
v
requireRole / workflow authorization
|
v
Protected endpoint

Authorization is enforced at the backend even when the frontend hides or disables an action.

This prevents a user from bypassing frontend restrictions by directly calling an API endpoint.

7. Role Model

The application supports workflow-oriented roles including:

applicant

supervisor

lab_nodal

assoc_lab_nodal

section_head

it_officer

hrms_officer

admin

super_admin

Legacy user role values are normalized to the applicant role where required by the application workflow.

Roles control:

accessible pages

requisition visibility

workflow actions

administrative operations

provisioning operations

8. Requisition Workflow

The requisition lifecycle is implemented as a multi-stage workflow.

Typical IT/HRMS flow:

Applicant
|
v
submitted_pending_pi
|
v
Supervisor / PI
|
v
pending_section_head
|
v
Section Head
|
v
in_tech_verification
|
v
IT / HRMS Officer
|
v
approved_provisioned

Typical laboratory flow:

Applicant
|
v
submitted_pending_pi
|
v
Supervisor / PI
|
v
in_lab_review
|
v
Lab Nodal / Associate Nodal
|
v
pending_section_head
|
v
Section Head
|
v
Final stage according to requisition type

Rejected and deactivated states are handled explicitly.

9. Workflow Security

Workflow actions are validated using:

authenticated actor identity

authenticated actor role

current requisition workflow stage

requested action

A valid role at the wrong workflow stage must not be permitted to perform the action.

Administrative deactivation is restricted to administrator roles.

Workflow actions are recorded in audit history.

10. Database Architecture

MySQL is the persistent data store.

Major logical areas include:

users

roles

user_roles

applicant_profiles

requisitions

IT/HRMS details

laboratory facility details

workflow state

workflow audit history

facility masters

service masters

Database access is isolated through repositories.

Application services should not contain raw SQL unless there is a documented architectural reason.

11. API Request Flow

A protected request follows this general flow:

Browser
|
v
Frontend API Client
|
v
Express Route
|
v
Authentication Middleware
|
v
Authorization Middleware
|
v
Controller
|
v
Service
|
v
Repository
|
v
MySQL

The response travels back through the application layers to the client.

12. Error Handling

Errors should be converted into controlled API responses.

The application should avoid exposing:

database credentials

SQL statements

internal stack traces

sensitive authentication information

unnecessary implementation details

Operational details should be logged server-side where appropriate.

13. Testing Architecture

Tests are organized under:

tests/
├── unit/
├── integration/
└── e2e/

Current automated unit coverage includes:

role normalization

requisition visibility

applicant access isolation

administrative visibility

workflow stage authorization

PI approval flow

laboratory workflow transitions

section-head transitions

IT/HRMS provisioning

unauthorized deactivation

administrative override

missing requisition handling

The current unit test suite is executed with Vitest.

14. CI/CD Architecture

GitHub Actions workflows are stored under:

.github/workflows/
├── ci.yml
└── security.yml

CI workflow

The CI workflow validates:

npm ci
|
v
npm run lint
|
v
npm test
|
v
npm run build

Security workflow

The security workflow validates dependency security using:

npm ci
|
v
npm audit --audit-level=high

15. Environment Configuration

Environment-specific configuration must not be hard-coded into source files.

Important environment values include:

database host

database port

database username

database password

database name

JWT configuration

client/server URLs

email configuration where applicable

Secrets must be supplied through environment variables or deployment secret stores.

16. Architectural Rules

The following rules should be maintained during future development.

Rule 1

Frontend code must not directly access MySQL.

Rule 2

Routes must not contain large business workflows.

Rule 3

Controllers must not become the database layer.

Rule 4

Repository code owns SQL/database access.

Rule 5

Authentication and authorization are backend-enforced.

Rule 6

Workflow actions must validate the current workflow stage.

Rule 7

Sensitive actor identity must come from the authenticated session.

Rule 8

New database changes should be introduced through migrations.

Rule 9

New security-sensitive behavior should include automated tests.

Rule 10

Production builds, linting and automated tests must remain green.

17. Directory Ownership Summary

Directory

Responsibility

src/app

Application shell and routing

src/features

Feature modules

src/components

Shared UI

src/api

Frontend API access

server/routes

HTTP endpoint definitions

server/controllers

HTTP request/response handlers

server/services

Business logic

server/repositories

Database access

server/db

Database infrastructure

database

Schema, migrations and seeds

tests

Automated testing

docs

Project documentation

.github

CI/security automation

18. Change Management

Architectural changes should preserve:

existing business functionality

role-based access control

workflow integrity

auditability

database consistency

automated test coverage

production build compatibility

Any intentional architectural deviation should be documented in the appropriate documentation section before implementation.

AMP — Security Documentation

1. Overview

AMP is a role-based access management application in which authentication,
authorization, workflow control, auditability and protection of personnel
data are core security requirements.

Security controls are implemented across:

frontend

API layer

Express middleware

controllers

business services

repositories

database

CI/security automation

Security must be enforced on the backend and must not rely only on
frontend visibility or button-level restrictions.

2. Security Architecture

The primary security flow is:

Browser
|
v
Frontend API Client
|
v
Express Route
|
+----------------------+
| |
v v
Authentication Authorization
Middleware Middleware
| |
+----------+-----------+
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

Every protected operation should pass through the appropriate security
controls before sensitive business logic is executed.

3. Authentication

Authentication establishes the identity of the user.

AMP uses JWT-based authentication for authenticated API sessions.

General flow:

Credentials
|
v
POST /api/login
|
v
Validate credentials
|
v
Validate account status
|
v
Resolve permitted roles
|
v
Issue JWT
|
v
Authenticated API requests

The server is responsible for establishing the authenticated identity.

A client must not be allowed to impersonate another user by supplying
another user's ID as the actor identity.

4. Password Security

Passwords must never be stored in plaintext.

The database stores a password hash rather than the original password.

Password handling requirements:

accept credentials only through protected authentication endpoints

compare passwords against stored hashes

never log plaintext passwords

never return password hashes to the frontend

never include passwords in API responses

never commit test/production passwords to source control

5. JWT Security

JWTs are used to represent an authenticated session.

The server should:

validate token signature

validate token structure

validate token expiration where configured

derive identity from the verified token

derive privileged actor information from authenticated identity

reject malformed or missing tokens for protected endpoints

The frontend may store the current authentication token according to the
current application implementation, but privileged authorization must
always be enforced server-side.

6. Authorization

Authentication and authorization are separate controls.

Authentication answers:

Who is the user?

Authorization answers:

What is the user allowed to do?

Authorization is implemented through backend middleware and workflow
rules.

Protected operations should use:

authenticateToken
|
v
requireRole / workflow authorization

A frontend restriction is not considered a security control by itself.

7. Role-Based Access Control

Supported workflow-oriented roles include:

applicant
supervisor
lab_nodal
assoc_lab_nodal
section_head
it_officer
hrms_officer
admin
super_admin

Legacy user role values may be normalized to applicant where required
by the workflow.

Role permissions should follow least privilege.

Examples:

Role

Main security responsibility

applicant

Own requisitions/profile

supervisor

PI/supervising approval

lab_nodal

Laboratory review

assoc_lab_nodal

Associate laboratory review

section_head

Section-head clearance

it_officer

IT/network provisioning

hrms_officer

HRMS/biometric processing

admin

Administrative control

super_admin

Highest-level governance

8. Object-Level Access Control

Role permission alone is not sufficient.

The backend must also verify that the authenticated actor is allowed to
access the specific target record.

For requisitions:

Applicant
|
+--> allowed to access own requisitions
|
+--> not allowed to access another applicant's requisition

Administrative roles may have broader visibility according to their
authorized responsibilities.

Changing an ID in a URL must never be enough to obtain another user's
protected information.

9. Workflow Authorization

Workflow actions are security-sensitive operations.

Supported actions include:

approve
reject
provision
deactivate

Before executing an action, the backend validates:

authenticated actor identity

authenticated actor role

current requisition status

requested workflow action

permitted workflow stage

Example:

Supervisor
|
+--> submitted_pending_pi APPROVE
|
X--> in_tech_verification NOT ALLOWED

A valid role at the wrong workflow stage must not be allowed to perform
the operation.

10. Administrative Deactivation

Deactivation is an administrative security operation.

Non-administrative workflow roles must not be allowed to deactivate an
access record.

Expected rule:

admin -> allowed
super_admin -> allowed
other roles -> denied

The action should be recorded in the workflow audit trail.

11. Actor Identity Protection

Privileged workflow requests must not trust actor identity fields supplied
by the request body.

Unsafe pattern:

{
"actorId": "another-user",
"actorRole": "admin"
}

The secure pattern is:

JWT
|
v
Verified authenticated user
|
v
Server-side actor identity
|
v
Authorization decision

The request body may contain workflow input such as comments or
provisioning values, but it must not be used to override the authenticated
actor identity.

12. Input Validation

All externally supplied input should be treated as untrusted.

Validation should cover:

request body

path parameters

query parameters

identifiers

email addresses

mobile numbers

MAC addresses

role IDs

workflow actions

workflow-specific fields

Invalid input should be rejected before business logic or database
operations where practical.

13. SQL Injection Protection

Database queries should use parameterized SQL/database driver parameters.

Do not construct SQL by concatenating untrusted request values directly.

Preferred pattern:

await db.query(
"SELECT \* FROM users WHERE id = ?",
[userId],
);

Avoid:

await db.query(
`SELECT * FROM users WHERE id = ${userId}`,
);

Repository functions are the intended boundary for SQL/database access.

14. Database Security

Database security should use least-privilege principles.

Production database access should:

use dedicated application credentials

restrict network access

protect database passwords

use secure transport where supported

restrict administrative database access

maintain regular backups

protect backup files

Database credentials must never be committed to Git.

15. Secrets Management

Secrets must be supplied through environment configuration or an
appropriate secret-management mechanism.

Sensitive configuration includes:

DB_PASSWORD
JWT secrets/configuration
Email credentials
Infrastructure credentials
Service/API secrets

Do not place production secret values in:

source code
README files
test fixtures
Git history
client-side bundles
console logs

The repository should contain only safe templates such as
.env.example.

16. Sensitive Personal Data

Applicant profiles may contain sensitive personnel, financial and
identity-related information.

Examples include:

PAN
bank account number
IFSC
personal email
mobile number
date of birth
biometric ID
office order information

Such information must be protected using:

backend authorization

minimum necessary exposure

controlled API responses

secure database access

restricted logging

Sensitive values should not be unnecessarily copied to browser storage.

17. Logging and Audit

Operational logging and security auditing serve different purposes.

Operational logging

Used for:

server failures

database connection problems

unexpected exceptions

diagnostics

Audit logging

Used for:

approvals

rejections

provisioning

deactivation

administrative overrides

other security-sensitive workflow actions

Audit records should preserve sufficient context to establish:

who
what
when
which requisition
which workflow stage

18. Error Handling

API errors should expose only information necessary for the client.

Avoid returning:

stack traces

SQL statements

database credentials

internal filesystem paths

secret values

unnecessary infrastructure details

Example safe response:

{
"success": false,
"message": "Unable to process request."
}

Detailed diagnostic information may be logged server-side where
appropriate.

19. Session and Client Security

Frontend session handling should minimize exposure of authentication
material.

The current architecture uses a centralized frontend API client and
authentication session helpers.

Future hardening may further reduce browser exposure by moving sensitive
session material toward secure, HttpOnly cookie-based session handling
where compatible with the deployment architecture.

Regardless of frontend session storage, backend authorization remains
mandatory.

20. CORS and Network Exposure

The backend should allow only the intended client origins in production.

Development/LAN configuration may use the configured application URL.

Production deployment should define explicit trusted origins rather than
permitting arbitrary origins.

The server should not expose administrative interfaces beyond the
required network boundary.

21. Rate Limiting

Security-sensitive endpoints should be protected against excessive
requests.

Important candidates include:

login

registration

activation

password/credential-related actions

sensitive administrative endpoints

The application architecture includes a dedicated rate-limit middleware
location:

server/middleware/rateLimit.ts

Rate-limiting policy should be configured according to production traffic
and operational requirements.

22. Security Headers

Production deployment should use appropriate HTTP security headers.

Typical controls include:

Content Security Policy

X-Content-Type-Options

Referrer-Policy

frame/embedding restrictions

HSTS when HTTPS is mandatory

secure cookie attributes when cookies are used

The exact policy should be reviewed against the deployed frontend,
backend and institutional infrastructure.

23. Dependency Security

Dependencies are checked automatically in CI.

Security workflow:

npm ci
|
v
npm audit --audit-level=high

The project should regularly review:

direct dependencies

transitive dependencies

deprecated packages

major-version upgrades

security advisories

Dependency upgrades must be tested through:

npm run lint
npm test
npm run build

before deployment.

24. CI Security Controls

GitHub Actions contains separate CI and security workflows:

.github/workflows/
├── ci.yml
└── security.yml

CI validates:

npm ci
npm run lint
npm test
npm run build

Security validates dependency vulnerabilities using npm audit.

Workflow permissions should remain limited to the minimum required
repository access.

25. Test-Based Security Verification

Security-sensitive behavior must have automated tests.

Current unit coverage includes:

legacy role normalization

applicant ownership restrictions

administrative visibility

workflow stage authorization

unauthorized workflow actions

laboratory workflow authorization

IT/HRMS workflow authorization

unauthorized deactivation

administrator override

missing requisition handling

The test suite currently validates 31 unit tests.

26. Security Testing Strategy

Unit tests

Test individual authorization and validation rules.

Integration tests

Test:

authentication middleware

authorization middleware

API authorization

repository/service interaction

database-backed permissions

End-to-end tests

Test critical real-world journeys from:

Login
->
Create requisition
->
Workflow approval
->
Provisioning
->
Final access state

Negative scenarios should also be tested.

27. Security Review Checklist

Before deployment, verify:

No plaintext passwords are stored.

No production secrets are committed.

Protected APIs require authentication.

Privileged APIs require authorization.

Actor identity comes from authenticated identity.

Object-level access is enforced.

Workflow stage validation is enforced.

Administrative deactivation is restricted.

Sensitive data is not unnecessarily exposed.

SQL uses parameterized queries.

Error responses do not expose internals.

Audit records exist for security-sensitive actions.

Dependency audit is clean.

Lint passes.

Unit tests pass.

Production build passes.

28. Incident Response

Security incidents should be handled through a controlled process.

At minimum:

identify the affected account, endpoint or resource

preserve relevant logs/audit information

restrict or disable compromised access

rotate affected credentials/secrets

assess database/data exposure

identify root cause

apply remediation

verify remediation through testing

document the incident and corrective action

Production credentials must be rotated outside the application repository.

29. Secure Development Rules

Developers should follow these rules:

Rule 1

Never trust client-provided role information for privileged operations.

Rule 2

Never trust client-provided actor identity for audit/security decisions.

Rule 3

Always enforce authorization on the backend.

Rule 4

Always validate workflow stage before workflow actions.

Rule 5

Use parameterized database queries.

Rule 6

Never log passwords or secrets.

Rule 7

Do not expose sensitive personal data unnecessarily.

Rule 8

Use migrations for database schema changes.

Rule 9

Add automated tests for security-sensitive changes.

Rule 10

Do not merge code when lint, tests or build are failing.

30. Current Security Baseline

The current project baseline includes:

JWT authentication ✅
Backend authorization ✅
Workflow stage authorization ✅
Repository database isolation ✅
Workflow audit recording ✅
Automated authorization tests ✅
CI workflow ✅
Dependency security workflow ✅
npm audit ✅ 0 vulnerabilities
TypeScript validation ✅
Production build ✅

Security hardening remains an ongoing operational responsibility and
should be reviewed whenever authentication, authorization, workflows,
database access or deployment infrastructure changes.

31. Related Documentation

System architecture:

docs/architecture/README.md

API documentation:

docs/api/README.md

Database documentation:

docs/database/README.md

Deployment documentation:

docs/deployment/

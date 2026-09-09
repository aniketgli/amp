AMP — API Documentation

1. Overview

This document describes the HTTP API structure used by the AMP (Access Management Portal).

The API is served by the Express backend under server/ and is consumed by the React frontend through the centralized frontend API layer.

General request flow:

Browser
|
v
Frontend API Client
|
v
Express Route
|
+--> Authentication Middleware
|
+--> Authorization Middleware
|
v
Controller / Service
|
v
Repository
|
v
MySQL

2. API Base

The application uses REST-style JSON endpoints.

Examples:

/api/login
/api/register
/api/me
/api/users
/api/profile
/api/requisitions
/api/facilities
/api/services

Protected endpoints require an authenticated session.

3. Authentication

POST /api/login

Authenticates a user and returns the login/session information required by the frontend.

Typical request:

{
"email": "user@example.com",
"password": "**\*\*\*\***",
"requestedRole": "supervisor"
}

requestedRole is optional and is used where a user has multiple permitted roles.

The server validates:

credentials

account activation state

account status

available roles

selected/current role

The response contains the authenticated user information, current role and authentication token.

POST /api/register

Creates a new user registration request.

Registration data should be validated by the server before being persisted.

The endpoint must not trust client-provided privileged roles or administrative permissions.

4. Current User

GET /api/me

Returns the authenticated user's current account information and active roles.

Authentication is required.

Typical response structure:

{
"success": true,
"user": {
"id": 1,
"fullName": "User Name",
"email": "user@example.com",
"phone": "",
"intercomExtension": null,
"isActivated": true,
"status": "active",
"roles": []
}
}

The server resolves the authenticated identity from the verified authentication token.

5. User Administration

GET /api/users

Returns users available to authorized administrative roles.

Authentication and administrative authorization are required.

The endpoint returns user information together with their active roles.

PUT /api/users/:userId/roles

Updates the active role assignments for a user.

Typical request:

{
"roleIds": [1, 2, 3]
}

The server validates:

user ID

role ID values

active role records

administrative authorization

Role assignment changes are persisted through the user repository.

6. Applicant Profile

GET /api/profile

Returns the authenticated applicant's profile.

Authentication is required.

The profile may contain personnel information such as:

applicant name

gender

date of birth

blood group

mobile number

personal email

official email

address

designation

department/project

supervising officer

joining/validity dates

PAN

bank details

biometric information

office order information

Sensitive values should be handled according to application security and privacy requirements.

PUT /api/profile

Creates or updates the authenticated applicant's profile.

The authenticated user ID is used by the backend rather than accepting an arbitrary user ID from the client.

The service layer validates required profile fields before persistence.

GET /api/profile/:userId

Returns a specific user's applicant profile where authorized.

This endpoint is intended for authorized administrative or workflow use.

Access must be protected by backend authorization.

7. Requisitions

The requisition API manages creation, retrieval and updates of access requests.

POST /api/requisitions

Creates a new requisition.

The applicant identity must be derived from the authenticated session.

The request may contain:

requisition type

requisition mode

renewal reason

remarks

IT/HRMS details

selected laboratory facilities

Supported requisition types include:

IT_HRMS
LAB_FACILITY
COMBINED

The server generates the requisition identifier.

The initial workflow status is established server-side.

GET /api/requisitions

Returns requisitions visible to the authenticated actor.

Visibility is role-aware.

The server applies access rules before returning records.

Typical visibility rules include:

applicant: own requisitions

supervisor: workflow-relevant submitted requisitions

laboratory roles: laboratory-related workflow records

section head: section-head workflow records

IT/HRMS roles: technical workflow records

administrators: administrative visibility

Frontend filtering is not a substitute for backend authorization.

GET /api/requisitions/:id

Returns a specific requisition when the authenticated actor is allowed to view it.

The backend validates:

requisition ID

authenticated identity

authenticated role

requisition visibility

Unauthorized access must not expose requisition data.

PUT /api/requisitions/:id

Updates requisition master data where permitted by the workflow and authorization rules.

Workflow-sensitive state transitions should be handled through the workflow action endpoint rather than allowing arbitrary status changes from the client.

8. Workflow Actions

POST /api/requisitions/:id/actions

Executes a workflow action against a requisition.

Supported actions include:

approve
reject
provision
deactivate

Typical request:

{
"action": "approve",
"comments": "Approved after verification."
}

Provisioning-related requests may additionally include values such as:

{
"action": "provision",
"provisionedEmail": "name@wii.gov.in",
"provisionedMac": "AA:BB:CC:DD:EE:FF",
"provisionedHrmsId": "HRMS-001",
"provisionedBiometricId": "BIO-001"
}

Laboratory workflow actions may include laboratory facility review information.

Workflow authorization

The backend validates:

authenticated actor identity

authenticated actor role

current requisition status

requested action

workflow stage

A role that is valid elsewhere in the workflow must not automatically be allowed to act at every stage.

Administrative deactivation is restricted to administrator roles.

Workflow actions are recorded in workflow audit history.

9. Workflow Stages

The principal statuses used by the requisition workflow include:

draft
submitted_pending_pi
pi_approved
in_lab_review
pending_section_head
in_tech_verification
approved_provisioned
rejected
deactivated

A typical IT/HRMS process is:

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
IT / HRMS
|
v
approved_provisioned

A laboratory-enabled process can include:

submitted_pending_pi
|
v
in_lab_review
|
v
Lab Nodal / Associate Nodal
|
v
pending_section_head

10. Facilities API

GET /api/facilities

Returns facility master records.

Authentication is required.

The response includes information such as:

facility ID

facility name

department

nodal officer

associate nodal officer

supervisor

description

status

workflow stages

timestamps

POST /api/facilities

Creates a new facility.

Administrative authorization is required.

Typical request:

{
"name": "Facility Name",
"dept": "Department",
"nodal": "Nodal Officer",
"assocNodal": "Associate Nodal Officer",
"supervisor": "Supervisor",
"desc": "Description",
"status": "active",
"workflowStages": []
}

Facility IDs are generated server-side.

PUT /api/facilities/:id

Updates a facility.

Administrative authorization is required.

The facility ID comes from the route parameter.

DELETE /api/facilities/:id

Deletes a facility.

Administrative authorization is required.

The backend should return a controlled not-found response when the target record does not exist.

11. Services API

GET /api/services

Returns service master records.

Authentication is required.

The response may contain:

service ID

service name

manager

quota/access specifications

status

workflow stages

timestamps

POST /api/services

Creates a new service.

Administrative authorization is required.

Typical request:

{
"name": "Service Name",
"manager": "Service Manager",
"quota": "Access specification",
"status": "active",
"workflowStages": []
}

Service IDs are generated server-side.

PUT /api/services/:id

Updates a service.

Administrative authorization is required.

DELETE /api/services/:id

Deletes a service.

Administrative authorization is required.

12. Administration APIs

Administrative APIs should always be protected by both:

Authentication +
Administrative authorization

Administrative functionality includes, as applicable:

user role management

facility management

service management

branding/configuration

diagnostic/status information

administrative workflow operations

Administrative permissions must never be granted solely by frontend route visibility.

13. Error Responses

API responses should use a predictable JSON structure.

Example:

{
"success": false,
"message": "Unable to process request."
}

Common HTTP status categories:

200 Successful request
201 Resource created
400 Invalid request
401 Authentication required/invalid
403 Authenticated but not authorized
404 Resource not found
409 Conflict
500 Server-side error
503 Required dependency unavailable

The server should not expose:

database passwords

SQL queries

raw stack traces

internal secrets

unnecessary infrastructure details

14. API Security Rules

Authentication

Protected APIs require a valid authenticated session.

Authorization

Privileged operations require server-side role checks.

Identity

Actor identity must come from the authenticated session.

Validation

Request data must be validated before business operations.

Workflow control

Workflow status transitions must be controlled by the backend.

Data access

A user must not be able to retrieve another user's protected records by changing an ID in the URL.

Auditability

Security-sensitive workflow actions should produce audit records.

15. Frontend API Layer

Frontend API access is centralized rather than spreading raw fetch() calls across feature components.

The primary API client is responsible for:

base request handling

authentication headers

JSON serialization

response parsing

common API error handling

Feature-specific API modules should call the centralized API client.

Recommended pattern:

React Feature
|
v
Feature API module
|
v
apiClient
|
v
Express API

16. Database Separation

The API layer must not access MySQL directly from React.

The backend separates responsibilities:

Route
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

This separation improves:

maintainability

testability

authorization control

database isolation

future API evolution

17. API Testing

API and workflow behavior should be tested at multiple levels.

Unit tests

Current unit coverage includes:

role normalization

requisition visibility

workflow authorization

workflow stage validation

PI approval

laboratory workflow

section-head transition

IT/HRMS provisioning

administrator deactivation

Integration tests

Integration tests should validate:

API authentication

database persistence

authorization middleware

repository/service integration

workflow persistence

audit persistence

E2E tests

End-to-end tests should validate critical business journeys such as:

Login
->
Create requisition
->
Supervisor approval
->
Required workflow stages
->
Provisioning
->
Final access state

18. API Change Rules

New endpoints should:

use the appropriate route module

apply authentication where required

apply authorization where required

validate request input

delegate business logic to services

use repositories for database access

return controlled API responses

include tests for security-sensitive behavior

update this documentation

19. Related Documentation

Architecture:

docs/architecture/README.md

Database documentation:

docs/database/

Security documentation:

docs/security/

Deployment documentation:

docs/deployment/

20. API Maintenance

Any future change to an API contract should update:

route implementation

request/response types

frontend API module

automated tests

API documentation

Backward-incompatible API changes should be explicitly reviewed before deployment.

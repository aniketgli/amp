AMP — Database Documentation

1. Overview

AMP uses MySQL as its persistent relational database.

The database is organized around:

user identity and roles

applicant profiles

facility and service masters

access requisitions

IT/HRMS request details

laboratory access details

workflow state

workflow audit history

The baseline schema is maintained as SQL and database changes are intended to be managed through migrations.

2. Database Name

The baseline schema creates and selects:

wii_access_portal

The baseline schema targets MySQL 8.0+ / MariaDB / Cloud SQL and uses utf8mb4.

3. Database Access Architecture

Application database access follows this structure:

Service / Business Logic
|
v
Repository Layer
|
v
server/db/connection.ts
|
v
MySQL

Application services and frontend components should not open direct database connections.

4. Connection Configuration

The database connection is configured through environment variables.

Typical configuration values:

DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME

The application defaults DB_PORT to 3306 and DB_NAME to wii_access_portal when those values are not explicitly supplied.

The database password must be supplied through DB_PASSWORD; it must not be hard-coded into application source.

5. Connection Pool

The server uses a MySQL connection pool.

The current connection layer is based on mysql2/promise and maintains pooled connections for application queries.

The connection layer also exposes a database connectivity check used during server startup/health validation.

6. Core Tables

The baseline schema defines the following major tables.

users
applicant_profiles
facility_masters
service_masters
requisitions
it_hrms_details
lab_facility_details
workflow_audit_logs

Additional workflow-state structures may be maintained through migration-managed database changes.

7. users

The users table is the master identity and authentication directory.

Key fields include:

Column

Purpose

id

Unique user identifier

full_name

User/official name

email

Unique email address

phone

Mobile/contact number

password_hash

Password hash

is_activated

Account activation state

activation_token

Activation/verification token

role

Primary workflow role in the baseline schema

intercom_extension

Internal telephone extension

status

Account status

last_active_at

Last active timestamp

created_at

Record creation time

updated_at

Last update time

Baseline roles include:

applicant
supervisor
lab_nodal
assoc_lab_nodal
section_head
it_officer
hrms_officer
admin
super_admin

Indexes are defined for email, role and status.

8. applicant_profiles

applicant_profiles stores detailed personnel and engagement information linked to a user.

Important fields include:

user_id
salutation
applicant_name
gender
date_of_birth
blood_group
mobile_no
personal_email
wii_official_email
address
city
state
pincode
designation
department_cell_project
supervising_officer_id
supervising_officer_name
date_of_joining
valid_up_to
pan_no
bank_name
account_no
ifsc_code
office_order_file_name
biometric_id

The profile is linked to users.

The baseline schema defines user_id as unique so that a user has one profile record.

9. facility_masters

The facility master contains research laboratory/facility definitions.

Important fields include:

id
facility_name
department
nodal_officer_id
nodal_officer_name
assoc_nodal_officer_id
assoc_nodal_officer_name
supervisor_id
supervisor_name
description
status
created_at
updated_at

Facility statuses in the baseline schema include:

active
inactive
maintenance

Officer references are linked to the users table.

10. service_masters

The service master contains centrally managed IT, network and administrative services.

Important fields include:

id
service_name
manager_id
manager_name
quota_access_specs
status
created_at
updated_at

Service statuses include:

active
inactive

The service manager may be linked to the users table.

11. requisitions

requisitions is the master table for access applications.

Important fields include:

id
applicant_id
requisition_type
status
requisition_mode
renewal_reason
remarks
submitted_at
updated_at

Supported requisition types:

IT_HRMS
LAB_FACILITY
COMBINED

Supported workflow statuses in the baseline schema:

draft
submitted_pending_pi
pi_approved
in_lab_review
pending_section_head
in_tech_verification
approved_provisioned
rejected
deactivated

Supported requisition modes:

new
renewal

The applicant is linked to the users table.

Indexes are defined for status, type and applicant.

12. it_hrms_details

This table stores IT, institutional email, network, HRMS and biometric requirements associated with a requisition.

Important request fields:

requisition_id
request_email
requested_email_prefix
requested_email_groups
request_internet
device_type
mac_address
request_hrms_pms
request_biometric

Important provisioning fields:

provisioned_email
provisioned_mac
provisioned_hrms_id
provisioned_biometric_id

The requisition relationship is one-to-one in the baseline schema because requisition_id is unique.

13. lab_facility_details

This table maps a requisition to selected laboratory facilities.

Important fields include:

requisition_id
facility_id
facility_name
nodal_approval_status
remarks
reviewed_by_id
reviewed_by
reviewed_at
created_at

Nodal approval status values:

pending
approved
rejected

Foreign-key relationships connect the record to:

requisitions

facility_masters

users for the reviewer

Indexes are provided for requisition and approval status.

14. workflow_audit_logs

The workflow audit table records the approval and processing history of requisitions.

The baseline schema includes fields such as:

requisition_id
actor_id
actor_name
actor_role

The audit structure is intended to preserve who performed an action and the workflow history associated with the requisition.

Security-sensitive actions should always be auditable.

15. Relationships

The primary relationships can be represented as:

users
|
+--------------------> applicant_profiles
|
+--------------------> requisitions
|
+--------------------> facility_masters
|
+--------------------> service_masters
|
+--------------------> workflow_audit_logs

requisitions
|
+--------------------> it_hrms_details
|
+--------------------> lab_facility_details

facility_masters
|
+--------------------> lab_facility_details

16. Referential Integrity

The baseline schema uses foreign keys with InnoDB.

Examples include:

applicant_profiles.user_id
-> users.id

requisitions.applicant_id
-> users.id

it_hrms_details.requisition_id
-> requisitions.id

lab_facility_details.requisition_id
-> requisitions.id

lab_facility_details.facility_id
-> facility_masters.id

Several relationships use cascading or nullifying behavior to prevent orphaned references.

17. Workflow Persistence

Workflow processing is separated from the requisition master record.

The requisition stores the current overall status.

Supporting workflow information records stage-specific information such as:

PI approval

laboratory review

section-head approval

IT/network verification

HRMS processing

provisioning values

audit history

This separation allows the system to maintain both current state and historical actions.

18. Migrations

Database changes should be introduced through the migration system rather than directly modifying a production database without versioning.

Current project command:

npm run db:migrate

The migration runner is implemented under:

server/db/migrate.ts

Migration files belong under:

database/migrations/

Each migration should:

have a clear purpose

be deterministic

be safe to execute in the intended environment

be reviewed before deployment

avoid destructive changes unless explicitly approved

19. Seeds

Seed data should be maintained separately from the base schema.

Target location:

database/seeds/

Seed files should be suitable for development/test environments and must not contain real production credentials.

20. Schema Management Rules

The following rules apply to database changes.

Rule 1

Do not hard-code database credentials.

Rule 2

Use environment variables for connection configuration.

Rule 3

Database access belongs in repositories.

Rule 4

Use migrations for schema evolution.

Rule 5

Avoid manual production schema changes without recording the change.

Rule 6

Add indexes for frequently queried fields where justified.

Rule 7

Use foreign keys for important relational integrity.

Rule 8

Do not store plaintext passwords.

Rule 9

Review destructive changes carefully.

Rule 10

Test migrations against a safe database before production deployment.

21. Backup and Recovery

Database backup and recovery are deployment/operations responsibilities.

A production deployment should have:

scheduled database backups

tested restoration procedures

migration history

controlled access to backup files

protection for database credentials

The application repository should not contain production database dumps containing real personal data.

22. Sensitive Data

Applicant profiles may contain sensitive personnel and financial information such as:

PAN
Bank account number
IFSC
Personal email
Mobile number
Date of birth
Biometric ID
Office order information

Access to such fields must be restricted according to backend authorization rules.

Sensitive data should not be unnecessarily exposed in API responses, logs or client-side storage.

23. Database Security

Recommended database security controls include:

dedicated database credentials for the application

least-privilege database permissions

restricted network access

encrypted transport where supported by the deployment

regular backups

controlled migration access

audit logging for administrative operations

no plaintext credentials in source control

24. Validation

Database constraints provide an important second layer of protection after application validation.

Application validation should happen before repository operations.

Database constraints should still enforce:

primary keys

unique fields

foreign keys

non-null required fields

enumerated workflow/status values where applicable

25. Development vs Production

Development/test databases may use seed data designed for testing.

Production must use:

real environment configuration

real secrets supplied externally

controlled migrations

production-safe backup procedures

restricted database access

Development credentials must never be copied into production.

26. Schema Documentation Maintenance

Any database change should update, where applicable:

database/schema.sql
database/migrations/
database/seeds/
docs/database/README.md

The API/service layer should also be reviewed whenever a schema change affects request or response contracts.

27. Related Documentation

System architecture:

docs/architecture/README.md

API documentation:

docs/api/README.md

Security documentation:

docs/security/

Deployment documentation:

docs/deployment/

28. Current Baseline

The repository contains a baseline SQL schema at:

schema.sql

The target architecture places database artifacts under:

database/
├── schema.sql
├── migrations/
└── seeds/

The schema location should be normalized during the final cleanup phase without losing the existing baseline schema.

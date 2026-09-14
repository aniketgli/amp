-- Seed the complete static Access catalogue into the database masters.
-- Existing records are preserved; only missing catalogue IDs are inserted.

INSERT INTO service_masters
  (id, service_name, manager_name, quota_access_specs, status)
VALUES
  ('SRV-02', 'Campus Internet & Wi-Fi MAC Address Registration', 'Not Configured', 'Standard Device Access', 'active'),
  ('SRV-03', 'HRMS / PMS Portal & Biometric Attendance', 'Not Configured', 'Standard Access', 'active'),
  ('SRV-04', 'Institute Smart Identity Card & RFID Campus Pass', 'Not Configured', 'Standard Access', 'active')
ON DUPLICATE KEY UPDATE
  service_name = VALUES(service_name),
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO facility_masters
  (id, facility_name, department, nodal_officer_name, assoc_nodal_officer_name, supervisor_name, description, status)
VALUES
  (
    'FAC-01',
    'WII Research Laboratory Access Facilities',
    'Research Laboratories Division',
    'Not Configured',
    'Not Configured',
    'Dr. R. K. Singh',
    'Equipment Usage Authorization & Nodal Approvals across 9 Specialized Research Labs',
    'active'
  )
ON DUPLICATE KEY UPDATE
  facility_name = VALUES(facility_name),
  description = VALUES(description),
  updated_at = CURRENT_TIMESTAMP;

-- Keep the existing Email service (SRV-01) and the seeded catalogue services
-- on the appropriate static Access scopes. The Access UI determines whether
-- Quota / Access is shown only for Email and Internet services.

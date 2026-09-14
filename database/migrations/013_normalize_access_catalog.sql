-- Normalize the Access master catalogue to the agreed structure:
-- 4 services + 1 combined Labs & Facility master record.
-- Existing records are updated in-place so previously seeded databases converge safely.

INSERT INTO service_masters
  (id, service_name, manager_name, quota_access_specs, status)
VALUES
  ('SRV-01', 'Official WII Email ID (@wii.gov.in)', 'Not Configured', 'Institute Webmail Account, Domain Access & Group Mappings', 'active'),
  ('SRV-02', 'Campus Internet & Wi-Fi MAC Address Registration', 'Not Configured', 'Device Hardware Address MAC Binding for High-Speed LAN & Campus Wi-Fi', 'active'),
  ('SRV-03', 'HRMS / PMS Portal & Biometric Attendance', 'Not Configured', NULL, 'active'),
  ('SRV-04', 'Institute Smart Identity Card & RFID Campus Pass', 'Not Configured', NULL, 'active')
ON DUPLICATE KEY UPDATE
  service_name = VALUES(service_name),
  quota_access_specs = VALUES(quota_access_specs),
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO facility_masters
  (id, facility_name, department, nodal_officer_name, assoc_nodal_officer_name, supervisor_name, description, status)
VALUES
  (
    'FAC-01',
    'Labs & Facility',
    'Research Laboratories Division',
    'Not Configured',
    'Not Configured',
    'Dr. R. K. Singh',
    'Single master record for laboratory and facility access. Individual lab/facility names will be maintained within this master.',
    'active'
  )
ON DUPLICATE KEY UPDATE
  facility_name = VALUES(facility_name),
  description = VALUES(description),
  updated_at = CURRENT_TIMESTAMP;

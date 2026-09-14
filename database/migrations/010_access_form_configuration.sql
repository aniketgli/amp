-- ============================================================================
-- ACCESS FORM CONFIGURATION
-- Facilities & Services Master records own the popup form configuration.
-- ============================================================================

ALTER TABLE service_masters
  ADD COLUMN form_config JSON NULL COMMENT 'DB-driven Access popup form configuration';

ALTER TABLE facility_masters
  ADD COLUMN form_config JSON NULL COMMENT 'DB-driven facility access popup form configuration';

-- Seed configuration for existing Services Master records.
-- New/unknown services receive a safe generic form and can be customized later.

UPDATE service_masters
SET form_config = JSON_OBJECT(
  'scope', 'email',
  'fields', JSON_ARRAY(
    JSON_OBJECT(
      'key', 'requestedEmailPrefix',
      'label', 'Requested Email Address Prefix',
      'type', 'text',
      'required', true,
      'placeholder', 'name.surname'
    ),
    JSON_OBJECT(
      'key', 'requestedEmailGroups',
      'label', 'Mailing Groups',
      'type', 'multiselect',
      'required', false,
      'options', JSON_ARRAY(
        JSON_OBJECT('value', 'All Staff', 'label', 'All Staff'),
        JSON_OBJECT('value', 'Faculty & Scientists', 'label', 'Faculty & Scientists'),
        JSON_OBJECT('value', 'Researchers & Fellows', 'label', 'Researchers & Fellows'),
        JSON_OBJECT('value', 'CAMPA Project', 'label', 'CAMPA Project'),
        JSON_OBJECT('value', 'IT & GIS Cell', 'label', 'IT & GIS Cell'),
        JSON_OBJECT('value', 'Wildlife Conservation Group', 'label', 'Wildlife Conservation Group')
      )
    )
  )
)
WHERE form_config IS NULL
  AND LOWER(service_name) REGEXP 'email|webmail|mail';

UPDATE service_masters
SET form_config = JSON_OBJECT(
  'scope', 'mac',
  'maxDevices', 2,
  'fields', JSON_ARRAY(
    JSON_OBJECT(
      'key', 'deviceType',
      'label', 'Hardware Device Type',
      'type', 'select',
      'required', true,
      'options', JSON_ARRAY(
        JSON_OBJECT('value', 'Laptop Workstation', 'label', 'Laptop Workstation'),
        JSON_OBJECT('value', 'Desktop Computer', 'label', 'Desktop Computer'),
        JSON_OBJECT('value', 'Mobile / Smartphone', 'label', 'Mobile / Smartphone'),
        JSON_OBJECT('value', 'Tablet / iPad', 'label', 'Tablet / iPad'),
        JSON_OBJECT('value', 'Research Instrument PC', 'label', 'Research Instrument PC')
      )
    ),
    JSON_OBJECT(
      'key', 'macAddress',
      'label', 'Physical MAC Hardware Address',
      'type', 'text',
      'required', true,
      'placeholder', 'XX:XX:XX:XX:XX:XX',
      'helpText', 'Format: XX:XX:XX:XX:XX:XX'
    )
  )
)
WHERE form_config IS NULL
  AND LOWER(service_name) REGEXP 'wifi|wi-fi|internet|mac|network';

UPDATE service_masters
SET form_config = JSON_OBJECT(
  'scope', 'hrms',
  'fields', JSON_ARRAY(
    JSON_OBJECT(
      'key', 'requestHrmsPms',
      'label', 'HRMS / PMS Portal Access',
      'type', 'checkbox',
      'required', false
    ),
    JSON_OBJECT(
      'key', 'requestBiometric',
      'label', 'Biometric ID Allocation',
      'type', 'checkbox',
      'required', false
    )
  )
)
WHERE form_config IS NULL
  AND LOWER(service_name) REGEXP 'hrms|payroll|biometric|attendance';

UPDATE service_masters
SET form_config = JSON_OBJECT(
  'scope', 'combined',
  'fields', JSON_ARRAY(
    JSON_OBJECT(
      'key', 'requestedEmailPrefix',
      'label', 'Requested Email Address Prefix',
      'type', 'text',
      'required', false,
      'placeholder', 'name.surname'
    ),
    JSON_OBJECT(
      'key', 'deviceType',
      'label', 'Hardware Device Type',
      'type', 'select',
      'required', false,
      'options', JSON_ARRAY(
        JSON_OBJECT('value', 'Laptop Workstation', 'label', 'Laptop Workstation'),
        JSON_OBJECT('value', 'Desktop Computer', 'label', 'Desktop Computer'),
        JSON_OBJECT('value', 'Mobile / Smartphone', 'label', 'Mobile / Smartphone'),
        JSON_OBJECT('value', 'Tablet / iPad', 'label', 'Tablet / iPad'),
        JSON_OBJECT('value', 'Research Instrument PC', 'label', 'Research Instrument PC')
      )
    ),
    JSON_OBJECT(
      'key', 'macAddress',
      'label', 'Physical MAC Hardware Address',
      'type', 'text',
      'required', false,
      'placeholder', 'XX:XX:XX:XX:XX:XX'
    ),
    JSON_OBJECT(
      'key', 'requestHrmsPms',
      'label', 'HRMS / PMS Portal Access',
      'type', 'checkbox',
      'required', false
    ),
    JSON_OBJECT(
      'key', 'requestBiometric',
      'label', 'Biometric ID Allocation',
      'type', 'checkbox',
      'required', false
    )
  )
)
WHERE form_config IS NULL
  AND LOWER(service_name) REGEXP 'combined|access';

UPDATE service_masters
SET form_config = JSON_OBJECT(
  'scope', 'combined',
  'fields', JSON_ARRAY(
    JSON_OBJECT(
      'key', 'requestDetails',
      'label', 'Request Details / Justification',
      'type', 'textarea',
      'required', true,
      'placeholder', 'Describe the access/service required and the official purpose.'
    )
  )
)
WHERE form_config IS NULL;

-- Seed facility access form configuration for existing Facilities Master records.
UPDATE facility_masters
SET form_config = JSON_OBJECT(
  'scope', 'lab',
  'fields', JSON_ARRAY(
    JSON_OBJECT(
      'key', 'purposeEquipment',
      'label', 'Purpose & Equipment / Instrument to be Used',
      'type', 'textarea',
      'required', true,
      'placeholder', 'Specify research purpose, equipment/instrument and sample details.'
    ),
    JSON_OBJECT(
      'key', 'fromDate',
      'label', 'Access Period - From Date',
      'type', 'date',
      'required', true
    ),
    JSON_OBJECT(
      'key', 'toDate',
      'label', 'Access Period - To Date',
      'type', 'date',
      'required', true
    ),
    JSON_OBJECT(
      'key', 'hasBiometricId',
      'label', 'Do you already have an assigned / registered Biometric ID?',
      'type', 'radio',
      'required', true,
      'options', JSON_ARRAY(
        JSON_OBJECT('value', 'yes', 'label', 'Yes, I have a Biometric ID'),
        JSON_OBJECT('value', 'no', 'label', 'No, Biometric ID not created yet')
      )
    ),
    JSON_OBJECT(
      'key', 'biometricIdNumber',
      'label', 'Existing Biometric ID Number',
      'type', 'text',
      'required', true,
      'visibleWhen', JSON_OBJECT('field', 'hasBiometricId', 'equals', 'yes')
    )
  )
)
WHERE form_config IS NULL;

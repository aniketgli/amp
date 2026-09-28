-- ============================================================================
-- OFFICIAL WII EMAIL SERVICE FORM MASTER
-- Align SRV-01 with the approved application form. Values are DB-driven.
-- ============================================================================

UPDATE service_masters
SET form_config = JSON_OBJECT(
  'scope', 'email',
  'emailDomain', '@wii.gov.in',
  'fields', JSON_ARRAY(
    JSON_OBJECT(
      'key', 'requestedEmailPrefix',
      'label', 'Requested Email Address Prefix',
      'type', 'text',
      'required', true,
      'placeholder', 'Enter preferred email address prefix'
    )
  )
)
WHERE id = 'SRV-01';

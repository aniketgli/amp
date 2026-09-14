-- The existing requisition API stores the submission summary in remarks.
-- Capture the structured FORM_DATA payload into the dedicated JSON column
-- without changing the existing workflow submission contract.

DROP TRIGGER IF EXISTS trg_requisitions_form_data_before_insert;

CREATE TRIGGER trg_requisitions_form_data_before_insert
BEFORE INSERT ON requisitions
FOR EACH ROW
BEGIN
  DECLARE payload LONGTEXT;
  SET payload = TRIM(SUBSTRING_INDEX(COALESCE(NEW.remarks, ''), 'FORM_DATA:', -1));

  IF payload <> COALESCE(NEW.remarks, '') AND JSON_VALID(payload) THEN
    SET NEW.form_data = CAST(payload AS JSON);
  END IF;
END;

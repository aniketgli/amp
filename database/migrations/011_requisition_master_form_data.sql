-- Persist the exact values entered against the master-driven access form.
ALTER TABLE requisitions
  ADD COLUMN selected_service_key VARCHAR(100) NULL,
  ADD COLUMN selected_service_label VARCHAR(255) NULL,
  ADD COLUMN service_name VARCHAR(255) NULL,
  ADD COLUMN form_data JSON NULL;

CREATE INDEX idx_req_service_key
  ON requisitions (selected_service_key);

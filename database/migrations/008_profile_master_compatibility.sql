-- Compatibility repair for installations where migration 007 was applied
-- before batch_number was introduced. Safe for fresh installations too.
SET @has_msc_batch_number := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'profile_msc_batches' AND COLUMN_NAME = 'batch_number');
SET @sql := IF(@has_msc_batch_number = 0, 'ALTER TABLE profile_msc_batches ADD COLUMN batch_number INT UNSIGNED NULL AFTER stream_id', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_trainee_batch_number := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'profile_trainee_batches' AND COLUMN_NAME = 'batch_number');
SET @sql := IF(@has_trainee_batch_number = 0, 'ALTER TABLE profile_trainee_batches ADD COLUMN batch_number INT UNSIGNED NULL AFTER course_id', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := 'UPDATE profile_msc_batches b JOIN (SELECT id, ROW_NUMBER() OVER (PARTITION BY stream_id ORDER BY validity_start_year, id) AS rn FROM profile_msc_batches) x ON x.id=b.id SET b.batch_number=x.rn WHERE b.batch_number IS NULL';
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := 'UPDATE profile_trainee_batches b JOIN (SELECT id, ROW_NUMBER() OVER (PARTITION BY course_id ORDER BY validity_start_year, id) AS rn FROM profile_trainee_batches) x ON x.id=b.id SET b.batch_number=x.rn WHERE b.batch_number IS NULL';
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := 'ALTER TABLE profile_msc_batches MODIFY COLUMN batch_number INT UNSIGNED NOT NULL';
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := 'ALTER TABLE profile_trainee_batches MODIFY COLUMN batch_number INT UNSIGNED NOT NULL';
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_msc_idx := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='profile_msc_batches' AND INDEX_NAME='uq_profile_msc_batch_stream_number');
SET @sql := IF(@has_msc_idx=0, 'ALTER TABLE profile_msc_batches ADD UNIQUE KEY uq_profile_msc_batch_stream_number (stream_id, batch_number)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_trainee_idx := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='profile_trainee_batches' AND INDEX_NAME='uq_profile_trainee_batch_course_number');
SET @sql := IF(@has_trainee_idx=0, 'ALTER TABLE profile_trainee_batches ADD UNIQUE KEY uq_profile_trainee_batch_course_number (course_id, batch_number)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

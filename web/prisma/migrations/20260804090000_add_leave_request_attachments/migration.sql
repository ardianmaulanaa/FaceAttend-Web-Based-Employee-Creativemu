ALTER TABLE `LeaveRequest`
  ADD COLUMN `attachment_file` LONGBLOB NULL,
  ADD COLUMN `attachment_name` VARCHAR(255) NULL,
  ADD COLUMN `attachment_mime` VARCHAR(100) NULL;

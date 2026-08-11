ALTER TABLE `users`
  ADD COLUMN `profile_photo_data` LONGBLOB NULL,
  ADD COLUMN `profile_photo_mime` VARCHAR(50) NULL;

ALTER TABLE `Announcement`
  ADD COLUMN `document_file` LONGBLOB NULL;

ALTER TABLE `app_settings`
  ADD COLUMN `setting_file` LONGBLOB NULL,
  ADD COLUMN `setting_mime` VARCHAR(100) NULL;

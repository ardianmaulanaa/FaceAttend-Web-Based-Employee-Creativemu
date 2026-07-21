-- Rename internal master data "Unit" to "Jabatan".
-- This keeps existing data and only changes table/column/index/foreign key names.

-- Drop old foreign keys before renaming columns/tables.
ALTER TABLE `users` DROP FOREIGN KEY `users_unit_id_fkey`;
ALTER TABLE `Position` DROP FOREIGN KEY `Position_unit_id_fkey`;
ALTER TABLE `Unit` DROP FOREIGN KEY `Unit_department_id_fkey`;

-- Rename the master table and relation columns.
RENAME TABLE `Unit` TO `jabatans`;
ALTER TABLE `users` RENAME COLUMN `unit_id` TO `jabatan_id`;
ALTER TABLE `Position` RENAME COLUMN `unit_id` TO `jabatan_id`;

-- Rename indexes that still carry the old unit naming.
ALTER TABLE `jabatans` RENAME INDEX `Unit_department_id_name_key` TO `jabatans_department_id_name_key`;
ALTER TABLE `jabatans` RENAME INDEX `Unit_department_id_idx` TO `jabatans_department_id_idx`;
ALTER TABLE `users` RENAME INDEX `users_unit_id_idx` TO `users_jabatan_id_idx`;
ALTER TABLE `Position` RENAME INDEX `Position_unit_id_name_key` TO `Position_jabatan_id_name_key`;
ALTER TABLE `Position` RENAME INDEX `Position_unit_id_idx` TO `Position_jabatan_id_idx`;

-- Recreate foreign keys with Jabatan naming.
ALTER TABLE `jabatans`
  ADD CONSTRAINT `jabatans_department_id_fkey`
  FOREIGN KEY (`department_id`) REFERENCES `Department`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `users`
  ADD CONSTRAINT `users_jabatan_id_fkey`
  FOREIGN KEY (`jabatan_id`) REFERENCES `jabatans`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `Position`
  ADD CONSTRAINT `Position_jabatan_id_fkey`
  FOREIGN KEY (`jabatan_id`) REFERENCES `jabatans`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

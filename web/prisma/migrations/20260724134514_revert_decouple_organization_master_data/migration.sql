-- Mengembalikan relasi Department ke OfficeLocation
ALTER TABLE `Department`
  ADD COLUMN `office_id` CHAR(36) NULL;

-- Mengembalikan relasi Jabatan ke Department
ALTER TABLE `jabatans`
  ADD COLUMN `department_id` CHAR(36) NULL;

-- Mengembalikan relasi Position ke Jabatan
ALTER TABLE `Position`
  ADD COLUMN `jabatan_id` CHAR(36) NULL;

-- Memulihkan Department.office_id berdasarkan relasi karyawan
UPDATE `Department` AS department_data
JOIN (
  SELECT
    `department_id`,
    MIN(`registered_office_id`) AS `office_id`
  FROM `users`
  WHERE
    `department_id` IS NOT NULL
    AND `registered_office_id` IS NOT NULL
  GROUP BY `department_id`
  HAVING COUNT(DISTINCT `registered_office_id`) = 1
) AS employee_mapping
  ON employee_mapping.`department_id` = department_data.`id`
SET department_data.`office_id` = employee_mapping.`office_id`;

-- Memulihkan Jabatan.department_id berdasarkan relasi karyawan
UPDATE `jabatans` AS jabatan_data
JOIN (
  SELECT
    `jabatan_id`,
    MIN(`department_id`) AS `department_id`
  FROM `users`
  WHERE
    `jabatan_id` IS NOT NULL
    AND `department_id` IS NOT NULL
  GROUP BY `jabatan_id`
  HAVING COUNT(DISTINCT `department_id`) = 1
) AS employee_mapping
  ON employee_mapping.`jabatan_id` = jabatan_data.`id`
SET jabatan_data.`department_id` = employee_mapping.`department_id`;

-- Memulihkan Position.jabatan_id berdasarkan relasi karyawan
UPDATE `Position` AS position_data
JOIN (
  SELECT
    `position_id`,
    MIN(`jabatan_id`) AS `jabatan_id`
  FROM `users`
  WHERE
    `position_id` IS NOT NULL
    AND `jabatan_id` IS NOT NULL
  GROUP BY `position_id`
  HAVING COUNT(DISTINCT `jabatan_id`) = 1
) AS employee_mapping
  ON employee_mapping.`position_id` = position_data.`id`
SET position_data.`jabatan_id` = employee_mapping.`jabatan_id`;

CREATE UNIQUE INDEX `Department_office_id_name_key`
  ON `Department`(`office_id`, `name`);

CREATE INDEX `Department_office_id_idx`
  ON `Department`(`office_id`);

CREATE UNIQUE INDEX `jabatans_department_id_name_key`
  ON `jabatans`(`department_id`, `name`);

CREATE INDEX `jabatans_department_id_idx`
  ON `jabatans`(`department_id`);

CREATE UNIQUE INDEX `Position_jabatan_id_name_key`
  ON `Position`(`jabatan_id`, `name`);

CREATE INDEX `Position_jabatan_id_idx`
  ON `Position`(`jabatan_id`);

ALTER TABLE `Department`
  ADD CONSTRAINT `Department_office_id_fkey`
  FOREIGN KEY (`office_id`)
  REFERENCES `OfficeLocation`(`id`)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

ALTER TABLE `jabatans`
  ADD CONSTRAINT `jabatans_department_id_fkey`
  FOREIGN KEY (`department_id`)
  REFERENCES `Department`(`id`)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

ALTER TABLE `Position`
  ADD CONSTRAINT `Position_jabatan_id_fkey`
  FOREIGN KEY (`jabatan_id`)
  REFERENCES `jabatans`(`id`)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

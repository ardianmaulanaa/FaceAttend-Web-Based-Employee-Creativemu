-- DropForeignKey
ALTER TABLE `Department` DROP FOREIGN KEY `Department_office_id_fkey`;

-- DropForeignKey
ALTER TABLE `Position` DROP FOREIGN KEY `Position_jabatan_id_fkey`;

-- DropForeignKey
ALTER TABLE `jabatans` DROP FOREIGN KEY `jabatans_department_id_fkey`;

-- DropIndex
DROP INDEX `Department_office_id_idx` ON `Department`;

-- DropIndex
DROP INDEX `Department_office_id_name_key` ON `Department`;

-- DropIndex
DROP INDEX `Position_jabatan_id_idx` ON `Position`;

-- DropIndex
DROP INDEX `Position_jabatan_id_name_key` ON `Position`;

-- DropIndex
DROP INDEX `jabatans_department_id_idx` ON `jabatans`;

-- DropIndex
DROP INDEX `jabatans_department_id_name_key` ON `jabatans`;

-- AlterTable
ALTER TABLE `Department` DROP COLUMN `office_id`;

-- AlterTable
ALTER TABLE `Position` DROP COLUMN `jabatan_id`;

-- AlterTable
ALTER TABLE `jabatans` DROP COLUMN `department_id`;

-- CreateIndex
CREATE INDEX `Department_name_idx` ON `Department`(`name`);

-- CreateIndex
CREATE INDEX `Position_name_idx` ON `Position`(`name`);

-- CreateIndex
CREATE INDEX `jabatans_name_idx` ON `jabatans`(`name`);

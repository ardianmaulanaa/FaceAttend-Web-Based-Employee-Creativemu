SET @rename_jabatan_table_sql = (
  SELECT IF(
    EXISTS (
      SELECT 1
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'jabatans'
    )
    AND NOT EXISTS (
      SELECT 1
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'jabatan'
    ),
    'RENAME TABLE `jabatans` TO `jabatan`',
    'SELECT 1'
  )
);

PREPARE rename_jabatan_table_stmt FROM @rename_jabatan_table_sql;
EXECUTE rename_jabatan_table_stmt;
DEALLOCATE PREPARE rename_jabatan_table_stmt;

SET @rename_jabatan_unique_sql = (
  SELECT IF(
    EXISTS (
      SELECT 1
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'jabatan'
        AND INDEX_NAME = 'jabatans_department_id_name_key'
    )
    AND NOT EXISTS (
      SELECT 1
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'jabatan'
        AND INDEX_NAME = 'jabatan_department_id_name_key'
    ),
    'ALTER TABLE `jabatan` RENAME INDEX `jabatans_department_id_name_key` TO `jabatan_department_id_name_key`',
    'SELECT 1'
  )
);

PREPARE rename_jabatan_unique_stmt FROM @rename_jabatan_unique_sql;
EXECUTE rename_jabatan_unique_stmt;
DEALLOCATE PREPARE rename_jabatan_unique_stmt;

SET @rename_jabatan_index_sql = (
  SELECT IF(
    EXISTS (
      SELECT 1
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'jabatan'
        AND INDEX_NAME = 'jabatans_department_id_idx'
    )
    AND NOT EXISTS (
      SELECT 1
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'jabatan'
        AND INDEX_NAME = 'jabatan_department_id_idx'
    ),
    'ALTER TABLE `jabatan` RENAME INDEX `jabatans_department_id_idx` TO `jabatan_department_id_idx`',
    'SELECT 1'
  )
);

PREPARE rename_jabatan_index_stmt FROM @rename_jabatan_index_sql;
EXECUTE rename_jabatan_index_stmt;
DEALLOCATE PREPARE rename_jabatan_index_stmt;

SET @drop_old_jabatan_fk_sql = (
  SELECT IF(
    EXISTS (
      SELECT 1
      FROM information_schema.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'jabatan'
        AND CONSTRAINT_NAME = 'jabatans_department_id_fkey'
    )
    AND NOT EXISTS (
      SELECT 1
      FROM information_schema.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'jabatan'
        AND CONSTRAINT_NAME = 'jabatan_department_id_fkey'
    ),
    'ALTER TABLE `jabatan` DROP FOREIGN KEY `jabatans_department_id_fkey`',
    'SELECT 1'
  )
);

PREPARE drop_old_jabatan_fk_stmt FROM @drop_old_jabatan_fk_sql;
EXECUTE drop_old_jabatan_fk_stmt;
DEALLOCATE PREPARE drop_old_jabatan_fk_stmt;

SET @add_new_jabatan_fk_sql = (
  SELECT IF(
    NOT EXISTS (
      SELECT 1
      FROM information_schema.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'jabatan'
        AND CONSTRAINT_NAME = 'jabatan_department_id_fkey'
    ),
    'ALTER TABLE `jabatan` ADD CONSTRAINT `jabatan_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `Department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
    'SELECT 1'
  )
);

PREPARE add_new_jabatan_fk_stmt FROM @add_new_jabatan_fk_sql;
EXECUTE add_new_jabatan_fk_stmt;
DEALLOCATE PREPARE add_new_jabatan_fk_stmt;

SET @add_leave_quota_yearly_sql = (
  SELECT IF(
    EXISTS (
      SELECT 1
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME = 'leave_quota_yearly'
    ),
    'SELECT 1',
    'ALTER TABLE `users` ADD COLUMN `leave_quota_yearly` INTEGER NOT NULL DEFAULT 12'
  )
);

PREPARE add_leave_quota_yearly_stmt FROM @add_leave_quota_yearly_sql;
EXECUTE add_leave_quota_yearly_stmt;
DEALLOCATE PREPARE add_leave_quota_yearly_stmt;

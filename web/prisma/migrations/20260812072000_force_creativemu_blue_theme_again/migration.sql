INSERT INTO `app_settings` (`setting_key`, `setting_value`)
VALUES (
  'app_theme_colors',
  '{"primaryColor":"#123c8c","primaryHoverColor":"#0f3274","softColor":"#eaf1ff","subtleColor":"#f8fbff","textColor":"#123c8c"}'
)
ON DUPLICATE KEY UPDATE
  `setting_value` = VALUES(`setting_value`),
  `updated_at` = CURRENT_TIMESTAMP(3);

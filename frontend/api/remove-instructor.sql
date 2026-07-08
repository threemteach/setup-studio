-- Remove instructor columns from academy_content table
ALTER TABLE academy_content
  DROP COLUMN IF EXISTS instructor_label_en,
  DROP COLUMN IF EXISTS instructor_label_ar,
  DROP COLUMN IF EXISTS instructor_heading_en,
  DROP COLUMN IF EXISTS instructor_heading_ar,
  DROP COLUMN IF EXISTS instructor_body_en,
  DROP COLUMN IF EXISTS instructor_body_ar,
  DROP COLUMN IF EXISTS instructor_info_en,
  DROP COLUMN IF EXISTS instructor_info_ar,
  DROP COLUMN IF EXISTS instructor_photo_url,
  DROP COLUMN IF EXISTS instructor_photo_id;

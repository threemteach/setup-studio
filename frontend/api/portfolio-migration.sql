-- Create portfolio_content table (singleton for page-level content)
CREATE TABLE IF NOT EXISTS portfolio_content (
  id INTEGER PRIMARY KEY DEFAULT 1,
  hero_heading_en TEXT DEFAULT '',
  hero_heading_ar TEXT DEFAULT '',
  hero_subtitle_en TEXT DEFAULT '',
  hero_subtitle_ar TEXT DEFAULT '',
  categories JSONB DEFAULT '[]'::jsonb, -- [{ slug, heading_en, heading_ar, desc_en, desc_ar }]
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE portfolio_content DISABLE ROW LEVEL SECURITY;

INSERT INTO portfolio_content (id, hero_heading_en, hero_heading_ar, hero_subtitle_en, hero_subtitle_ar)
VALUES (1, 'Our Work', 'أعمالنا', 'Explore our video production portfolio across different categories', 'تصفح أعمالنا في إنتاج الفيديو عبر مختلف الفئات')
ON CONFLICT (id) DO NOTHING;

-- Create portfolio_videos table (one row per video)
CREATE TABLE IF NOT EXISTS portfolio_videos (
  id BIGSERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  title_en TEXT DEFAULT '',
  title_ar TEXT DEFAULT '',
  description_en TEXT DEFAULT '',
  description_ar TEXT DEFAULT '',
  video_url TEXT NOT NULL,
  video_key TEXT DEFAULT '',
  thumbnail_url TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE portfolio_videos DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_portfolio_videos_category ON portfolio_videos(category);

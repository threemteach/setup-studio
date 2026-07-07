-- ═══════════════════════════════════════════════
-- RLS Policies for all public-facing tables
-- Public = SELECT only
-- Authenticated = INSERT, UPDATE, DELETE
-- ═══════════════════════════════════════════════

-- ─── homepage_content ───
ALTER TABLE homepage_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_select" ON homepage_content;
DROP POLICY IF EXISTS "auth_insert" ON homepage_content;
DROP POLICY IF EXISTS "auth_update" ON homepage_content;
DROP POLICY IF EXISTS "auth_delete" ON homepage_content;
CREATE POLICY "public_select" ON homepage_content FOR SELECT USING (true);
CREATE POLICY "auth_insert" ON homepage_content FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_update" ON homepage_content FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "auth_delete" ON homepage_content FOR DELETE USING (auth.role() = 'authenticated');

-- ─── about_content ───
ALTER TABLE about_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_select" ON about_content;
DROP POLICY IF EXISTS "auth_insert" ON about_content;
DROP POLICY IF EXISTS "auth_update" ON about_content;
DROP POLICY IF EXISTS "auth_delete" ON about_content;
CREATE POLICY "public_select" ON about_content FOR SELECT USING (true);
CREATE POLICY "auth_insert" ON about_content FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_update" ON about_content FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "auth_delete" ON about_content FOR DELETE USING (auth.role() = 'authenticated');

-- ─── academy_content ───
ALTER TABLE academy_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_select" ON academy_content;
DROP POLICY IF EXISTS "auth_insert" ON academy_content;
DROP POLICY IF EXISTS "auth_update" ON academy_content;
DROP POLICY IF EXISTS "auth_delete" ON academy_content;
CREATE POLICY "public_select" ON academy_content FOR SELECT USING (true);
CREATE POLICY "auth_insert" ON academy_content FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_update" ON academy_content FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "auth_delete" ON academy_content FOR DELETE USING (auth.role() = 'authenticated');

-- ─── photos ───
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_select" ON photos;
DROP POLICY IF EXISTS "auth_insert" ON photos;
DROP POLICY IF EXISTS "auth_update" ON photos;
DROP POLICY IF EXISTS "auth_delete" ON photos;
CREATE POLICY "public_select" ON photos FOR SELECT USING (true);
CREATE POLICY "auth_insert" ON photos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_update" ON photos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "auth_delete" ON photos FOR DELETE USING (auth.role() = 'authenticated');

-- ─── portfolio_content ───
ALTER TABLE portfolio_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_select" ON portfolio_content;
DROP POLICY IF EXISTS "auth_insert" ON portfolio_content;
DROP POLICY IF EXISTS "auth_update" ON portfolio_content;
DROP POLICY IF EXISTS "auth_delete" ON portfolio_content;
CREATE POLICY "public_select" ON portfolio_content FOR SELECT USING (true);
CREATE POLICY "auth_insert" ON portfolio_content FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_update" ON portfolio_content FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "auth_delete" ON portfolio_content FOR DELETE USING (auth.role() = 'authenticated');

-- ─── portfolio_videos ───
ALTER TABLE portfolio_videos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_select" ON portfolio_videos;
DROP POLICY IF EXISTS "auth_insert" ON portfolio_videos;
DROP POLICY IF EXISTS "auth_update" ON portfolio_videos;
DROP POLICY IF EXISTS "auth_delete" ON portfolio_videos;
CREATE POLICY "public_select" ON portfolio_videos FOR SELECT USING (true);
CREATE POLICY "auth_insert" ON portfolio_videos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "auth_update" ON portfolio_videos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "auth_delete" ON portfolio_videos FOR DELETE USING (auth.role() = 'authenticated');

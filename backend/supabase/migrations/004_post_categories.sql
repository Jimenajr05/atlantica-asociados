-- Las publicaciones existentes pertenecen al Blog.
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'blog'
  CHECK (category IN ('blog', 'noticias'));

CREATE INDEX IF NOT EXISTS idx_posts_category_published
  ON public.posts(category, published, published_at DESC);

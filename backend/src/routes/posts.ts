import { Router, Request, Response } from 'express';
import { getPublicPosts, getPostBySlug } from '../services/posts-store';

const router = Router();

// GET /api/posts
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const posts = await getPublicPosts();
    res.json({ success: true, posts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/posts/:slug
router.get('/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const post = await getPostBySlug(slug);

    if (!post || !post.published) {
      res.status(404).json({ error: 'Artículo no encontrado.' });
      return;
    }

    res.json({ success: true, post });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

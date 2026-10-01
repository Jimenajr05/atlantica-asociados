import { Router, Request, Response } from 'express';
import { requireAdmin } from '../middleware/require-admin';
import { postSchema, postUpdateSchema } from '../validations/post';
import {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
} from '../services/posts-store';

const router = Router();
router.use(requireAdmin);

// GET /api/admin/posts
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const posts = await getAllPosts();
    res.json({ success: true, posts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/posts
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = postSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: result.error.issues[0].message });
      return;
    }
    const body = result.data;
    const { title, slug, excerpt, content, published, category } = body;
    const post = await createPost({
      category: category || 'blog',
      title: title.trim(),
      slug: slug.trim().toLowerCase(),
      excerpt: excerpt?.trim() || '',
      meta_description: excerpt?.trim() || '',
      content,
      published: Boolean(published),
    });

    res.json({ success: true, post });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/posts/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const post = await getPostById(id);

    if (post) {
      res.json({ success: true, post });
      return;
    }

    res.status(404).json({ error: 'Artículo no encontrado.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/posts/:id
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = postUpdateSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: result.error.issues[0].message });
      return;
    }
    const body = result.data;
    const { excerpt } = body;

    const updated = await updatePost(id, {
      ...body,
      ...(excerpt !== undefined ? { meta_description: excerpt } : {}),
    });

    if (updated) {
      res.json({ success: true, post: updated });
      return;
    }

    res.status(404).json({ error: 'Artículo no encontrado.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/admin/posts/:id
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await deletePost(id);
    if (!deleted) {
      res.status(404).json({ error: 'Artículo no encontrado.' });
      return;
    }
    res.json({ success: true, message: 'Artículo eliminado.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

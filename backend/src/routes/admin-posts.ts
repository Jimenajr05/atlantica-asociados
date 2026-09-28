import { Router, Request, Response } from 'express';
import {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
} from '../services/posts-store';

const router = Router();

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
    const body = req.body || {};
    const { title, slug, excerpt, content, meta_description, published } = body;

    if (!title || !slug || !content) {
      res.status(400).json({ error: 'Título, slug y contenido en Markdown son obligatorios.' });
      return;
    }

    const post = await createPost({
      title: title.trim(),
      slug: slug.trim().toLowerCase(),
      excerpt: excerpt?.trim() || '',
      meta_description: meta_description?.trim() || excerpt?.trim() || '',
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
    const body = req.body || {};
    const { title, slug, excerpt, content, meta_description, published } = body;

    const updated = await updatePost(id, {
      title,
      slug,
      excerpt,
      content,
      meta_description,
      published: Boolean(published),
    });

    if (updated) {
      res.json({ success: true, post: updated });
      return;
    }

    res.status(400).json({ error: 'No se pudo actualizar el artículo.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/admin/posts/:id
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await deletePost(id);
    res.json({ success: true, message: 'Artículo eliminado.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

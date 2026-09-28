import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

export async function parseAndSanitizeMarkdown(markdownText: string): Promise<string> {
  if (!markdownText) return '';

  // Renderizar markdown a HTML
  const rawHtml = await marked.parse(markdownText, {
    async: true,
    gfm: true,
    breaks: true,
  });

  // Sanitizar exhaustivamente para evitar cualquier vector XSS
  const cleanHtml = sanitizeHtml(rawHtml, {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
      'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
      'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'span'
    ],
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel', 'class'],
      div: ['class'],
      span: ['class'],
      p: ['class'],
      table: ['class'],
      th: ['class'],
      td: ['class'],
      code: ['class'],
    },
    transformTags: {
      a: (tagName, attribs) => {
        // Garantizar que enlaces externos abran con seguridad rel="noopener noreferrer"
        return {
          tagName: 'a',
          attribs: {
            ...attribs,
            target: '_blank',
            rel: 'noopener noreferrer',
            class: 'text-azul-rey hover:text-dorado underline font-medium transition-colors',
          },
        };
      },
    },
  });

  return cleanHtml;
}

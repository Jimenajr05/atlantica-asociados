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
      'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'span', 'u', 's'
    ],
    allowedAttributes: {
      '*': ['style'],
      ol: ['start'],
      a: ['href', 'name', 'target', 'rel', 'class'],
      div: ['class'],
      span: ['class'],
      p: ['class'],
      table: ['class'],
      th: ['class', 'colspan', 'rowspan'],
      td: ['class', 'colspan', 'rowspan'],
      code: ['class'],
    },
    // Solo conservar el formato del editor; nunca CSS arbitrario.
    allowedStyles: {
      '*': {
        color: [/^#[0-9a-f]{3,8}$/i, /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/],
        'background-color': [/^#[0-9a-f]{3,8}$/i, /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/],
        'text-align': [/^(left|center|right|justify)$/],
        'margin-left': [/^(24|48|72|96|120|144)px$/],
      },
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

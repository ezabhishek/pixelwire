import DOMPurify from 'dompurify';

let hooksInstalled = false;

function installHooks(): void {
  if (hooksInstalled) return;
  hooksInstalled = true;
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node instanceof HTMLAnchorElement) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer nofollow ugc');
    }
    if (node instanceof HTMLImageElement) {
      node.setAttribute('loading', 'lazy');
      node.setAttribute('decoding', 'async');
      node.setAttribute('referrerpolicy', 'no-referrer');
    }
  });
}

/**
 * Clean third-party HTML (DEV article bodies, HN comments) before it is
 * rendered. Scripts, styles, frames, forms and inline styles are removed;
 * links open in a new tab without a referrer.
 */
export function sanitizeHtml(html: string | null | undefined): string | null {
  if (!html) return null;
  installHooks();
  const clean = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['style', 'iframe', 'form', 'input', 'button', 'textarea', 'select', 'object', 'embed'],
    FORBID_ATTR: ['style', 'srcset'],
  });
  return clean.trim().length > 0 ? clean : null;
}

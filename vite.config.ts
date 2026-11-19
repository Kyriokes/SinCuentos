/// <reference types="vitest/config" />
import { defineConfig, type HtmlTagDescriptor, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Política de contenido para el sitio publicado: todo sale del propio dominio y no hay scripts ni estilos
 * inline (React y gsap escriben estilos por CSSOM, que la política no bloquea). Solo va en el build:
 * en desarrollo Vite inyecta estilos con <style> y la rompería.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  'upgrade-insecure-requests',
].join('; ');

/**
 * Ajustes del HTML publicado:
 * - la CSP como <meta>;
 * - precarga de la tipografía del título gigante, que si no se descubre recién cuando corre el JS;
 * - con VITE_SITE_URL (por ejemplo https://sincuentos.com.ar) definida al hacer el build, la imagen para compartir
 *   pasa a URL absoluta, como piden WhatsApp, X y Facebook, y se agregan og:url y canonical.
 */
function publishedHead(): Plugin {
  let site = '';
  return {
    name: 'sin-cuentos:head',
    apply: 'build',
    configResolved(config) {
      site = String(config.env.VITE_SITE_URL ?? '').replace(/\/+$/, '');
    },
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const tags: HtmlTagDescriptor[] = [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' }];
        const font = Object.keys(ctx.bundle ?? {}).find((file) => /big-shoulders-display-latin-900-normal-[\w-]+\.woff2$/.test(file));
        if (font) tags.push({ tag: 'link', attrs: { rel: 'preload', href: `/${font}`, as: 'font', type: 'font/woff2', crossorigin: '' }, injectTo: 'head' });
        if (site) {
          html = html.replace('content="/og.png"', `content="${site}/og.png"`);
          tags.push(
            { tag: 'meta', attrs: { property: 'og:url', content: `${site}/` }, injectTo: 'head' },
            { tag: 'link', attrs: { rel: 'canonical', href: `${site}/` }, injectTo: 'head' },
          );
        }
        return { html, tags };
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), publishedHead()],
  test: { environment: 'jsdom', globals: true, setupFiles: ['./src/test-setup.ts'] },
});

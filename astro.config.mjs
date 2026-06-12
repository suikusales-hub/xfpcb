import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'static',
  adapter: cloudflare(),
  site: 'https://xfpcb.com',
  build: {
    assets: '_assets',
  },
  trailingSlash: 'always',
});

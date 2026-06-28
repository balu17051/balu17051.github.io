import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://balu17051.github.io',
    trailingSlash: 'always',
  integrations: [tailwind()],
  output: 'static',
});

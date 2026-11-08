import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
    // relative asset paths, since the app is served from vis4.net/hackernyt/
    base: './',
    plugins: [svelte()]
});

import { defineConfig } from 'rolldown'

const dir = 'dist';

export default defineConfig({
	input: {
		index: 'src/index.ts',
	},
	output: [
		{
			dir,
			format: 'esm',
			entryFileNames: '[name].mjs',
		},
		{
			dir,
			format: 'cjs',
			entryFileNames: '[name].js',
		},
	],
	external: [
		'astro',
		'astro/zod',
		'zod',
	],
	resolve: {
		// This needs to be explicitly set for now because oxc resolver doesn't
		// assume default exports conditions. Rolldown will ship with a default that
		// aligns with Vite in the future.
		conditionNames: ['import'],
	},
})
import esbuild from "esbuild";
import process from "process";
import builtins from "builtin-modules";

const banner =
`/*
http server with liveReload for pagedjs
*/
`;

const prod = (process.argv[2] === 'production');

const context = await esbuild.context({
	banner: {
		js: banner,
	},
	entryPoints: ['main.ts'],
	bundle: true,
	external: [
		'obsidian',
		'electron',
		'@codemirror/autocomplete',
		'@codemirror/collab',
		'@codemirror/commands',
		'@codemirror/language',
		'@codemirror/lint',
		'@codemirror/search',
		'@codemirror/state',
		'@codemirror/view',
		'@lezer/common',
		'@lezer/highlight',
		'@lezer/lr',
		...builtins
	],
	format: 'cjs',
	target: 'es2018',
	logLevel: "info",
	sourcemap: prod ? false : 'inline',
	treeShaking: true,
	outfile: 'main.js',
	allowOverwrite: true,
	minify: prod,
	// Configuration pour la structure modulaire
	loader: {
		'.ts': 'ts',
		'.js': 'js'
	},
	resolveExtensions: ['.ts', '.js'],
	// Optimisations pour la production
	...(prod && {
		drop: ['console', 'debugger'],
		mangleProps: /^_/,
	})
});

if (prod) {
	console.log('🚀 Building for production...');
	await context.rebuild();
	console.log('✅ Production build completed');
	process.exit(0);
} else {
	console.log('🔄 Starting development build with watch mode...');
	console.log('📝 Main entry: main.ts');
	console.log('📂 Modular structure enabled');
	console.log('🔍 Watching for changes...');
	await context.watch();
}
import { spawn } from 'child_process';
import svelte from 'rollup-plugin-svelte';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import resolve from '@rollup/plugin-node-resolve';
import livereload from 'rollup-plugin-livereload';
import css from 'rollup-plugin-css-only';
import json from '@rollup/plugin-json';
import obfuscator from 'rollup-plugin-obfuscator';

const production = !process.env.ROLLUP_WATCH;

function serve() {
	let server;

	function toExit() {
		if (server) server.kill(0);
	}

	return {
		writeBundle() {
			if (server) return;
			server = spawn('npm', ['run', 'start', '--', '--dev'], {
				stdio: ['ignore', 'inherit', 'inherit'],
				shell: true
			});

			process.on('SIGTERM', toExit);
			process.on('exit', toExit);
		}
	};
}

export default {
	input: 'src/main.js',
	output: {
		sourcemap: !production, // keep dev sourcemap
		format: 'iife',
		name: 'app',
		file: 'public/banana_forest/banana_bundle.js'
	},
	plugins: [
		svelte({
			compilerOptions: {
				dev: !production
			}
		}),
		json(),
		css({ output: 'banana_style.css' }),
		resolve({
			browser: true,
			dedupe: ['svelte'],
			exportConditions: ['svelte']
		}),
		commonjs(),

		!production && serve(),
		!production && livereload('public'),

		production && terser({
			compress: {
				drop_debugger: false
			}
		}), // minify in prod

		// Obfuscate only in production
		production && obfuscator({
			compact: true,
			controlFlowFlattening: true,
			controlFlowFlatteningThreshold: 0.75,
			deadCodeInjection: true,
			deadCodeInjectionThreshold: 0.4,
			debugProtection: true,
			debugProtectionInterval: 2000,
			disableConsoleOutput: false,
			stringArray: true,
			stringArrayEncoding: ['base64'],
			stringArrayThreshold: 0.75,
			selfDefending: true
		})
	],
	watch: {
		clearScreen: false
	}
};
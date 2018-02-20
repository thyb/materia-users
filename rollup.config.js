import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import angularInline from 'rollup-plugin-angular-inline';

export default {
    input: 'client/main.ts',
    output: {
        file: 'dist/bundle.js',
        format: 'system'
    },
    plugins: [
        resolve({
            // pass custom options to the resolve plugin
            customResolveOptions: {
                moduleDirectory: 'node_modules'
            }
        }),
        angularInline({ include: './client/**/*.component.ts' }),
        typescript({
            typescript: require('typescript')
        })
    ],
    external: [
        '@materia/addons',
        '@angular/animations',
        '@angular/core',
        '@angular/material',
        '@angular/cdk',
		'@angular/platform-browser',
		'@angular/forms'
    ]
}
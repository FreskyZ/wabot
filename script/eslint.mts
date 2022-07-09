import { ESLint } from 'eslint';
import { log } from './common.mjs';

export async function eslint(target: string, pattern: string | string[]): Promise<void> {
    if (!('AKARIN_ESLINT' in process.env)) {
        return;
    }

    const eslint = new ESLint({
        useEslintrc: false,
        baseConfig: {
            parser: '@typescript-eslint/parser',
            parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
            plugins: ['@typescript-eslint'],
            env: { 'node': true },
            extends: ['eslint:recommended', "plugin:@typescript-eslint/recommended"],
            rules: {
                'array-callback-return': 'warn',
                'class-methods-use-this': 'error',
                'comma-dangle': 'off', // overwrite by ts-eslint
                'eol-last': 'error',
                'no-constant-condition': 'off', // do-while-true and infinite-generator are all useful patterns when needed
                'no-multiple-empty-lines': 'error',
                "no-extra-parens": 'off', // this does not have the 'except boolean-and-or-mixed' option
                'no-lone-blocks': 'warn',
                'no-sequences': 'error', // this is comma expression
                "no-template-curly-in-string": 'warn',
                'no-trailing-spaces': 'error',
                'no-unused-expressions': 'off', // overwrite by ts-eslint
                'prefer-named-capture-group': 'off', // it even raises /(...)?/
                'require-await': 'error',
                'semi': 'off', // overwrite by ts-eslint
                '@typescript-eslint/comma-dangle': ['warn', 'always-multiline'],
                '@typescript-eslint/consistent-type-imports': 'off', // I'd like to only include 'all imports are types' but there is no option, maybe enable it some time
                "@typescript-eslint/explicit-module-boundary-types": ['warn', { allowArgumentsExplicitlyTypedAsAny: true }],
                '@typescript-eslint/member-delimiter-style': ['warn', { multiline: { delimiter: 'comma', requireLast: true }, singleline: { delimiter: 'comma', requireLast: false } }],
                '@typescript-eslint/no-confusing-non-null-assertion': 'warn',
                "@typescript-eslint/no-explicit-any": 'off',
                '@typescript-eslint/no-non-null-assertion': 'off', // explained in tools/typescript note for strict mode
                '@typescript-eslint/no-unnecessary-condition': 'off',     // this want a tsconfig file
                '@typescript-eslint/no-unused-expressions': 'error',
                '@typescript-eslint/no-var-requires': 'off', // see docs/build-script.md for src/server-core/auto require function call
                '@typescript-eslint/prefer-includes': 'off',              // this want a tsconfig file
                '@typescript-eslint/prefer-readonly': 'off',              // this want a tsconfig file
                '@typescript-eslint/semi': 'error',
                '@typescript-eslint/switch-exhaustiveness-check': 'off',  // this want a tsconfig file
                '@typescript-eslint/triple-slash-reference': 'off',
            }
        },
        cache: true,
        cacheLocation: `.cache/eslint-${target}`,
    });
    const results = await eslint.lintFiles(pattern);
    const formattedResults = (await eslint.loadFormatter('stylish')).format(results);
    if (formattedResults) {
        console.log(formattedResults);
    } else {
        log.info('esl', 'clear');
    }
}

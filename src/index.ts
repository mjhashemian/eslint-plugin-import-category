import type { ESLint } from 'eslint';
import importCommentsRule from './rules/import-category';
import recommended from './configs/recommended';

const plugin: ESLint.Plugin = {
    meta: {
        name: 'eslint-plugin-import-category',
        version: '1.0.2',
    },
    rules: {
        'import-comments': importCommentsRule as any,
    },
    configs: {
        recommended: recommended as any,
    },
};

export default plugin;

module.exports = plugin;

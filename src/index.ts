import importCategory from './rules/import-category';

const plugin = {
    rules: {
        'import-category': importCategory,
    },
    configs: {
        recommended: {
            plugins: ['import-category'],
            rules: {
                'import-category/import-category-comments': 'error',
            },
        },
    },
};

export = plugin;

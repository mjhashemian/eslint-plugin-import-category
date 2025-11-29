export default {
    plugins: ['import-category'],
    rules: {
        'import-category/import-category-comments': [
            'error',
            {
                categories: [
                    {
                        comment: '// External Libraries',
                        patterns: ['^[a-z@]'],
                        order: 1,
                    },
                    {
                        comment: '// Internal Modules',
                        patterns: ['^~/', '^@/'],
                        order: 2,
                    },
                    {
                        comment: '// Relative Imports',
                        patterns: ['^\\.'],
                        order: 3,
                    },
                ],
                typeImportsCategory: '// Types',
                enforceOrder: true,
                enforceComments: true,
                commentStyle: 'line',
            },
        ],
    },
};

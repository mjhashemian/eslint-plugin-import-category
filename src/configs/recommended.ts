export default {
    rules: {
        'import-category/import-comments': [
            'error',
            {
                configs: [
                    {
                        comment: '// Types',
                        patterns: [],
                        order: 0,
                    },
                    {
                        comment: '// External Libraries',
                        patterns: [/^[a-z@]/],
                        order: 1,
                    },
                    {
                        comment: '// Internal Modules',
                        patterns: [/^~\//, /^@\//],
                        order: 2,
                    },
                    {
                        comment: '// Relative Imports',
                        patterns: [/^\./],
                        order: 3,
                    },
                ],
            },
        ],
    },
};

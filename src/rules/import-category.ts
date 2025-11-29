// Types
import { ESLintUtils } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/types';

const createRule = ESLintUtils.RuleCreator((name) => `https://your-docs-url.com/rules/${name}`);

type ImportCategory = {
    comment: string;
    patterns: string[];
    order: number;
};

type Options = [
    {
        categories?: ImportCategory[];
        typeImportsCategory?: string | null;
        enforceOrder?: boolean;
        enforceComments?: boolean;
        commentStyle?: 'line' | 'block';
    },
];

type MessageIds = 'missingComment' | 'duplicateComment' | 'wrongOrder';

const rule = createRule<Options, MessageIds>({
    name: 'import-category-comments',
    meta: {
        type: 'layout',
        docs: {
            description: 'Enforce comment headers for import groups and correct ordering',
        },
        fixable: 'code',
        schema: [
            {
                type: 'object',
                properties: {
                    categories: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                comment: { type: 'string' },
                                patterns: {
                                    type: 'array',
                                    items: { type: 'string' },
                                },
                                order: { type: 'number' },
                            },
                            required: ['comment', 'patterns', 'order'],
                            additionalProperties: false,
                        },
                        description: 'Array of import categories with their patterns and order',
                    },
                    typeImportsCategory: {
                        oneOf: [{ type: 'string' }, { type: 'null' }],
                        description: 'Comment for type-only imports (null to disable)',
                    },
                    enforceOrder: {
                        type: 'boolean',
                        description: 'Whether to enforce category order',
                    },
                    enforceComments: {
                        type: 'boolean',
                        description: 'Whether to enforce category comments',
                    },
                    commentStyle: {
                        type: 'string',
                        enum: ['line', 'block'],
                        description: 'Style of comments to use',
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            missingComment: 'Missing or incorrect comment "{{category}}" before this import group',
            duplicateComment: 'Duplicate comment "{{category}}" should be removed',
            wrongOrder:
                'Import from "{{importPath}}" ({{category}}) is out of order. Expected order: {{expectedOrder}}, but found: {{actualOrder}}',
        },
    },
    defaultOptions: [
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
    create(context) {
        const options = context.options[0] || {};
        const {
            categories = [],
            typeImportsCategory = '// Types',
            enforceOrder = true,
            enforceComments = true,
            commentStyle = 'line',
        } = options;

        const sourceCode = context.sourceCode;

        const categoriesWithRegex = categories.map((cat) => ({
            ...cat,
            patterns: cat.patterns.map((pattern) => new RegExp(pattern)),
        }));

        const isTypeOnlyImport = (importNode: TSESTree.ImportDeclaration): boolean =>
            /^import\s+type\s+/.test(sourceCode.getText(importNode));

        const getCategoryForImport = (
            importPath: string,
            isTypeOnly: boolean,
        ): { comment: string; order: number } | null => {
            if (isTypeOnly && typeImportsCategory) {
                const typeCategory = categoriesWithRegex.find((cat) => cat.comment === typeImportsCategory);
                if (typeCategory) {
                    return { comment: typeCategory.comment, order: typeCategory.order };
                }
                return { comment: typeImportsCategory, order: 0 };
            }

            for (const category of categoriesWithRegex) {
                if (category.patterns.some((pattern) => pattern.test(importPath))) {
                    return { comment: category.comment, order: category.order };
                }
            }
            return null;
        };

        const groupImportsByCategory = (
            imports: TSESTree.ImportDeclaration[],
        ): Map<string, TSESTree.ImportDeclaration[]> => {
            const groups = new Map<string, TSESTree.ImportDeclaration[]>();

            imports.forEach((importNode) => {
                const importPath = importNode.source.value as string;
                const isTypeOnly = isTypeOnlyImport(importNode);
                const category = getCategoryForImport(importPath, isTypeOnly);

                if (category) {
                    if (!groups.has(category.comment)) {
                        groups.set(category.comment, []);
                    }
                    groups.get(category.comment)!.push(importNode);
                }
            });

            return groups;
        };

        const formatComment = (comment: string): string => {
            if (commentStyle === 'block') {
                const text = comment.replace(/^\/\/\s*/, '');
                return `/* ${text} */`;
            }
            if (!comment.startsWith('//')) {
                return `// ${comment}`;
            }
            return comment;
        };

        const checkImportOrder = (imports: TSESTree.ImportDeclaration[]) => {
            if (!enforceOrder) return;

            let expectedOrder = 0;

            imports.forEach((importNode) => {
                const importPath = importNode.source.value as string;
                const isTypeOnly = isTypeOnlyImport(importNode);
                const category = getCategoryForImport(importPath, isTypeOnly);

                if (category) {
                    if (category.order < expectedOrder) {
                        context.report({
                            node: importNode,
                            messageId: 'wrongOrder',
                            data: {
                                importPath,
                                category: category.comment,
                                expectedOrder: String(expectedOrder),
                                actualOrder: String(category.order),
                            },
                        });
                    } else {
                        expectedOrder = category.order;
                    }
                }
            });
        };

        const checkCategoryComments = (groups: Map<string, TSESTree.ImportDeclaration[]>) => {
            if (!enforceComments) return;

            const sortedCategories = Array.from(groups.keys()).sort((a, b) => {
                const catA = categoriesWithRegex.find((cat) => cat.comment === a);
                const catB = categoriesWithRegex.find((cat) => cat.comment === b);
                const orderA = catA?.order ?? (a === typeImportsCategory ? 0 : 999);
                const orderB = catB?.order ?? (b === typeImportsCategory ? 0 : 999);
                return orderA - orderB;
            });

            sortedCategories.forEach((category) => {
                const categoryImports = groups.get(category)!;
                const [firstImport, ...restImports] = categoryImports;

                const commentsBefore = sourceCode.getCommentsBefore(firstImport);
                const expectedComment = formatComment(category);
                const categoryText = category.replace(/^\/\/\s*/, '').replace(/^\/\*\s*/, '').replace(/\s*\*\/$/, '').trim();

                const hasCorrectComment = commentsBefore.some((comment) => {
                    const commentText = comment.value.trim();
                    return commentText === categoryText || comment.value.trim() === category.replace(/^\/\/\s*/, '').trim();
                });

                if (!hasCorrectComment) {
                    context.report({
                        node: firstImport,
                        messageId: 'missingComment',
                        data: { category: expectedComment },
                        fix: (fixer) => fixer.insertTextBefore(firstImport, `${expectedComment}\n`),
                    });
                }

                restImports.forEach((importNode) => {
                    sourceCode.getCommentsBefore(importNode).forEach((comment) => {
                        const commentText = comment.value.trim();
                        if (commentText === categoryText || comment.value.trim() === category.replace(/^\/\/\s*/, '').trim()) {
                            context.report({
                                node: importNode,
                                messageId: 'duplicateComment',
                                data: { category: expectedComment },
                                fix: (fixer) => fixer.removeRange([comment.range[0], comment.range[1] + 1]),
                            });
                        }
                    });
                });
            });
        };

        return {
            Program(node) {
                const imports = node.body.filter(
                    (n): n is TSESTree.ImportDeclaration => n.type === 'ImportDeclaration',
                );

                if (imports.length === 0) return;

                const importGroups = groupImportsByCategory(imports);
                checkImportOrder(imports);
                checkCategoryComments(importGroups);
            },
        };
    },
});

export default rule;

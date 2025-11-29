import { ESLintUtils } from '@typescript-eslint/utils';
import type { TSESTree } from '@typescript-eslint/types';

const createRule = ESLintUtils.RuleCreator(
    (name) => `https://github.com/mjhashemian/eslint-plugin-import-category#README.md`
);

type ImportCategory = {
    comment: string;
    patterns: RegExp[];
    order: number;
};

type Options = [
    {
        configs?: ImportCategory[];
    },
];

type MessageIds = 'missingComment' | 'duplicateComment' | 'wrongOrder';

const rule = createRule<Options, MessageIds>({
    name: 'import-category',
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
                    configs: {
                        type: 'array',
                        description: 'Array of import categories with their patterns and order',
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
            configs: [],
        },
    ],
    create(context) {
        const options = context.options[0] || {};
        const { configs = [] } = options;

        if (configs.length === 0) {
            return {};
        }

        const sourceCode = context.sourceCode;

        const isTypeOnlyImport = (importNode: TSESTree.ImportDeclaration): boolean =>
            /^import\s+type\s+/.test(sourceCode.getText(importNode));

        const getCategoryForImport = (
            importPath: string,
            isTypeOnly: boolean,
        ): { comment: string; order: number } | null => {
            for (const category of configs) {
                const isTypeCategory = category.comment.toLowerCase().includes('type');

                if (isTypeOnly && isTypeCategory) {
                    return { comment: category.comment, order: category.order };
                }

                if (!isTypeOnly && !isTypeCategory) {
                    if (category.patterns.some((pattern) => pattern.test(importPath))) {
                        return { comment: category.comment, order: category.order };
                    }
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

        const checkImportOrder = (imports: TSESTree.ImportDeclaration[]) => {
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
            const sortedCategories = Array.from(groups.keys()).sort((a, b) => {
                const catA = configs.find((cat) => cat.comment === a);
                const catB = configs.find((cat) => cat.comment === b);
                const orderA = catA?.order ?? 999;
                const orderB = catB?.order ?? 999;
                return orderA - orderB;
            });

            sortedCategories.forEach((category) => {
                const categoryImports = groups.get(category)!;
                const [firstImport, ...restImports] = categoryImports;

                const commentsBefore = sourceCode.getCommentsBefore(firstImport);
                const categoryText = category.replace(/^\/\/\s*/, '').trim();

                const hasCorrectComment = commentsBefore.some((comment) => {
                    const commentText = comment.value.trim();
                    return commentText === categoryText;
                });

                if (!hasCorrectComment) {
                    context.report({
                        node: firstImport,
                        messageId: 'missingComment',
                        data: { category },
                        fix: (fixer) => fixer.insertTextBefore(firstImport, `${category}\n`),
                    });
                }

                restImports.forEach((importNode) => {
                    sourceCode.getCommentsBefore(importNode).forEach((comment) => {
                        const commentText = comment.value.trim();
                        if (commentText === categoryText) {
                            context.report({
                                node: importNode,
                                messageId: 'duplicateComment',
                                data: { category },
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

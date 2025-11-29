import importCategoryComments from "./rules/import-category";
import recommended from "./configs/recommended";

const plugin = {
    meta: {
        name: 'eslint-plugin-import-category',
        version: '1.0.0',
    },
    rules: {
        'import-category-comments': importCategoryComments,
    },
    configs: {
        recommended,
    },
};

export default plugin;

// For CommonJS compatibility
module.exports = plugin;

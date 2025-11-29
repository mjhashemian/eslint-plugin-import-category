# eslint-plugin-import-category

ESLint plugin to enforce comment headers and ordering for import groups with full configurability.

## Installation
```bash
  npm install --save-dev eslint-plugin-import-category
```
## Usage

### With ESLint Flat Config (JavaScript - `eslint.config.js`)

```js
const importCategory = require('eslint-plugin-import-category');
const tsParser = require('@typescript-eslint/parser');

module.exports = [{
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
        parser: tsParser,
        parserOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            project: './tsconfig.json',
        },
    },
    plugins: {
        'import-category': importCategory,
    },
    rules: {
        'import-category/import-category-comments': ['error'],
    },
}, ];
```
### With ESLint Flat Config (TypeScript - `eslint.config.ts`)

```ts
import importCategory from 'eslint-plugin-import-category';
import tsParser from '@typescript-eslint/parser';
import type {
    Linter
} from 'eslint';

const config: Linter.FlatConfig[] = [{
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
        parser: tsParser,
        parserOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            project: './tsconfig.json',
        },
    },
    plugins: {
        'import-category': importCategory,
    },
    rules: {
        'import-category/import-category-comments': ['error'],
    },
}, ];

export default config;
```
### Using Recommended Config

```ts
import importCategory from 'eslint-plugin-import-category';
import tsParser from '@typescript-eslint/parser';

export default [{
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
        parser: tsParser,
        parserOptions: {
            project: './tsconfig.json',
        },
    },
    ...importCategory.configs.recommended,
}, ];
```
## Rule Configuration

### Options

- **`categories`** (array): Define your import categories with patterns and order
  - `comment` (string): The comment text for the category
  - `patterns` (string[]): RegExp patterns to match imports
  - `order` (number): Order priority (lower numbers come first)

- **`typeImportsCategory`** (string | null): Comment for type-only imports (default: `'// Types'`, use `null` to disable)

- **`enforceOrder`** (boolean): Whether to enforce category order (default: `true`)

- **`enforceComments`** (boolean): Whether to enforce category comments (default: `true`)

- **`commentStyle`** ('line' | 'block'): Style of comments to use (default: `'line'`)

### Default Configuration

```ts
{
    rules: {
        'import-category/import-category-comments': ['error', {
            categories: [{
                comment: '// React & Core Libraries',
                patterns: ['^react', '^react-dom', '^next'],
                order: 1,
            },
                {
                    comment: '// External Dependencies',
                    patterns: ['^@tanstack', '^axios', '^lodash'],
                    order: 2,
                },
                {
                    comment: '// UI Components',
                    patterns: ['^@/components', '^~/components'],
                    order: 3,
                },
                {
                    comment: '// Utilities & Helpers',
                    patterns: ['^@/utils', '^@/helpers', '^@/lib'],
                    order: 4,
                },
                {
                    comment: '// Styles',
                    patterns: ['\\.css$', '\\.scss$', '\\.module\\.css$'],
                    order: 5,
                },
            ],
            typeImportsCategory: '// Type Definitions',
            enforceOrder: true,
            enforceComments: true,
            commentStyle: 'line',
        }]
    }
}
```
## Configuration Examples

### Custom React Project Setup

```ts
    rules: {
        'import-category/import-category-comments': ['error', {
            categories: [{
                comment: '// React & Core Libraries',
                patterns: ['^react', '^react-dom', '^next'],
                order: 1,
            },
                {
                    comment: '// External Dependencies',
                    patterns: ['^@tanstack', '^axios', '^lodash'],
                    order: 2,
                },
                {
                    comment: '// UI Components',
                    patterns: ['^@/components', '^~/components'],
                    order: 3,
                },
                {
                    comment: '// Utilities & Helpers',
                    patterns: ['^@/utils', '^@/helpers', '^@/lib'],
                    order: 4,
                },
                {
                    comment: '// Styles',
                    patterns: ['\\.css$', '\\.scss$', '\\.module\\.css$'],
                    order: 5,
                },
            ],
            typeImportsCategory: '// Type Definitions',
            enforceOrder: true,
            enforceComments: true,
            commentStyle: 'line',
        }]
    }
```
### Disable Type Imports Category

```ts
{
    rules: {
        'import-category/import-category-comments': ['error', {
            typeImportsCategory: null,
        }]
    }
}
```
### Use Block Comments

```ts
{
    rules: {
        'import-category/import-category-comments': ['error', {
            commentStyle: 'block',
            categories: [{
                comment: 'External Libraries',
                patterns: ['^[a-z@]'],
                order: 1,
            }, ],
        }]
    }
}
```
### Only Enforce Order (No Comments)

```ts
{
    rules: {
        'import-category/import-category-comments': ['error', {
            enforceComments: false,
            enforceOrder: true,
        }]
    }
}
```
## Example Output

### Before

```ts
import { useState } from 'react';
import type { User } from '@/types/user';
import axios from 'axios';
import { Button } from '@/components/Button';
import type { Config } from './config';
import './styles.css';
```
### After (with default config)

```ts
// Types
import type { User } from '@/types/user';
import type { Config } from './config';

// External Libraries
import { useState } from 'react';
import axios from 'axios';

// Internal Modules
import { Button } from '@/components/Button';

// Relative Imports
import './styles.css';
```
## Features

✅ **Fully Configurable**: Define your own categories, patterns, and ordering  
✅ **Flexible Patterns**: Use RegExp for matching import paths  
✅ **Type Imports Support**: Separate category for `import type` statements  
✅ **Comment Style Options**: Support for both line (`//`) and block (`/* */`) comments  
✅ **Optional Enforcement**: Disable order or comment checks independently  
✅ **Auto-Fix**: Automatically add missing comments and remove duplicates  
✅ **TypeScript First**: Built with TypeScript for type safety

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Support

If you encounter any issues, please report them at GitHub Issues](https://github.com/mjhashemian/eslint-plugin-import-category/issues).


# Build-time a11y linting for React/JSX (no live site needed)

Add `eslint-plugin-jsx-a11y` and enable its recommended (or strict) config. This catches a large
class of issues at commit time — missing alt, invalid ARIA, non-interactive elements with handlers,
labels not associated with controls, etc.

```bash
npm i -D eslint-plugin-jsx-a11y
```

Flat config (eslint.config.js):
```js
import jsxA11y from 'eslint-plugin-jsx-a11y';
export default [
  jsxA11y.flatConfigs.strict, // or .recommended
];
```

Legacy .eslintrc:
```json
{ "extends": ["plugin:jsx-a11y/strict"], "plugins": ["jsx-a11y"] }
```

# Contributing

## Scope Reminder

SimuTrace is deliberately narrow in scope. Before adding a feature, ask: *"Does this help show a before/after storage diff for a specific function call?"*

If the answer is no, it probably belongs in a different tool (like Stellar Lab).

## Development

```bash
npm install
npm run dev     # start dev server
npm test        # run unit tests
npm run build   # typecheck + production build
```

## Git Workflow

- One commit per logical unit.
- Use conventional commit format: `type(scope): description`.
- Stage specific files — never `git add .`.
- Push immediately after every commit.

## Coding Standards

- No `any` in TypeScript. Use `unknown` and narrow explicitly.
- No floating-point math for amounts — use `bigint` or `string`.
- One component per file, named exports, no default exports except page-level components.
- Every async function that can fail must throw or return a typed `SimuTraceError`.

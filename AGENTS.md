---
trigger: always_on
---

This is the source code for the Angular framework. This guide outlines standard practices for AI agents working in this repository.

## Environment

- Use `pnpm` for package management.
- Use `pnpm bazel test //target` to run tests.

## Key Documentation

- [Building and Testing](contributing-docs/building-and-testing-angular.md): definitive guide for running targets.
- [Coding Standards](contributing-docs/coding-standards.md): style guide for TypeScript and other files.
- [Commit Guidelines](contributing-docs/commit-message-guidelines.md): format for commit messages and PR titles.

## Comments

Follow [Write useful comments](contributing-docs/coding-standards.md#write-useful-comments), and keep them short. Agent-written comments tend to be too long for the value they add.

- Prefer one or two lines. Reserve anything longer for genuinely non-obvious reasoning.
- Explain **why**, not what. Drop anything restated from the code on the next line.
- Say it once. Don't restate the same reason in the declaration, the usage, and the test.
- Narrate the code, not the investigation: no history of what was tried, ruled out, or fixed. That belongs in the commit message or the linked issue.

## Testing

- **Zoneless & Async-First:** Assume a zoneless environment where state changes schedule updates asynchronously.
  - **Do NOT** use `fixture.detectChanges()` to manually trigger updates.
  - **ALWAYS** use the "Act, Wait, Assert" pattern:
    1. **Act:** Update state or perform an action.
    2. **Wait:** `await fixture.whenStable()` to allow the framework to process the scheduled update.
    3. **Assert:** Verify the output.
- To keep tests fast, minimize the need for waiting:
  - Use `useAutoTick()` (from `packages/private/testing/src/utils.ts`) to fast-forward time via the mock clock.
- When waiting is necessary, use real async tests (`it('...', async () => { ... })`) along with:
  - `await timeout(ms)` (from `packages/private/testing/src/utils.ts`) to wait a specific number of milliseconds.
  - `await fixture.whenStable()` to wait for framework stability.

## Pull Requests

- Use the `gh` CLI (GitHub CLI) for creating and managing pull requests.

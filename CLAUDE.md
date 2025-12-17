# Claude Code Project Guidelines

Please follow these guidelines when working on this project.

## Conventional Commits

This project requires that all **commit messages** and **PR titles** follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>: <description>

[optional body]

[optional footer(s)]
```

### Available Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes that affect the build system or external dependencies
- `ci`: Changes to CI configuration files and scripts
- `chore`: Other changes that don't modify src or test files
- `revert`: Reverts a previous commit

### Examples

**Commit messages:**
```
feat: add user authentication
fix: resolve null pointer exception in chat handler
ci: add PR checks for lint and typecheck
docs: update README with setup instructions
```

**PR titles:**
```
feat: implement dark mode support
fix: correct webhook message formatting
ci: add GitHub Actions workflow for PR validation
```

### Important Rules

- **All commits** must follow the Conventional Commits format
- **All PR titles** must follow the Conventional Commits format
- The description must start with a lowercase letter (e.g., `feat: add feature` ✓, `feat: Add feature` ✗)
- CI will automatically check the format and PRs cannot be merged if they don't comply

## Code Style

- Code is formatted and linted using Biome
- All code must pass TypeScript type checking
- All tests must pass

## CI/CD

Before a PR can be merged, the following checks are automatically run:

1. **Biome Lint**: Checks code style and potential issues
2. **TypeScript Type Check**: Validates type consistency
3. **Tests**: All tests must pass
4. **PR Title Check**: Validates that the PR title follows Conventional Commits

All of these checks must pass before a PR can be merged.

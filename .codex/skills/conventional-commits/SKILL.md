---
name: conventional-commits
description: Create safe, atomic Git commits that follow Conventional Commits. Use when Codex is asked to commit changes, prepare and execute one or more conventional commits, split unrelated work into logical commits, or suggest a Conventional Commit message from a diff. Inspect repository state and instructions, preserve unrelated work, run required validations, stage only intended changes, and never push or amend unless explicitly requested.
---

# Conventional Commits

## Objective

Create the smallest coherent commit or sequence of commits that accurately describes the requested work. Write every commit message in English.

## Safety Rules

- Treat the user's request as the commit scope. Leave unrelated changes untouched.
- Never discard, overwrite, reset, restore, stash, or otherwise hide working-tree changes.
- Never use broad staging commands such as `git add .` or `git add -A`. Stage explicit paths or clearly isolated hunks.
- Never commit suspected secrets, credentials, private keys, environment files, generated artifacts, or unexpectedly large binaries. Stop and report the concern.
- Never push, amend, rebase, force, change Git configuration, or bypass hooks unless the user explicitly requests that separate action.
- Stop and report unresolved conflicts, an in-progress merge/rebase, an empty commit scope, or mixed pre-staged changes that cannot be separated safely.
- Do not create a commit when the user asks only for a message suggestion.

## Workflow

### 1. Read Repository Guidance

- Find and follow applicable repository instructions such as `AGENTS.md`, contribution guides, and package scripts.
- Identify mandatory formatting, linting, type-checking, testing, and commit-message rules.

### 2. Inspect Before Staging

- Inspect `git status --short`.
- Inspect both unstaged and staged diffs, including stats and full patches.
- Inspect recent commit subjects to infer established scope vocabulary without copying inconsistent message styles.
- Distinguish changes made for the current request from pre-existing or unrelated work.

### 3. Form Atomic Groups

- Group changes by intent and dependency, not merely by file type.
- Separate independent changes, such as an unrelated `fix` and `chore`, into different commits.
- Keep tests, documentation, migrations, and configuration with the behavior they directly support.
- Prefer whole-file groups. Use partial staging only when hunks are clearly independent and the staged patch can be verified exactly.
- If separate intentions overlap in the same hunk or cannot be isolated confidently, keep them together under the predominant intent when the result remains coherent. Otherwise, stop and ask the user how to proceed.
- Preserve an existing coherent staged group and commit it first. Do not silently unstage mixed user-staged work.

Use these decisions for common cases:

| Situation | Action |
| --- | --- |
| One coherent change | Create one commit. |
| Independent `fix` and `chore` changes | Create two commits when they can be staged independently. |
| Different intentions in the same inseparable hunk | Keep one coherent commit under the predominant intent or ask if no accurate message exists. |
| Coherent changes already staged | Verify and commit the staged group before handling unstaged work. |
| Breaking public behavior | Add `!` and a `BREAKING CHANGE:` footer. |
| Unrelated working-tree changes | Leave them unstaged and list them in the final report. |

### 4. Validate the Intended Changes

- Run checks required by repository instructions before committing.
- Run additional focused tests when they are clearly relevant and safe.
- Do not claim a check passed unless it was executed successfully.
- If a required check fails, do not commit. Report the command, failure, and remaining work unless the user explicitly authorizes committing despite that known failure.

### 5. Stage and Commit Each Group

For every atomic group:

1. Stage only its explicit paths or isolated hunks.
2. Review `git diff --cached --stat`, `git diff --cached`, and `git diff --cached --check`.
3. Confirm the staged patch contains the complete intended group and nothing else.
4. Create the commit with an exact, non-interactive message while allowing configured hooks to run.
5. Verify the resulting commit and recompute repository status before starting the next group.

If a hook modifies files or rejects the commit, inspect the new state before retrying. Never bypass the hook automatically.

### 6. Report the Result

- List each created commit hash and subject.
- List validations run and their outcomes.
- Summarize remaining staged or unstaged changes without implying they were committed.
- If no commit was created, explain the precise blocker and preserve the repository state.

## Message Format

Use:

```text
<type>(<scope>)!: <description>

[optional body]

[optional footer]
```

- Use one of: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, or `revert`.
- Choose the type from the change's intent. Do not use `chore` as a catch-all for user-visible behavior.
- Omit the scope when no concise subsystem name adds useful context. Otherwise use a short, stable, lowercase noun, preferably kebab-case.
- Write the description in lowercase imperative form, without a trailing period. Keep the complete subject at 72 characters or fewer when practical.
- Use a body only to explain important motivation, context, or behavior that the subject cannot capture.
- Mark breaking changes with `!` before the colon and add `BREAKING CHANGE: <impact and migration guidance>` in the footer.
- Add issue references in footers when supplied by the user or repository context. Do not invent identifiers.

Examples:

```text
feat(auth): add email verification
fix(notes): prevent empty note updates
chore(deps): update authentication packages
feat(api)!: replace numeric note identifiers

BREAKING CHANGE: clients must send UUID note identifiers.
```

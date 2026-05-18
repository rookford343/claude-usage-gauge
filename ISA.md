---
task: claude-usage-gauge v1.1.3 release — docs, build, commit, push
slug: cug-v1-1-3-release
effort: E3
phase: observe
progress: 0/12
mode: algorithm
project: claude-usage-gauge
started: 2026-05-18T00:00:00Z
updated: 2026-05-18T00:00:00Z
---

## Problem

v1.1.2 shipped code fixes (weekly history daily-delta display, "Today" reset label) but the documentation, changelog, and package version still reflect the old behavior. The DMG artifact has not been rebuilt, and changes have not been committed or pushed.

## Vision

v1.1.3 is cleanly released: CHANGELOG documents both fixes, README roadmap reflects the new current release, USER_GUIDE accurately describes the history grid behavior, package.json is bumped, a fresh DMG is built, and the git history is clean with a single well-formed commit pushed to remote.

## Out of Scope

New features. Changes to SECURITY.md or DATA_SOURCES.md (not affected by these fixes). Any electron-builder config changes. Multi-account work. Version bumps beyond patch.

## Principles

- Documentation describes observed behavior, never aspirational behavior
- Version numbers follow semver: two bug fixes = patch bump
- Every doc update must reflect the exact user-visible change, not the internal implementation

## Constraints

- bun/bunx only — no npm
- Version bumped from 1.1.2 → 1.1.3 (patch: two bug fixes)
- ~/.claude repo commits directly to main per operational rules
- DMG produced by `bun run build` (electron-builder)

## Goal

Bump version to 1.1.3, update CHANGELOG/README/USER_GUIDE to accurately describe the two fixes, build a fresh DMG, and push a clean commit to remote.

## Criteria

- [ ] ISC-1: package.json version reads "1.1.3"
- [ ] ISC-2: CHANGELOG.md has a "## v1.1.3" section at the top
- [ ] ISC-3: CHANGELOG v1.1.3 describes the daily-delta weekly history fix
- [ ] ISC-4: CHANGELOG v1.1.3 describes the "Today" weekly reset label fix
- [ ] ISC-5: README.md Roadmap lists v1.1.3 as the current release section
- [ ] ISC-6: README.md Quick Start DMG download link references 1.1.3
- [ ] ISC-7: USER_GUIDE.md Full View description no longer says "peak weekly usage per day"
- [ ] ISC-8: USER_GUIDE.md reflects daily consumed usage and "Today" reset label behavior
- [ ] ISC-9: USER_GUIDE.md DMG filename reference updated to 1.1.3
- [ ] ISC-10: `bun run build` completes with exit code 0
- [ ] ISC-11: dist/ contains a new .dmg file matching version 1.1.3
- [ ] ISC-12: git commit exists with all changed files staged
- [ ] Anti: ISC-13: Anti: no file outside the expected set (docs, package.json, dist/) is modified
- [ ] ISC-14: git push completes without error

## Test Strategy

| isc | type | check | threshold | tool |
|-----|------|-------|-----------|------|
| ISC-1 | read | grep "version.*1.1.3" package.json | exact match | Bash/grep |
| ISC-2 | read | grep "## v1.1.3" CHANGELOG.md | line present | Bash/grep |
| ISC-3 | read | CHANGELOG contains "daily" or "delta" near v1.1.3 | present | Read |
| ISC-4 | read | CHANGELOG contains "Today" near v1.1.3 | present | Read |
| ISC-5 | read | README Roadmap has "### v1.1.3 — Current Release" | present | Read |
| ISC-6 | read | README Quick Start mentions 1.1.3 in dmg filename | present | grep |
| ISC-7 | read | USER_GUIDE no longer says "peak weekly usage per day" | absent | grep |
| ISC-8 | read | USER_GUIDE mentions daily consumed or similar | present | grep |
| ISC-9 | read | USER_GUIDE dmg filename is 1.1.3 | present | grep |
| ISC-10 | bash | bun run build exit code | 0 | Bash |
| ISC-11 | bash | ls dist/*1.1.3*.dmg | file exists | Bash |
| ISC-12 | bash | git log --oneline -1 includes v1.1.3 | present | Bash |
| ISC-13 | bash | git diff --name-only HEAD confirms expected files only | set match | Bash |
| ISC-14 | bash | git push exit code | 0 | Bash |

## Features

| name | satisfies | depends_on | parallelizable |
|------|-----------|------------|----------------|
| version-bump | ISC-1 | — | yes |
| changelog-update | ISC-2,3,4 | version-bump | no |
| readme-update | ISC-5,6 | version-bump | yes |
| userguide-update | ISC-7,8,9 | version-bump | yes |
| dmg-build | ISC-10,11 | all-doc-updates | no |
| git-commit-push | ISC-12,13,14 | dmg-build | no |

## Decisions

## Changelog

## Verification

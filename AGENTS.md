# Repository Contribution Guidelines

- Update `CHANGELOG.md` with a short description for every change.
- After every 10 changelog entries, move older entries to `CHANGELOG_ARCHIVE.md` (or a similarly named file) to keep `CHANGELOG.md` concise.
- Use the current UTC date for new changelog entries. Run `date -u +%Y-%m-%d` for the date heading and prefix each bullet beneath it with an `HHMM` timestamp from `date -u +%H%M`.
- Run any available tests before committing, even if none exist yet.
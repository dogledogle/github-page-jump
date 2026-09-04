# Repository Guidelines

## Architecture

- Preserve the zero-build Manifest V3 design and browser-compatible plain JavaScript.
- Keep pagination and URL rules in `src/core.js`; this module must remain DOM-free.
- Keep localization and preference definitions in `src/shared.js`.
- Keep GitHub DOM adapters and injected control lifecycle in `src/pagination.js`.
- Keep `src/content.js` and `src/popup.js` limited to application startup and event binding.

## Development

- Run `npm test` after changing JavaScript or `manifest.json`.
- Update both `manifest.json` and `tests/fixture.html` when adding a browser source module.
- Add new preferences to `SETTING_DEFINITIONS` instead of using storage keys directly.
- Add new GitHub pagination structures to `PAGINATION_ADAPTERS`.
- Document every named source function with concise English JSDoc, including parameters and return values.
- Use regular English comments only for non-obvious constraints or compatibility behavior.

# GitHub UI integration

- Host UI: GitHub pagination, verified against the current `Pagination` component markup.
- Visual source: the user-provided GitHub pagination screenshot and GitHub's live Primer CSS variables.
- Color: only host-provided `--fgColor-*`, `--bgColor-*`, and `--borderColor-*` tokens, with Primer-compatible fallbacks.
- Typography: inherit GitHub's page font; input remains at the pagination's 14px tool scale.
- Spacing: 4px internal gap, 8px separation from native pagination, 32px controls.
- Radius: 6px, matching compact GitHub controls.
- Motion: 80ms color transitions, disabled when reduced motion is requested.
- Brand assets: no logo or product imagery is introduced; the extension is an inline enhancement to the existing GitHub UI.
- Popup: a minimal toolbar panel with one option ("Fixed pagination") as a Primer-like toggle switch; extension-owned colors mirror the host tokens and adapt to light/dark system theme.

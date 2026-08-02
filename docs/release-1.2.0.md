# Release 1.2.0

Everything below is prepared and waiting. The App Store Connect steps are the
only part that has to be done by hand, since it needs the account.

## What's New (draft, needs your approval before it goes in)

> The app has been redesigned.
>
> Typing now happens on a keypad built into the calculator. Tap any assumption
> to edit it, then use Prev and Next to move through all four without closing
> the pad.
>
> The growth chart has a time axis that adjusts to your horizon, from months on
> a short run to decades on a long one, and it moves between shapes as you type
> rather than jumping.
>
> Saved records, the share card, and the sheets for saving, renaming and
> deleting have all been rebuilt to match.

## Screenshots

Captured on an iPhone 17 Pro Max simulator. Six screens, in the order they are
worth showing:

1. `dark-home` — calculator, dark
2. `keypad` — keypad open on a contribution
3. `dark-saved` — saved records
4. `share` — the shareable summary card
5. `learn` — Learn tab
6. `light-home` — calculator, light

Both iPhone slots are covered:

- `docs/app-store/6.9/` — 1320x2868, for the 6.9" slot
- `docs/app-store/6.5/` — 1242x2688, for the 6.5" slot

The 6.5" set is the same captures fitted to that slot's exact dimensions, which
costs about half a percent of vertical scale and is not visible.

If the listing still has screenshots from an earlier version in either slot,
they have to be deleted in App Store Connect. Apple keeps whatever is already
there; it does not replace a slot just because another one was filled.

## App Store Connect checklist

- [ ] Create the 1.2.0 version
- [ ] Delete the old screenshots from both iPhone slots
- [ ] Upload `docs/app-store/6.9/` and `docs/app-store/6.5/`
- [ ] Paste the What's New text once approved
- [ ] Attach the build (check the build number, several 1.2.0 builds exist)
- [ ] Submit for review

Export compliance should not stop you: `ITSAppUsesNonExemptEncryption` is
already declared false in `app.json`, so Apple will not ask.

Description, keywords, age rating and privacy answers carry over from 1.1.0 and
only need touching if you want to change them. Nothing in this release collects
data, so the privacy answers still hold.

## Verified before handing over

- Typecheck and lint clean
- Compound interest, chart geometry and keypad input differential-tested
  against the design prototype's own implementation
- Colours diffed token by token against the design in both themes
- Every font size in the design is used in the app
- Calculator, keypad, chart, tab bar, Learn, saved records, and the save,
  rename, delete and share sheets all checked rendering on device

## Not verified

The save, rename, delete and share **actions** have only been exercised in a
browser, not on a device. Rendering is confirmed; the round trip through
storage and the iOS share sheet is not. Worth running once on the TestFlight
build before submitting.

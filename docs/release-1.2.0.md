# Release 1.2.0

The listing is filled in and saved. Nothing has been sent to review.

## What's New (in App Store Connect now, change it if you want)

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

1. `dark-home`, calculator, dark
2. `keypad`, keypad open on a contribution
3. `dark-saved`, saved records
4. `share`, the shareable summary card
5. `learn`, Learn tab
6. `light-home`, calculator, light

Both iPhone slots are covered:

- `docs/app-store/6.9/`: 1320x2868, for the 6.9" slot
- `docs/app-store/6.5/`: 1242x2688, for the 6.5" slot

The 6.5" set is the same captures fitted to that slot's exact dimensions, which
costs about half a percent of vertical scale and is not visible.

In the end only the 6.9" slot needed filling. Apple treats it as the source for
the smaller iPhone sizes, so 6.5" and 6.3" both read "Using 6.9" Display" and
show the same six images. The 6.5" set in the repo is kept in case a future
listing needs that slot filled on its own.

Apple keeps whatever is already in a slot; it does not replace one just because
another was filled. The old 6.9" and 6.3" sets had to be deleted by hand first.

## App Store Connect checklist

- [x] Create the 1.2.0 version
- [x] Delete the old screenshots (6.9" and a stale 6.3" set from the last release)
- [x] Upload `docs/app-store/6.9/`, one file at a time so the order holds
- [x] Confirm 6.5" and 6.3" inherit from 6.9"
- [x] Confirm iPad, Apple Watch and iMessage hold nothing stale
- [x] Paste the What's New text
- [x] Attach build 23
- [x] Save
- [ ] Add for Review

Only the last line is left, and it is deliberately left. Nothing goes to Apple
until you press it.

Two settings on that page are still on their defaults and worth a look before
you do: **App Store Version Release** (manual or automatic after approval) and
**Phased Release**. Neither was touched.

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

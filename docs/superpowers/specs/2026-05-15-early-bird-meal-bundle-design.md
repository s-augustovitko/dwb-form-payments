# Early-Bird Meal Bundle

**Date:** 2026-05-15
**Status:** Approved
**Scope:** `forms/web/` (Solid/TS frontend) + `forms/api/` (PHP backend)

## Summary

When a registration qualifies for the early-bird discount, all meal addons
are automatically included in the order at no extra cost to the registrant
who pays online. On-site payment reverses the bundle (same way it already
reverses the early-bird discount itself), so the bundle is effectively a
"pay online" perk.

## Goals

- Reward early-bird, full-course registrations with a complimentary all-meals package.
- Keep the meal bundle reversible for on-site payment so revenue is preserved when the user opts out of paying online.
- Avoid schema migrations and avoid changing the Go admin surface.

## Non-Goals

- No new addon type. The bundle reuses existing `EARLY_DISCOUNT` semantics.
- No admin-side changes (Go API, admin UI, admin export).
- No changes to discount mechanics other than the early-bird flow.
- Does not extend to `ALL_SESSIONS_DISCOUNT` (separate discount with different reversal rules).

## Trigger

A bundle is **active** for a given submission iff all of:

1. The form has a configured `EARLY_DISCOUNT` addon matching the chosen currency.
2. Its `date_time` (deadline) is in the future (UTC comparison, as today).
3. The user has effectively selected all sessions for the chosen currency (today's existing early-bird trigger).
4. `meal_type` is `REGULAR` or `VEGETARIAN` (not `NONE`).
5. The form has at least one `MEAL` addon matching the chosen currency.

If any condition fails, behavior is unchanged from today.

When the bundle is active:

- All `MEAL` addons matching currency are added to `order_items` at full price.
- The `EARLY_DISCOUNT` row stored on the order has `price = E + M` where `E` is the original addon price and `M` is the sum of all meal-addon prices in that currency.
- `meal_type = NONE` is rejected by the backend (400). The frontend hides the `NONE` option so this is unreachable from normal use.

## Math

Let `S` = sum of session prices in the chosen currency, `E` = original early discount addon price, `M` = sum of meal addon prices in the chosen currency.

- `order_items` contents (bundle active):
  - `SESSION` rows: `S` total at full price
  - `MEAL` rows: `M` total at full price
  - `EARLY_DISCOUNT` row: `E + M`
- `order.amount` (web price) = `S + M − (E + M) = S − E` ✓
- On-site price = `order.amount + EARLY_DISCOUNT.price = (S − E) + (E + M) = S + M` ✓ (full sessions + full meals; no discount, no bundle)

The existing `calculate_total` and on-site formulas are reused unchanged.

## Backend (PHP) — `forms/api/service.php`

Only `_get_addons_for_order` has real logic changes.

New flow:

1. Same first pass: iterate addons, populate `selected_addons` (sessions + user-picked meals), `session_count`, `all_session_discount`, `early_discount`. **Additionally** collect `available_meals` — every `MEAL` addon matching `$currency`, regardless of whether its ID appears in `$addon_ids`.
2. Same precondition: at least one session selected; compute `full_course_selected`.
3. If `!full_course_selected` → return early (existing behavior, no discount, no bundle).
4. Compute `bundle_active`:
   - `early_discount` non-empty and `early_discount['date_time']` parses to a future UTC instant
   - `available_meals` non-empty
   - `$meal_type !== 'NONE'`
5. If `bundle_active`:
   - Re-validate `$meal_type !== 'NONE'`; if `NONE`, throw `Exception("Tipo de comida es requerido cuando hay descuento de pre-venta")`.
   - Replace any user-picked meal entries in `selected_addons` with the full `available_meals` list (so the order contains exactly the bundle, not whatever the client sent).
   - `$early_discount['price'] = (float)$early_discount['price'] + array_sum(array_column($available_meals, 'price'))`.
   - `$early_discount['title'] = $early_discount['title'] . ' (incluye comidas)'` — makes the inflated row self-explanatory in checkout/result UIs.
   - Push `$early_discount` and `$all_session_discount` (if present) into `selected_addons` as today.
6. If `!bundle_active`: existing behavior. Apply `all_session_discount` for full-course; apply the unmodified `early_discount` if its deadline is in the future.

`calculate_total`, `create_update_order`, and `_insert_order_items` (or whichever helper persists items) need no logic changes — they consume whatever is in `selected_addons`.

The NONE-rejection guard inside `_get_addons_for_order` is the authoritative defense. Implementation should verify input validators in `submit.php` / `form_submission.php` still accept `meal_type` values cleanly and not add a redundant layer.

## Frontend (Solid/TS) — `forms/web/src/`

### New helper — `pages/form/index.tsx`

`isEarlyBundleActive()` mirrors the backend trigger:

- `getEarlyDiscount()` returns a value (already encodes: addon present, currency match, all sessions selected, deadline future).
- `addonsList().meals.length > 0`
- `getSelectedMealType() !== MealType.NONE`

### Form UI — `pages/form/index.tsx`

- **Meal-type select** (around line 434): derive a local `availableMealTypes()` that excludes `MealType.NONE` when the bundle would be active given current inputs (i.e., the same conditions as `isEarlyBundleActive()` but ignoring the meal_type check). Pass that into the `Select`'s `items` prop.
- **Meal multi-select** (`<Show>` around line 448): hide it when `isEarlyBundleActive()` is true. Render an info alert in its place: `"Todas las comidas están incluidas con el descuento de Pre-Venta"`.
- **Stale `MealType.NONE` correction:** add a `createEffect` that watches the bundle pre-conditions; if the bundle is about to become active and `meal_type === NONE`, set `meal_type = REGULAR`. Avoids a forced re-pick when the user crosses the threshold by changing event_type or sessions.

### Totals — `pages/form/index.tsx`

The form summary must match what the backend will compute:

- `getSelectedMeals()` (around line 107): when `isEarlyBundleActive()`, return `addonsList().meals.map(m => m.value)` (all meal IDs); otherwise return the user's selection. This flows automatically into `getSelectedAddons()` (sent on submission) and `getSubtotal()`.
- `getDiscountTotal()` (around line 162): when `isEarlyBundleActive()`, add `M` (sum of meal prices) to the early-discount value `E`.
- Summary table (around line 477): the early-discount row uses `getEarlyDiscount()?.title + " (incluye comidas)"` and amount `E + M` when bundle is active. A small helper `getEarlyDiscountAmount()` keeps the JSX clean.

Net total in the summary: `S + M − (E + M) = S − E` ✓ — matches the order the backend will create.

### Submission — `pages/form/transforms.ts`

`transformSubmissionSchemaToRequest` consumes `getSelectedAddons()`, which now includes all meal IDs when bundle is active. No change needed to the transform function.

The backend overrides the meal list regardless of what the client sends, so frontend/backend can never disagree on bundle contents.

### Schema — `pages/form/schema.ts`

No changes. Rationale: cross-field bundle conditions depend on the form's full addons list (sessions count, meal availability, early-discount deadline), which the schema doesn't have access to. Enforcement is split between UI (hide NONE; the visible affordance prevents normal users from sending it) and backend (authoritative reject).

### Checkout & Result — no logic changes

- `pages/checkout/index.tsx`:
  - `getSubtotal()` = `order.amount + sum(discount.price)` = `(S − E) + (E + M) = S + M` ✓
  - `getOnSitePrice()` = `order.amount + early_discount.price` = `(S − E) + (E + M) = S + M` ✓
  - `getWebPrice()` = `order.amount` = `S − E` ✓
  - Meals render at full price in the meals list. The early-discount line title's `(incluye comidas)` suffix (set server-side) explains the larger discount value.
- `pages/result/index.tsx`: same — displays whatever is in `order_items`.

## Edge Cases

- **Form with `EARLY_DISCOUNT` but no `MEAL` addons:** bundle inactive (condition 5 fails). Early discount applies as today.
- **User switches from PER_DAY-partial to ALL_SESSIONS:** bundle activates. If `meal_type` was `NONE`, the `createEffect` resets it to `REGULAR`. If user had selected specific meals, those are ignored — the bundle takes over.
- **User switches back to partial sessions:** bundle deactivates. Meal multi-select reappears; user's previous individual meal selection (if any) reappears as well, since the override only happens at submission via `getSelectedMeals()`, not by mutating the underlying form field. `meal_type` retains its value.
- **Currency switch:** all meal/discount filtering is per-currency. Bundle re-evaluates on currency change.
- **Bundle becomes inactive between form submit and checkout** (e.g., deadline passes after order creation but before payment): order is already created; user pays the web price as recorded. This matches today's early-bird behavior and is out of scope.
- **`SPECIAL` form_type:** behavior is identical to `COURSE` (both use `fullEvents` schema and have meals). Bundle applies the same way.
- **`CONFERENCE` form_type:** no meals and no event selection. Bundle never activates. No-op.

## Files Touched

Backend:
- `forms/api/service.php` (primary — `_get_addons_for_order`)

Frontend:
- `forms/web/src/pages/form/index.tsx` (primary — helper, UI, totals)

Not touched (verified):
- `forms/web/src/pages/form/schema.ts`
- `forms/web/src/pages/form/transforms.ts`
- `forms/web/src/pages/checkout/index.tsx`
- `forms/web/src/pages/result/index.tsx`
- `admin/**` (out of scope)
- Any database schema or migrations

## Test Plan

Backend (PHP, `forms/api/service.php`):

- `_get_addons_for_order` with bundle conditions met → all meals appear in `selected_addons` at full price; `EARLY_DISCOUNT` row's `price` equals `E + M` and title ends with " (incluye comidas)".
- `_get_addons_for_order` with `meal_type = NONE` while bundle pre-conditions hold → throws with the bundle-NONE message.
- `_get_addons_for_order` with deadline expired → bundle off; original behavior.
- `_get_addons_for_order` with partial sessions → bundle off; original behavior.
- `_get_addons_for_order` with no `MEAL` addons → bundle off; early discount applied as today.
- `calculate_total` over a bundled `selected_addons` returns `S − E`.

Frontend:

- Form summary with bundle active shows subtotal `S + M`, discount row `E + M` with `(incluye comidas)` suffix, total `S − E`.
- Meal multi-select hidden when bundle active; info alert visible.
- `MealType.NONE` not in the meal-type select when bundle pre-conditions hold.
- Switching from partial to all sessions with `meal_type = NONE` resets meal_type to `REGULAR`.
- Checkout page: web price `S − E`, on-site price `S + M`, meals visible at full price, discount line shows inflated amount and suffixed title.
- Result page: same item set as checkout.

End-to-end:

- COURSE form with early discount + meals: register all sessions, pay online → order.amount = `S − E`, all meals in order_items.
- Same form, pay on-site → on-site button shows `S + M`; recorded order keeps `S − E` (web price) for display but the user knows they owe full price on-site (existing on-site flow).
- SPECIAL form: same scenarios.
- CONFERENCE form: bundle never activates (sanity check).

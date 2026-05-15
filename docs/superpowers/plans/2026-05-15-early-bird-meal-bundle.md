# Early-Bird Meal Bundle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a registration qualifies for the early-bird discount, automatically bundle all meals into the order at no additional web cost; on-site payment reverses both the discount and the bundle (already handled by the existing on-site flow).

**Architecture:** Backend (`forms/api/service.php`) computes the bundle in `_get_addons_for_order`. When the existing early-discount conditions are met and the form has `MEAL` addons, all meals are pushed into `selected_addons` at full price and the `EARLY_DISCOUNT` row's price is inflated by the meal total (and its title suffixed with `(incluye comidas)`). The existing `calculate_total` and on-site reversal in `update_and_fetch_order_for_payment` (which deletes `EARLY_DISCOUNT` items and recomputes) need no changes. Frontend (`forms/web/src/pages/form/index.tsx`) adds an `isEarlyBundleActive()` helper, hides the meal multi-select with an info note, removes `MealType.NONE` from the meal-type select, auto-resets `NONE` → `REGULAR` when the bundle activates, and updates totals so the summary table matches what the backend will store.

**Tech Stack:** PHP 8 (forms API), Solid.js + TypeScript + Valibot + modular-forms (frontend), MySQL (orders/order_items).

**Spec:** `docs/superpowers/specs/2026-05-15-early-bird-meal-bundle-design.md`

**Testing approach:** The codebase has no PHP or JS test framework. Adding one is out of scope. Each task ends with **manual verification steps** the engineer must run before committing.

---

## File Structure

**Modified:**
- `forms/api/service.php` — `_get_addons_for_order` only. New `$available_meals` collection during the addon scan; new bundle activation block after the existing early-discount applicability check.
- `forms/web/src/pages/form/index.tsx` — new helpers (`isEarlyBundleActive`, `getMealsTotal`, `getEarlyDiscountAmount`, `availableMealTypes`), updates to `getSelectedMeals`/`getDiscountTotal`, new `createEffect` for `NONE` auto-correction, UI changes for meal-type select / meal multi-select / summary table.

**Verified unchanged (do not edit):**
- `forms/web/src/pages/form/schema.ts` — schema-level enforcement is not feasible (it lacks the form addons context); UI + backend are authoritative.
- `forms/web/src/pages/form/transforms.ts` — submission payload already flows through `getSelectedAddons()`.
- `forms/web/src/pages/checkout/index.tsx` — math works as-is given the inflated discount.
- `forms/web/src/pages/result/index.tsx` — renders `order_items` directly.
- `forms/api/submit.php` — already validates `meal_type` against the enum; the bundle-specific rejection lives inside `_get_addons_for_order`.
- `forms/api/service.php` `update_and_fetch_order_for_payment` — on-site delete-and-recompute flow correctly reverses the inflated discount.
- `admin/**` — out of scope (per spec).

---

## Task 1: Backend — collect `available_meals` during the addon scan

**Files:**
- Modify: `forms/api/service.php` (function `_get_addons_for_order`, currently lines ~149–254)

This task only introduces the `$available_meals` collection. No behavior change yet — that comes in Task 2. Splitting these makes the diff easier to audit.

- [ ] **Step 1: Add the `$available_meals` accumulator and populate it in the loop**

Edit `_get_addons_for_order` so that after `$early_discount = [];` the function declares the accumulator, and inside the `foreach` loop every `MEAL` addon (matching currency, which is already guaranteed by the early `continue`) is collected — regardless of whether it appears in `$addon_ids`.

Locate the existing line:

```php
    $early_discount = [];

    foreach ($addons as $addon) {
        // Skip anything that's not your selected currency
        if ($addon['currency'] !== $currency) {
            continue;
        }
```

Insert `$available_meals = [];` immediately above the `foreach`:

```php
    $early_discount = [];
    $available_meals = [];

    foreach ($addons as $addon) {
        // Skip anything that's not your selected currency
        if ($addon['currency'] !== $currency) {
            continue;
        }
```

Then, inside the same loop, locate the `SESSION` counter:

```php
        if ($addon['addon_type'] === 'SESSION') {
            $session_count++;
        }
```

Immediately after that block, add a sibling block for `MEAL` accumulation:

```php
        if ($addon['addon_type'] === 'SESSION') {
            $session_count++;
        }

        if ($addon['addon_type'] === 'MEAL') {
            $available_meals[] = $addon;
        }
```

- [ ] **Step 2: Manual verification — function still returns identical results for non-bundle cases**

Behavior must be unchanged after this step. Verify by running the dev environment (per repo's existing setup — `make` / `podman` compose) and submitting:

  1. A COURSE form with all sessions selected, REGULAR meal_type, and **no** EARLY_DISCOUNT addon configured. Confirm `order_items` row counts match prior behavior (sessions only — plus user-picked meals if any).
  2. A COURSE form with all sessions selected, NONE meal_type, EARLY_DISCOUNT active. Confirm `order_items` contains sessions + EARLY_DISCOUNT at original price (no meals, no inflation) — exact pre-change behavior.

Use a MySQL client (or `podman compose exec mariadb mysql ...` per repo setup) to inspect:

```sql
SELECT addon_type, title, price FROM order_items WHERE order_id = '<order_id>';
```

Expected: identical to pre-change behavior. If anything differs, the loop change is buggy.

- [ ] **Step 3: Commit**

```bash
git add forms/api/service.php
git commit -m "collect available meals during addon scan"
```

---

## Task 2: Backend — implement bundle activation + inflated discount

**Files:**
- Modify: `forms/api/service.php` (function `_get_addons_for_order`, the discount-application block at the end of the function)

- [ ] **Step 1: Refactor the existing early-discount block into "applies?" + "apply"**

Locate the current end of the function:

```php
    // If no full course selected skip discounts
    if (!$full_course_selected) {
        return $selected_addons;
    }

    // Add full course discount
    if (!empty($all_session_discount)) {
        array_push($selected_addons, $all_session_discount);
    }

    // Add early bird discount if applicable
    if (
        !empty($early_discount) &&
        isset($early_discount['date_time'])
    ) {
        $discount_deadline = new DateTime(
            $early_discount['date_time'],
            new DateTimeZone('UTC'),
        );
        $now = new DateTime('now', new DateTimeZone('UTC'));

        if ($discount_deadline > $now) {
            array_push($selected_addons, $early_discount);
        }
    }

    return $selected_addons;
}
```

Replace it with:

```php
    // If no full course selected skip discounts
    if (!$full_course_selected) {
        return $selected_addons;
    }

    // Add full course discount
    if (!empty($all_session_discount)) {
        array_push($selected_addons, $all_session_discount);
    }

    // Determine whether the early discount currently applies
    $early_discount_applies = false;
    if (!empty($early_discount) && isset($early_discount['date_time'])) {
        $discount_deadline = new DateTime(
            $early_discount['date_time'],
            new DateTimeZone('UTC'),
        );
        $now = new DateTime('now', new DateTimeZone('UTC'));
        $early_discount_applies = $discount_deadline > $now;
    }

    if (!$early_discount_applies) {
        return $selected_addons;
    }

    // Bundle pre-conditions hold (early discount applies + meals exist on this form).
    // meal_type=NONE is rejected here as the authoritative guard.
    if (!empty($available_meals) && $meal_type === 'NONE') {
        throw new Exception(
            "Tipo de comida es requerido cuando hay descuento de pre-venta"
        );
    }

    $bundle_active = !empty($available_meals) && $meal_type !== 'NONE';

    if ($bundle_active) {
        // Drop any user-picked meals already pushed into $selected_addons
        $selected_addons = array_values(array_filter(
            $selected_addons,
            fn($a) => $a['addon_type'] !== 'MEAL'
        ));

        // Bundle all available meals at full price
        $selected_addons = array_merge($selected_addons, $available_meals);

        // Inflate the early discount to absorb the meal total
        $meals_total = array_sum(array_map(
            fn($m) => (float)$m['price'],
            $available_meals
        ));
        $early_discount['price'] = (float)$early_discount['price'] + $meals_total;
        $early_discount['title'] = $early_discount['title'] . ' (incluye comidas)';
    }

    array_push($selected_addons, $early_discount);

    return $selected_addons;
}
```

Key semantic points to double-check after the edit:
- `$early_discount` is pushed exactly once into `$selected_addons` — never zero, never twice — when `$early_discount_applies` is true.
- When `$bundle_active`, user-picked meals are stripped first, then `$available_meals` is merged. This guarantees no duplicate MEAL rows and ensures the order has exactly the form's MEAL set.
- The `NONE` rejection only fires when meals exist AND the early discount applies. If a form has no MEAL addons, NONE remains valid.

- [ ] **Step 2: Manual verification — bundle activates correctly**

Set up a test COURSE form in admin with:
- 3 sessions (e.g., 200, 200, 200 PEN)
- 2 meals (e.g., 50, 50 PEN)
- 1 EARLY_DISCOUNT @ 100 PEN with `date_time` ~1 day in the future
- 1 ALL_SESSIONS_DISCOUNT @ 50 PEN (optional, for cross-check)

Then submit the form via the frontend with all sessions selected, `meal_type=REGULAR`, no individual meals selected.

Inspect the DB:

```sql
SELECT addon_type, title, price FROM order_items WHERE order_id = '<order_id>' ORDER BY addon_type;
```

Expected rows:
- 3 × SESSION at 200.00
- 2 × MEAL at 50.00 (both meals, full price)
- 1 × ALL_SESSIONS_DISCOUNT at 50.00 (if configured)
- 1 × EARLY_DISCOUNT at 200.00 (100 original + 50 + 50 meals), title ends with ` (incluye comidas)`

```sql
SELECT amount FROM orders WHERE id = '<order_id>';
```

Expected: `600 + 100 − 50 − 200 = 450` PEN (sessions + meals − all_sessions − inflated_early). Or without the ALL_SESSIONS_DISCOUNT: `600 + 100 − 200 = 500` PEN.

- [ ] **Step 3: Manual verification — bundle rejects NONE**

Resubmit the same form via curl with `meal_type=NONE`:

```bash
curl -X POST http://<host>/api/submit.php \
  -H 'Content-Type: application/json' \
  -d '{
    "first_name":"T","last_name":"T","email":"t@t.com",
    "id_type":"DNI","id_value":"12345678",
    "country_code":"+51","phone":"999999999",
    "selected_addons":["<session1>","<session2>","<session3>"],
    "meal_type":"NONE","event_type":"ALL_SESSIONS","currency":"PEN"
  }'
```

Expected: HTTP 400 with body containing `"Tipo de comida es requerido cuando hay descuento de pre-venta"`.

- [ ] **Step 4: Manual verification — non-bundle paths unchanged**

  1. Partial sessions (event_type=PER_SESSION, only 2 of 3 selected): order has no EARLY_DISCOUNT row and no bundled meals; user-picked meals (if any) appear at full price. Same as today.
  2. Deadline expired (set `date_time` in the past in the admin form): order has full sessions + user-picked meals + no EARLY_DISCOUNT. Same as today.
  3. Form with EARLY_DISCOUNT but no MEAL addons (delete the meal addons): full sessions + EARLY_DISCOUNT @ 100 (un-inflated), title unchanged. NONE remains valid here.

- [ ] **Step 5: Manual verification — on-site reversal still works**

Take the order from Step 2 (bundle active, amount = 450 PEN if ALL_SESSIONS_DISCOUNT present; else 500). Click "Pagar en Evento" on the checkout page. Inspect after:

```sql
SELECT status, amount FROM orders WHERE id = '<order_id>';
SELECT addon_type, price FROM order_items WHERE order_id = '<order_id>';
```

Expected: EARLY_DISCOUNT row is deleted; `orders.amount` is recomputed to `600 + 100 − 50 = 650` (with ALL_SESSIONS_DISCOUNT) or `600 + 100 = 700` (without). Bundle reversed correctly.

- [ ] **Step 6: Commit**

```bash
git add forms/api/service.php
git commit -m "bundle all meals into early-bird discount orders"
```

---

## Task 3: Frontend — add `isEarlyBundleActive`, `getMealsTotal`, `getEarlyDiscountAmount` helpers

**Files:**
- Modify: `forms/web/src/pages/form/index.tsx` (between `getEarlyDiscount` and `getDiscountTotal`, currently around lines 149–175)

- [ ] **Step 1: Add the three helpers**

Locate the current `getEarlyDiscount` and `getDiscountTotal` block:

```ts
	const getEarlyDiscount = () => formInfo?.addons.find((item) => {
		if (item.addon_type !== AddonType.EARLY_DISCOUNT || item.currency !== getCurrency())
			return false

		if (getSelectedSessions().length !== addonsList().sessions.length)
			return false

		if (!item.date_time || dayjs(normalizeDate(item.date_time)).isBefore(new Date()))
			return false

		return true
	})

	const getDiscountTotal = (): number => {
```

Insert three new helpers between `getEarlyDiscount` and `getDiscountTotal`:

```ts
	const getEarlyDiscount = () => formInfo?.addons.find((item) => {
		if (item.addon_type !== AddonType.EARLY_DISCOUNT || item.currency !== getCurrency())
			return false

		if (getSelectedSessions().length !== addonsList().sessions.length)
			return false

		if (!item.date_time || dayjs(normalizeDate(item.date_time)).isBefore(new Date()))
			return false

		return true
	})

	const isEarlyBundleActive = (): boolean =>
		!!getEarlyDiscount() &&
		addonsList().meals.length > 0 &&
		getSelectedMealType() !== MealType.NONE

	const getMealsTotal = (): number =>
		(formInfo?.addons || [])
			.filter(a => a.addon_type === AddonType.MEAL && a.currency === getCurrency())
			.reduce((acc, a) => acc + Number(a.price), 0)

	const getEarlyDiscountAmount = (): number => {
		const earlyDiscount = getEarlyDiscount()
		if (!earlyDiscount) return 0
		return Number(earlyDiscount.price) + (isEarlyBundleActive() ? getMealsTotal() : 0)
	}

	const getDiscountTotal = (): number => {
```

Note: `getMealsTotal` reads from `formInfo.addons` directly (filtered by current currency), not from `addonsList().meals` — the latter is the display-shaped list and doesn't carry `price`.

- [ ] **Step 2: Manual verification — TypeScript compiles**

Run from the repo root:

```bash
cd forms/web && npx tsc --noEmit
```

Expected: no errors. (If you see "Cannot find name X" for a helper, double-check the helper is declared at the top level of `FormContent`, not nested in another function.)

- [ ] **Step 3: Commit**

```bash
git add forms/web/src/pages/form/index.tsx
git commit -m "add isEarlyBundleActive and discount-amount helpers"
```

---

## Task 4: Frontend — update `getSelectedMeals` and `getDiscountTotal` to use the bundle

**Files:**
- Modify: `forms/web/src/pages/form/index.tsx` (currently around lines 107–110 and 162–175)

- [ ] **Step 1: Update `getSelectedMeals` to return all meal IDs when bundle is active**

Locate:

```ts
	const getSelectedMeals = (): string[] =>
		getSelectedMealType() === MealType.NONE ?
			[] :
			getValue(formDataStore, 'selected_meals') || []
```

Replace with:

```ts
	const getSelectedMeals = (): string[] => {
		if (isEarlyBundleActive()) {
			return addonsList().meals.map(m => m.value)
		}
		return getSelectedMealType() === MealType.NONE
			? []
			: getValue(formDataStore, 'selected_meals') || []
	}
```

- [ ] **Step 2: Update `getDiscountTotal` to use `getEarlyDiscountAmount`**

Locate:

```ts
	const getDiscountTotal = (): number => {
		const allSessionsDiscount = getAllSessionsDiscount()
		const earlyDiscount = getEarlyDiscount()

		let total = 0.0
		if (allSessionsDiscount) {
			total += Number(allSessionsDiscount.price)
		}
		if (earlyDiscount) {
			total += Number(earlyDiscount.price)
		}

		return total
	}
```

Replace with:

```ts
	const getDiscountTotal = (): number => {
		const allSessionsDiscount = getAllSessionsDiscount()

		let total = getEarlyDiscountAmount()
		if (allSessionsDiscount) {
			total += Number(allSessionsDiscount.price)
		}

		return total
	}
```

- [ ] **Step 3: Manual verification — totals math matches the backend**

Run `npm run dev` from `forms/web/`. With the test form from Task 2 (3 sessions @ 200, 2 meals @ 50, EARLY_DISCOUNT @ 100 PEN active, no ALL_SESSIONS_DISCOUNT for clarity), open the form. Select all sessions, `meal_type=REGULAR`. The form summary should show:
- Subtotal: 700 PEN (= 600 sessions + 100 meals, because `getSelectedMeals` now includes all meals)
- Early-bird discount: 200 PEN (E + M = 100 + 100)
- Total: 500 PEN

This matches what the backend computes for `orders.amount`.

- [ ] **Step 4: Commit**

```bash
git add forms/web/src/pages/form/index.tsx
git commit -m "include bundled meals in selected list and discount total"
```

---

## Task 5: Frontend — filter `MealType.NONE` out of the meal-type select when bundle pre-conditions hold

**Files:**
- Modify: `forms/web/src/pages/form/index.tsx` (currently around line 434, the `<Field name="meal_type">` block)

- [ ] **Step 1: Add `availableMealTypes` memo**

In the helpers block (after `getEarlyDiscountAmount`, before any UI-return content), add:

```ts
	const availableMealTypes = createMemo(() => {
		if (!!getEarlyDiscount() && addonsList().meals.length > 0) {
			return mealTypesList.filter(item => item.value !== MealType.NONE)
		}
		return mealTypesList
	})
```

This watches all the reactive sources used in `getEarlyDiscount()` and `addonsList()`. When the bundle pre-conditions become true (early discount applies + meals exist), the list excludes NONE. Note: we intentionally do **not** include `getSelectedMealType()` in this check — that's the field being edited, so checking it here would mean the option disappears only after you pick something else, which is the opposite of what we want.

- [ ] **Step 2: Wire the memo into the Select**

Locate the meal-type Field block (~line 434):

```tsx
				<Field name="meal_type">
					{(field, props) => (
						<Select
							{...props}
							value={field.value || ""}
							error={field.error}
							required
							disabled={loading()}
							items={mealTypesList}
							label="Tipo de Comida"
						/>
					)}
				</Field>
```

Change `items={mealTypesList}` to `items={availableMealTypes()}`:

```tsx
				<Field name="meal_type">
					{(field, props) => (
						<Select
							{...props}
							value={field.value || ""}
							error={field.error}
							required
							disabled={loading()}
							items={availableMealTypes()}
							label="Tipo de Comida"
						/>
					)}
				</Field>
```

- [ ] **Step 3: Manual verification — NONE disappears under bundle pre-conditions**

In the browser:
  1. Open a COURSE form with EARLY_DISCOUNT active and MEAL addons configured. Select all sessions. Open the meal-type dropdown — only **Regular** and **Vegetariano** appear. NONE is gone.
  2. Switch event_type to PER_DAY and pick only some days (partial sessions). Open meal-type — all three options reappear (including **Sin Comidas**).
  3. On a CONFERENCE form (no meal section), confirm there's no change (this Field block isn't rendered for CONFERENCE).

- [ ] **Step 4: Commit**

```bash
git add forms/web/src/pages/form/index.tsx
git commit -m "hide Sin Comidas option when early-bird bundle applies"
```

---

## Task 6: Frontend — auto-reset `meal_type` from `NONE` to `REGULAR` when the bundle activates

**Files:**
- Modify: `forms/web/src/pages/form/index.tsx` (imports + helpers block)

This handles the case where the user had picked NONE before the bundle's other conditions became true (e.g., they were on partial sessions and then switched to ALL_SESSIONS).

- [ ] **Step 1: Add `createEffect` to the solid-js import**

Locate line 1:

```ts
import { Component, createMemo, createResource, createSignal, Show } from "solid-js";
```

Add `createEffect`:

```ts
import { Component, createEffect, createMemo, createResource, createSignal, Show } from "solid-js";
```

- [ ] **Step 2: Add the effect**

Just below the `availableMealTypes` memo from Task 5, add:

```ts
	createEffect(() => {
		if (
			!!getEarlyDiscount() &&
			addonsList().meals.length > 0 &&
			getSelectedMealType() === MealType.NONE
		) {
			setValues(formDataStore, 'meal_type', MealType.REGULAR)
		}
	})
```

No feedback loop: once `meal_type` becomes `REGULAR` the predicate is false. The effect will not fire again until the user reverts via some other path (and since NONE is hidden from the select, they can't normally).

- [ ] **Step 3: Manual verification — NONE auto-resets**

In the browser, with a COURSE form (EARLY_DISCOUNT active, meals configured):
  1. Pick event_type=PER_DAY, select only 1 of 3 days (partial). Pick `meal_type=Sin Comidas`. The form total should reflect sessions only (no meals, no discount).
  2. Switch event_type back to ALL_SESSIONS. Without any user action on the meal_type field, watch the dropdown auto-flip to **Regular**. The discount + bundle should now apply (summary shows subtotal with meals, discount = E + M, total = S − E).

- [ ] **Step 4: Commit**

```bash
git add forms/web/src/pages/form/index.tsx
git commit -m "auto-reset meal_type when early-bird bundle activates"
```

---

## Task 7: Frontend — hide the meal multi-select and show an info note when the bundle is active

**Files:**
- Modify: `forms/web/src/pages/form/index.tsx` (currently around lines 448–461)

- [ ] **Step 1: Update the existing `<Show>` guard and add an info-note block**

Locate:

```tsx
				<Show when={addonsList().meals.length > 0 && getSelectedMealType() !== MealType.NONE}>
					<Field name="selected_meals" type="string[]">
						{(field, props) => (
							<MultiSelect
								{...props}
								value={field.value ?? []}
								error={field.error}
								disabled={loading()}
								label="Seleccion de Almuerzos"
								items={addonsList().meals}
							/>
						)}
					</Field>
				</Show>
```

Replace with:

```tsx
				<Show when={isEarlyBundleActive()}>
					<div role="alert" class="alert alert-success">
						<span>Todas las comidas estan incluidas con el descuento de Pre-Venta</span>
					</div>
				</Show>

				<Show when={!isEarlyBundleActive() && addonsList().meals.length > 0 && getSelectedMealType() !== MealType.NONE}>
					<Field name="selected_meals" type="string[]">
						{(field, props) => (
							<MultiSelect
								{...props}
								value={field.value ?? []}
								error={field.error}
								disabled={loading()}
								label="Seleccion de Almuerzos"
								items={addonsList().meals}
							/>
						)}
					</Field>
				</Show>
```

Note: text uses "estan" (no accent) to be safe with file encoding — the codebase has historically had encoding issues with special chars (see commit `6f2f8e0 fix issues with special chars`). If you confirm UTF-8 is fine, "están" with the accent is preferred.

- [ ] **Step 2: Manual verification — UI swaps correctly**

In the browser:
  1. Activate the bundle (full course + REGULAR meal_type + EARLY_DISCOUNT active). The meal multi-select disappears; a green info alert appears: "Todas las comidas estan incluidas con el descuento de Pre-Venta".
  2. Deactivate by switching to partial sessions. The info note disappears; the multi-select returns with whatever meals were previously selected.
  3. Pick `meal_type=Sin Comidas` (only possible on partial sessions). Both the multi-select and the info note are hidden. (No meals, no bundle.)

- [ ] **Step 3: Commit**

```bash
git add forms/web/src/pages/form/index.tsx
git commit -m "swap meal multi-select for info note when bundle applies"
```

---

## Task 8: Frontend — show inflated amount and `(incluye comidas)` suffix in the summary table

**Files:**
- Modify: `forms/web/src/pages/form/index.tsx` (currently around lines 477–482, the early-discount row in the summary table)

- [ ] **Step 1: Update the early-discount row to use the inflated amount and suffix**

Locate:

```tsx
							<Show when={getEarlyDiscount()}>
								<tr class="text-xs">
									<td>{getEarlyDiscount()?.title}</td>
									<td class="text-success">- {getMoneyDisplay(getEarlyDiscount()?.currency, Number(getEarlyDiscount()?.price))}</td>
								</tr>
							</Show>
```

Replace with:

```tsx
							<Show when={getEarlyDiscount()}>
								<tr class="text-xs">
									<td>{getEarlyDiscount()?.title}{isEarlyBundleActive() ? " (incluye comidas)" : ""}</td>
									<td class="text-success">- {getMoneyDisplay(getEarlyDiscount()?.currency, getEarlyDiscountAmount())}</td>
								</tr>
							</Show>
```

- [ ] **Step 2: Manual verification — summary matches backend exactly**

With the test form from Task 2 (sessions 600, meals 100, EARLY_DISCOUNT 100, no ALL_SESSIONS_DISCOUNT), with all sessions + REGULAR meal_type:
- Subtotal row: 700 PEN
- Early discount row title: `<original_title> (incluye comidas)`, amount: `- 200 PEN`
- Total row: 500 PEN

Then deactivate the bundle (partial sessions): the summary returns to its prior behavior (no subtotal row if no discount applies, no early-discount row, no `(incluye comidas)` suffix).

- [ ] **Step 3: Commit**

```bash
git add forms/web/src/pages/form/index.tsx
git commit -m "show bundled meal total in summary discount row"
```

---

## Task 9: End-to-end verification

**Files:** none modified.

- [ ] **Step 1: Run the production build to catch any TypeScript or build issues missed by `tsc --noEmit`**

```bash
cd forms/web && npm run build
```

Expected: build succeeds with no errors. (Warnings about unused imports are acceptable but worth a glance.)

- [ ] **Step 2: COURSE form — full flow**

1. Open a COURSE form with EARLY_DISCOUNT active + meals configured.
2. Fill personal info; select all sessions (ALL_SESSIONS); meal_type defaults / set to REGULAR. Verify summary numbers match Task 4 expected.
3. Submit → checkout page. Verify:
   - "Comidas" collapse shows all meals at full price.
   - "Sesiones" collapse shows all sessions at full price.
   - "Subtotal" line: `S + M` (e.g., 700 PEN).
   - Discount line: `(incluye comidas)` suffix, `- (E + M)` (e.g., `- 200 PEN`).
   - "Total Pago Web" = `S − E` (500 PEN).
   - "Total Pago en Evento" = `S + M` (700 PEN).
4. Click "Pagar en Evento". On the result page, verify the order shows the expected totals and the EARLY_DISCOUNT line is gone, with `orders.amount` updated server-side to `S + M`.

- [ ] **Step 3: COURSE form — bundle deactivation paths**

1. Re-open the same form; deselect one session (PER_SESSION mode). Submit. Checkout: only the selected sessions appear; no meals (or only user-picked meals if any were selected); no EARLY_DISCOUNT; no `(incluye comidas)` suffix.
2. Re-open; set deadline in the past via admin (or use a form with expired EARLY_DISCOUNT). Submit with all sessions. Checkout: sessions only (or user-picked meals); no discount, no bundle.

- [ ] **Step 4: SPECIAL form — same scenarios as Steps 2–3**

SPECIAL adds the arrival/departure/emergency-contact fields but otherwise uses the same event+meal logic. Confirm the bundle activates identically.

- [ ] **Step 5: CONFERENCE form — sanity check**

CONFERENCE forms have no event/meal selection, so `isEarlyBundleActive()` is always false (no MEAL addons, no event selection). Submit a CONFERENCE registration and confirm the order has no MEAL items and no `(incluye comidas)` suffix. Behavior matches today.

- [ ] **Step 6: No-meal-with-discount sanity check**

Create or modify a COURSE form so it has EARLY_DISCOUNT but no MEAL addons. Submit with all sessions, any meal_type (NONE remains valid since the form has no meals). Verify:
- Order has sessions + EARLY_DISCOUNT at original price (no inflation).
- No `(incluye comidas)` suffix anywhere.
- `meal_type=NONE` is accepted (no backend throw, because `$available_meals` is empty).

- [ ] **Step 7: Commit a no-op summary marker** *(optional)*

If you've kept the implementation commits cleanly atomic per task, no extra commit is needed. Otherwise, push the branch and open a PR per repo convention.

```bash
git push origin <branch>
```

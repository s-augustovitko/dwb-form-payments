import { Component, createSignal, For, Show } from "solid-js";
import { createForm, Field, getDateTimeForBackEnd, Method, notAfterDate, notBeforeDate, request, validateArrReduce } from "../../utils";
import { Input, notificationStore, Select, TextArea } from "../../components";
import { settingsDataSchema, settingsTypes } from "./schema";
import { FaSolidAdd, FaSolidChevronLeft, FaSolidTrash } from "solid-icons/fa";
import { A, useNavigate } from "@solidjs/router";
import dayjs from "dayjs";

const CreateSettings: Component = () => {
	const [loading, setLoading] = createSignal<boolean>(false);
	const navigate = useNavigate();

	// Initialize the form
	const settingsSchema = settingsDataSchema({})
	const settingsForm = createForm(settingsSchema);

	// Submit handler
	const submit = async (e: Event) => {
		e.preventDefault();
		if (!settingsForm.validate()) {
			return;
		}

		setLoading(true);
		try {
			const values = settingsForm.values();
			const data = {
				...values,
				session_price_pen: Number.parseFloat(values.session_price_pen as any),
				session_price_usd: Number.parseFloat(values.session_price_usd as any),
				meal_price_pen: Number.parseFloat(values.meal_price_pen as any),
				meal_price_usd: Number.parseFloat(values.meal_price_usd as any),
				start_date: getDateTimeForBackEnd(dayjs(values.start_date).startOf("d")),
				end_date: getDateTimeForBackEnd(dayjs(values.end_date).endOf("d")),
				sessions: values.sessions.map(item => ({ ...item, session_time: getDateTimeForBackEnd(item.session_time) }))
			}

			await request("settings", Method.POST, undefined, data)
			navigate("/settings");
		} catch (err) {
			notificationStore.error((err as any).message)
		} finally {
			setLoading(false)
		}
	};

	function addSession() {
		settingsForm.fields.sessions.add({ title: "", session_time: "" })
	}

	function removeSession(idx: number) {
		settingsForm.fields.sessions.remove(idx)
	}

	function addMeal() {
		settingsForm.fields.meals.add({ title: "" })
	}

	function removeMeal(idx: number) {
		settingsForm.fields.meals.remove(idx)
	}

	return (
		<form onSubmit={submit}>
			<div class="inline-flex gap-4 items-center mb-2">
				<A href="/settings" class="btn btn-ghost btn-circle text-lg text-primary">
					<FaSolidChevronLeft />
				</A>
				<h2 class="text-lg font-bold">Create Config</h2>
			</div>

			{/* Basic fields */}
			<Select
				items={settingsTypes}
				title="Form Type *"
				field={settingsForm.fields.form_type}
			/>
			<Input title="Title *" field={settingsForm.fields.title} />
			<TextArea title="Description" field={settingsForm.fields.description} />

			<Input type="date" title="Start Date *" field={settingsForm.fields.start_date} />
			<Input type="date" title="End Date *" field={settingsForm.fields.end_date} validate={() => notBeforeDate(settingsForm.fields.start_date.get())} />

			<legend class="fieldset-legend mt-4">Sessions</legend>

			<div class="grid grid-cols-2 gap-4 mb-4">
				<Input type="number" title="Session Price (PEN) *" field={settingsForm.fields.session_price_pen} />
				<Input type="number" title="Session Price (USD) *" field={settingsForm.fields.session_price_usd} />
			</div>

			<Show when={settingsForm.fields.sessions.forms().length}>
				<div class="join join-vertical w-full mb-4">
					<For each={settingsForm.fields.sessions.forms()}>
						{(item, index) => (
							<div class="inline-flex gap-4 p-4 border border-base-300 join-item">
								<Input
									title="Session Name *"
									field={item.fields.title as Field<string>}
									class="w-full"
								/>

								<Input
									type="datetime-local"
									title="Session Start DateTime *"
									field={item.fields.session_time as Field<string>}
									class="w-full"
									validate={() => validateArrReduce([
										notBeforeDate(settingsForm.fields.start_date.get()),
										notAfterDate(settingsForm.fields.end_date.get()),
									])}
								/>

								<div class="w-min">
									<label class="text-xs label mb-1">Delete</label>

									<button
										type="button"
										onclick={() => removeSession(index())}
										class="btn btn-ghost btn-error btn-circle"
									>
										<FaSolidTrash />
									</button>
								</div>
							</div>
						)}
					</For>
				</div>
			</Show>

			<button
				type="button"
				class="w-full btn btn-info"
				onclick={() => addSession()}
			>
				<FaSolidAdd /> Add Session
			</button>

			<legend class="fieldset-legend mt-4">Meals</legend>

			<div class="grid grid-cols-2 gap-4 mb-4">
				<Input type="number" title="Meal Price (PEN) *" field={settingsForm.fields.meal_price_pen} />
				<Input type="number" title="Meal Price (USD) *" field={settingsForm.fields.meal_price_usd} />
			</div>

			<Show when={settingsForm.fields.meals.forms().length}>
				<div class="join join-vertical w-full mb-4">
					<For each={settingsForm.fields.meals.forms()}>
						{(item, index) => (
							<div class="inline-flex gap-4 p-4 border border-base-300 join-item">
								<Input
									title="Meal Name *"
									field={item.fields.title as Field<string>}
									class="w-full"
								/>

								<div class="w-min">
									<label class="text-xs label mb-1">Delete</label>

									<button
										type="button"
										onclick={() => removeMeal(index())}
										class="btn btn-ghost btn-error btn-circle"
									>
										<FaSolidTrash />
									</button>
								</div>
							</div>
						)}
					</For>
				</div>
			</Show>

			<button
				type="button"
				class="w-full btn btn-info"
				onclick={() => addMeal()}
			>
				<FaSolidAdd /> Add Meal
			</button>

			<button
				type="submit"
				class="w-full btn btn-primary mt-4"
				disabled={loading()}
			>
				{loading() ? "Saving..." : "Save Configuration"}
			</button>
		</form>
	);
};

export default CreateSettings;

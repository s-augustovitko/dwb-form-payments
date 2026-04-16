import { Accessor, Component, createResource, createSignal, For, Setter } from "solid-js"
import { notificationStore, PageLayout } from "../../components";
import { BASE_URL, FormType, formTypeMap, getDateDisplay, Method, PagedResponse, request } from "../../utils";
import { Pagination } from "../../components/Pagination";
import { A } from "@solidjs/router";
import { FiDownload, FiEdit, FiPlus } from "solid-icons/fi";
import { FormListItem } from "./types";

async function getFormListLimit(limit: number, skip: number, active: boolean): Promise<PagedResponse<FormListItem>> {
	return request<PagedResponse<FormListItem>>(
		"forms",
		Method.GET,
		{ limit: limit.toString(), skip: skip.toString(), active: active.toString() }
	)
}

const Form: Component = () => {
	const [page, setPage] = createSignal(1);
	const [isActiveTab, setIsActiveTab] = createSignal(true);
	const pageSize = 10;

	const [formList, { mutate }] = createResource(
		() => [pageSize, (page() - 1) * pageSize, isActiveTab()] as const,
		([limitVal, skipVal, activeVal]) => getFormListLimit(limitVal, skipVal, activeVal)
	);

	const totalPages = () =>
		Math.ceil((formList()?.total || 0) / pageSize);

	const handleTabChange = (active: boolean) => {
		setIsActiveTab(active);
		setPage(1);
	};

	return (
		<PageLayout
			title="Forms"
			subtitle={`Showing ${formList()?.total ?? 0} forms`}
			actions={<A href="create" class="btn btn-primary"><FiPlus /> Create New Form</A>}
		>
			<div class="tabs tabs-lift">
				<input
					type="radio"
					name="form_tabs"
					class="tab"
					aria-label="Active"
					checked={isActiveTab()}
					onchange={() => handleTabChange(true)}
				/>
				<div class="tab-content bg-base-100 border-base-300 p-6">
					<FormList formList={() => formList()?.items || []} mutate={mutate} />
				</div>

				<input
					type="radio"
					name="form_tabs"
					class="tab"
					aria-label="Inactive"
					checked={!isActiveTab()}
					onchange={() => handleTabChange(false)}
				/>
				<div class="tab-content bg-base-100 border-base-300 p-6">
					<FormList formList={() => formList()?.items || []} mutate={mutate} />
				</div>
			</div>

			<Pagination
				page={page}
				totalPages={totalPages}
				setPage={setPage}
			/>
		</PageLayout >
	)
}

type Params = {
	formList: Accessor<FormListItem[]>,
	mutate: Setter<PagedResponse<FormListItem> | undefined>,
}

const FormList: Component<Params> = ({ formList, mutate }) => {
	const updateActive = async (item: FormListItem) => {
		let previous: PagedResponse<FormListItem> | undefined;
		try {
			mutate((prev) => {
				previous = prev;
				if (!prev) {
					return { total: 0, items: [] };
				}

				return {
					total: prev.total - 1,
					items: prev.items.filter((current) => current.id !== item.id),
				};
			});

			const action = item.active ? "Disabled" : "Enabled";
			await request(`forms/${item.id}/active`, Method.PUT, undefined, { active: !item.active })
			notificationStore.info(`${action} ${item.title}`);
		} catch (err) {
			mutate(() => previous)
			notificationStore.error((err as any).message)
		}
	}

	return (
		<div class="overflow-x-auto">
			<table class="table table-sm">
				<thead>
					<tr>
						<th>Form Name</th>
						<th>Type</th>
						<th>Start Date</th>
						<th>End Date</th>
						<th>Status</th>
						<th>Actions</th>
					</tr>
				</thead>

				<tbody>
					<For each={formList()}>
						{(form) => (
							<tr>
								<td>{form.title}</td>
								<td>
									<div class="badge" classList={{
										"badge-primary": form.form_type === FormType.CONFERENCE,
										"badge-success": form.form_type === FormType.COURSE,
										"badge-info": form.form_type === FormType.SPECIAL,
									}}>
										{formTypeMap[form.form_type]}
									</div>
								</td>
								<td>{getDateDisplay(form.start_date)}</td>
								<td>{getDateDisplay(form.end_date)}</td>
								<td>
									<label class="label truncate cursor-pointer gap-3">
										<input
											type="checkbox"
											class="toggle toggle-success"
											checked={form.active}
											onchange={() => updateActive(form)}
										/>
										{form.active ? "Enabled" : "Disabled"}
									</label>
								</td>
								<td class="inline-flex justify-end">
									<A href={form.id} class="btn btn-ghost"><FiEdit /></A>
									<a href={`${BASE_URL}/forms/export?${new URLSearchParams({ form_ids: form.id })}`} target="_blank" class="btn btn-ghost"><FiDownload /> Export CSV</a>
								</td>
							</tr>
						)}
					</For>
				</tbody>
			</table>
		</div>
	)
}

export default Form;

import { Component, createEffect, createResource, createMemo, onCleanup, For } from "solid-js";
import { useSearchParams } from "@solidjs/router";
import { MultiSelect, PageLayout, Card, Stat } from "../../components";
import { AddonType, addonTypeMap, BASE_URL, Currency, getDateDisplay, getMoneyDisplay, Method, OrderStatus, orderStatusMap, request } from "../../utils";
import { DashboardDataResponse } from "./types";
import Chart from 'chart.js/auto';
import { FiDownload } from "solid-icons/fi";

type SearchParams = {
	form_ids?: string | string[];
	order_status?: string | string[];
}

const Dashboard: Component = () => {
	let canvasRef!: HTMLCanvasElement;
	const [searchParams, setSearchParams] = useSearchParams<SearchParams>();

	const [formList] = createResource(async () => {
		return request<{ id: string, title: string }[]>("dashboard/list", Method.GET);
	});

	const formIds = createMemo<string[]>(() => {
		const params = searchParams.form_ids;
		if (params) return Array.isArray(params) ? params : [params];

		const first = formList()?.at(0)?.id;
		return first ? [first] : [];
	});

	const orderStatuses = createMemo<string[]>(() => {
		const params = searchParams.order_status;
		if (params) return Array.isArray(params) ? params : [params];

		return Object.values(OrderStatus);
	});

	const queryParamsForRequests = createMemo(() => ({
		form_ids: formIds().join(","),
		order_status: orderStatuses().join(",")
	}));

	const [dashboardData] = createResource(queryParamsForRequests, async (queryParams) => {
		if (!queryParams.form_ids) return null;
		return request<DashboardDataResponse>("dashboard", Method.GET, queryParams);
	});

	createEffect(() => {
		const data = dashboardData();

		if (data && canvasRef) {
			const chart = new Chart(canvasRef, {
				type: 'pie',
				data: {
					labels: data.status_list.map(row => row.name),
					datasets: [{
						label: 'Registration Status',
						data: data.status_list.map(row => row.count)
					}]
				}
			});

			onCleanup(() => chart.destroy());
		}
	});

	// 5. Consolidated and typed URL param updates
	const updateSearchParams = (field: keyof SearchParams, added: boolean, val: string) => {
		const currentList = field === 'form_ids' ? formIds() : orderStatuses();

		const newList = added
			? [...currentList, val]
			: currentList.filter(item => item !== val);

		// setSearchParams merges by default. 'undefined' removes the key from the URL.
		setSearchParams({ [field]: newList.length ? newList : undefined });
	};

	// Strongly typed event handlers
	const changeSelectedForms = (e: Event & { target: HTMLInputElement }) => {
		updateSearchParams('form_ids', e.target.checked ?? false, e.target.value ?? "");
	};

	const changeSelectedStatus = (e: Event & { target: HTMLInputElement }) => {
		updateSearchParams('order_status', e.target.checked ?? false, e.target.value ?? "");
	};

	return (
		<PageLayout
			title="Dashboard Overview"
			subtitle={`Showing ${dashboardData()?.course_count ?? 0} active courses`}
			actions={
				<>
					<details class="dropdown">
						<summary class="btn" classList={{ 'btn-disabled': !formList()?.length }}>
							Seleccione los cursos
						</summary>
						<div class="dropdown-content card card-sm bg-base-100 z-1 w-64 shadow-md">
							<div class="card-body">
								<MultiSelect
									name="Seleccione"
									items={formList()?.map(item => ({ title: item.title, value: item.id })) || []}
									value={formIds()}
									onChange={changeSelectedForms as any}
								/>
							</div>
						</div>
					</details>

					<details class="dropdown">
						<summary class="btn" classList={{ 'btn-disabled': !formList()?.length }}>
							Seleccione los estados
						</summary>
						<div class="dropdown-content card card-sm bg-base-100 z-1 w-64 shadow-md">
							<div class="card-body">
								<MultiSelect
									name="Seleccione"
									items={Object.values(OrderStatus).map(item => ({ title: orderStatusMap[item], value: item }))}
									value={orderStatuses()}
									onChange={changeSelectedStatus as any}
								/>
							</div>
						</div>
					</details>

					<a
						href={`${BASE_URL}/forms/export?${new URLSearchParams(queryParamsForRequests()).toString()}`}
						target="_blank"
						class="btn"
						classList={{ 'btn-disabled': !formList()?.length }}
					>
						<FiDownload /> Export CSV
					</a>
				</>
			}
		>
			<div class="stats border border-base-300 bg-base-200 w-full mb-4">
				<Stat
					title="Total Courses"
					value={dashboardData()?.course_count || '0'}
					desc="Active"
				/>
				<Stat
					title="Total Registrations"
					value={dashboardData()?.registration_count || '0'}
					desc="Across all selected courses"
				/>
				<Stat
					title="Total Revenue"
					value={getMoneyDisplay(Currency.PEN, dashboardData()?.total_revenue?.PEN)}
					desc={getMoneyDisplay(Currency.USD, dashboardData()?.total_revenue?.USD)}
				/>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
				<Card title="Registration Status">
					<canvas ref={canvasRef}></canvas>
				</Card>

				<Card title="Course Details" class="h-32">
					<ul class="list bg-base-100 rounded-box shadow-md overflow-y-scroll">
						<For each={dashboardData()?.addons}>
							{(addon) => (
								<li class="list-row flex justify-between">
									<div>
										<div class="font-medium">{addon.title}</div>
										<div class="text-sm text-base-content/70">
											<p>{getDateDisplay(addon.date_time)}</p>
											<p>{getMoneyDisplay(addon.currency, addon.price)}</p>
										</div>
									</div>
									<div class="badge" classList={{
										"badge-primary": addon.addon_type === AddonType.SESSION,
										"badge-info": addon.addon_type === AddonType.MEAL,
										"badge-success": addon.addon_type === AddonType.ALL_SESSIONS_DISCOUNT,
										"badge-accent": addon.addon_type === AddonType.EARLY_DISCOUNT
									}}>
										{addonTypeMap[addon.addon_type]}
									</div>
								</li>
							)}
						</For>
					</ul>
				</Card>
			</div>

			<div class="w-full mb-4">
				<Card title="Recent Activity">
					<div class="overflow-x-auto">
						<table class="table table-sm">
							<thead>
								<tr>
									<th>Name</th>
									<th>Course</th>
									<th>Date</th>
									<th>Status</th>
								</tr>
							</thead>
							<tbody>
								<For each={dashboardData()?.latest_activity}>
									{(activity) => (
										<tr>
											<td>{activity.full_name}</td>
											<td>{activity.course_title}</td>
											<td>{getDateDisplay(activity.submission_date)}</td>
											<td>
												<div class="badge" classList={{
													"badge-neutral": activity.submission_status === OrderStatus.DRAFT,
													"badge-error": activity.submission_status === OrderStatus.CANCELLED,
													"badge-success": activity.submission_status === OrderStatus.CONFIRMED,
													"badge-accent": activity.submission_status === OrderStatus.ON_SITE,
												}}>
													{orderStatusMap[activity.submission_status]}
												</div>
											</td>
										</tr>
									)}
								</For>
							</tbody>
						</table>
					</div>
				</Card>
			</div>
		</PageLayout>
	);
};

export default Dashboard;

import { type Component, createResource, Suspense, For, ErrorBoundary, Show, createSignal } from "solid-js";
import { Loading, notificationStore } from "../../components";
import { getDateDisplay, Method, request } from "../../utils";
import { FaSolidPencil } from 'solid-icons/fa'
import { A } from "@solidjs/router";
import { Pagination } from "../../components/Pagination";

interface SettingsListItem {
	id: string;
	form_type: string;
	title: string;
	start_date: string;
	end_date: string;
	session_count: number;
	meal_count: number;
	active: boolean;
	count: number;
}

interface SettingsListResponse {
	items: SettingsListItem[];
	total: number;
}

async function getSettingsList(limit: number, skip: number): Promise<SettingsListResponse> {
	try {
		const res = await request<SettingsListResponse>(
			"settings",
			Method.GET,
			{ limit: limit.toString(), skip: skip.toString() }
		)
		return res
	} catch (err) {
		notificationStore.error("No se pudo obtener los ajustes");
		return { items: [], total: 0 }
	}
}

const Settings: Component = () => {
	const [page, setPage] = createSignal(1);
	const pageSize = 10;

	// convert page number to skip
	const skip = () => (page() - 1) * pageSize;

	const [settings, { mutate }] = createResource(
		() => [skip(), pageSize],
		([skipVal, limitVal]) => getSettingsList(limitVal, skipVal)
	);

	const totalPages = () =>
		Math.ceil((settings()?.total || 0) / pageSize);

	const updateActiveListData = (id: string) => {
		mutate((prev) => {
			if (!prev) {
				return { total: 0, items: [] }
			}

			return {
				...prev,
				items: prev?.items.map(item =>
					item.id === id
						? { ...item, active: !item.active }
						: item
				)
			}
		})
	}

	const updateActive = async (item: SettingsListItem) => {
		try {
			updateActiveListData(item.id)
			const action = item.active ? "Disabled" : "Enabled";
			await request(`settings/${item.id}/active`, Method.PUT, undefined, { active: !item.active })
			notificationStore.info(`${action} ${item.title}`);
		} catch (err) {
			updateActiveListData(item.id)
			notificationStore.error((err as any).message)
		}
	}

	return (
		<div>
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-lg font-bold">Lista de Ajustes</h2>
				<A href="create" class="btn btn-primary">Crear Ajuste</A>
			</div>

			<ErrorBoundary
				fallback={(_) => (
					<div>
						<hr />
						<p class="text-center p-4">Error obteniendo ajustes</p>
					</div>
				)}
			>
				<Suspense fallback={<Loading />}>
					<Show when={settings() && !settings()?.items?.length}>
						<div>
							<hr />
							<p class="text-center p-4">No hay ajustes...</p>
						</div>
					</Show>
					
					<Show when={settings()?.items?.length}>
						<div class="overflow-x-auto">
							<table class="table">
								<thead>
									<tr>
										<th>Titulo</th>
										<th>Tipo</th>
										<th>Estado</th>
										<th># Sessiones</th>
										<th># Comidas</th>
										<th>Inicio</th>
										<th>Final</th>
										<th>Acciones</th>
									</tr>
								</thead>

								<tbody>
									<For each={settings()?.items}>
										{(item, _) => (
											<tr>
												<td class="w-32 truncate">{item.title}</td>
												<td>
													<span
														class="badge"
														classList={{
															"badge-primary": item.form_type === "TALK",
															"badge-accent": item.form_type === "COURSE",
															"badge-info": item.form_type === "SPECIAL"
														}}
													>
														{item.form_type}
													</span>
												</td>
												<td class="h-full">
													<div class="flex items-center">
														<button
															class={`btn btn-sm ${item.active ? "btn-success" : "btn-error"}`}
															onClick={() => updateActive(item)}
														>
															{item.active ? "Enabled" : "Disabled"}
														</button>
													</div>
												</td>
												<td>{item.session_count}</td>
												<td>{item.meal_count}</td>
												<td>{getDateDisplay(item.start_date)}</td>
												<td>{getDateDisplay(item.end_date)}</td>
												<td class="h-full">
													<div class="flex items-center gap-4">
														<A href={`${item.id}`} class="btn btn-ghost btn-circle btn-info">
															<FaSolidPencil />
														</A>
													</div>
												</td>
											</tr>
										)}
									</For>
								</tbody>
							</table>
						</div>

						<Pagination
							page={page}
							totalPages={totalPages}
							setPage={setPage}
						/>
					</Show>
				</Suspense>
			</ErrorBoundary>
		</div>
	);
};

export default Settings;

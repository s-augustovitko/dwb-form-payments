import { getMoneyDisplay } from "../../utils";
import { Show, type Component } from "solid-js"

interface Props {
	currency: () => string;

	session_price: () => number;
	meal_price: () => number;

	sessions?: () => string[];
	meals?: () => string[];

	total: () => number
}

export const Summary: Component<Props> = (props) => {
	return (
		<div class="grid w-full gap-4 my-6">

			<hr class="border-base-300" />
			<h2 class="text-lg font-bold">Resumen</h2>

			<div class="overflow-x-auto bg-base-100 rounded-box shadow-md">
				<table class="table">
					{/* Head */}
					<thead>
						<tr>
							<th>Titulo</th>
							<th>Precio</th>
							<th>Cantidad</th>
							<th>Total</th>
						</tr>
					</thead>

					{/* Body */}
					<tbody>
						{/* Meals */}
						<Show when={!!props.meals?.().length}>
							<tr>
								<td>Comidas</td>
								<td>{getMoneyDisplay(props.currency(), props.meal_price())}</td>
								<td>{props.meals?.().length || 0}</td>
								<td>{getMoneyDisplay(props.currency(), props.meal_price() * (props.meals?.().length || 0))}</td>
							</tr>
						</Show>

						{/* Sessions */}
						<Show when={!!props.sessions?.().length}>
							<tr>
								<td>Sesiones</td>
								<td>{getMoneyDisplay(props.currency(), props.session_price())}</td>
								<td>{props.sessions?.().length || 0}</td>
								<td>{getMoneyDisplay(props.currency(), props.session_price() * (props.sessions?.().length || 0))}</td>
							</tr>
						</Show>

						{/* Total */}
						<tr class="bg-base-300">
							<th>Total</th>
							<th>{getMoneyDisplay(props.currency(), props.total())}</th>
							<th></th>
							<th></th>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	)
}



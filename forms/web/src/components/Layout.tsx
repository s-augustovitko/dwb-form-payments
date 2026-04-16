import { ErrorBoundary, JSX, ParentComponent, Suspense } from "solid-js"
import { Loading } from "./Loading"

type Props = {
	id?: string;
	title: string;
	description?: string;
	actions?: JSX.Element | JSX.Element[];
}

export const PageLayout: ParentComponent<Props> = (props) => {
	return (
		<div class="bg-base-200 border border-base-300 rounded-box p-4" id={props.id}>
			<ErrorBoundary fallback={
				(err) => (
					<>
						<h1 class="text-xl font-bold">Ocurrio un error</h1>
						<p class="text-error">{err.message}</p>
					</>
				)
			}>
				<Suspense fallback={<Loading />}>
					<div class="flex items-center justify-start mb-4 gap-4">
						{props.actions &&
							<div class="flex gap-2">
								{props.actions}
							</div>
						}

						<div>
							<h1 class="text-xl font-bold">{props.title}</h1>
							{props.description && <p class="text-base-content/50 text-sm mt-2">{props.description}</p>}
						</div>
					</div>


					<div class="w-full">
						{props.children}
					</div>
				</Suspense>
			</ErrorBoundary>
		</div>
	)
}

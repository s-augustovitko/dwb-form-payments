import type { Component } from "solid-js";

const NotFound: Component = () => {
	return (
		<div class="min-h-screen flex items-center justify-center">
			<div class="card w-96 bg-base-100 card-md shadow-sm">
				<div class="card-body">
					<h2 class="card-title">404: Not Found</h2>
					<p>It's gone 😞</p>
				</div>
			</div>
		</div>
	);
};

export default NotFound;

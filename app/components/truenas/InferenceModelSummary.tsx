import { getTranslations } from "next-intl/server";
import {
	EXACT_GPU_BENCHMARK_URL,
	GPU_MODELS,
	RAM_MODELS,
	type InferenceModelRow,
} from "./hardwarePlan";

type TableLabels = {
	model: string;
	memory: string;
	use: string;
	speed: string;
	parallel: string;
	measured: string;
	estimated: string;
};

function ModelTable({
	rows,
	uses,
	labels,
}: {
	rows: ReadonlyArray<InferenceModelRow>;
	uses: string[];
	labels: TableLabels;
}) {
	return (
		<div className="table-responsive">
			<table className="table table-sm align-middle mb-0">
				<thead>
					<tr>
						<th scope="col">{labels.model}</th>
						<th scope="col">{labels.memory}</th>
						<th scope="col">{labels.use}</th>
						<th scope="col">{labels.speed}</th>
						<th scope="col">{labels.parallel}</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((row, index) => (
						<tr key={row.name}>
							<th scope="row">{row.name}</th>
							<td>{row.memory}</td>
							<td>{uses[index]}</td>
							<td>
								{row.speed}
								<small className="d-block text-muted">
									{row.speedKind === "measured" ? labels.measured : labels.estimated}
								</small>
							</td>
							<td>{row.parallel}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

export default async function InferenceModelSummary() {
	const t = await getTranslations("truenas.upgrades.models");
	const labels: TableLabels = {
		model: t("model"),
		memory: t("memory"),
		use: t("use"),
		speed: t("speed"),
		parallel: t("parallel"),
		measured: t("measured"),
		estimated: t("estimated"),
	};
	const gpuUses = t.raw("gpuUses") as string[];
	const ramUses = t.raw("ramUses") as string[];

	return (
		<div className="card box-shadow mt-4">
			<div className="card-body">
				<h5 className="h6 mb-2">
					<i className="fas fa-brain me-2" aria-hidden="true" />
					{t("title")}
				</h5>
				<p className="small text-muted">{t("lead")}</p>

				<h6 className="small fw-bold mt-3">{t("gpuTierTitle")}</h6>
				<ModelTable rows={GPU_MODELS} uses={gpuUses} labels={labels} />

				<h6 className="small fw-bold mt-4">{t("ramTierTitle")}</h6>
				<ModelTable rows={RAM_MODELS} uses={ramUses} labels={labels} />

				<p className="small mt-3 mb-1">
					<a href={EXACT_GPU_BENCHMARK_URL} target="_blank" rel="noopener noreferrer">
						{t("benchmarkSource")}
					</a>
				</p>
				<p className="small text-muted mb-1">{t("concurrencyNote")}</p>
				<p className="small text-muted mb-0">{t("ramNote")}</p>
			</div>
		</div>
	);
}

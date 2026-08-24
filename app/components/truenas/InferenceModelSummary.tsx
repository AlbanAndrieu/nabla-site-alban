const GPU_MODELS = [
	{
		name: "gpt-oss-20b MXFP4",
		memory: "11.27 GiB",
		speed: "109.7 tok/s",
		speedKind: "measured",
		parallel: "4–8",
	},
	{
		name: "Qwen3.6-35B-A3B-MTP IQ4_NL",
		memory: "17.25 GiB",
		speed: "95.9 tok/s",
		speedKind: "measured",
		parallel: "2–4",
	},
	{
		name: "Qwen3-Coder-30B-A3B-Instruct Q4_K_M",
		memory: "~18.6 GB",
		speed: "~70–100 tok/s",
		speedKind: "estimated",
		parallel: "2–4",
	},
	{
		name: "MADLAD-400-10B-MT 4-bit",
		memory: "~6–8 GB",
		speed: "~30–60 tok/s",
		speedKind: "estimated",
		parallel: "8+",
	},
] as const;

const RAM_MODELS = [
	{
		name: "gpt-oss-120b MXFP4",
		memory: "63.4 GB",
		speed: "~20–30 tok/s",
		speedKind: "estimated",
		parallel: "1–2",
	},
	{
		name: "Llama 3.3 70B Instruct Q4_K_M",
		memory: "~42 GB",
		speed: "~2–4 tok/s",
		speedKind: "estimated",
		parallel: "1",
	},
	{
		name: "NVIDIA Nemotron 3 Super 120B-A12B (quantized)",
		memory: "~65 GB",
		speed: "~8–16 tok/s",
		speedKind: "estimated",
		parallel: "1",
	},
] as const;

const EXACT_GPU_BENCHMARK_URL = "https://github.com/mmontes11/llm-bench";

export type InferenceModelSummaryCopy = {
	title: string;
	lead: string;
	gpuTierTitle: string;
	ramTierTitle: string;
	model: string;
	memory: string;
	use: string;
	speed: string;
	parallel: string;
	measured: string;
	estimated: string;
	benchmarkSource: string;
	concurrencyNote: string;
	ramNote: string;
	gpuUses: string[];
	ramUses: string[];
};

function ModelTable({
	rows,
	uses,
	copy,
}: {
	rows: ReadonlyArray<{
		name: string;
		memory: string;
		speed: string;
		parallel: string;
		speedKind: "measured" | "estimated";
	}>;
	uses: string[];
	copy: InferenceModelSummaryCopy;
}) {
	return (
		<div className="table-responsive">
			<table className="table table-sm align-middle mb-0">
				<thead>
					<tr>
						<th scope="col">{copy.model}</th>
						<th scope="col">{copy.memory}</th>
						<th scope="col">{copy.use}</th>
						<th scope="col">{copy.speed}</th>
						<th scope="col">{copy.parallel}</th>
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
									{row.speedKind === "measured" ? copy.measured : copy.estimated}
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

export default function InferenceModelSummary({
	copy,
}: {
	copy: InferenceModelSummaryCopy;
}) {
	return (
		<div className="card box-shadow mt-4">
			<div className="card-body">
				<h5 className="h6 mb-2">
					<i className="fas fa-brain me-2" aria-hidden="true" />
					{copy.title}
				</h5>
				<p className="small text-muted">{copy.lead}</p>

				<h6 className="small fw-bold mt-3">{copy.gpuTierTitle}</h6>
				<ModelTable rows={GPU_MODELS} uses={copy.gpuUses} copy={copy} />

				<h6 className="small fw-bold mt-4">{copy.ramTierTitle}</h6>
				<ModelTable rows={RAM_MODELS} uses={copy.ramUses} copy={copy} />

				<p className="small mt-3 mb-1">
					<a href={EXACT_GPU_BENCHMARK_URL} target="_blank" rel="noopener noreferrer">
						{copy.benchmarkSource}
					</a>
				</p>
				<p className="small text-muted mb-1">{copy.concurrencyNote}</p>
				<p className="small text-muted mb-0">{copy.ramNote}</p>
			</div>
		</div>
	);
}

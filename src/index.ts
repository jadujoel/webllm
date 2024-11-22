import * as webllm from "@mlc-ai/web-llm";

type ModelNames =
| "Llama-3.1-8B-Instruct-q4f32_1-MLC"

class LLM {
	constructor(
		public engine: webllm.MLCEngine,
		public systemMessage = "You are a helpful AI assistant.",
		public temperature = 1,
		public history: string[][] = [],
		public onchunk: (chunk: webllm.ChatCompletionChunk) => void = (chunk) => {
			console.log(chunk.choices[0]?.delta.content ?? "");
			if (chunk.usage) {
				console.log(chunk.usage); // only last chunk has usage
			}
		},
	) {}
	static async FromModelName(
		selectedModel: ModelNames = "Llama-3.1-8B-Instruct-q4f32_1-MLC",
		initProgressCallback: webllm.InitProgressCallback = (initProgress) => {
			console.log(initProgress);
		},
	) {
		const engine = await webllm.CreateMLCEngine(
			selectedModel,
			{
				initProgressCallback,
			}, // engineConfig
		);
		return new LLM(engine);
	}
	setSystemMessage(message: string) {
		this.systemMessage = message;
	}
	setOnChunk(callback: (chunk: webllm.ChatCompletionChunk) => void) {
		this.onchunk = callback;
	}
	setTemperature(temperature: number) {
		this.temperature = temperature;
	}
	async sendMessage(content: string, history = this.history): Promise<string> {
		this.history.push([this.systemMessage, content]);
		const previous: webllm.ChatCompletionMessageParam[] = history.flatMap(
			(item) => ({
				role: "user",
				content: item[1],
			}),
		);
		const chunks = await this.engine.chat.completions.create({
			messages: [
				{ role: "system", content: this.systemMessage },
				...previous,
				{ role: "user", content },
			],
			temperature: this.temperature,
			stream: true, // <-- Enable streaming
			stream_options: { include_usage: true },
		});

		let reply = "";
		for await (const chunk of chunks) {
			reply += chunk.choices[0]?.delta.content || "";
			this.history.at(-1)?.push(reply);
			this.onchunk(chunk);
		}
		return await this.engine.getMessage();
	}
}

async function main() {
	const serviceWorkerUrl = new URL("service-worker.js", import.meta.url);
	console.debug({ serviceWorkerUrl });

	// register service worker
	await navigator.serviceWorker.register(serviceWorkerUrl.href);

	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	const loadStatus = document.getElementById("loadstatus")!;
	const chatInput = document.getElementById("chatinput") as HTMLTextAreaElement;
	const submitButton = document.getElementById("send") as HTMLButtonElement;

	const chatOutput = document.getElementById(
		"chatoutput",
	) as HTMLTextAreaElement;

	const llm = await LLM.FromModelName(undefined, (initProgress) => {
		loadStatus.innerText = initProgress.text;
	});
	llm.setSystemMessage("You are a helpful AI assistant.");
	llm.setOnChunk((chunk) => {
		chatOutput.textContent += chunk.choices[0]?.delta.content ?? "";
	});

	submitButton.addEventListener("click", async () => {
		const content = chatInput.value;
		chatOutput.textContent += `You: ${content}\n`;
		chatInput.value = "";
		chatOutput.textContent += "AI:\n";
		await llm.sendMessage(content);
		chatOutput.textContent += "\n";
	});
}

main();

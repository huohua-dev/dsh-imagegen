import { promises, readFileSync } from "node:fs";
import path from "node:path";
import * as settingsModule from "@deepseek-ai/dsh-settings";
import { SettingsConflictError } from "@deepseek-ai/dsh-settings";
import z from "schemastery";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { createHash, createHmac, randomUUID } from "node:crypto";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import { defineTool } from "@deepseek-ai/dsh-tools";
//#region src/settings-compat.ts
const compatModule = settingsModule;
/** Brand namespaces where the installed settings package still exposes it. */
function settingsNamespaceCompat(value) {
	return compatModule.settingsNamespace?.(value) ?? value;
}
/**
* Register an optional settings section across the rc.7 and alpha.2 APIs.
* rc.7 exposes a module helper; alpha.2 moves the helper onto the provider.
*/
function installSettingsSectionCompat(ctx, ns, schema, entry, hooks) {
	const legacyInstaller = compatModule.installSettingsSection;
	if (legacyInstaller !== void 0) {
		legacyInstaller(ctx, ns, schema, entry, hooks);
		return;
	}
	ctx.inject(["settings"], (sctx) => {
		const provider = sctx.get("settings");
		if (provider.installSection === void 0) throw new TypeError("dsh-settings does not expose installSection");
		provider.installSection(ctx, ns, schema, entry, hooks);
	});
}
//#endregion
//#region src/protocol.ts
/**
* Wire contract shared by the host and client halves of dsh-imagegen: the
* settings namespace, the route paths, and the generate payload/result shapes.
* Pure types + constants 鈥?safe for the client bundle to inline.
*/
/** Settings namespace this plugin owns (host settings seam + bridge). */
const IMAGEGEN_SETTINGS_NAMESPACE = "dsh-imagegen";
/** Published package version shared by the host updater and the client UI. */
const PLUGIN_VERSION = "1.5.5";
/** Same-origin route family (loopback-only, mirroring the dsh-ssh fence). */
const SETTINGS_API = {
	describe: "/api/dsh-imagegen/settings/describe",
	mutate: "/api/dsh-imagegen/settings/mutate"
};
/** The image-generation proxy route. */
const GENERATE_API = "/api/dsh-imagegen/generate";
/** Host-mediated OpenAI-compatible prompt enhancement endpoints. */
const PROMPT_ENHANCE_API = {
	models: "/api/dsh-imagegen/prompt-enhance/models",
	enhance: "/api/dsh-imagegen/prompt-enhance"
};
/** Host-mediated candidate discovery for the configured image API. */
const IMAGE_MODEL_API = { models: "/api/dsh-imagegen/image-models" };
/** Host-served built-in provider catalog (channels the user can instantiate). */
const PRESETS_API = "/api/dsh-imagegen/presets";
/** Loopback-only image reader for Agent tool-result previews. */
const AGENT_IMAGE_API = "/api/dsh-imagegen/agent-image";
/** Store the current composer image for the direct edit_image command. */
const CONVERSATION_IMAGE_API = "/api/dsh-imagegen/conversation-image";
/**
* Host-computed per-channel usage counters (generation-count badges in the
* settings card): entries are tallied from the persisted history and gallery
* by channel + model alias.
*/
const USAGE_API = "/api/dsh-imagegen/usage";
/** Host-resident generation queue endpoints. */
const TASK_API = {
	submit: "/api/dsh-imagegen/tasks/submit",
	list: "/api/dsh-imagegen/tasks/list",
	cancel: "/api/dsh-imagegen/tasks/cancel",
	retry: "/api/dsh-imagegen/tasks/retry"
};
/** Reveal the host data directory (saved images) in the OS file manager. */
const DATA_FOLDER_API = "/api/dsh-imagegen/data-folder/open";
/** Probe the configured S3-compatible object storage. */
const STORAGE_API = { test: "/api/dsh-imagegen/storage/test" };
/** Host-mediated GitHub Release update routes. */
const UPDATE_API = {
	check: "/api/dsh-imagegen/update/check",
	apply: "/api/dsh-imagegen/update/apply"
};
/**
* Same-origin route family for the host-persisted generation history. Images
* live as files under ~/.dsh/dsh-imagegen/images/ and are served back through
* the `image` prefix route, so list responses carry metadata only (never
* base64) and the browser loads thumbnails/previews lazily.
*/
const HISTORY_API = {
	list: "/api/dsh-imagegen/history/list",
	append: "/api/dsh-imagegen/history/append",
	remove: "/api/dsh-imagegen/history/remove",
	clear: "/api/dsh-imagegen/history/clear",
	image: "/api/dsh-imagegen/history/image"
};
/**
* Same-origin route family for the user-curated gallery (favorites). Entries
* reuse the history wire shape and persist under ~/.dsh/dsh-imagegen/gallery/;
* unlike history there is no size cap 鈥?the user adds images on purpose.
*/
const GALLERY_API = {
	list: "/api/dsh-imagegen/gallery/list",
	append: "/api/dsh-imagegen/gallery/append",
	remove: "/api/dsh-imagegen/gallery/remove",
	clear: "/api/dsh-imagegen/gallery/clear",
	tags: "/api/dsh-imagegen/gallery/tags",
	image: "/api/dsh-imagegen/gallery/image"
};
/** Host-persisted infinite canvas projects and their content-addressed assets. */
const CANVAS_API = {
	list: "/api/dsh-imagegen/canvas/list",
	create: "/api/dsh-imagegen/canvas/create",
	read: "/api/dsh-imagegen/canvas/read",
	save: "/api/dsh-imagegen/canvas/save",
	remove: "/api/dsh-imagegen/canvas/remove",
	assetUpload: "/api/dsh-imagegen/canvas/asset/upload",
	assetImport: "/api/dsh-imagegen/canvas/asset/import",
	asset: "/api/dsh-imagegen/canvas/asset"
};
/**
* Same-origin route family for the prompt-template libraries. The library is
* multi-source: every request names a source id from {@link TEMPLATE_SOURCES},
* each source keeps an independent snapshot/image cache host-side, and
* reference images are proxied through the source-scoped `image` prefix route
* (`…/image/<sourceId>/<file>`) and cached on disk so repeated views never hit
* the network again.
*/
const TEMPLATES_API = {
	list: "/api/dsh-imagegen/templates/list",
	refresh: "/api/dsh-imagegen/templates/refresh",
	sample: "/api/dsh-imagegen/templates/sample",
	image: "/api/dsh-imagegen/templates/image"
};
/** Same-origin route family for the user's saved (favorited) templates. */
const TEMPLATE_FAVORITES_API = {
	list: "/api/dsh-imagegen/templates/favorites/list",
	add: "/api/dsh-imagegen/templates/favorites/add",
	remove: "/api/dsh-imagegen/templates/favorites/remove"
};
/**
* The template-library source registry. Each entry is fully independent (own
* upstream JSON, own image pool, own refresh state) and renders as its own
* tab; adding a source later means appending an entry here plus a host-side
* fetch definition in templates-store.ts and an optional bundled snapshot.
*/
const TEMPLATE_SOURCES = [{
	id: "vibeui",
	label: "精选案例库",
	homepage: "https://vibeui.top/",
	description: "awesome-gpt-image-2 精选提示词案例（vibeui.top 镜像）"
}, {
	id: "canghe",
	label: "沧河案例库",
	homepage: "https://gpt-image2.canghe.ai/",
	description: "GPT-Image2 Prompt Gallery（gpt-image2.canghe.ai，定期更新）"
}];
/** Default source id when a request does not name one (legacy clients). */
const DEFAULT_TEMPLATE_SOURCE_ID = TEMPLATE_SOURCES[0].id;
/** True when the id names a registered template source. */
function isTemplateSourceId(id) {
	return TEMPLATE_SOURCES.some((source) => source.id === id);
}
//#endregion
//#region src/model-catalog.ts
const ENTRIES = {
	"gpt-image": {
		label: "gpt-image",
		labelZh: "GPT 图像",
		known: true,
		supportsEdit: true,
		supportsAspectRatio: false,
		qualityTiers: [
			"1K",
			"2K",
			"4K"
		]
	},
	"dall-e": {
		label: "DALL·E",
		labelZh: "DALL·E",
		known: true,
		supportsEdit: true,
		supportsAspectRatio: false,
		qualityTiers: ["auto"]
	},
	grok: {
		label: "grok",
		labelZh: "Grok",
		known: true,
		supportsEdit: true,
		supportsAspectRatio: true,
		qualityTiers: ["1K", "2K"]
	},
	nanobanana: {
		label: "nanobanana",
		labelZh: "Nano Banana",
		known: true,
		supportsEdit: true,
		supportsAspectRatio: true,
		qualityTiers: [
			"1K",
			"2K",
			"4K"
		]
	},
	seedream: {
		label: "seedream",
		labelZh: "Seedream",
		known: true,
		supportsEdit: true,
		supportsAspectRatio: true,
		qualityTiers: ["1K", "2K"]
	},
	zhipu: {
		label: "GLM-Image",
		labelZh: "智谱图像",
		known: true,
		supportsEdit: false,
		supportsAspectRatio: false,
		qualityTiers: ["HD"]
	},
	qwen: {
		label: "qwen-image",
		labelZh: "千问图像",
		known: true,
		supportsEdit: true,
		supportsAspectRatio: true,
		qualityTiers: ["auto"]
	}
};
/** Official Gemini image ids served by Nano Banana gateways. */
const NANOBANANA_GEMINI_IDS = /* @__PURE__ */ new Set([
	"gemini-3-pro-image",
	"gemini-3-pro-image-preview",
	"gemini-3.1-flash-image",
	"gemini-3.1-flash-image-preview",
	"gemini-3.1-flash-lite-image",
	"gemini-2.5-flash-image"
]);
/** Classify one upstream model id into its request-shaping family. */
function describeModel(model) {
	const id = model.trim();
	if (/^gpt-image/i.test(id)) return {
		family: "gpt-image",
		...ENTRIES["gpt-image"]
	};
	if (/^dall-e/i.test(id)) return {
		family: "dall-e",
		...ENTRIES["dall-e"]
	};
	if (/^grok-imagine(?:-|$)/.test(id)) return {
		family: "grok",
		...ENTRIES.grok
	};
	if (/^nanobanana/i.test(id) || NANOBANANA_GEMINI_IDS.has(id)) return {
		family: "nanobanana",
		...ENTRIES.nanobanana
	};
	if (/^(?:doubao-)?seedream/i.test(id)) return {
		family: "seedream",
		...ENTRIES.seedream
	};
	if (/^(?:glm-image|cogview(?:-|$))/i.test(id)) return {
		family: "zhipu",
		...ENTRIES.zhipu
	};
	if (/^qwen-image(?:[-_.]|$)/i.test(id)) return {
		family: "qwen",
		...ENTRIES.qwen
	};
	return {
		family: "unknown",
		label: "unknown",
		labelZh: "未知协议",
		known: false,
		supportsEdit: true,
		supportsAspectRatio: false,
		qualityTiers: []
	};
}
/** Conservative fallback for providers whose /models response only has ids.
*  Metadata-aware filtering lives in prompt-enhancer.ts; this catches common
*  image model naming conventions without treating every unknown model as an
*  image model. */
function isLikelyImageModelId(model) {
	return /(?:^|[-_.])(?:image|img|diffusion|flux|cogview|imagen|seedream|nanobanana|grok-imagine|dall-e|stable-diffusion|sdxl|pixart|kolors|ideogram|midjourney|recraft|hunyuan|jimeng|wanx|hidream|playground)(?:$|[-_.])/i.test(model.trim());
}
/** The family a model id routes its request through. */
function modelFamily(model) {
	return describeModel(model).family;
}
//#endregion
//#region src/prompt-enhancer.ts
/** OpenAI-compatible chat helpers used by the optional prompt-enhancement UI. */
function endpoint(base, suffix) {
	return `${base.replace(/\/+$/, "")}${suffix}`;
}
function headers(apiKey) {
	return {
		"content-type": "application/json",
		...apiKey.trim() === "" ? {} : { authorization: `Bearer ${apiKey.trim()}` }
	};
}
async function responseJson(response) {
	const body = await response.json().catch(() => void 0);
	if (!response.ok || body === void 0 || body === null || typeof body !== "object") {
		const message = body !== null && typeof body === "object" && typeof body.error?.message === "string" ? body.error.message : `HTTP ${response.status}`;
		throw new Error(message);
	}
	return body;
}
async function listModelRecords(config) {
	if (config.apiUrl.trim() === "") throw new Error("API URL is required");
	const body = await responseJson(await fetch(endpoint(config.apiUrl, "/models"), { headers: headers(config.apiKey) }));
	return (Array.isArray(body.data) ? body.data : []).flatMap((item) => {
		if (item === null || typeof item !== "object" || typeof item.id !== "string") return [];
		const id = item.id.trim();
		return id === "" ? [] : [{
			...item,
			id
		}];
	});
}
function textOf(value) {
	if (typeof value === "string") return [value];
	if (!Array.isArray(value)) return [];
	return value.filter((item) => typeof item === "string");
}
function hasImageGenerationCapability(record) {
	const capability = record.capabilities;
	if (capability !== null && typeof capability === "object") {
		const values = capability;
		for (const key of [
			"image_generation",
			"imageGeneration",
			"text_to_image",
			"textToImage",
			"image_gen"
		]) if (typeof values[key] === "boolean") return values[key];
		const serialized = JSON.stringify(values).toLowerCase();
		if (/image[ _-]?generation|text[ _-]?to[ _-]?image/.test(serialized)) return true;
	}
	const taskText = [
		...textOf(record.task),
		...textOf(record.task_type),
		...textOf(record.taskType),
		...textOf(record.type),
		...textOf(record.model_type),
		...textOf(record.modelType),
		...textOf(record.tasks),
		...textOf(record.description)
	].join(" ").toLowerCase();
	if (/image[ _-]?generation|text[ _-]?to[ _-]?image|image[ _-]?gen/.test(taskText)) return true;
	if (/^image(?:[ _-]?generation)?$/.test(taskText.trim())) return true;
	if (/embedding|rerank|moderation|transcri|speech|audio|video|chat[ _-]?completion/.test(taskText)) return false;
	for (const key of [
		"output_modalities",
		"outputModalities",
		"supported_output_modalities"
	]) {
		const modalities = textOf(record[key]).map((value) => value.toLowerCase());
		if (modalities.length > 0) return modalities.includes("image");
	}
}
function isImageModelRecord(record) {
	return hasImageGenerationCapability(record) ?? isLikelyImageModelId(record.id);
}
/** List candidates exposed by an OpenAI-compatible endpoint. */
async function listOpenAIModels(config) {
	return [...new Set((await listModelRecords(config)).map((record) => record.id))].sort((a, b) => a.localeCompare(b));
}
/** List only models that advertise or conventionally represent image generation. */
async function listImageModels(config) {
	return [...new Set((await listModelRecords(config)).filter(isImageModelRecord).map((record) => record.id))].sort((a, b) => a.localeCompare(b));
}
/** List chat models exposed by an OpenAI-compatible endpoint. */
async function listPromptModels(config) {
	return listOpenAIModels(config);
}
/** Expand a concise image request into a production-ready image prompt. */
async function enhancePrompt(config, prompt) {
	if (config.apiUrl.trim() === "" || config.model.trim() === "") throw new Error("prompt enhancement model is not configured");
	const body = await responseJson(await fetch(endpoint(config.apiUrl, "/chat/completions"), {
		method: "POST",
		headers: headers(config.apiKey),
		body: JSON.stringify({
			model: config.model.trim(),
			temperature: .7,
			messages: [{
				role: "system",
				content: "You are an expert image-prompt editor. Expand the user request into one vivid, specific image-generation prompt. Preserve intent and language. Add only useful visual detail: subject, composition, lighting, materials, color, camera/style and quality. Return only the finished prompt, with no preface or markdown."
			}, {
				role: "user",
				content: prompt
			}]
		})
	}));
	const choices = Array.isArray(body.choices) ? body.choices : [];
	const content = choices[0] !== null && typeof choices[0] === "object" ? choices[0].message?.content : void 0;
	if (typeof content !== "string" || content.trim() === "") throw new Error("chat model returned an empty prompt");
	return content.trim();
}
//#endregion
//#region src/image-models.ts
/**
* Image-model configuration shared by the host, panel, and Agent tools.
* `/models` exposes candidates only: the configured list is the explicit
* allow-list because OpenAI-compatible gateways rarely advertise modalities.
*/
const DEFAULT_IMAGE_MODELS = [
	"gpt-image-2",
	"grok-imagine-image",
	"nanobanana2",
	"nanobanana2-lite",
	"nanobanana-pro",
	"seedream-5.0-pro",
	"glm-image"
];
/** Normalize user-entered model identifiers and retain a usable legacy default. */
function normalizeImageModels(value) {
	const candidates = Array.isArray(value) ? value : [];
	const unique = /* @__PURE__ */ new Set();
	for (const candidate of candidates) {
		if (typeof candidate !== "string") continue;
		const model = candidate.trim();
		if (model !== "") unique.add(model);
	}
	return unique.size > 0 ? [...unique] : [...DEFAULT_IMAGE_MODELS];
}
//#endregion
//#region src/image-format.ts
function detectImageMime(data) {
	const startsWith = (...bytes) => bytes.every((value, index) => data[index] === value);
	if (startsWith(137, 80, 78, 71, 13, 10, 26, 10)) return "image/png";
	if (startsWith(255, 216, 255)) return "image/jpeg";
	if (startsWith(71, 73, 70, 56, 55, 97) || startsWith(71, 73, 70, 56, 57, 97)) return "image/gif";
	if (startsWith(82, 73, 70, 70) && data[8] === 87 && data[9] === 69 && data[10] === 66 && data[11] === 80) return "image/webp";
}
//#endregion
//#region src/engine.ts
/** A generation failure with a user-presentable message. */
var ImageGenError = class extends Error {
	/** Stable wire code. */
	code;
	constructor(message, code = "generate-failed") {
		super(message);
		this.name = "ImageGenError";
		this.code = code;
	}
};
/** Total budget for the upstream generation call (image models are slow). */
const UPSTREAM_TIMEOUT_MS = 24e4;
/** Budget for downloading one result image URL. */
const IMAGE_FETCH_TIMEOUT_MS = 6e4;
/** Cap on the reference image payload (edit mode), in bytes. */
const MAX_EDIT_IMAGE_BYTES = 10 * 1024 * 1024;
/** Sizes dall-e-3 accepts; anything else falls back to its square default. */
const DALLE3_SIZES = /* @__PURE__ */ new Set([
	"1024x1024",
	"1792x1024",
	"1024x1792"
]);
/** The wire model id for a request: `upstream` (host-filled alias mapping)
*  wins, then the alias, then the family default. */
function wireModel(request) {
	const upstream = request.upstream?.trim();
	if (upstream !== void 0 && upstream !== "") return upstream;
	const alias = request.model.trim();
	return alias === "" ? "gpt-image-2" : alias;
}
/** Whether the model is an xAI Grok Imagine model (grok-imagine-image,
*  grok-imagine-image-2.0, …). Grok Imagine speaks JSON on both endpoints
*  and exposes its own aspect-ratio / response-format knobs instead of the
*  OpenAI size/quality/detail passthrough. */
function isGrokImagine(model) {
	return modelFamily(model) === "grok";
}
/** Whether the model belongs to the Google Nano Banana family (nanobanana2 /
*  nanobanana2-lite / nanobanana-pro, plus the official Gemini image IDs the
*  gateways expose). OpenAI-compatible gateways serve these with their own
*  aspect_ratio / image_size vocabulary instead of the OpenAI size/quality
*  passthrough. */
function isNanoBanana(model) {
	return modelFamily(model) === "nanobanana";
}
/** Whether the model belongs to the ByteDance Seedream family (seedream-5.0-pro,
*  seedream-5.0, seedream-4.x, doubao-seedream-…). OpenAI-compatible gateways
*  serve Seedream through a unified generate-and-edit architecture:
*  generation AND editing both go to /images/generations and reference images
*  are a JSON URL / data-URL array. */
function isSeedream(model) {
	return modelFamily(model) === "seedream";
}
/** Whether the model uses the official Zhipu image-generation contract. */
function isZhipuImage(model) {
	return modelFamily(model) === "zhipu";
}
/** Whether the model is Alibaba Qwen-Image, which speaks the DashScope native
*  multimodal-generation contract (NOT OpenAI-compatible): a chat-style
*  messages body, `宽*高` pixel sizes, and image URLs in the reply content. */
function isQwenImage(model) {
	return modelFamily(model) === "qwen";
}
function isGlmImage(model) {
	return /^glm-image(?:-|$)/i.test(model.trim());
}
/** Whether this is the official Volcengine Ark model naming convention. */
function isVolcSeedream(model) {
	return /^doubao-seedream(?:-|$)/i.test(model.trim());
}
/** Volcengine uses `size` for the output tier, not the panel's aspect ratio. */
function seedreamSize(quality) {
	if (quality === "1k") return "1K";
	return "2K";
}
/** The panel's aspect ratios mapped to Qwen-Image's `宽*高` pixel sizes.
*  The classic series (qwen-image / -plus / -max) documents this fixed list;
*  2.0 / 3.0-series models accept any size within their pixel budget and
*  recommend the larger set. */
const QWEN_SIZE_CLASSIC = {
	"16:9": "1664*928",
	"21:9": "1664*928",
	"4:3": "1472*1104",
	"3:2": "1472*1104",
	"1:1": "1328*1328",
	"3:4": "1104*1472",
	"2:3": "1104*1472",
	"9:16": "928*1664"
};
const QWEN_SIZE_HD = {
	"16:9": "2688*1536",
	"21:9": "2688*1536",
	"4:3": "2368*1728",
	"3:2": "2368*1728",
	"1:1": "2048*2048",
	"3:4": "1728*2368",
	"2:3": "1728*2368",
	"9:16": "1536*2688"
};
/** Versioned ids (qwen-image-2.0 / -3.0-pro / …) take the large size set. */
function isVersionedQwenImage(model) {
	return /^qwen-image-\d+\.\d/i.test(model.trim());
}
function qwenSize(model, ratio) {
	if (ratio === "" || ratio === "auto") return void 0;
	return (isVersionedQwenImage(model) ? QWEN_SIZE_HD : QWEN_SIZE_CLASSIC)[ratio];
}
/** The panel's aspect ratios mapped to the closest OpenAI pixel size
*  (gpt-image-2 / generic OpenAI-compatible endpoints). */
const OPENAI_SIZE_BY_RATIO = {
	"1:1": "1024x1024",
	"3:4": "1024x1536",
	"4:3": "1536x1024",
	"9:16": "1024x1792",
	"2:3": "1024x1536",
	"3:2": "1536x1024",
	"16:9": "1792x1024",
	"21:9": "1792x1024"
};
/** Panel ratios that need renaming for a model's vocabulary. Grok documents
*  20:9 as its ultra-wide ratio, so the panel's 21:9 label is sent as 20:9. */
const GROK_ASPECT_ALIASES = { "21:9": "20:9" };
/**
* One request-scoped timeout that is cleared as soon as its fetch settles.
* AbortSignal.timeout() cannot be disposed early; using it inside a long-lived
* task queue leaves an otherwise idle Node process holding every timeout.
*/
function requestSignal(source, timeoutMs) {
	const controller = new AbortController();
	const abortFromSource = () => {
		controller.abort(source?.reason);
	};
	if (source?.aborted === true) abortFromSource();
	else source?.addEventListener("abort", abortFromSource, { once: true });
	const timeout = setTimeout(() => {
		controller.abort(new DOMException("The operation timed out.", "TimeoutError"));
	}, timeoutMs);
	timeout.unref();
	return {
		signal: controller.signal,
		dispose: () => {
			clearTimeout(timeout);
			source?.removeEventListener("abort", abortFromSource);
		}
	};
}
/** Whether an error was produced by a requestSignal budget timeout. These can
* surface from the fetch call itself or from reading the response body, so the
* budget must stay armed until the body has been consumed. */
function isBudgetTimeout(error) {
	return (error instanceof DOMException || error instanceof Error) && error.name === "TimeoutError";
}
/** Content-type extension hints for URL-fetched images. */ function mimeOfExtension(path) {
	const match = /\.([a-z0-9]+)$/i.exec(path);
	if (match === null) return void 0;
	switch (match[1].toLowerCase()) {
		case "png": return "image/png";
		case "jpg":
		case "jpeg": return "image/jpeg";
		case "webp": return "image/webp";
		case "gif": return "image/gif";
		default: return;
	}
}
/** Parse `data:<mime>;base64,<payload>` into its parts; undefined when malformed. */
function parseDataUrl(dataUrl) {
	const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(dataUrl.trim());
	if (match === null || match[3] === void 0) return void 0;
	if (match[2] === void 0) return;
	return {
		mime: match[1] ?? "application/octet-stream",
		base64: match[3]
	};
}
/** Strip a data: prefix from an upstream b64 payload if a gateway added one. */
function bareBase64(value) {
	const parsed = parseDataUrl(value);
	return parsed !== void 0 && parsed.base64 !== void 0 ? parsed.base64 : value;
}
/** Whether a result URL carries cloud-storage signing credentials. */
function isPresignedUrl(value) {
	let url;
	try {
		url = new URL(value);
	} catch {
		return false;
	}
	const params = new Set(Array.from(url.searchParams.keys(), (key) => key.toLowerCase()));
	if (params.has("x-goog-signature") || params.has("x-goog-credential")) return true;
	if (params.has("x-amz-signature") || params.has("x-amz-credential")) return true;
	return params.has("signature") && (params.has("expires") || params.has("googleaccessid") || params.has("awsaccesskeyid"));
}
/**
* Whether a result URL lives on the same origin as the configured API base.
* The upstream Bearer key is only ever forwarded to this origin: a provider
* (or a compromised relay) that hands back an image URL on a foreign host
* must not be able to harvest the key through that download.
*/
function isSameOriginAsApi(value, apiUrl) {
	try {
		return new URL(value).origin === new URL(apiUrl).origin;
	} catch {
		return false;
	}
}
/** Clamp the requested image count into the API-accepted range. */
function clampCount(n) {
	if (!Number.isFinite(n)) return 1;
	return Math.min(4, Math.max(1, Math.round(n)));
}
/** Pick the effective per-model request parameters. Never includes `n`: the
*  batch parameter is rejected by Responses-API-based gateways (tools[0].n),
*  so the count is satisfied by parallel single-image requests instead. */
function effectiveParams(request) {
	const model = wireModel(request);
	if (model === "dall-e-3") {
		const pixel = OPENAI_SIZE_BY_RATIO[request.size];
		return {
			model,
			size: pixel !== void 0 && DALLE3_SIZES.has(pixel) ? pixel : "1024x1024"
		};
	}
	if (isGrokImagine(model)) return {
		model,
		...request.size !== "" && request.size !== "auto" ? { aspect_ratio: GROK_ASPECT_ALIASES[request.size] ?? request.size } : {},
		...request.quality !== "" && request.quality !== "auto" ? { resolution: request.quality === "4k" ? "2k" : request.quality } : {},
		response_format: "b64_json"
	};
	if (isNanoBanana(model)) return {
		model,
		...request.size !== "" && request.size !== "auto" ? { aspect_ratio: request.size } : {},
		...request.quality !== "" && request.quality !== "auto" ? { image_size: request.quality.toUpperCase() } : {},
		response_format: "b64_json"
	};
	if (isSeedream(model)) return {
		model,
		size: seedreamSize(request.quality),
		response_format: isVolcSeedream(model) ? "url" : "b64_json"
	};
	if (isZhipuImage(model)) return {
		model,
		...request.size !== "" && request.size !== "auto" && OPENAI_SIZE_BY_RATIO[request.size] !== void 0 ? { size: OPENAI_SIZE_BY_RATIO[request.size] } : {},
		quality: isGlmImage(model) ? "hd" : "standard"
	};
	return {
		model,
		...request.size !== "" && request.size !== "auto" && OPENAI_SIZE_BY_RATIO[request.size] !== void 0 ? { size: OPENAI_SIZE_BY_RATIO[request.size] } : {},
		...request.quality === "1k" ? { quality: "low" } : {},
		...request.quality === "2k" ? { quality: "medium" } : {},
		...request.quality === "4k" ? { quality: "high" } : {},
		...request.detail !== "" ? { detail: request.detail } : {}
	};
}
/** How many single-image requests to issue for the requested image count. */
function effectiveCount(request) {
	if (wireModel(request) === "dall-e-3") return 1;
	return clampCount(request.n);
}
/** Normalize one upstream data item into a base64 image. */
async function normalizeItem(item, upstream, signal) {
	const revisedPrompt = typeof item.revised_prompt === "string" ? item.revised_prompt : void 0;
	if (typeof item.b64_json === "string" && item.b64_json.trim() !== "") {
		const b64 = bareBase64(item.b64_json);
		if (b64.trim() !== "") return {
			b64,
			mime: detectImageMime(Buffer.from(b64, "base64")) ?? "image/png",
			revisedPrompt
		};
	}
	if (typeof item.url !== "string" || item.url === "") throw new ImageGenError("upstream image item has neither b64_json nor url");
	const url = item.url;
	if (url.startsWith("data:")) {
		const parsed = parseDataUrl(url);
		if (parsed === void 0) throw new ImageGenError("upstream returned a malformed data: url");
		return {
			b64: parsed.base64,
			mime: detectImageMime(Buffer.from(parsed.base64, "base64")) ?? parsed.mime,
			revisedPrompt
		};
	}
	const budget = requestSignal(signal, IMAGE_FETCH_TIMEOUT_MS);
	try {
		let response;
		try {
			const forwardKey = upstream.apiKey !== "" && !isPresignedUrl(url) && isSameOriginAsApi(url, upstream.apiUrl);
			response = await fetch(url, {
				...forwardKey ? { headers: { authorization: `Bearer ${upstream.apiKey}` } } : {},
				signal: budget.signal
			});
		} catch (error) {
			throw new ImageGenError(`failed to fetch the generated image url: ${error instanceof Error ? error.message : String(error)}`);
		}
		if (!response.ok) throw new ImageGenError(`failed to fetch the generated image url: HTTP ${response.status}`);
		const buffer = Buffer.from(await response.arrayBuffer());
		const contentType = response.headers.get("content-type");
		const mime = detectImageMime(buffer) ?? (contentType !== null && contentType !== "" ? contentType.split(";")[0].trim() : mimeOfExtension(url) ?? "image/png");
		return {
			b64: buffer.toString("base64"),
			mime,
			revisedPrompt
		};
	} finally {
		budget.dispose();
	}
}
/** Expand a provider image item whose URL may be a string or an array. */
function imageItemsOf(value) {
	if (value === null || typeof value !== "object") return [];
	const item = value;
	if (Array.isArray(item.url)) return item.url.filter((url) => typeof url === "string" && url !== "").map((url) => ({
		...item,
		url
	}));
	return [item];
}
/** Return the data records from the response shapes shared by sync gateways. */
function dataRecordsOf(payload) {
	const data = Array.isArray(payload.data) ? payload.data : payload.data !== null && typeof payload.data === "object" ? [payload.data] : Array.isArray(payload.images) ? payload.images : Array.isArray(payload.output) ? payload.output : void 0;
	if (data === void 0) return void 0;
	return data.filter((entry) => entry !== null && typeof entry === "object");
}
const ASYNC_PENDING_STATUSES = /* @__PURE__ */ new Set([
	"submitted",
	"pending",
	"processing",
	"running",
	"in_progress",
	"queued"
]);
const ASYNC_COMPLETED_STATUSES = /* @__PURE__ */ new Set([
	"completed",
	"succeeded",
	"success",
	"done"
]);
const ASYNC_FAILED_STATUSES = /* @__PURE__ */ new Set([
	"failed",
	"failure",
	"cancelled",
	"canceled",
	"error"
]);
const ASYNC_POLL_MAX_MS = 24e4;
const ASYNC_POLL_REQUEST_TIMEOUT_MS = 3e4;
/** Read a provider error message from the common nested locations. */
function asyncErrorMessage(payload, fallback) {
	if (payload !== null && typeof payload === "object") {
		const record = payload;
		const candidates = [record.message, record.error];
		const data = record.data;
		const entries = Array.isArray(data) ? data : [data];
		for (const entry of entries) {
			if (entry === null || typeof entry !== "object") continue;
			const item = entry;
			candidates.push(item.message, item.error);
			const nested = item.error;
			if (nested !== null && typeof nested === "object") candidates.push(nested.message);
		}
		for (const candidate of candidates) {
			if (typeof candidate === "string" && candidate.trim() !== "") return candidate;
			if (candidate !== null && typeof candidate === "object") {
				const message = candidate.message;
				if (typeof message === "string" && message.trim() !== "") return message;
			}
		}
	}
	return fallback;
}
/** Wait between async-provider polls, but wake immediately when cancelled. */
function waitForPoll(ms, signal) {
	return new Promise((resolve, reject) => {
		if (signal?.aborted === true) {
			reject(signal.reason ?? new DOMException("The operation was aborted.", "AbortError"));
			return;
		}
		const onAbort = () => {
			clearTimeout(timer);
			signal?.removeEventListener("abort", onAbort);
			reject(signal?.reason ?? new DOMException("The operation was aborted.", "AbortError"));
		};
		const done = () => {
			signal?.removeEventListener("abort", onAbort);
			resolve();
		};
		const timer = setTimeout(done, ms);
		timer.unref();
		signal?.addEventListener("abort", onAbort, { once: true });
	});
}
/**
* Poll one apib/apimart-style provider task until it yields image records.
* The total deadline is shared by every poll and the final image downloads;
* local task cancellation propagates through every request and sleep.
*/
async function pollAsyncTask(baseUrl, upstream, taskId, signal) {
	const deadline = Date.now() + ASYNC_POLL_MAX_MS;
	let delay = 1e3;
	while (Date.now() < deadline) {
		const remaining = deadline - Date.now();
		const budget = requestSignal(signal, Math.min(ASYNC_POLL_REQUEST_TIMEOUT_MS, remaining));
		try {
			let response;
			try {
				response = await fetch(`${baseUrl}/tasks/${encodeURIComponent(taskId)}`, {
					method: "GET",
					headers: { authorization: `Bearer ${upstream.apiKey.trim()}` },
					signal: budget.signal
				});
			} catch (error) {
				if (signal?.aborted === true) throw new ImageGenError("任务已取消", "cancelled");
				if (isBudgetTimeout(error)) throw new ImageGenError("上游异步任务轮询超时", "upstream-timeout");
				throw new ImageGenError(`无法轮询上游异步任务：${error instanceof Error ? error.message : String(error)}`, "upstream-unreachable");
			}
			let payload;
			try {
				payload = await response.json();
			} catch (error) {
				if (isBudgetTimeout(error)) throw new ImageGenError("上游异步任务轮询超时", "upstream-timeout");
				throw new ImageGenError(`上游任务接口返回了非 JSON 响应（HTTP ${response.status}）`, "upstream-invalid");
			}
			if (!response.ok || payload === null || typeof payload !== "object") throw new ImageGenError(asyncErrorMessage(payload, `上游任务轮询失败（HTTP ${response.status}）`), "upstream-rejected");
			const record = payload;
			const data = record.data;
			const statusRecord = Array.isArray(data) ? data[0] : data !== null && typeof data === "object" ? data : record;
			const statusValue = statusRecord !== null && typeof statusRecord === "object" ? statusRecord.status : void 0;
			const status = typeof statusValue === "string" ? statusValue.toLowerCase() : "";
			if (ASYNC_FAILED_STATUSES.has(status)) throw new ImageGenError(asyncErrorMessage(payload, `上游异步任务失败（${status || "unknown"}）`), "upstream-rejected");
			const nested = statusRecord !== null && typeof statusRecord === "object" ? statusRecord : record;
			const result = nested.result ?? (nested.output !== null && typeof nested.output === "object" ? nested.output.result : void 0) ?? record.result;
			const images = (result !== null && typeof result === "object" ? result : void 0)?.images ?? nested.images ?? record.images;
			if (ASYNC_COMPLETED_STATUSES.has(status) || images !== void 0) {
				const items = Array.isArray(images) ? images.flatMap(imageItemsOf) : imageItemsOf(images);
				if (items.length > 0) return items;
				if (ASYNC_COMPLETED_STATUSES.has(status)) throw new ImageGenError("上游异步任务完成但没有图片结果", "upstream-empty");
			}
			if (status !== "" && !ASYNC_PENDING_STATUSES.has(status) && !ASYNC_COMPLETED_STATUSES.has(status)) throw new ImageGenError(`上游返回了未知异步任务状态：${status}`, "upstream-invalid");
		} finally {
			budget.dispose();
		}
		await waitForPoll(Math.min(delay, Math.max(1, deadline - Date.now())), signal);
		delay = Math.min(5e3, delay * 2);
	}
	throw new ImageGenError("上游异步任务轮询超时（240 秒）", "upstream-timeout");
}
/**
* Issue one single-image request (never sends `n`). The response is kept as a
* list so a gateway that happens to return several images per call still works.
*/
async function requestOneImage(baseUrl, upstream, request, params, signal) {
	const headers = { authorization: `Bearer ${upstream.apiKey.trim()}` };
	let body;
	if (request.mode === "edit") {
		if (typeof request.image !== "string" || request.image === "") throw new ImageGenError("图生图需要上传参考图片", "edit-image-missing");
		const decodeReference = (dataUrl) => {
			const parsed = parseDataUrl(dataUrl);
			if (parsed === void 0) throw new ImageGenError("参考图片格式无效", "edit-image-invalid");
			let bytes;
			try {
				bytes = Buffer.from(parsed.base64, "base64");
			} catch {
				throw new ImageGenError("参考图片数据无法解码", "edit-image-invalid");
			}
			if (bytes.byteLength > MAX_EDIT_IMAGE_BYTES) throw new ImageGenError("参考图片超过 10MB 上限", "edit-image-too-large");
			return {
				bytes,
				mime: parsed.mime,
				filename: `reference.${extensionOf$3(parsed.mime)}`
			};
		};
		const primary = decodeReference(request.image);
		const extras = (request.images ?? []).filter((img) => typeof img === "string" && img !== "").slice(0, 4).map(decodeReference);
		if (isGrokImagine(params.model)) {
			headers["content-type"] = "application/json";
			body = JSON.stringify({
				model: params.model,
				prompt: request.prompt,
				image: {
					url: request.image,
					type: "image_url"
				},
				...params.aspect_ratio !== void 0 ? { aspect_ratio: params.aspect_ratio } : {},
				response_format: "b64_json"
			});
		} else if (isNanoBanana(params.model)) {
			const form = new FormData();
			form.append("image", new Blob([primary.bytes], { type: primary.mime }), primary.filename);
			form.append("prompt", request.prompt);
			form.append("model", params.model);
			if (params.aspect_ratio !== void 0) form.append("aspect_ratio", params.aspect_ratio);
			if (params.image_size !== void 0) form.append("image_size", params.image_size);
			body = form;
		} else if (isSeedream(params.model)) {
			headers["content-type"] = "application/json";
			body = JSON.stringify({
				model: params.model,
				prompt: request.prompt,
				image: [request.image, ...(request.images ?? []).filter((img) => typeof img === "string" && img !== "").slice(0, 4)],
				...params.size !== void 0 ? { size: params.size } : {},
				...params.resolution !== void 0 ? { resolution: params.resolution } : {},
				response_format: isVolcSeedream(params.model) ? "url" : "b64_json"
			});
		} else {
			const form = new FormData();
			if (extras.length > 0) for (const [index, reference] of [primary, ...extras].entries()) form.append("image[]", new Blob([reference.bytes], { type: reference.mime }), `reference-${index}.${extensionOf$3(reference.mime)}`);
			else form.append("image", new Blob([primary.bytes], { type: primary.mime }), primary.filename);
			form.append("prompt", request.prompt);
			form.append("model", params.model);
			if (params.size !== void 0) form.append("size", params.size);
			if (params.quality !== void 0) form.append("quality", params.quality);
			if (params.detail !== void 0) form.append("detail", params.detail);
			body = form;
		}
	} else {
		headers["content-type"] = "application/json";
		body = JSON.stringify({
			prompt: request.prompt,
			...params
		});
	}
	const budget = requestSignal(signal, UPSTREAM_TIMEOUT_MS);
	try {
		let response;
		try {
			const endpoint = request.mode === "edit" && !isSeedream(params.model) ? "/images/edits" : "/images/generations";
			response = await fetch(`${baseUrl}${endpoint}`, {
				method: "POST",
				headers,
				body,
				signal: budget.signal
			});
		} catch (error) {
			if (isBudgetTimeout(error)) throw new ImageGenError("上游接口响应超时（240 秒）", "upstream-timeout");
			if (signal?.aborted === true) throw new ImageGenError("任务已取消", "cancelled");
			throw new ImageGenError(`无法连接上游接口：${error instanceof Error ? error.message : String(error)}`, "upstream-unreachable");
		}
		let payload;
		try {
			payload = await response.json();
		} catch (error) {
			if (isBudgetTimeout(error)) throw new ImageGenError("上游接口响应超时（240 秒）", "upstream-timeout");
			if (signal?.aborted === true) throw new ImageGenError("任务已取消", "cancelled");
			throw new ImageGenError(`上游接口返回了非 JSON 响应（HTTP ${response.status}）`, "upstream-invalid");
		}
		if (!response.ok || payload === null || typeof payload !== "object") throw new ImageGenError(upstreamMessage(payload, response.status), "upstream-rejected");
		const data = dataRecordsOf(payload);
		if (data === void 0) throw new ImageGenError("上游响应缺少 data 数组", "upstream-invalid");
		if (data.length === 0) throw new ImageGenError("上游返回了 0 张图片", "upstream-empty");
		const asyncEntries = data.filter((entry) => typeof entry.task_id === "string" && entry.task_id.trim() !== "");
		if (asyncEntries.length > 0) {
			const asyncRecords = (await Promise.all(asyncEntries.map((entry) => pollAsyncTask(baseUrl, upstream, entry.task_id, signal)))).flat();
			if (asyncRecords.length === 0) throw new ImageGenError("上游异步任务完成但没有图片结果", "upstream-empty");
			return Promise.all(asyncRecords.flatMap(imageItemsOf).map((item) => normalizeItem(item, upstream, signal)));
		}
		return Promise.all(data.flatMap(imageItemsOf).map((item) => normalizeItem(item, upstream, signal)));
	} finally {
		budget.dispose();
	}
}
/**
* Qwen-Image (DashScope native multimodal-generation): one chat-style request
* carries the prompt (plus the reference image for edit mode) and answers
* synchronously with image URLs in the reply content. The versioned series
* batches natively (n ≤ 6; the panel caps at 4), the classic series is
* single-image per call.
*/
async function generateQwenImage(baseUrl, upstream, request, options) {
	const model = wireModel(request);
	const content = [];
	if (request.mode === "edit") {
		if (typeof request.image !== "string" || request.image === "") throw new ImageGenError("图生图需要上传参考图片", "edit-image-missing");
		const parsed = parseDataUrl(request.image);
		if (parsed === void 0) throw new ImageGenError("参考图片格式无效", "edit-image-invalid");
		if (Buffer.from(parsed.base64, "base64").byteLength > MAX_EDIT_IMAGE_BYTES) throw new ImageGenError("参考图片超过 10MB 上限", "edit-image-too-large");
		content.push({ image: request.image });
	}
	content.push({ text: request.prompt });
	const count = isVersionedQwenImage(model) ? clampCount(request.n) : 1;
	const size = qwenSize(model, request.size);
	const body = {
		model,
		input: { messages: [{
			role: "user",
			content
		}] },
		parameters: {
			...size !== void 0 ? { size } : {},
			...count > 1 ? { n: count } : {}
		}
	};
	const budget = requestSignal(options.signal, UPSTREAM_TIMEOUT_MS);
	try {
		let response;
		try {
			response = await fetch(`${baseUrl}/services/aigc/multimodal-generation/generation`, {
				method: "POST",
				headers: {
					authorization: `Bearer ${upstream.apiKey.trim()}`,
					"content-type": "application/json"
				},
				body: JSON.stringify(body),
				signal: budget.signal
			});
		} catch (error) {
			if (isBudgetTimeout(error)) throw new ImageGenError("上游接口响应超时（240 秒）", "upstream-timeout");
			if (options.signal?.aborted === true) throw new ImageGenError("任务已取消", "cancelled");
			throw new ImageGenError(`无法连接上游接口：${error instanceof Error ? error.message : String(error)}`, "upstream-unreachable");
		}
		let payload;
		try {
			payload = await response.json();
		} catch (error) {
			if (isBudgetTimeout(error)) throw new ImageGenError("上游接口响应超时（240 秒）", "upstream-timeout");
			if (options.signal?.aborted === true) throw new ImageGenError("任务已取消", "cancelled");
			throw new ImageGenError(`上游接口返回了非 JSON 响应（HTTP ${response.status}）`, "upstream-invalid");
		}
		if (!response.ok || payload === null || typeof payload !== "object") throw new ImageGenError(upstreamMessage(payload, response.status), "upstream-rejected");
		const output = payload.output;
		const choices = output !== void 0 && Array.isArray(output.choices) ? output.choices : [];
		const urls = [];
		for (const choice of choices) {
			const message = choice !== null && typeof choice === "object" ? choice.message : void 0;
			const items = message !== null && typeof message === "object" && Array.isArray(message.content) ? message.content : [];
			for (const item of items) if (item !== null && typeof item === "object") {
				const image = item.image;
				if (typeof image === "string" && image !== "") urls.push(image);
			}
		}
		if (urls.length === 0) throw new ImageGenError("上游响应缺少图片内容", "upstream-empty");
		return { images: await Promise.all(urls.map(async (url) => {
			const normalized = await normalizeItem({ url }, upstream);
			return {
				b64: normalized.b64,
				mime: normalized.mime
			};
		})) };
	} finally {
		budget.dispose();
	}
}
/**
* Forward one generate request to the configured endpoint. The requested image
* count is satisfied with N parallel single-image requests (the `n` batch
* parameter is never sent, because Responses-API-based gateways reject it as
* `tools[0].n`), then the results are flattened in order.
*/
async function generateImage(upstream, request, options = {}) {
	const baseUrl = upstream.apiUrl.trim().replace(/\/+$/, "");
	if (baseUrl === "") throw new ImageGenError("api_url 未配置：请先在「设置 → 插件 → 可配置」中填写", "config-missing");
	if (upstream.apiKey.trim() === "") throw new ImageGenError("api_key 未配置：请先在「设置 → 插件 → 可配置」中填写", "config-missing");
	if (isQwenImage(wireModel(request))) return generateQwenImage(baseUrl, upstream, request, options);
	if (request.mode === "edit" && isZhipuImage(wireModel(request))) throw new ImageGenError("智谱 GLM-Image 当前仅支持文生图，请切换到文生图模式或选择支持图生图的模型", "edit-unsupported");
	const params = effectiveParams(request);
	const count = effectiveCount(request);
	return { images: (await Promise.all(Array.from({ length: count }, () => requestOneImage(baseUrl, upstream, request, params, options.signal)))).flat() };
}
/** Human-readable failure message from an upstream error payload. */
function upstreamMessage(payload, status) {
	if (payload !== null && typeof payload === "object") {
		const record = payload;
		const error = record.error;
		if (error !== null && typeof error === "object") {
			const message = error.message;
			if (typeof message === "string" && message !== "") return message;
		}
		if (typeof record.message === "string" && record.message !== "") return record.message;
		if (typeof record.error === "string" && record.error !== "") return record.error;
	}
	return `上游接口拒绝请求（HTTP ${status}）`;
}
/** File extension for a MIME type (multipart reference image). */
function extensionOf$3(mime) {
	switch (mime.split(";")[0].trim()) {
		case "image/jpeg": return "jpg";
		case "image/webp": return "webp";
		case "image/gif": return "gif";
		default: return "png";
	}
}
//#endregion
//#region src/storage-sync.ts
/**
* Object-storage sync for saved images: one S3-compatible uploader (SigV4,
* zero dependencies) that covers Tencent COS / Alibaba OSS / Qiniu S3 /
* MinIO / R2 style endpoints, plus a fire-and-forget hook the image stores
* call after a file lands on disk. The handler is registered by the plugin
* root (it owns the live settings), so framework-free stores stay decoupled
* from the settings seam.
*
* Object keys: `${prefix}/gallery/<file>` and `${prefix}/images/<file>` —
* content-addressed file names dedupe re-uploads naturally.
*/
let uploadHandler;
/** Register the live uploader (index.ts apply). Pass undefined to clear. */
function setStorageSyncHandler(handler) {
	uploadHandler = handler;
}
/** Fire-and-forget notification from the image stores after a file write. */
function notifyImageSaved(kind, filePath) {
	try {
		uploadHandler?.(kind, filePath);
	} catch {}
}
/** URL-encode per RFC 3986 (AWS SigV4 canonical forms). */
function uriEncode(value, encodeSlash = true) {
	return value.replace(/[^A-Za-z0-9-_.~]/g, (char) => {
		return `%${char.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")}`;
	}).replace(/%2F/g, encodeSlash ? "%2F" : "/");
}
/** HMAC-SHA256 helper. */
function hmac(key, data) {
	return createHmac("sha256", key).update(data, "utf8").digest();
}
/**
* PUT one object to an S3-compatible endpoint (SigV4, virtual-hosted or
* path-style — the endpoint URL already includes the bucket). Returns the
* elapsed milliseconds so the settings card can show a latency reading.
*/
async function putObject(config, key, data, contentType = "application/octet-stream") {
	const endpoint = config.endpoint.trim().replace(/\/+$/, "");
	if (endpoint === "" || config.accessKey.trim() === "" || config.secretKey.trim() === "") throw new Error("对象存储配置不完整：请填写接口地址与密钥");
	const url = new URL(`${endpoint}/${key.split("/").map((part) => uriEncode(part)).join("/")}`);
	const payloadHash = createHash("sha256").update(data).digest("hex");
	const amzDate = `${(/* @__PURE__ */ new Date()).toISOString().replace(/[:-]|\.\d{3}/g, "")}`;
	const dateStamp = amzDate.slice(0, 8);
	const host = url.host;
	const canonicalUri = url.pathname;
	const canonicalHeaders = `content-type:${contentType}\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
	const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
	const canonicalRequest = `PUT\n${canonicalUri}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
	const scope = `${dateStamp}/${config.region.trim() || "us-east-1"}/s3/aws4_request`;
	const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${createHash("sha256").update(canonicalRequest, "utf8").digest("hex")}`;
	const signature = createHmac("sha256", hmac(hmac(hmac(hmac(`AWS4${config.secretKey.trim()}`, dateStamp), config.region.trim() || "us-east-1"), "s3"), "aws4_request")).update(stringToSign, "utf8").digest("hex");
	const authorization = `AWS4-HMAC-SHA256 Credential=${config.accessKey.trim()}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
	const started = Date.now();
	const response = await fetch(url, {
		method: "PUT",
		headers: {
			"content-type": contentType,
			"x-amz-content-sha256": payloadHash,
			"x-amz-date": amzDate,
			authorization
		},
		body: new Uint8Array(data)
	});
	if (!response.ok) {
		const text = await response.text().catch(() => "");
		throw new Error(`对象存储拒绝上传（HTTP ${response.status}）${text !== "" ? `：${text.slice(0, 200)}` : ""}`);
	}
	return { ms: Date.now() - started };
}
/** Upload a small probe object; used by the settings card's test button. */
async function testStorage(config) {
	const key = `${config.prefix.trim() || "dsh-imagegen"}/ping.txt`;
	const { ms } = await putObject(config, key, Buffer.from("dsh-imagegen storage ok", "utf8"), "text/plain");
	return {
		ms,
		key
	};
}
//#endregion
//#region src/history-store.ts
/**
* Host-persisted generation history: images are stored as individual files
* under ~/.dsh/dsh-imagegen/images/ and an index.json keeps the metadata +
* file names. This makes the history survive across browsers/devices that
* connect to the same DSH host, and keeps list responses small (the browser
* loads image bytes lazily through the history image route).
*
* Framework-free (node:fs only) so the route layer can drive it directly.
*/
const HISTORY_DIR$1 = path.join(homedir(), ".dsh", "dsh-imagegen");
const INDEX_PATH$1 = path.join(HISTORY_DIR$1, "index.json");
const IMAGES_DIR$1 = path.join(HISTORY_DIR$1, "images");
let pendingMutation$1 = Promise.resolve();
function mutateHistory(operation) {
	const next = pendingMutation$1.then(operation, operation);
	pendingMutation$1 = next.then(() => void 0, () => void 0);
	return next;
}
/** File extension for a MIME type (image file names). */
function extensionOf$2(mime) {
	switch (mime.split(";")[0].trim()) {
		case "image/jpeg": return "jpg";
		case "image/webp": return "webp";
		case "image/gif": return "gif";
		default: return "png";
	}
}
/** MIME type for a stored image file name (image route responses). */
function mimeOfFile$2(file) {
	switch (path.extname(file).toLowerCase()) {
		case ".jpg":
		case ".jpeg": return "image/jpeg";
		case ".webp": return "image/webp";
		case ".gif": return "image/gif";
		default: return "image/png";
	}
}
/** Sanitize an entry id for use as a file-name prefix. */
function safeId$2(id) {
	const cleaned = id.replace(/[^a-zA-Z0-9-]/g, "-");
	return cleaned === "" ? "entry" : cleaned;
}
/** Ensure the storage directories exist. */
async function ensureDirs$1() {
	await promises.mkdir(IMAGES_DIR$1, { recursive: true });
}
/** Read the index, tolerating a missing/corrupt file. */
async function readIndex$1() {
	try {
		const raw = await promises.readFile(INDEX_PATH$1, "utf8");
		const parsed = JSON.parse(raw);
		if (parsed === null || typeof parsed !== "object") return [];
		const entries = parsed.entries;
		if (!Array.isArray(entries)) return [];
		return entries.filter(isStoredEntry$1);
	} catch {
		return [];
	}
}
/** Persist the index. */
async function writeIndex$1(entries) {
	await ensureDirs$1();
	const payload = { entries };
	const tmp = `${INDEX_PATH$1}.tmp-${process.pid}`;
	await promises.writeFile(tmp, JSON.stringify(payload), "utf8");
	await promises.rename(tmp, INDEX_PATH$1);
}
/** Structural guard for a stored entry. */
function isStoredEntry$1(value) {
	if (value === null || typeof value !== "object") return false;
	const entry = value;
	return typeof entry.id === "string" && typeof entry.createdAt === "number" && (entry.mode === "text" || entry.mode === "edit") && (entry.workflow === void 0 || entry.workflow === "ecommerce") && (entry.projectId === void 0 || typeof entry.projectId === "string") && (entry.projectName === void 0 || typeof entry.projectName === "string") && (entry.slotKey === void 0 || typeof entry.slotKey === "string") && (entry.slotLabel === void 0 || typeof entry.slotLabel === "string") && typeof entry.prompt === "string" && Array.isArray(entry.images) && entry.images.every((image) => {
		if (image === null || typeof image !== "object") return false;
		const record = image;
		return typeof record.file === "string" && typeof record.mime === "string";
	});
}
/** Remove one entry's image files (best effort). */
async function removeEntryFiles$1(entry) {
	for (const image of entry.images) try {
		await promises.rm(path.join(IMAGES_DIR$1, image.file), { force: true });
	} catch {}
}
/** Project a stored entry onto the wire shape (image URLs). */
function toWire$1(entry) {
	return {
		id: entry.id,
		createdAt: entry.createdAt,
		mode: entry.mode,
		model: entry.model,
		prompt: entry.prompt,
		size: entry.size,
		quality: entry.quality,
		detail: entry.detail,
		n: entry.n,
		images: entry.images.map((image) => ({
			url: `/api/dsh-imagegen/history/image/${image.file}`,
			mime: image.mime,
			...image.revisedPrompt === void 0 ? {} : { revisedPrompt: image.revisedPrompt }
		})),
		...entry.refName === void 0 ? {} : { refName: entry.refName },
		...entry.channel === void 0 ? {} : { channel: entry.channel },
		...entry.channelId === void 0 ? {} : { channelId: entry.channelId },
		...entry.comparisonId === void 0 ? {} : { comparisonId: entry.comparisonId },
		...entry.comparisonModels === void 0 ? {} : { comparisonModels: entry.comparisonModels },
		...entry.workflow === void 0 ? {} : { workflow: entry.workflow },
		...entry.projectId === void 0 ? {} : { projectId: entry.projectId },
		...entry.projectName === void 0 ? {} : { projectName: entry.projectName },
		...entry.slotKey === void 0 ? {} : { slotKey: entry.slotKey },
		...entry.slotLabel === void 0 ? {} : { slotLabel: entry.slotLabel },
		...entry.canvas === void 0 ? {} : { canvas: entry.canvas }
	};
}
/** List the persisted history, newest first, as wire entries. */
async function listHistory() {
	return (await readIndex$1()).map(toWire$1);
}
/** Append one generation, evicting the oldest beyond HISTORY_MAX. */
async function appendHistory(input) {
	return mutateHistory(async () => {
		await ensureDirs$1();
		const prefix = safeId$2(input.id);
		const storedImages = [];
		try {
			for (let index = 0; index < input.images.length; index++) {
				const image = input.images[index];
				const file = `${prefix}-${index}.${extensionOf$2(image.mime)}`;
				await promises.writeFile(path.join(IMAGES_DIR$1, file), Buffer.from(image.b64, "base64"));
				notifyImageSaved("history", path.join(IMAGES_DIR$1, file));
				storedImages.push({
					file,
					mime: image.mime,
					...image.revisedPrompt === void 0 ? {} : { revisedPrompt: image.revisedPrompt }
				});
			}
		} catch (error) {
			await removeEntryFiles$1({ images: storedImages });
			throw error;
		}
		const merged = [{
			id: input.id,
			createdAt: input.createdAt,
			mode: input.mode,
			model: input.model,
			prompt: input.prompt,
			size: input.size,
			quality: input.quality,
			detail: input.detail,
			n: input.n,
			images: storedImages,
			...input.refName === void 0 ? {} : { refName: input.refName },
			...input.channelId === void 0 ? {} : { channelId: input.channelId },
			...input.channel === void 0 ? {} : { channel: input.channel },
			...input.comparisonId === void 0 ? {} : { comparisonId: input.comparisonId },
			...input.comparisonModels === void 0 ? {} : { comparisonModels: input.comparisonModels },
			...input.workflow === void 0 ? {} : { workflow: input.workflow },
			...input.projectId === void 0 ? {} : { projectId: input.projectId },
			...input.projectName === void 0 ? {} : { projectName: input.projectName },
			...input.slotKey === void 0 ? {} : { slotKey: input.slotKey },
			...input.slotLabel === void 0 ? {} : { slotLabel: input.slotLabel },
			...input.canvas === void 0 ? {} : { canvas: input.canvas }
		}, ...await readIndex$1()];
		const kept = merged.slice(0, 50);
		for (const dropped of merged.slice(50)) await removeEntryFiles$1(dropped);
		await writeIndex$1(kept);
		return kept.map(toWire$1);
	});
}
/** Remove one entry (and its image files). */
async function removeHistory(id) {
	return mutateHistory(async () => {
		const previous = await readIndex$1();
		const target = previous.find((entry) => entry.id === id);
		if (target !== void 0) await removeEntryFiles$1(target);
		const kept = previous.filter((entry) => entry.id !== id);
		await writeIndex$1(kept);
		return kept.map(toWire$1);
	});
}
/** Remove every entry (and all image files). */
async function clearHistory() {
	return mutateHistory(async () => {
		const previous = await readIndex$1();
		for (const entry of previous) await removeEntryFiles$1(entry);
		await writeIndex$1([]);
		return [];
	});
}
/** Read one stored image file by its (validated) file name. */
async function readHistoryImage(file) {
	if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*-[0-9]+\.(png|jpg|jpeg|webp|gif)$/.test(file)) return void 0;
	try {
		return {
			data: await promises.readFile(path.join(IMAGES_DIR$1, file)),
			mime: mimeOfFile$2(file)
		};
	} catch {
		return;
	}
}
//#endregion
//#region src/task-queue.ts
/** In-memory, host-resident image generation queue. */
var GenerationTaskQueue = class {
	run;
	concurrency;
	tasks = [];
	controllers = /* @__PURE__ */ new Map();
	listeners = /* @__PURE__ */ new Set();
	running = 0;
	constructor(run, concurrency = 1) {
		this.run = run;
		this.concurrency = concurrency;
	}
	list() {
		return this.tasks.map((task) => this.snapshot(task));
	}
	/** Observe queue state changes. Listener failures never disrupt generation. */
	subscribe(listener) {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	}
	submit(request) {
		const task = {
			id: randomUUID(),
			request: { ...request },
			status: "queued",
			createdAt: Date.now()
		};
		this.tasks.unshift(task);
		this.publish(task);
		this.drain();
		return this.snapshot(task);
	}
	cancel(id) {
		const task = this.tasks.find((item) => item.id === id);
		if (task === void 0 || task.status === "completed" || task.status === "failed" || task.status === "cancelled") return task;
		task.status = "cancelled";
		task.finishedAt = Date.now();
		this.controllers.get(id)?.abort();
		this.publish(task);
		this.drain();
		return this.snapshot(task);
	}
	retry(id) {
		const previous = this.tasks.find((item) => item.id === id);
		return previous === void 0 ? void 0 : this.submit(previous.request);
	}
	/** Start queued tasks while capacity remains. Plain submissions and
	* comparison batches alike run in parallel up to the host-wide limit, so one
	* slow upstream can no longer hold back unrelated generations. */
	drain() {
		while (this.running < Math.max(1, this.concurrency)) {
			const task = this.tasks.find((item) => item.status === "queued");
			if (task === void 0) return;
			this.running += 1;
			this.runTask(task).finally(() => {
				this.running -= 1;
				this.drain();
			});
		}
	}
	async runTask(task) {
		task.status = "running";
		task.startedAt = Date.now();
		this.publish(task);
		const controller = new AbortController();
		this.controllers.set(task.id, controller);
		try {
			const result = await this.run(task.request, controller.signal);
			if (this.tasks.find((item) => item.id === task.id)?.status !== "cancelled") {
				task.status = "completed";
				task.result = result;
				task.finishedAt = Date.now();
				this.publish(task);
			}
		} catch (error) {
			if (this.tasks.find((item) => item.id === task.id)?.status !== "cancelled") {
				task.status = "failed";
				task.error = error instanceof Error ? error.message : String(error);
				task.finishedAt = Date.now();
				this.publish(task);
			}
		} finally {
			this.controllers.delete(task.id);
		}
	}
	publish(task) {
		const snapshot = this.snapshot(task);
		for (const listener of this.listeners) try {
			listener(snapshot);
		} catch {}
	}
	snapshot(task) {
		return {
			...task,
			request: { ...task.request },
			...task.result === void 0 ? {} : { result: task.result }
		};
	}
};
//#endregion
//#region src/generation-runtime.ts
/**
* Shared host-side generation runtime. Both the browser routes and Agent tools
* submit to this one queue so persisted history and cancellation semantics stay
* identical regardless of where a request originated.
*
* Requests carry a channel id (host-filled by the route/tool resolution); the
* runtime picks that channel's upstream credentials, otherwise the default
* channel, and records a channel snapshot on the history entry so usage
* counters and filters survive channel deletion.
*/
var ImageGenerationRuntime = class {
	resolve;
	history;
	queue;
	constructor(resolve, history = { append: appendHistory }) {
		this.resolve = resolve;
		this.history = history;
		this.queue = new GenerationTaskQueue((request, signal) => this.run(request, signal), 4);
	}
	async run(request, signal) {
		const view = this.resolve();
		const channel = view.channels.find((candidate) => candidate.id === request.channelId) ?? view.channels.find((candidate) => candidate.id === view.defaultChannelId) ?? view.channels[0];
		if (channel === void 0) throw new ImageGenError("尚未配置任何渠道：请先在「设置 → 插件 → AI 生图」添加渠道并填写 API 地址与密钥", "no-channels");
		const result = await generateImage({
			apiUrl: channel.apiUrl,
			apiKey: channel.apiKey
		}, request, { signal });
		try {
			const history = await this.history.append({
				id: randomUUID(),
				createdAt: Date.now(),
				mode: request.mode,
				model: request.model,
				prompt: request.prompt,
				size: request.size,
				quality: request.quality,
				detail: request.detail,
				n: request.n,
				images: result.images,
				...request.refName === void 0 ? {} : { refName: request.refName },
				...request.channelId === void 0 ? {} : { channelId: request.channelId },
				...request.channel === void 0 ? {} : { channel: request.channel },
				...request.comparisonId === void 0 ? {} : { comparisonId: request.comparisonId },
				...request.comparisonModels === void 0 ? {} : { comparisonModels: request.comparisonModels },
				...request.workflow === void 0 ? {} : { workflow: request.workflow },
				...request.projectId === void 0 ? {} : { projectId: request.projectId },
				...request.projectName === void 0 ? {} : { projectName: request.projectName },
				...request.slotKey === void 0 ? {} : { slotKey: request.slotKey },
				...request.slotLabel === void 0 ? {} : { slotLabel: request.slotLabel },
				...request.canvas === void 0 ? {} : { canvas: request.canvas }
			});
			return {
				...result,
				history
			};
		} catch (error) {
			return {
				...result,
				historyError: error instanceof Error ? error.message : String(error)
			};
		}
	}
};
//#endregion
//#region src/gallery-store.ts
/**
* Host-persisted gallery (user-curated favorites): mirrors the history store
* (image files + an index.json under ~/.dsh/dsh-imagegen/gallery/) but with no
* size cap — every entry is an explicit user choice. Appends are deduplicated
* by image content so adding the same generated image twice is a no-op.
*
* Framework-free (node:fs + node:crypto only) so the route layer can drive it
* directly.
*/
const HISTORY_DIR = path.join(homedir(), ".dsh", "dsh-imagegen");
const GALLERY_DIR = path.join(HISTORY_DIR, "gallery");
const INDEX_PATH = path.join(GALLERY_DIR, "index.json");
const IMAGES_DIR = path.join(GALLERY_DIR, "images");
let pendingMutation = Promise.resolve();
function mutateGallery(operation) {
	const next = pendingMutation.then(operation, operation);
	pendingMutation = next.then(() => void 0, () => void 0);
	return next;
}
/** File extension for a MIME type (image file names). */
function extensionOf$1(mime) {
	switch (mime.split(";")[0].trim()) {
		case "image/jpeg": return "jpg";
		case "image/webp": return "webp";
		case "image/gif": return "gif";
		default: return "png";
	}
}
/** MIME type for a stored image file name (image route responses). */
function mimeOfFile$1(file) {
	switch (path.extname(file).toLowerCase()) {
		case ".jpg":
		case ".jpeg": return "image/jpeg";
		case ".webp": return "image/webp";
		case ".gif": return "image/gif";
		default: return "image/png";
	}
}
/** Sanitize an entry id for use as a file-name prefix. */
function safeId$1(id) {
	const cleaned = id.replace(/[^a-zA-Z0-9-]/g, "-");
	return cleaned === "" ? "entry" : cleaned;
}
/** Short content fingerprint of the entry's first image. */
function fingerprint(input) {
	const first = input.images[0];
	if (first === void 0) return void 0;
	return createHash("sha1").update(first.b64).digest("hex");
}
/** Ensure the storage directories exist. */
async function ensureDirs() {
	await promises.mkdir(IMAGES_DIR, { recursive: true });
}
/** Read the index, tolerating a missing/corrupt file. */
async function readIndex() {
	try {
		const raw = await promises.readFile(INDEX_PATH, "utf8");
		const parsed = JSON.parse(raw);
		if (parsed === null || typeof parsed !== "object") return [];
		const entries = parsed.entries;
		if (!Array.isArray(entries)) return [];
		return entries.filter(isStoredEntry);
	} catch {
		return [];
	}
}
/** Persist the index. */
async function writeIndex(entries) {
	await ensureDirs();
	const payload = { entries };
	const tmp = `${INDEX_PATH}.tmp-${process.pid}`;
	await promises.writeFile(tmp, JSON.stringify(payload), "utf8");
	await promises.rename(tmp, INDEX_PATH);
}
/** Structural guard for a stored entry. */
function isStoredEntry(value) {
	if (value === null || typeof value !== "object") return false;
	const entry = value;
	return typeof entry.id === "string" && typeof entry.createdAt === "number" && (entry.mode === "text" || entry.mode === "edit") && (entry.workflow === void 0 || entry.workflow === "ecommerce") && (entry.projectId === void 0 || typeof entry.projectId === "string") && (entry.projectName === void 0 || typeof entry.projectName === "string") && (entry.slotKey === void 0 || typeof entry.slotKey === "string") && (entry.slotLabel === void 0 || typeof entry.slotLabel === "string") && typeof entry.prompt === "string" && Array.isArray(entry.images) && entry.images.every((image) => {
		if (image === null || typeof image !== "object") return false;
		const record = image;
		return typeof record.file === "string" && typeof record.mime === "string";
	});
}
/** Remove one entry's image files (best effort). */
async function removeEntryFiles(entry) {
	for (const image of entry.images) try {
		await promises.rm(path.join(IMAGES_DIR, image.file), { force: true });
	} catch {}
}
/** Project a stored entry onto the wire shape (image URLs). */
function toWire(entry) {
	return {
		id: entry.id,
		createdAt: entry.createdAt,
		mode: entry.mode,
		model: entry.model,
		prompt: entry.prompt,
		size: entry.size,
		quality: entry.quality,
		detail: entry.detail,
		n: entry.n,
		images: entry.images.map((image) => ({
			url: `/api/dsh-imagegen/gallery/image/${image.file}`,
			mime: image.mime,
			...image.revisedPrompt === void 0 ? {} : { revisedPrompt: image.revisedPrompt }
		})),
		...entry.refName === void 0 ? {} : { refName: entry.refName },
		...entry.tags === void 0 ? {} : { tags: entry.tags },
		...entry.channel === void 0 ? {} : { channel: entry.channel },
		...entry.channelId === void 0 ? {} : { channelId: entry.channelId },
		...entry.workflow === void 0 ? {} : { workflow: entry.workflow },
		...entry.projectId === void 0 ? {} : { projectId: entry.projectId },
		...entry.projectName === void 0 ? {} : { projectName: entry.projectName },
		...entry.slotKey === void 0 ? {} : { slotKey: entry.slotKey },
		...entry.slotLabel === void 0 ? {} : { slotLabel: entry.slotLabel },
		...entry.canvas === void 0 ? {} : { canvas: entry.canvas }
	};
}
/** List the persisted gallery, newest first, as wire entries. */
async function listGallery() {
	return (await readIndex()).map(toWire);
}
/** Append one image to the gallery. Deduplicates by first-image content —
*  appending an image already in the gallery returns `added: false` with the
*  list unchanged. No size cap: every entry is an explicit user choice. */
async function appendGallery(input) {
	return mutateGallery(async () => {
		await ensureDirs();
		const hash = fingerprint(input);
		if (hash !== void 0) {
			const existing = await readIndex();
			if (existing.some((entry) => entry.hash === hash)) return {
				entries: existing.map(toWire),
				added: false
			};
		}
		const prefix = safeId$1(input.id);
		const storedImages = [];
		try {
			for (let index = 0; index < input.images.length; index++) {
				const image = input.images[index];
				const file = `${prefix}-${index}.${extensionOf$1(image.mime)}`;
				await promises.writeFile(path.join(IMAGES_DIR, file), Buffer.from(image.b64, "base64"));
				notifyImageSaved("gallery", path.join(IMAGES_DIR, file));
				storedImages.push({
					file,
					mime: image.mime,
					...image.revisedPrompt === void 0 ? {} : { revisedPrompt: image.revisedPrompt }
				});
			}
		} catch (error) {
			await removeEntryFiles({ images: storedImages });
			throw error;
		}
		const merged = [{
			id: input.id,
			createdAt: input.createdAt,
			mode: input.mode,
			model: input.model,
			prompt: input.prompt,
			size: input.size,
			quality: input.quality,
			detail: input.detail,
			n: input.n,
			images: storedImages,
			...hash === void 0 ? {} : { hash },
			...input.refName === void 0 ? {} : { refName: input.refName },
			...input.channelId === void 0 ? {} : { channelId: input.channelId },
			...input.channel === void 0 ? {} : { channel: input.channel },
			...input.workflow === void 0 ? {} : { workflow: input.workflow },
			...input.projectId === void 0 ? {} : { projectId: input.projectId },
			...input.projectName === void 0 ? {} : { projectName: input.projectName },
			...input.slotKey === void 0 ? {} : { slotKey: input.slotKey },
			...input.slotLabel === void 0 ? {} : { slotLabel: input.slotLabel },
			...input.canvas === void 0 ? {} : { canvas: input.canvas }
		}, ...await readIndex()];
		await writeIndex(merged);
		return {
			entries: merged.map(toWire),
			added: true
		};
	});
}
/** Remove one entry (and its image files). */
async function removeGallery(id) {
	return mutateGallery(async () => {
		const previous = await readIndex();
		const target = previous.find((entry) => entry.id === id);
		if (target !== void 0) await removeEntryFiles(target);
		const kept = previous.filter((entry) => entry.id !== id);
		await writeIndex(kept);
		return kept.map(toWire);
	});
}
/** Replace the user-managed labels for one gallery entry. */
async function updateGalleryTags(id, tags) {
	return mutateGallery(async () => {
		const normalized = [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))].slice(0, 20);
		const entries = await readIndex();
		const target = entries.find((entry) => entry.id === id);
		if (target !== void 0) target.tags = normalized;
		await writeIndex(entries);
		return entries.map(toWire);
	});
}
/** Remove every entry (and all image files). */
async function clearGallery() {
	return mutateGallery(async () => {
		const previous = await readIndex();
		for (const entry of previous) await removeEntryFiles(entry);
		await writeIndex([]);
		return [];
	});
}
/** Read one stored image file by its (validated) file name. */
async function readGalleryImage(file) {
	if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*-[0-9]+\.(png|jpg|jpeg|webp|gif)$/.test(file)) return void 0;
	try {
		return {
			data: await promises.readFile(path.join(IMAGES_DIR, file)),
			mime: mimeOfFile$1(file)
		};
	} catch {
		return;
	}
}
//#endregion
//#region src/canvas-store.ts
/** Host-persisted infinite canvas documents and content-addressed assets. */
const DATA_ROOT = process.env.DSH_HOME?.trim() || path.join(homedir(), ".dsh");
const CANVAS_ROOT = path.join(DATA_ROOT, "dsh-imagegen", "canvas");
path.join(CANVAS_ROOT, "pages");
path.join(CANVAS_ROOT, "assets");
path.join(CANVAS_ROOT, "index.json");
var CanvasConflictError = class extends Error {
	code = "canvas-conflict";
	constructor(message = "画布已在其他窗口更新，请重新加载后再保存。") {
		super(message);
		this.name = "CanvasConflictError";
	}
};
function extensionOf(mime) {
	switch (mime.split(";")[0].trim().toLowerCase()) {
		case "image/jpeg": return "jpg";
		case "image/webp": return "webp";
		case "image/gif": return "gif";
		default: return "png";
	}
}
function mimeOf(file) {
	switch (path.extname(file).toLowerCase()) {
		case ".jpg":
		case ".jpeg": return "image/jpeg";
		case ".webp": return "image/webp";
		case ".gif": return "image/gif";
		default: return "image/png";
	}
}
function safeId(value) {
	const id = value.replace(/[^a-zA-Z0-9_-]/g, "-");
	return id === "" ? randomUUID() : id;
}
async function writeJsonAtomic(file, value) {
	await promises.mkdir(path.dirname(file), { recursive: true });
	const temp = `${file}.tmp-${process.pid}-${randomUUID()}`;
	await promises.writeFile(temp, `${JSON.stringify(value)}\n`, "utf8");
	await promises.rename(temp, file);
}
async function readJson(file) {
	try {
		return JSON.parse(await promises.readFile(file, "utf8"));
	} catch {
		return;
	}
}
function defaultDocument(id, title) {
	const now = Date.now();
	return {
		version: 2,
		id,
		title,
		revision: 1,
		viewport: {
			x: 0,
			y: 0,
			k: 1
		},
		background: "dots",
		nodes: [],
		connections: [],
		createdAt: now,
		updatedAt: now
	};
}
function isAssetRef(value) {
	if (value === null || typeof value !== "object") return false;
	const asset = value;
	return typeof asset.assetId === "string" && typeof asset.url === "string" && typeof asset.mime === "string" && typeof asset.width === "number" && typeof asset.height === "number";
}
function isNode(value) {
	if (value === null || typeof value !== "object") return false;
	const node = value;
	if (typeof node.id !== "string" || typeof node.title !== "string" || typeof node.x !== "number" || typeof node.y !== "number" || typeof node.width !== "number" || typeof node.height !== "number") return false;
	if (node.type !== "image" && node.type !== "text" && node.type !== "config") return false;
	const metadata = node.metadata;
	if (metadata !== void 0 && (metadata === null || typeof metadata !== "object")) return false;
	const state = metadata ?? {};
	if (node.type === "image") {
		if (state.asset !== void 0 && !isAssetRef(state.asset)) return false;
		return state.status === void 0 || state.status === "idle" || state.status === "generating" || state.status === "success" || state.status === "error";
	}
	if (node.type === "config") return state.prompt === void 0 || typeof state.prompt === "string";
	return state.text === void 0 || typeof state.text === "string";
}
function isDocument(value) {
	if (value === null || typeof value !== "object") return false;
	const document = value;
	return document.version === 2 && typeof document.id === "string" && typeof document.title === "string" && typeof document.revision === "number" && document.viewport !== null && typeof document.viewport === "object" && typeof document.viewport.x === "number" && typeof document.viewport.y === "number" && typeof document.viewport.k === "number" && (document.background === "dots" || document.background === "lines" || document.background === "diagonal" || document.background === "checker" || document.background === "blank" || document.background === "image") && (document.backgroundImage === void 0 || typeof document.backgroundImage === "string") && Array.isArray(document.nodes) && document.nodes.every(isNode) && Array.isArray(document.connections);
}
/** Upgrade a v1 (image/text/annotation + edges) document to the v2 node-graph model.
* Images and text notes keep their geometry; annotation prompt cards become plain
* text notes carrying the prompt, and old edges survive only between surviving nodes. */
function migrateLegacyDocument(input) {
	const now = Date.now();
	const legacyNodes = Array.isArray(input.nodes) ? input.nodes : [];
	const nodes = [];
	const annotationIds = /* @__PURE__ */ new Set();
	for (const raw of legacyNodes) {
		if (raw === null || typeof raw !== "object") continue;
		const node = raw;
		if (typeof node.id !== "string" || typeof node.x !== "number" || typeof node.y !== "number") continue;
		const base = {
			id: node.id,
			title: typeof node.title === "string" ? node.title : "未命名节点",
			x: node.x,
			y: node.y,
			width: typeof node.width === "number" ? node.width : 300,
			height: typeof node.height === "number" ? node.height : 220
		};
		if (node.type === "image" && isAssetRef(node.asset)) {
			const generation = node.generation ?? {};
			nodes.push({
				...base,
				type: "image",
				metadata: {
					asset: node.asset,
					status: typeof node.status === "string" && [
						"idle",
						"generating",
						"success",
						"error"
					].includes(node.status) ? node.status : "success",
					...typeof node.error === "string" ? { error: node.error } : {},
					...typeof generation.prompt === "string" ? { prompt: generation.prompt } : {},
					...typeof generation.model === "string" ? { model: generation.model } : {},
					...typeof generation.taskId === "string" ? { taskId: generation.taskId } : {},
					...typeof generation.sourceNodeId === "string" ? { sourceNodeId: generation.sourceNodeId } : {}
				}
			});
		} else if (node.type === "text") nodes.push({
			...base,
			type: "text",
			metadata: {
				text: typeof node.text === "string" ? node.text : "",
				...typeof node.fontSize === "number" ? { fontSize: node.fontSize } : {}
			}
		});
		else if (node.type === "annotation") {
			annotationIds.add(node.id);
			const prompt = typeof node.prompt === "string" && node.prompt.trim() !== "" ? node.prompt : "（旧版标注，提示词见此）";
			nodes.push({
				...base,
				type: "text",
				title: "旧版标注",
				metadata: { text: prompt }
			});
		}
	}
	nodes.sort((a, b) => {
		const za = legacyNodes.find((item) => item?.id === a.id)?.zIndex;
		const zb = legacyNodes.find((item) => item?.id === b.id)?.zIndex;
		return (typeof za === "number" ? za : 0) - (typeof zb === "number" ? zb : 0);
	});
	const validIds = new Set(nodes.map((node) => node.id));
	const seen = /* @__PURE__ */ new Set();
	const connections = (Array.isArray(input.edges) ? input.edges : []).flatMap((raw) => {
		if (raw === null || typeof raw !== "object") return [];
		const edge = raw;
		if (typeof edge.fromNodeId !== "string" || typeof edge.toNodeId !== "string") return [];
		if (annotationIds.has(edge.fromNodeId) || annotationIds.has(edge.toNodeId)) return [];
		if (!validIds.has(edge.fromNodeId) || !validIds.has(edge.toNodeId) || edge.fromNodeId === edge.toNodeId) return [];
		const key = `${edge.fromNodeId}->${edge.toNodeId}`;
		if (seen.has(key)) return [];
		seen.add(key);
		return [{
			id: typeof edge.id === "string" ? edge.id : `edge-${randomUUID()}`,
			fromNodeId: edge.fromNodeId,
			toNodeId: edge.toNodeId
		}];
	});
	const legacyViewport = input.viewport ?? {};
	const background = input.background === "grid" ? "lines" : input.background === "blank" ? "blank" : "dots";
	return {
		version: 2,
		id: typeof input.id === "string" ? input.id : randomUUID(),
		title: typeof input.title === "string" ? input.title : "未命名画布",
		revision: typeof input.revision === "number" ? input.revision : 1,
		viewport: {
			x: typeof legacyViewport.x === "number" ? legacyViewport.x : 0,
			y: typeof legacyViewport.y === "number" ? legacyViewport.y : 0,
			k: typeof legacyViewport.scale === "number" && legacyViewport.scale > 0 ? legacyViewport.scale : 1
		},
		background,
		nodes,
		connections,
		createdAt: typeof input.createdAt === "number" ? input.createdAt : now,
		updatedAt: typeof input.updatedAt === "number" ? input.updatedAt : now
	};
}
/** Accept either the v2 document or a legacy v1 payload and return v2. */
function coerceDocument(value) {
	if (value === null || typeof value !== "object") return void 0;
	const document = value;
	if (document.version === 1) {
		const migrated = migrateLegacyDocument(document);
		return isDocument(migrated) ? migrated : void 0;
	}
	return isDocument(value) ? value : void 0;
}
let mutation = Promise.resolve();
function serialize(operation) {
	const next = mutation.then(operation, operation);
	mutation = next.then(() => void 0, () => void 0);
	return next;
}
var CanvasStore = class {
	root;
	constructor(root = CANVAS_ROOT) {
		this.root = root;
	}
	pagesDir() {
		return path.join(this.root, "pages");
	}
	assetsDir() {
		return path.join(this.root, "assets");
	}
	indexPath() {
		return path.join(this.root, "index.json");
	}
	async ensure() {
		await promises.mkdir(this.pagesDir(), { recursive: true });
		await promises.mkdir(this.assetsDir(), { recursive: true });
	}
	pagePath(id) {
		return path.join(this.pagesDir(), `${safeId(id)}.json`);
	}
	assetPath(id) {
		if (!/^[a-f0-9]{64}\.(png|jpg|jpeg|webp|gif)$/.test(id)) return void 0;
		const target = path.join(this.assetsDir(), id);
		const relative = path.relative(this.assetsDir(), target);
		return relative.startsWith("..") || path.isAbsolute(relative) ? void 0 : target;
	}
	async readIndex() {
		const value = await readJson(this.indexPath());
		if (value === void 0 || typeof value !== "object" || !Array.isArray(value.projects)) return [];
		return value.projects.filter((item) => {
			if (item === null || typeof item !== "object") return false;
			const project = item;
			return typeof project.id === "string" && typeof project.title === "string" && typeof project.revision === "number" && typeof project.nodeCount === "number" && typeof project.createdAt === "number" && typeof project.updatedAt === "number";
		});
	}
	async writeIndex(projects) {
		await this.ensure();
		await writeJsonAtomic(this.indexPath(), { projects });
	}
	async list() {
		return this.readIndex();
	}
	async create(title = "未命名画布") {
		return serialize(async () => {
			await this.ensure();
			const id = randomUUID();
			const document = defaultDocument(id, title.trim() || "未命名画布");
			await writeJsonAtomic(this.pagePath(id), document);
			const projects = await this.readIndex();
			await this.writeIndex([this.summaryOf(document), ...projects]);
			return document;
		});
	}
	async read(id) {
		return coerceDocument(await readJson(this.pagePath(id)));
	}
	async save(document, expectedRevision) {
		return serialize(async () => {
			const incoming = coerceDocument(document);
			if (incoming === void 0) throw new Error("malformed canvas document");
			const current = await this.read(incoming.id);
			if (current !== void 0 && expectedRevision !== void 0 && current.revision !== expectedRevision) throw new CanvasConflictError();
			const next = {
				...incoming,
				revision: Math.max(current?.revision ?? 0, incoming.revision) + 1,
				updatedAt: Date.now()
			};
			await this.ensure();
			await writeJsonAtomic(this.pagePath(next.id), next);
			const projects = (await this.readIndex()).filter((item) => item.id !== next.id);
			await this.writeIndex([this.summaryOf(next), ...projects]);
			return next;
		});
	}
	async remove(id) {
		return serialize(async () => {
			try {
				await promises.rm(this.pagePath(id), { force: true });
			} catch {}
			const projects = (await this.readIndex()).filter((item) => item.id !== id);
			await this.writeIndex(projects);
			return projects;
		});
	}
	async putImage(input) {
		if (!input.data.byteLength) throw new Error("image data is empty");
		if (!/^image\/(png|jpeg|webp|gif)$/.test(input.mime)) throw new Error("unsupported image type");
		if (!Number.isSafeInteger(input.width) || input.width < 1 || !Number.isSafeInteger(input.height) || input.height < 1) throw new Error("image dimensions are invalid");
		await this.ensure();
		const file = `${createHash("sha256").update(input.data).digest("hex")}.${extensionOf(input.mime)}`;
		const target = path.join(this.assetsDir(), file);
		try {
			await promises.access(target);
		} catch {
			await promises.writeFile(target, input.data);
		}
		return {
			assetId: file,
			url: `/api/dsh-imagegen/canvas/asset/${file}`,
			mime: input.mime,
			bytes: input.data.byteLength,
			width: input.width,
			height: input.height,
			origin: input.origin,
			...input.originId === void 0 ? {} : { originId: input.originId },
			...input.entryId === void 0 ? {} : { entryId: input.entryId },
			...input.imageIndex === void 0 ? {} : { imageIndex: input.imageIndex }
		};
	}
	async readAsset(file) {
		const target = this.assetPath(file);
		if (target === void 0) return void 0;
		try {
			return {
				data: await promises.readFile(target),
				mime: mimeOf(file)
			};
		} catch {
			return;
		}
	}
	summaryOf(document) {
		return {
			id: document.id,
			title: document.title,
			revision: document.revision,
			nodeCount: document.nodes.length,
			createdAt: document.createdAt,
			updatedAt: document.updatedAt
		};
	}
};
const canvasStore = new CanvasStore();
//#endregion
//#region src/templates-store.ts
/**
* Prompt-template library store (multi-source).
*
* The library is a registry of independent sources (see TEMPLATE_SOURCES in
* protocol.ts): each source has its own upstream JSON list, its own bundled
* snapshot, its own refreshed runtime copy, and its own on-disk image pool.
* Sources never mix — the overlay shows one tab per source and every request
* names the source explicitly.
*
* Each case list ships as a bundled snapshot (src/templates/<file>, inside the
* npm package) so every library works offline out of the box; a successful
* refresh (manual, or the periodic background sync) writes a runtime copy
* under ~/.dsh/dsh-imagegen/templates/<sourceId>/ which then takes precedence.
* Reference images are not bundled (hundreds of files, ≈100 MB per source) —
* they are fetched from the source's mirror on demand, cached on disk under
* ~/.dsh/dsh-imagegen/template-images/<sourceId>/, and served from there on
* every later view.
*
* Framework-free (node:fs only) so the route layer and tests can drive it
* directly.
*/
/** Source registry (host half): where each TEMPLATE_SOURCES entry loads from. */
const SOURCE_DEFS = {
	vibeui: {
		listUrl: "https://vibeui.top/extra/awesome-gpt-image-2/data/cases.json",
		imageBaseUrl: "https://vibeui.top/extra/awesome-gpt-image-2/data/images/",
		bundledPath: fileURLToPath(new URL("../src/templates/cases.json", import.meta.url)),
		legacySnapshotPath: "legacy",
		legacyImageDir: "legacy"
	},
	canghe: {
		listUrl: "https://gpt-image2.canghe.ai/cases.json",
		imageBaseUrl: "https://gpt-image2.canghe.ai/images/",
		bundledPath: fileURLToPath(new URL("../src/templates/canghe-cases.json", import.meta.url))
	}
};
/** Category label map mirrored from the upstream sites' site.js (zh names). */
const CATEGORY_ZH = {
	"Architecture & Spaces": "建筑与空间",
	"Brand & Logos": "品牌与标志",
	"Characters & People": "人物与角色",
	"Charts & Infographics": "图表与信息可视化",
	"Documents & Publishing": "文档与出版物",
	"History & Classical Themes": "历史与古风题材",
	"Illustration & Art": "插画与艺术",
	"Other Use Cases": "其他应用场景",
	"Photography & Realism": "摄影与写实",
	"Posters & Typography": "海报与排版",
	"Products & E-commerce": "商品与电商",
	"Scenes & Storytelling": "场景与叙事",
	"UI & Interfaces": "UI 与界面",
	"Portraits & Fashion": "人像与时尚",
	"Celebrities & Sports": "名人与运动",
	"Characters & IP": "角色与 IP",
	"Food & Beverage": "美食与饮品",
	"Brand & Icons": "品牌与图标",
	"Social Media & Stickers": "社媒与表情包",
	"Infographics & Diagrams": "信息图与图解",
	"UI & App Screens": "UI 与应用界面",
	"Architecture & Interiors": "建筑与室内",
	"Cinematic & Storytelling": "影视与叙事",
	"Illustration & Comics": "插画与漫画",
	"Historical & Fantasy": "历史与幻想",
	"Animals & Nature": "动物与自然",
	"Other Creative Uses": "其他创意用途"
};
const DATA_DIR$1 = path.join(homedir(), ".dsh", "dsh-imagegen");
const REFRESHED_DIR = path.join(DATA_DIR$1, "templates");
const IMAGE_CACHE_ROOT = path.join(DATA_DIR$1, "template-images");
/** Pre-1.6 single-source locations (vibeui fallbacks). */
const LEGACY_SNAPSHOT_PATH = path.join(REFRESHED_DIR, "cases.json");
const LEGACY_IMAGE_DIR = IMAGE_CACHE_ROOT;
/** Budget for one upstream fetch (list refresh or one image). */
const FETCH_TIMEOUT_MS = 6e4;
/** Refuse to cache implausibly large "images". */
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
/** Strict reference-image file names this store writes and serves. */
const IMAGE_FILE_PATTERN = /^case\d+\.(jpg|jpeg|png|webp|gif)$/i;
/** Per-source in-memory memo of the active list (avoid re-parsing per request). */
const memos = /* @__PURE__ */ new Map();
/** Per-file in-flight downloads, so a gallery scroll never double-fetches. */
const inflightImages = /* @__PURE__ */ new Map();
/** Resolve a registered source id to its fetch definition. */
function sourceDefOf(sourceId) {
	return SOURCE_DEFS[sourceId];
}
/** Validate + normalize one raw upstream case; undefined when unusable. */
function normalizeCase(raw) {
	if (raw === null || typeof raw !== "object") return void 0;
	const record = raw;
	const id = Number(record.id);
	const title = typeof record.title === "string" ? record.title.trim() : "";
	const prompt = typeof record.prompt === "string" ? record.prompt.trim() : "";
	if (!Number.isInteger(id) || title === "" || prompt === "") return void 0;
	const category = typeof record.category === "string" ? record.category : "";
	const image = imageFileOf(typeof record.image === "string" ? record.image : "");
	return {
		id,
		title,
		prompt,
		category,
		categoryZh: CATEGORY_ZH[category] ?? category,
		styles: Array.isArray(record.styles) ? record.styles.map(String) : [],
		scenes: Array.isArray(record.scenes) ? record.scenes.map(String) : [],
		sourceLabel: typeof record.sourceLabel === "string" ? record.sourceLabel : "",
		sourceUrl: typeof record.sourceUrl === "string" ? record.sourceUrl : "",
		githubUrl: typeof record.githubUrl === "string" ? record.githubUrl : "",
		image,
		featured: record.featured === true
	};
}
/** Extract the bare file name from an upstream image path. */
function imageFileOf(value) {
	const name = value.replace(/^\/+/, "").split("/").pop() ?? "";
	return IMAGE_FILE_PATTERN.test(name) ? name : "";
}
/** Parse a snapshot payload (bundled, refreshed cache, or fresh download). */
function parseSnapshot(payload) {
	if (payload === null || typeof payload !== "object") return void 0;
	const snapshot = payload;
	if (!Array.isArray(snapshot.cases)) return void 0;
	const cases = [];
	for (const raw of snapshot.cases) {
		const normalized = normalizeCase(raw);
		if (normalized !== void 0) cases.push(normalized);
	}
	if (cases.length === 0) return void 0;
	cases.sort((a, b) => b.id - a.id);
	return {
		cases,
		repository: typeof snapshot.repository === "string" && snapshot.repository !== "" ? snapshot.repository : "freestylefly/awesome-gpt-image-2",
		fetchedAt: typeof snapshot.fetchedAt === "string" && snapshot.fetchedAt !== "" ? snapshot.fetchedAt : ""
	};
}
/** Read + parse a snapshot file; undefined when missing/corrupt. */
async function readSnapshotFile(file) {
	try {
		return parseSnapshot(JSON.parse(await promises.readFile(file, "utf8")));
	} catch {
		return;
	}
}
/**
* The active template list of one source: the refreshed runtime copy wins, the
* bundled snapshot is the always-available fallback. Memoized per source; a
* successful refresh replaces that source's memo.
*/
async function listTemplates(sourceId = DEFAULT_TEMPLATE_SOURCE_ID) {
	const def = sourceDefOf(sourceId);
	if (def === void 0) throw new Error(`未知的模板库来源：${sourceId}`);
	const memo = memos.get(sourceId);
	if (memo !== void 0) return memo;
	const refreshed = await readSnapshotFile(path.join(REFRESHED_DIR, sourceId, "cases.json")) ?? (def.legacySnapshotPath !== void 0 ? await readSnapshotFile(LEGACY_SNAPSHOT_PATH) : void 0);
	if (refreshed !== void 0) {
		const result = {
			sourceId,
			...refreshed,
			total: refreshed.cases.length,
			origin: "refreshed"
		};
		memos.set(sourceId, result);
		return result;
	}
	const bundled = await readSnapshotFile(def.bundledPath);
	if (bundled !== void 0) {
		const result = {
			sourceId,
			...bundled,
			total: bundled.cases.length,
			origin: "bundled"
		};
		memos.set(sourceId, result);
		return result;
	}
	const result = {
		sourceId,
		cases: [],
		total: 0,
		origin: "bundled",
		repository: "freestylefly/awesome-gpt-image-2",
		fetchedAt: ""
	};
	memos.set(sourceId, result);
	return result;
}
/**
* Re-download one source's case list from its upstream mirror and persist it
* as the runtime copy. Throws with a user-presentable message on failure; the
* previous list (refreshed or bundled) stays active.
*/
async function refreshTemplates(sourceId = DEFAULT_TEMPLATE_SOURCE_ID) {
	const def = sourceDefOf(sourceId);
	if (def === void 0) throw new Error(`未知的模板库来源：${sourceId}`);
	let response;
	try {
		response = await fetch(def.listUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
	} catch (error) {
		throw new Error(`无法连接模板库源站（${sourceId}）：${error instanceof Error ? error.message : String(error)}`);
	}
	if (!response.ok) throw new Error(`模板库源站拒绝请求（HTTP ${response.status}）`);
	let payload;
	try {
		payload = await response.json();
	} catch {
		throw new Error("模板库源站返回了非 JSON 响应");
	}
	const parsed = parseSnapshot(payload);
	if (parsed === void 0) throw new Error("模板库源站数据格式无效");
	const fetchedAt = (/* @__PURE__ */ new Date()).toISOString();
	const snapshot = {
		repository: parsed.repository,
		sourceUrl: def.listUrl,
		fetchedAt,
		totalCases: parsed.cases.length,
		cases: parsed.cases
	};
	const target = path.join(REFRESHED_DIR, sourceId, "cases.json");
	await promises.mkdir(path.dirname(target), { recursive: true });
	const tmp = `${target}.tmp-${process.pid}`;
	await promises.writeFile(tmp, JSON.stringify(snapshot), "utf8");
	await promises.rename(tmp, target);
	const result = {
		sourceId,
		cases: parsed.cases,
		total: parsed.cases.length,
		origin: "refreshed",
		repository: parsed.repository,
		fetchedAt
	};
	memos.set(sourceId, result);
	return {
		sourceId,
		total: parsed.cases.length,
		fetchedAt
	};
}
/** Fisher–Yates shuffle (returns a copy; never mutates the pool). */
function shuffled(items) {
	const out = [...items];
	for (let i = out.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1));
		const a = out[i];
		out[i] = out[j];
		out[j] = a;
	}
	return out;
}
/**
* Draw up to `count` random cases across every source that has data,
* round-robin between sources so one huge library cannot crowd out the
* others, then shuffle the final pick. Reads memoized lists, so this never
* touches the network — cheap enough for every shuffle click.
*/
async function sampleTemplates(count = 9) {
	const size = Math.min(12, Math.max(1, Math.floor(count) || 9));
	const pools = [];
	for (const source of TEMPLATE_SOURCES) try {
		const list = await listTemplates(source.id);
		if (list.cases.length > 0) pools.push({
			sourceId: source.id,
			cases: shuffled(list.cases)
		});
	} catch {}
	const picks = [];
	for (let round = 0; picks.length < size && pools.some((pool) => pool.cases.length > 0); round += 1) {
		const pool = pools[round % pools.length];
		const picked = pool.cases.pop();
		if (picked !== void 0) picks.push({
			sourceId: pool.sourceId,
			case: picked
		});
	}
	return shuffled(picks);
}
/** Serially refresh every registered source; one failure never stops the rest. */
async function syncAllTemplates() {
	const reports = [];
	for (const source of TEMPLATE_SOURCES) try {
		const result = await refreshTemplates(source.id);
		reports.push({
			sourceId: source.id,
			ok: true,
			total: result.total
		});
	} catch (error) {
		reports.push({
			sourceId: source.id,
			ok: false,
			total: 0,
			error: error instanceof Error ? error.message : String(error)
		});
	}
	return reports;
}
/** MIME type for a cached reference-image file name. */
function mimeOfFile(file) {
	switch (path.extname(file).toLowerCase()) {
		case ".jpg":
		case ".jpeg": return "image/jpeg";
		case ".webp": return "image/webp";
		case ".gif": return "image/gif";
		default: return "image/png";
	}
}
/** Download one reference image into the source's disk cache; undefined on failure. */
async function fetchTemplateImage(def, file, cacheDir) {
	let response;
	try {
		response = await fetch(`${def.imageBaseUrl}${encodeURIComponent(file)}`, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
	} catch {
		return;
	}
	if (!response.ok) return void 0;
	if (Number(response.headers.get("content-length") ?? 0) > MAX_IMAGE_BYTES) return void 0;
	const data = Buffer.from(await response.arrayBuffer());
	if (data.byteLength === 0 || data.byteLength > MAX_IMAGE_BYTES) return void 0;
	const mime = mimeOfFile(file);
	try {
		await promises.mkdir(cacheDir, { recursive: true });
		const tmp = path.join(cacheDir, `${file}.tmp-${process.pid}`);
		await promises.writeFile(tmp, data);
		await promises.rename(tmp, path.join(cacheDir, file));
	} catch {}
	return {
		data,
		mime
	};
}
/**
* Read one reference image for a source's library. Cache hit → disk; miss →
* fetch from that source's mirror, cache, and serve. Only file names present
* in the active case list are served, so the route can never act as an open
* proxy. Undefined when the name is unknown or the fetch failed.
*/
async function readTemplateImage(sourceId, file) {
	const def = sourceDefOf(sourceId);
	if (def === void 0) return void 0;
	if (!IMAGE_FILE_PATTERN.test(file) || file.includes("..")) return void 0;
	if (!(await listTemplates(sourceId)).cases.some((entry) => entry.image === file)) return void 0;
	const cacheDir = path.join(IMAGE_CACHE_ROOT, sourceId);
	try {
		return {
			data: await promises.readFile(path.join(cacheDir, file)),
			mime: mimeOfFile(file)
		};
	} catch {}
	if (def.legacyImageDir !== void 0) try {
		return {
			data: await promises.readFile(path.join(LEGACY_IMAGE_DIR, file)),
			mime: mimeOfFile(file)
		};
	} catch {}
	const cacheKey = `${sourceId}/${file}`;
	const inflight = inflightImages.get(cacheKey);
	if (inflight !== void 0) return inflight;
	const pending = fetchTemplateImage(def, file, cacheDir);
	inflightImages.set(cacheKey, pending);
	try {
		return await pending;
	} finally {
		inflightImages.delete(cacheKey);
	}
}
/** Drop the in-memory list memos (tests). */
function clearTemplateMemo() {
	memos.clear();
}
//#endregion
//#region src/template-favorites.ts
/**
* Favorites store for the prompt-template library.
*
* The user's starred templates persist host-side as full case snapshots under
* ~/.dsh/dsh-imagegen/templates/favorites.json, keyed by
* `${sourceId}:${caseId}` — the snapshot means a favorite stays usable even
* after the upstream list drops or renumbers the case. Framework-free
* (node:fs only) so the route layer and tests can drive it directly.
*/
const DATA_DIR = path.join(homedir(), ".dsh", "dsh-imagegen");
const FAVORITES_PATH = path.join(DATA_DIR, "templates", "favorites.json");
/** Refuse to grow the file without bound; the user curates this list. */
const MAX_FAVORITES = 1e3;
/** In-memory memo of the persisted list. */
let memo;
/** Build the stable key of one case within a source. */
function templateFavoriteKey(sourceId, caseId) {
	return `${sourceId}:${caseId}`;
}
/** Validate + normalize one raw stored favorite; undefined when unusable. */
function normalizeFavorite(raw) {
	if (raw === null || typeof raw !== "object") return void 0;
	const record = raw;
	if (typeof record.key !== "string" || typeof record.savedAt !== "string") return void 0;
	const sourceId = typeof record.sourceId === "string" ? record.sourceId : "";
	if (!isTemplateSourceId(sourceId)) return void 0;
	if (record.key !== templateFavoriteKey(sourceId, Number(record.case && record.case.id))) return void 0;
	const rawCase = record.case;
	if (rawCase === null || typeof rawCase !== "object") return void 0;
	const item = rawCase;
	const id = Number(item.id);
	const title = typeof item.title === "string" ? item.title : "";
	const prompt = typeof item.prompt === "string" ? item.prompt : "";
	if (!Number.isInteger(id) || title === "" || prompt === "") return void 0;
	const snapshot = {
		id,
		title,
		prompt,
		category: typeof item.category === "string" ? item.category : "",
		categoryZh: typeof item.categoryZh === "string" ? item.categoryZh : "",
		styles: Array.isArray(item.styles) ? item.styles.map(String) : [],
		scenes: Array.isArray(item.scenes) ? item.scenes.map(String) : [],
		sourceLabel: typeof item.sourceLabel === "string" ? item.sourceLabel : "",
		sourceUrl: typeof item.sourceUrl === "string" ? item.sourceUrl : "",
		githubUrl: typeof item.githubUrl === "string" ? item.githubUrl : "",
		image: typeof item.image === "string" ? item.image : "",
		featured: item.featured === true
	};
	return {
		key: record.key,
		sourceId,
		savedAt: record.savedAt,
		case: snapshot
	};
}
/** Read + parse the favorites file (memoized). */
async function listTemplateFavorites() {
	if (memo !== void 0) return memo;
	try {
		const parsed = JSON.parse(await promises.readFile(FAVORITES_PATH, "utf8"));
		memo = Array.isArray(parsed) ? parsed.map(normalizeFavorite).filter((entry) => entry !== void 0) : [];
	} catch {
		memo = [];
	}
	return memo;
}
/** Persist the list atomically and update the memo. */
async function writeFavorites(entries) {
	memo = entries;
	await promises.mkdir(path.dirname(FAVORITES_PATH), { recursive: true });
	const tmp = `${FAVORITES_PATH}.tmp-${process.pid}`;
	await promises.writeFile(tmp, JSON.stringify(entries, null, 2), "utf8");
	await promises.rename(tmp, FAVORITES_PATH);
}
/** Star one template. Re-starring refreshes the snapshot and is idempotent. */
async function addTemplateFavorite(sourceId, item) {
	if (!isTemplateSourceId(sourceId)) throw new Error(`未知的模板库来源：${sourceId}`);
	const key = templateFavoriteKey(sourceId, item.id);
	const rest = (await listTemplateFavorites()).filter((entry) => entry.key !== key);
	const next = [{
		key,
		sourceId,
		savedAt: (/* @__PURE__ */ new Date()).toISOString(),
		case: item
	}, ...rest].slice(0, MAX_FAVORITES);
	await writeFavorites(next);
	return next;
}
/** Unstar one template by key; unknown keys are a no-op. */
async function removeTemplateFavorite(key) {
	const next = (await listTemplateFavorites()).filter((entry) => entry.key !== key);
	if (next.length === memo?.length) return next;
	await writeFavorites(next);
	return next;
}
/** Drop the in-memory memo (tests). */
function clearTemplateFavoritesMemo() {
	memo = void 0;
}
//#endregion
//#region src/updater.ts
/** GitHub Release discovery and explicit, user-triggered plugin updates. */
/** Keep this in sync with package.json for each published release. */
const CURRENT_VERSION = PLUGIN_VERSION;
const PACKAGE_NAME = "@dickpy/dsh-imagegen";
const RELEASES_URL = "https://api.github.com/repos/dickpy/dsh-imagegen/releases/latest";
const CHECK_TIMEOUT_MS = 1e4;
const CACHE_TTL_MS = 15 * 6e4;
let cached;
/** Compare stable semver triples; returns positive when `left` is newer. */
function compareVersions(left, right) {
	const parse = (value) => {
		const match = /^v?(\d+)\.(\d+)\.(\d+)/.exec(value.trim());
		if (match === null) return [
			0,
			0,
			0
		];
		return [
			Number(match[1]),
			Number(match[2]),
			Number(match[3])
		];
	};
	const a = parse(left);
	const b = parse(right);
	return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
}
function normalizedReleaseVersion(tag) {
	if (typeof tag !== "string" || !/^v?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(tag.trim())) return void 0;
	return tag.trim().replace(/^v/, "");
}
/** Read the latest stable GitHub Release, with a short host-side cache. */
async function checkForUpdate(fetchFn = fetch, now = Date.now()) {
	if (cached !== void 0 && cached.expiresAt > now) return cached.value;
	const response = await fetchFn(RELEASES_URL, {
		headers: {
			accept: "application/vnd.github+json",
			"user-agent": "dsh-imagegen-update-check"
		},
		signal: AbortSignal.timeout(CHECK_TIMEOUT_MS)
	});
	if (!response.ok) throw new Error(`GitHub Releases returned HTTP ${response.status}`);
	const payload = await response.json();
	if (payload === null || typeof payload !== "object") throw new Error("GitHub Releases returned malformed JSON");
	const release = payload;
	if (release.draft === true || release.prerelease === true) throw new Error("latest GitHub Release is not stable");
	const latestVersion = normalizedReleaseVersion(release.tag_name);
	if (latestVersion === void 0) throw new Error("latest GitHub Release has an invalid version tag");
	const releaseUrl = typeof release.html_url === "string" ? release.html_url : "https://github.com/dickpy/dsh-imagegen/releases";
	const value = {
		currentVersion: CURRENT_VERSION,
		latestVersion,
		updateAvailable: compareVersions(latestVersion, CURRENT_VERSION) > 0,
		releaseUrl,
		...typeof release.published_at === "string" ? { publishedAt: release.published_at } : {}
	};
	cached = {
		expiresAt: now + CACHE_TTL_MS,
		value
	};
	return value;
}
/** Resolve the profile that launched the current DSH process. */
function profileFromProcess(argv = process.argv, env = process.env) {
	const envProfile = env.DSH_PROFILE?.trim();
	if (envProfile !== void 0 && /^[a-zA-Z0-9_-]+$/.test(envProfile)) return envProfile;
	const profileIndex = argv.indexOf("--profile");
	const explicit = profileIndex >= 0 ? argv[profileIndex + 1]?.trim() : void 0;
	if (explicit !== void 0 && /^[a-zA-Z0-9_-]+$/.test(explicit)) return explicit;
	if (argv.includes("web")) return "web";
	return "web";
}
/** Run the same official command documented for plugin installation. */
function installUpdate(version, spawnFn = spawn, argv = process.argv, env = process.env) {
	if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) return Promise.reject(/* @__PURE__ */ new Error("invalid update version"));
	const profile = profileFromProcess(argv, env);
	const child = spawnFn(process.platform === "win32" ? "dsh.cmd" : "dsh", [
		"plugin",
		"--profile",
		profile,
		"add",
		`${PACKAGE_NAME}@${version}`
	], {
		shell: process.platform === "win32",
		stdio: "ignore"
	});
	return new Promise((resolve, reject) => {
		child.once("error", reject);
		child.once("exit", (code, signal) => {
			if (code === 0) resolve();
			else reject(/* @__PURE__ */ new Error(signal === null ? `plugin update exited with code ${code ?? "unknown"}` : `plugin update terminated by ${signal}`));
		});
	});
}
/** Test helper: clear the host-side Release cache. */
function clearUpdateCache() {
	cached = void 0;
}
//#endregion
//#region src/presets.ts
const IMAGE_PRESETS = [
	{
		id: "volc-ark-seedream",
		name: "字节 · 火山方舟（Seedream）",
		apiUrl: "https://ark.cn-beijing.volces.com/api/v3",
		hint: "字节跳动官方 Seedream 文生图/图生图入口",
		models: [
			{
				alias: "seedream-5.0-pro",
				id: "seedream-5.0-pro"
			},
			{
				alias: "seedream-5.0",
				id: "seedream-5.0"
			},
			{
				alias: "seedream-4.0",
				id: "seedream-4.0"
			}
		]
	},
	{
		id: "openai-official",
		name: "OpenAI 官方",
		apiUrl: "https://api.openai.com/v1",
		hint: "OpenAI 官方图像生成接口",
		models: [{
			alias: "gpt-image-2",
			id: "gpt-image-2"
		}]
	},
	{
		id: "zhipu-official",
		name: "智谱 AI 官方",
		apiUrl: "https://open.bigmodel.cn/api/paas/v4",
		hint: "智谱官方 GLM-Image 图像生成接口",
		models: [{
			alias: "glm-image",
			id: "glm-image"
		}]
	},
	{
		id: "aliyun-dashscope-qwen",
		name: "阿里云百炼（Qwen-Image）",
		apiUrl: "https://dashscope.aliyuncs.com/api/v1",
		hint: "阿里云百炼 DashScope 原生接口：通义千问 Qwen-Image 系列（该渠道不可复用于提示词增强）",
		models: [
			{
				alias: "qwen-image-3.0-pro",
				id: "qwen-image-3.0-pro"
			},
			{
				alias: "qwen-image-3.0",
				id: "qwen-image-3.0"
			},
			{
				alias: "qwen-image-2.0-pro",
				id: "qwen-image-2.0-pro"
			},
			{
				alias: "qwen-image-2.0",
				id: "qwen-image-2.0"
			},
			{
				alias: "qwen-image-max",
				id: "qwen-image-max"
			},
			{
				alias: "qwen-image-plus",
				id: "qwen-image-plus"
			},
			{
				alias: "qwen-image",
				id: "qwen-image"
			}
		]
	},
	{
		id: "xai-grok",
		name: "xAI（Grok）",
		apiUrl: "https://api.x.ai/v1",
		hint: "xAI 官方接口：Grok Imagine 系列",
		models: [{
			alias: "grok-imagine-image",
			id: "grok-imagine-image"
		}]
	}
];
/** Look up one built-in provider by id. */
function presetById(id) {
	return IMAGE_PRESETS.find((preset) => preset.id === id);
}
//#endregion
//#region src/routes.ts
/** Cap on JSON request bodies (settings ops and generate payloads are small). */
const MAX_JSON_BODY_BYTES = 24 * 1024 * 1024;
/** Cap on history append bodies (base64 result images can be much larger). */
const MAX_HISTORY_BODY_BYTES = 64 * 1024 * 1024;
/** Loopback literal check plus browser same-origin markers (mirrors dsh-ssh). */
function isLoopbackRequest(request) {
	const address = request.socket.remoteAddress;
	if (address !== "127.0.0.1" && address !== "::1" && address !== "::ffff:127.0.0.1") return false;
	const host = request.headers.host;
	if (typeof host !== "string") return false;
	let hostUrl;
	try {
		hostUrl = new URL(`http://${host}`);
	} catch {
		return false;
	}
	if (hostUrl.hostname !== "127.0.0.1" && hostUrl.hostname !== "localhost" && hostUrl.hostname !== "[::1]") return false;
	if (request.headers["sec-fetch-site"] === "cross-site") return false;
	const origin = request.headers.origin;
	if (origin === void 0) return true;
	try {
		return new URL(origin).host === hostUrl.host;
	} catch {
		return false;
	}
}
/** One JSON response. */
function writeJson(res, status, body) {
	const payload = JSON.stringify(body);
	res.writeHead(status, {
		"content-type": "application/json; charset=utf-8",
		"referrer-policy": "no-referrer"
	});
	res.end(payload);
}
/** Read a JSON request body (undefined when too large or unparseable). */
async function readJsonBody(req, maxBytes = MAX_JSON_BODY_BYTES) {
	const chunks = [];
	let size = 0;
	for await (const chunk of req) {
		const buffer = chunk;
		size += buffer.length;
		if (size > maxBytes) return void 0;
		chunks.push(buffer);
	}
	try {
		const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
		return typeof parsed === "object" && parsed !== null ? parsed : void 0;
	} catch {
		return;
	}
}
/** Human-readable text from an unknown thrown value. */
function messageOf(error) {
	return error instanceof Error ? error.message : String(error);
}
/** Validate the { source } body of a template-library request. */
function templateSourceOf(body) {
	const raw = body?.source;
	if (raw === void 0 || raw === "") return DEFAULT_TEMPLATE_SOURCE_ID;
	return typeof raw === "string" && isTemplateSourceId(raw) ? raw : void 0;
}
function parseGenerateRequest(body) {
	const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
	if (prompt === "") return void 0;
	const comparisonModels = Array.isArray(body.comparisonModels) ? [...new Set(body.comparisonModels.filter((model) => typeof model === "string").map((model) => model.trim()).filter(Boolean))] : [];
	const canvas = parseCanvasMeta(body.canvas);
	return {
		mode: body.mode === "edit" ? "edit" : "text",
		model: typeof body.model === "string" ? body.model : "",
		prompt,
		size: typeof body.size === "string" ? body.size : "auto",
		quality: typeof body.quality === "string" ? body.quality : "auto",
		n: typeof body.n === "number" ? body.n : 1,
		detail: typeof body.detail === "string" ? body.detail : "",
		...typeof body.image === "string" && body.image !== "" ? { image: body.image } : {},
		...Array.isArray(body.images) ? { images: body.images.filter((item) => typeof item === "string" && item !== "").slice(0, 4) } : {},
		...typeof body.refName === "string" && body.refName !== "" ? { refName: body.refName } : {},
		...typeof body.channelId === "string" && body.channelId !== "" ? { channelId: body.channelId } : {},
		...typeof body.comparisonId === "string" && body.comparisonId !== "" ? { comparisonId: body.comparisonId } : {},
		...comparisonModels.length > 1 ? { comparisonModels } : {},
		...canvas === void 0 ? {} : { canvas },
		...body.workflow === "ecommerce" ? { workflow: "ecommerce" } : {},
		...typeof body.projectId === "string" && body.projectId !== "" ? { projectId: body.projectId } : {},
		...typeof body.projectName === "string" && body.projectName !== "" ? { projectName: body.projectName } : {},
		...typeof body.slotKey === "string" && body.slotKey !== "" ? { slotKey: body.slotKey } : {},
		...typeof body.slotLabel === "string" && body.slotLabel !== "" ? { slotLabel: body.slotLabel } : {}
	};
}
function parseCanvasMeta(value) {
	if (value === null || typeof value !== "object") return void 0;
	const raw = value;
	if (typeof raw.canvasId !== "string" || raw.canvasId.trim() === "") return void 0;
	return {
		canvasId: raw.canvasId.trim(),
		...typeof raw.sourceNodeId === "string" && raw.sourceNodeId.trim() !== "" ? { sourceNodeId: raw.sourceNodeId.trim() } : {},
		...typeof raw.annotationNodeId === "string" && raw.annotationNodeId.trim() !== "" ? { annotationNodeId: raw.annotationNodeId.trim() } : {},
		...typeof raw.parentNodeId === "string" && raw.parentNodeId.trim() !== "" ? { parentNodeId: raw.parentNodeId.trim() } : {},
		...raw.placement === "right" || raw.placement === "below" ? { placement: raw.placement } : {}
	};
}
/** Validate a submitted history entry (images carry base64). */
function parseHistoryEntryInput(body) {
	const raw = body.entry;
	if (raw === null || typeof raw !== "object") return void 0;
	const entry = raw;
	if (typeof entry.id !== "string" || typeof entry.createdAt !== "number") return void 0;
	if (entry.mode !== "text" && entry.mode !== "edit") return void 0;
	if (typeof entry.model !== "string" || typeof entry.prompt !== "string") return void 0;
	if (typeof entry.size !== "string" || typeof entry.quality !== "string" || typeof entry.detail !== "string") return void 0;
	if (typeof entry.n !== "number") return void 0;
	if (!Array.isArray(entry.images)) return void 0;
	const images = [];
	for (const item of entry.images) {
		if (item === null || typeof item !== "object") return void 0;
		const image = item;
		if (typeof image.b64 !== "string" || typeof image.mime !== "string") return void 0;
		images.push({
			b64: image.b64,
			mime: image.mime,
			...typeof image.revisedPrompt === "string" ? { revisedPrompt: image.revisedPrompt } : {}
		});
	}
	const comparisonModels = Array.isArray(entry.comparisonModels) ? [...new Set(entry.comparisonModels.filter((model) => typeof model === "string").map((model) => model.trim()).filter(Boolean))] : [];
	const canvas = parseCanvasMeta(entry.canvas);
	return {
		id: entry.id,
		createdAt: entry.createdAt,
		mode: entry.mode,
		model: entry.model,
		prompt: entry.prompt,
		size: entry.size,
		quality: entry.quality,
		detail: entry.detail,
		n: entry.n,
		images,
		...typeof entry.refName === "string" ? { refName: entry.refName } : {},
		...typeof entry.channelId === "string" ? { channelId: entry.channelId } : {},
		...typeof entry.channel === "string" ? { channel: entry.channel } : {},
		...typeof entry.comparisonId === "string" ? { comparisonId: entry.comparisonId } : {},
		...comparisonModels.length > 1 ? { comparisonModels } : {},
		...canvas === void 0 ? {} : { canvas },
		...entry.workflow === "ecommerce" ? { workflow: "ecommerce" } : {},
		...typeof entry.projectId === "string" ? { projectId: entry.projectId } : {},
		...typeof entry.projectName === "string" ? { projectName: entry.projectName } : {},
		...typeof entry.slotKey === "string" ? { slotKey: entry.slotKey } : {},
		...typeof entry.slotLabel === "string" ? { slotLabel: entry.slotLabel } : {}
	};
}
/** Extract the image file name from a history-image request URL. */
function imageFileFrom(rawUrl, basePath) {
	if (rawUrl === void 0) return void 0;
	let pathname;
	try {
		pathname = new URL(rawUrl, "http://localhost").pathname;
	} catch {
		return;
	}
	if (!pathname.startsWith(`${basePath}/`)) return void 0;
	return decodeURIComponent(pathname.slice(basePath.length + 1));
}
/** Parse the durable image reference carried by an Agent tool-result view. */
function agentImageRefFrom(rawUrl) {
	if (rawUrl === void 0) return void 0;
	let url;
	try {
		url = new URL(rawUrl, "http://localhost");
	} catch {
		return;
	}
	if (url.pathname !== "/api/dsh-imagegen/agent-image") return void 0;
	const attachmentId = url.searchParams.get("attachment_id") ?? "";
	const mediaType = url.searchParams.get("media_type") ?? "";
	const bytes = Number(url.searchParams.get("bytes"));
	const width = Number(url.searchParams.get("width"));
	const height = Number(url.searchParams.get("height"));
	if (attachmentId === "" || !isImageMediaType(mediaType) || !Number.isSafeInteger(bytes) || bytes < 1 || !Number.isSafeInteger(width) || width < 1 || !Number.isSafeInteger(height) || height < 1) return void 0;
	return {
		attachmentId,
		mediaType,
		bytes,
		width,
		height
	};
}
function isImageMediaType(value) {
	return value === "image/png" || value === "image/jpeg" || value === "image/webp" || value === "image/gif";
}
function imageDataUrl$1(value) {
	const match = /^data:(image\/(?:png|jpeg|webp|gif));base64,(.*)$/su.exec(value.trim());
	if (match === null || match[1] === void 0 || match[2] === void 0) return void 0;
	const data = Buffer.from(match[2], "base64");
	return data.byteLength === 0 ? void 0 : {
		mediaType: match[1],
		data
	};
}
/** Project one settings descriptor onto the bridge wire view. */
function toView(descriptor) {
	return {
		ns: String(descriptor.ns),
		schema: descriptor.schema,
		value: descriptor.value,
		...descriptor.base === void 0 ? {} : { base: descriptor.base },
		...descriptor.user === void 0 ? {} : { user: descriptor.user },
		...descriptor.secrets === void 0 ? {} : { secrets: descriptor.secrets.map((secret) => ({
			path: [...secret.path],
			set: secret.set
		})) },
		revision: descriptor.revision
	};
}
/** Map a seam failure onto the bridge refusal envelope. */
function failureOf(error) {
	if (error instanceof SettingsConflictError) return {
		ok: false,
		code: "settings-conflict",
		message: error.message
	};
	return {
		ok: false,
		code: "settings-rejected",
		message: error instanceof Error ? error.message : String(error)
	};
}
/**
* Build every /api/dsh-imagegen route.
* @param deps - settings seam + config resolver.
* @returns the route registrations.
*/
function makeRoutes(deps) {
	const history = deps.history ?? {
		list: listHistory,
		append: appendHistory,
		remove: removeHistory,
		clear: clearHistory,
		readImage: readHistoryImage
	};
	const gallery = deps.gallery ?? {
		list: listGallery,
		append: appendGallery,
		remove: removeGallery,
		clear: clearGallery,
		updateTags: updateGalleryTags,
		readImage: readGalleryImage
	};
	const canvas = deps.canvas ?? canvasStore;
	const templates = deps.templates ?? {
		list: listTemplates,
		refresh: refreshTemplates,
		sample: sampleTemplates,
		readImage: readTemplateImage
	};
	const favorites = deps.favorites ?? {
		list: listTemplateFavorites,
		add: addTemplateFavorite,
		remove: removeTemplateFavorite
	};
	const resolvePrompt = deps.resolvePrompt ?? (() => ({
		apiUrl: "",
		apiKey: "",
		model: ""
	}));
	const resolveImageModels = deps.resolveImageModels ?? (() => normalizeImageModels(void 0));
	/** The current channel view: the channel-aware resolver, or a synthesized
	*  single default channel from the legacy flat upstream config (tests and
	*  older hosts). */
	const channelViewOf = () => {
		if (deps.resolveChannels !== void 0) return deps.resolveChannels();
		const upstream = deps.resolve();
		const models = normalizeImageModels(resolveImageModels()).map((id) => ({
			alias: id,
			id
		}));
		if (upstream.apiUrl.trim() === "" && models.length === 0) return {
			channels: [],
			defaultChannelId: ""
		};
		return {
			channels: [{
				id: "default",
				preset: "",
				name: "默认渠道",
				apiUrl: upstream.apiUrl,
				apiKey: upstream.apiKey,
				models
			}],
			defaultChannelId: "default"
		};
	};
	const runtime = deps.runtime ?? new ImageGenerationRuntime(channelViewOf, history);
	/** Resolve an alias (or the channel fallback) into a concrete generation
	*  request: picks the channel (explicit then default), maps alias → upstream
	*  id, and fills the channel snapshot kept on history entries. */
	const resolveChannelRequest = (request) => {
		const view = channelViewOf();
		if (view.channels.length === 0) return {
			ok: false,
			code: "no-channels",
			message: "尚未配置任何渠道：请先在「设置 → 插件 → AI 生图」添加渠道并填写 API 地址与密钥"
		};
		const explicit = view.channels.find((candidate) => candidate.id === request.channelId);
		const defaults = view.channels.find((candidate) => candidate.id === view.defaultChannelId) ?? view.channels[0];
		const target = explicit ?? defaults;
		const asked = request.model.trim();
		if (asked === "") {
			const alias = target?.models[0]?.alias ?? "";
			if (alias === "") return {
				ok: false,
				code: "no-models",
				message: `渠道「${target?.name ?? ""}」尚未配置模型，请先在设置中添加`
			};
			const mapping = target.models.find((model) => model.alias === alias);
			return {
				ok: true,
				request: {
					...request,
					model: alias,
					upstream: mapping.id,
					channelId: target.id,
					channel: target.name
				}
			};
		}
		const hosting = view.channels.filter((channel) => channel.models.some((model) => model.alias === asked));
		if (hosting.length === 0) return {
			ok: false,
			code: "image-model-not-configured",
			message: `模型「${asked}」未在任一渠道配置；可用模型：${[...new Set(view.channels.flatMap((channel) => channel.models.map((model) => model.alias)))].join("、") || "（无）"}`
		};
		const picked = target !== void 0 && target.models.some((model) => model.alias === asked) ? target : hosting[0];
		const mapping = picked.models.find((model) => model.alias === asked);
		return {
			ok: true,
			request: {
				...request,
				model: asked,
				upstream: mapping.id,
				channelId: picked.id,
				channel: picked.name
			}
		};
	};
	const guard = (req, res, method) => {
		if (!isLoopbackRequest(req)) {
			writeJson(res, 403, { error: "forbidden: loopback-only" });
			return false;
		}
		if (req.method !== method) {
			writeJson(res, 405, { error: `method not allowed: ${req.method}` });
			return false;
		}
		return true;
	};
	return [
		...deps.attachments?.saveImage === void 0 || deps.pendingConversationImages === void 0 ? [] : [{
			kind: "exact",
			path: CONVERSATION_IMAGE_API,
			handler: async (req, res) => {
				if (!guard(req, res, "POST")) return;
				const body = await readJsonBody(req, MAX_JSON_BODY_BYTES);
				const sessionId = typeof body?.sessionId === "string" ? body.sessionId.trim() : "";
				const dataUrl = typeof body?.dataUrl === "string" ? imageDataUrl$1(body.dataUrl) : void 0;
				if (sessionId === "" || dataUrl === void 0) {
					writeJson(res, 200, {
						ok: false,
						code: "bad-request",
						message: "sessionId and image data are required"
					});
					return;
				}
				try {
					const ref = await deps.attachments.saveImage({
						data: dataUrl.data,
						mediaType: dataUrl.mediaType,
						...typeof body?.name === "string" && body.name.trim() !== "" ? { name: body.name.trim() } : {}
					});
					deps.pendingConversationImages.set(sessionId, ref);
					writeJson(res, 200, { ok: true });
				} catch (error) {
					writeJson(res, 200, {
						ok: false,
						code: "image-save-failed",
						message: messageOf(error)
					});
				}
			}
		}],
		...deps.attachments === void 0 ? [] : [{
			kind: "prefix",
			path: AGENT_IMAGE_API,
			handler: async (req, res) => {
				if (!isLoopbackRequest(req)) {
					writeJson(res, 403, { error: "forbidden: loopback-only" });
					return;
				}
				if (req.method !== "GET") {
					writeJson(res, 405, { error: `method not allowed: ${req.method}` });
					return;
				}
				const ref = agentImageRefFrom(req.url);
				if (ref === void 0) {
					writeJson(res, 400, { error: "invalid image reference" });
					return;
				}
				try {
					const stored = await deps.attachments.readImage(ref);
					res.writeHead(200, {
						"content-type": stored.ref.mediaType,
						"content-length": stored.data.byteLength,
						"cache-control": "private, max-age=3600"
					});
					res.end(Buffer.from(stored.data));
				} catch {
					writeJson(res, 404, { error: "image attachment not found" });
				}
			}
		}],
		{
			kind: "exact",
			path: IMAGE_MODEL_API.models,
			handler: async (req, res) => {
				if (!guard(req, res, "POST")) return;
				const body = await readJsonBody(req);
				const view = channelViewOf();
				const stored = view.channels.find((candidate) => candidate.id === (typeof body?.channelId === "string" ? body.channelId : void 0)) ?? view.channels.find((candidate) => candidate.id === view.defaultChannelId) ?? view.channels[0];
				const upstream = {
					apiUrl: typeof body?.apiUrl === "string" && body.apiUrl.trim() !== "" ? body.apiUrl.trim() : stored?.apiUrl ?? "",
					apiKey: typeof body?.apiKey === "string" && body.apiKey.trim() !== "" ? body.apiKey.trim() : stored?.apiKey ?? ""
				};
				try {
					writeJson(res, 200, {
						ok: true,
						models: await listImageModels(upstream)
					});
				} catch (error) {
					writeJson(res, 200, {
						ok: false,
						code: "image-models-failed",
						message: messageOf(error)
					});
				}
			}
		},
		{
			kind: "exact",
			path: PRESETS_API,
			handler: async (req, res) => {
				if (!guard(req, res, "POST")) return;
				writeJson(res, 200, {
					ok: true,
					presets: IMAGE_PRESETS.map((preset) => ({
						id: preset.id,
						name: preset.name,
						apiUrl: preset.apiUrl,
						hint: preset.hint,
						models: preset.models
					}))
				});
			}
		},
		{
			kind: "exact",
			path: USAGE_API,
			handler: async (req, res) => {
				if (!guard(req, res, "POST")) return;
				try {
					const entries = [...await history.list(), ...await gallery.list()];
					const byChannel = {};
					const totals = {};
					for (const entry of entries) {
						const channelKey = entry.channelId !== void 0 ? entry.channelId : entry.channel !== void 0 ? `name:${entry.channel}` : "";
						const alias = entry.model;
						const bucket = byChannel[channelKey] ?? (byChannel[channelKey] = {});
						bucket[alias] = (bucket[alias] ?? 0) + 1;
						totals[alias] = (totals[alias] ?? 0) + 1;
					}
					writeJson(res, 200, {
						ok: true,
						usage: {
							byChannel,
							totals
						}
					});
				} catch (error) {
					writeJson(res, 200, {
						ok: false,
						code: "usage-failed",
						message: messageOf(error)
					});
				}
			}
		},
		{
			kind: "exact",
			path: PROMPT_ENHANCE_API.models,
			handler: async (req, res) => {
				if (!guard(req, res, "POST")) return;
				try {
					writeJson(res, 200, {
						ok: true,
						models: await listPromptModels(resolvePrompt())
					});
				} catch (error) {
					writeJson(res, 200, {
						ok: false,
						code: "prompt-models-failed",
						message: messageOf(error)
					});
				}
			}
		},
		{
			kind: "exact",
			path: PROMPT_ENHANCE_API.enhance,
			handler: async (req, res) => {
				if (!guard(req, res, "POST")) return;
				const body = await readJsonBody(req);
				const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
				if (prompt === "") {
					writeJson(res, 200, {
						ok: false,
						code: "bad-request",
						message: "prompt is required"
					});
					return;
				}
				try {
					writeJson(res, 200, {
						ok: true,
						prompt: await enhancePrompt(resolvePrompt(), prompt)
					});
				} catch (error) {
					writeJson(res, 200, {
						ok: false,
						code: "prompt-enhance-failed",
						message: messageOf(error)
					});
				}
			}
		},
		{
			kind: "exact",
			path: SETTINGS_API.describe,
			handler: async (req, res) => {
				if (!guard(req, res, "POST")) return;
				const descriptor = deps.settings.describe({ redactSecrets: true }).find((candidate) => String(candidate.ns) === IMAGEGEN_SETTINGS_NAMESPACE);
				writeJson(res, 200, {
					ok: true,
					value: {
						namespaces: descriptor === void 0 ? [] : [toView(descriptor)],
						writable: deps.settings.writable !== false
					}
				});
			}
		},
		{
			kind: "exact",
			path: SETTINGS_API.mutate,
			handler: async (req, res) => {
				if (!guard(req, res, "POST")) return;
				const body = await readJsonBody(req);
				if (body === void 0) {
					writeJson(res, 200, {
						ok: false,
						code: "settings-rejected",
						message: "unreadable JSON body"
					});
					return;
				}
				const ns = typeof body.ns === "string" ? body.ns : "";
				if (ns !== "dsh-imagegen" || !Array.isArray(body.ops)) {
					writeJson(res, 200, {
						ok: false,
						code: "settings-rejected",
						message: "malformed bridge settings request"
					});
					return;
				}
				const expectedRevision = typeof body.expectedRevision === "number" ? body.expectedRevision : void 0;
				try {
					await deps.settings.mutate(ns, body.ops, expectedRevision);
				} catch (error) {
					writeJson(res, 200, failureOf(error));
					return;
				}
				const descriptor = deps.settings.describe({ redactSecrets: true }).find((candidate) => String(candidate.ns) === ns);
				if (descriptor === void 0) {
					writeJson(res, 200, {
						ok: false,
						code: "internal",
						message: `settings namespace "${ns}" was disposed after the mutate`
					});
					return;
				}
				writeJson(res, 200, {
					ok: true,
					value: toView(descriptor)
				});
			}
		},
		{
			kind: "exact",
			path: GENERATE_API,
			handler: async (req, res) => {
				if (!guard(req, res, "POST")) return;
				const body = await readJsonBody(req);
				const parsed = body === void 0 ? void 0 : parseGenerateRequest(body);
				if (parsed === void 0) {
					writeJson(res, 200, {
						ok: false,
						code: "bad-request",
						message: "prompt is required"
					});
					return;
				}
				const resolved = resolveChannelRequest(parsed);
				if (!resolved.ok) {
					writeJson(res, 200, {
						ok: false,
						code: resolved.code,
						message: resolved.message
					});
					return;
				}
				try {
					writeJson(res, 200, {
						ok: true,
						...await runtime.run(resolved.request)
					});
				} catch (error) {
					const message = error instanceof Error ? error.message : String(error);
					writeJson(res, 200, {
						ok: false,
						code: error instanceof Error && "code" in error && typeof error.code === "string" ? error.code : "generate-failed",
						message
					});
				}
			}
		},
		{
			kind: "exact",
			path: TASK_API.submit,
			handler: async (req, res) => {
				if (!guard(req, res, "POST")) return;
				const body = await readJsonBody(req);
				const parsed = body === void 0 ? void 0 : parseGenerateRequest(body);
				if (parsed === void 0) {
					writeJson(res, 200, {
						ok: false,
						code: "bad-request",
						message: "prompt is required"
					});
					return;
				}
				const resolved = resolveChannelRequest(parsed);
				if (!resolved.ok) {
					writeJson(res, 200, {
						ok: false,
						code: resolved.code,
						message: resolved.message
					});
					return;
				}
				writeJson(res, 200, {
					ok: true,
					task: runtime.queue.submit(resolved.request)
				});
			}
		},
		{
			kind: "exact",
			path: TASK_API.list,
			handler: async (req, res) => {
				if (!guard(req, res, "POST")) return;
				writeJson(res, 200, {
					ok: true,
					tasks: runtime.queue.list()
				});
			}
		},
		{
			kind: "exact",
			path: TASK_API.cancel,
			handler: async (req, res) => {
				if (!guard(req, res, "POST")) return;
				const body = await readJsonBody(req);
				const task = typeof body?.id === "string" ? runtime.queue.cancel(body.id) : void 0;
				if (task === void 0) {
					writeJson(res, 200, {
						ok: false,
						code: "not-found",
						message: "task not found"
					});
					return;
				}
				writeJson(res, 200, {
					ok: true,
					task
				});
			}
		},
		{
			kind: "exact",
			path: TASK_API.retry,
			handler: async (req, res) => {
				if (!guard(req, res, "POST")) return;
				const body = await readJsonBody(req);
				const task = typeof body?.id === "string" ? runtime.queue.retry(body.id) : void 0;
				if (task === void 0) {
					writeJson(res, 200, {
						ok: false,
						code: "not-found",
						message: "task not found"
					});
					return;
				}
				writeJson(res, 200, {
					ok: true,
					task
				});
			}
		},
		{
			kind: "exact",
			path: UPDATE_API.check,
			handler: async (req, res) => {
				if (!guard(req, res, "POST")) return;
				try {
					writeJson(res, 200, {
						ok: true,
						update: await checkForUpdate()
					});
				} catch (error) {
					writeJson(res, 200, {
						ok: false,
						code: "update-check-failed",
						message: messageOf(error)
					});
				}
			}
		},
		{
			kind: "exact",
			path: UPDATE_API.apply,
			handler: async (req, res) => {
				if (!guard(req, res, "POST")) return;
				const body = await readJsonBody(req);
				const version = body !== void 0 && typeof body.version === "string" ? body.version.trim() : "";
				if (version === "") {
					writeJson(res, 200, {
						ok: false,
						code: "bad-request",
						message: "update version is required"
					});
					return;
				}
				try {
					const latest = await checkForUpdate();
					if (!latest.updateAvailable || latest.latestVersion !== version) {
						writeJson(res, 200, {
							ok: false,
							code: "update-not-available",
							message: `version ${version} is not the latest available release`
						});
						return;
					}
					await installUpdate(version);
					writeJson(res, 200, {
						ok: true,
						currentVersion: CURRENT_VERSION,
						updatedVersion: version,
						restartRequired: true
					});
				} catch (error) {
					writeJson(res, 200, {
						ok: false,
						code: "update-failed",
						message: messageOf(error)
					});
				}
			}
		},
		{
			kind: "exact",
			path: HISTORY_API.list,
			handler: async (req, res) => {
				if (!guard(req, res, "POST")) return;
				try {
					writeJson(res, 200, {
						ok: true,
						entries: await history.list()
					});
				} catch (error) {
					writeJson(res, 200, {
						ok: false,
						code: "history-failed",
						message: messageOf(error)
					});
				}
			}
		},
		{
			kind: "exact",
			path: HISTORY_API.append,
			handler: async (req, res) => {
				if (!guard(req, res, "POST")) return;
				const body = await readJsonBody(req, MAX_HISTORY_BODY_BYTES);
				if (body === void 0) {
					writeJson(res, 200, {
						ok: false,
						code: "bad-request",
						message: "unreadable JSON body"
					});
					return;
				}
				const entry = parseHistoryEntryInput(body);
				if (entry === void 0) {
					writeJson(res, 200, {
						ok: false,
						code: "bad-request",
						message: "malformed history entry"
					});
					return;
				}
				try {
					writeJson(res, 200, {
						ok: true,
						entries: await history.append(entry)
					});
				} catch (error) {
					writeJson(res, 200, {
						ok: false,
						code: "history-failed",
						message: messageOf(error)
					});
				}
			}
		},
		{
			kind: "exact",
			path: HISTORY_API.remove,
			handler: async (req, res) => {
				if (!guard(req, res, "POST")) return;
				const body = await readJsonBody(req);
				const id = body !== void 0 && typeof body.id === "string" ? body.id : "";
				if (id === "") {
					writeJson(res, 200, {
						ok: false,
						code: "bad-request",
						message: "history id is required"
					});
					return;
				}
				try {
					writeJson(res, 200, {
						ok: true,
						entries: await history.remove(id)
					});
				} catch (error) {
					writeJson(res, 200, {
						ok: false,
						code: "history-failed",
						message: messageOf(error)
					});
				}
			}
		},
		{
			kind: "exact",
			path: HISTORY_API.clear,
			handler: async (req, res) => {
				if (!guard(req, res, "POST")) return;
				try {
					writeJson(res, 200, {
						ok: true,
						entries: await history.clear()
					});
				} catch (error) {
					writeJson(res, 200, {
						ok: false,
						code: "history-failed",
						message: messageOf(error)
					});
				}
			}
		},
		{
			kind: "prefix",
			path: HISTORY_API.image,
			handler: async (req, res) => {
				if (!isLoopbackRequest(req)) {
					writeJson(res, 403, { error: "forbidden: loopback-only" });
					return;
				}
				if (req.method !== "GET") {
					writeJson(res, 405, { error: `method not allowed: ${req.method}` });
					return;
				}
				const file = imageFileFrom(req.url, HISTORY_API.image);
				if (file === void 0) {
					writeJson(res, 404, { error: "not found" });
					return;
				}
				const found = await history.readImage(file);
				if (found === void 0) {
					writeJson(res, 404, { error: "not found" });
					return;
				}
				res.writeHead(200, {
					"content-type": found.mime,
					"content-length": found.data.length,
					"cache-control": "private, max-age=3600"
				});
				res.end(found.data);
			}
		},
		{
			kind: "exact",
			path: GALLERY_API.list,
			handler: async (req, res) => {
				if (!guard(req, res, "POST")) return;
				try {
					writeJson(res, 200, {
						ok: true,
						entries: await gallery.list()
					});
				} catch (error) {
					writeJson(res, 200, {
						ok: false,
						code: "gallery-failed",
						message: messageOf(error)
					});
				}
			}
		},
		{
			kind: "exact",
			path: GALLERY_API.append,
			handler: async (req, res) => {
				if (!guard(req, res, "POST")) return;
				const body = await readJsonBody(req, MAX_HISTORY_BODY_BYTES);
				if (body === void 0) {
					writeJson(res, 200, {
						ok: false,
						code: "bad-request",
						message: "unreadable JSON body"
					});
					return;
				}
				const entry = parseHistoryEntryInput(body);
				if (entry === void 0) {
					writeJson(res, 200, {
						ok: false,
						code: "bad-request",
						message: "malformed gallery entry"
					});
					return;
				}
				try {
					const result = await gallery.append({
						...entry,
						id: randomUUID()
					});
					writeJson(res, 200, {
						ok: true,
						entries: result.entries,
						added: result.added
					});
				} catch (error) {
					writeJson(res, 200, {
						ok: false,
						code: "gallery-failed",
						message: messageOf(error)
					});
				}
			}
		},
		{
			kind: "exact",
			path: GALLERY_API.remove,
			handler: async (req, res) => {
				if (!guard(req, res, "POST")) return;
				const body = await readJsonBody(req);
				const id = body !== void 0 && typeof body.id === "string" ? body.id : "";
				if (id === "") {
					writeJson(res, 200, {
						ok: false,
						code: "bad-request",
						message: "gallery id is required"
					});
					return;
				}
				try {
					writeJson(res, 200, {
						ok: true,
						entries: await gallery.remove(id)
					});
				} catch (error) {
					writeJson(res, 200, {
						ok: false,
						code: "gallery-failed",
						message: messageOf(error)
					});
				}
			}
		},
		{
			kind: "exact",
			path: GALLERY_API.tags,
			handler: async (req, res) => {
				if (!guard(req, res, "POST")) return;
				const body = await readJsonBody(req);
				const id = typeof body?.id === "string" ? body.id : "";
				const tags = Array.isArray(body?.tags) ? body.tags.filter((tag) => typeof tag === "string") : void 0;
				if (id === "" || tags === void 0 || gallery.updateTags === void 0) {
					writeJson(res, 200, {
						ok: false,
						code: "bad-request",
						message: "gallery id and tags are required"
					});
					return;
				}
				try {
					writeJson(res, 200, {
						ok: true,
						entries: await gallery.updateTags(id, tags)
					});
				} catch (error) {
					writeJson(res, 200, {
						ok: false,
						code: "gallery-failed",
						message: messageOf(error)
					});
				}
			}
		},
		{
			kind: "exact",
			path: GALLERY_API.clear,
			handler: async (req, res) => {
				if (!guard(req, res, "POST")) return;
				try {
					writeJson(res, 200, {
						ok: true,
						entries: await gallery.clear()
					});
				} catch (error) {
					writeJson(res, 200, {
						ok: false,
						code: "gallery-failed",
						message: messageOf(error)
					});
				}
			}
		},
		{
			kind: "prefix",
			path: GALLERY_API.image,
			handler: async (req, res) => {
				if (!isLoopbackRequest(req)) {
					writeJson(res, 403, { error: "forbidden: loopback-only" });
					return;
				}
				if (req.method !== "GET") {
					writeJson(res, 405, { error: `method not allowed: ${req.method}` });
					return;
				}
				const file = imageFileFrom(req.url, GALLERY_API.image);
				if (file === void 0) {
					writeJson(res, 404, { error: "not found" });
					return;
				}
				const found = await gallery.readImage(file);
				if (found === void 0) {
					writeJson(res, 404, { error: "not found" });
					return;
				}
				res.writeHead(200, {
					"content-type": found.mime,
					"content-length": found.data.length,
					"cache-control": "private, max-age=3600"
				});
				res.end(found.data);
			}
		},
		{
			kind: "exact",
			path: CANVAS_API.list,
			handler: async (req, res) => {
				if (!guard(req, res, "POST")) return;
				try {
					writeJson(res, 200, {
						ok: true,
						projects: await canvas.list()
					});
				} catch (error) {
					writeJson(res, 200, {
						ok: false,
						code: "canvas-failed",
						message: messageOf(error)
					});
				}
			}
		},
		{
			kind: "exact",
			path: CANVAS_API.create,
			handler: async (req, res) => {
				if (!guard(req, res, "POST")) return;
				const body = await readJsonBody(req);
				const title = typeof body?.title === "string" ? body.title : "未命名画布";
				try {
					writeJson(res, 200, {
						ok: true,
						document: await canvas.create(title)
					});
				} catch (error) {
					writeJson(res, 200, {
						ok: false,
						code: "canvas-failed",
						message: messageOf(error)
					});
				}
			}
		},
		{
			kind: "exact",
			path: CANVAS_API.read,
			handler: async (req, res) => {
				if (!guard(req, res, "POST")) return;
				const body = await readJsonBody(req);
				const id = typeof body?.id === "string" ? body.id : "";
				const document = id === "" ? void 0 : await canvas.read(id);
				if (document === void 0) writeJson(res, 200, {
					ok: false,
					code: "not-found",
					message: "画布不存在"
				});
				else writeJson(res, 200, {
					ok: true,
					document
				});
			}
		},
		{
			kind: "exact",
			path: CANVAS_API.save,
			handler: async (req, res) => {
				if (!guard(req, res, "POST")) return;
				const body = await readJsonBody(req);
				const document = body?.document;
				const expectedRevision = typeof body?.expectedRevision === "number" ? body.expectedRevision : void 0;
				if (document === void 0 || typeof document !== "object") {
					writeJson(res, 200, {
						ok: false,
						code: "bad-request",
						message: "canvas document is required"
					});
					return;
				}
				try {
					writeJson(res, 200, {
						ok: true,
						document: await canvas.save(document, expectedRevision)
					});
				} catch (error) {
					writeJson(res, 200, {
						ok: false,
						code: error instanceof CanvasConflictError ? error.code : "canvas-failed",
						message: messageOf(error)
					});
				}
			}
		},
		{
			kind: "exact",
			path: CANVAS_API.remove,
			handler: async (req, res) => {
				if (!guard(req, res, "POST")) return;
				const body = await readJsonBody(req);
				const id = typeof body?.id === "string" ? body.id : "";
				if (id === "") {
					writeJson(res, 200, {
						ok: false,
						code: "bad-request",
						message: "canvas id is required"
					});
					return;
				}
				try {
					writeJson(res, 200, {
						ok: true,
						projects: await canvas.remove(id)
					});
				} catch (error) {
					writeJson(res, 200, {
						ok: false,
						code: "canvas-failed",
						message: messageOf(error)
					});
				}
			}
		},
		{
			kind: "exact",
			path: CANVAS_API.assetUpload,
			handler: async (req, res) => {
				if (!guard(req, res, "POST")) return;
				const body = await readJsonBody(req, MAX_HISTORY_BODY_BYTES);
				const parsed = typeof body?.dataUrl === "string" ? imageDataUrl$1(body.dataUrl) : void 0;
				const width = Number(body?.width);
				const height = Number(body?.height);
				if (parsed === void 0 || !Number.isSafeInteger(width) || width < 1 || !Number.isSafeInteger(height) || height < 1) {
					writeJson(res, 200, {
						ok: false,
						code: "bad-request",
						message: "image data and dimensions are required"
					});
					return;
				}
				try {
					writeJson(res, 200, {
						ok: true,
						asset: await canvas.putImage({
							data: parsed.data,
							mime: parsed.mediaType,
							width,
							height,
							origin: body?.origin === "history" || body?.origin === "gallery" || body?.origin === "generated" ? body.origin : "upload",
							...typeof body?.originId === "string" ? { originId: body.originId } : {},
							...typeof body?.entryId === "string" ? { entryId: body.entryId } : {},
							...Number.isSafeInteger(Number(body?.imageIndex)) ? { imageIndex: Number(body?.imageIndex) } : {}
						})
					});
				} catch (error) {
					writeJson(res, 200, {
						ok: false,
						code: "canvas-asset-failed",
						message: messageOf(error)
					});
				}
			}
		},
		{
			kind: "exact",
			path: CANVAS_API.assetImport,
			handler: async (req, res) => {
				if (!guard(req, res, "POST")) return;
				const body = await readJsonBody(req);
				const source = body?.source === "history" || body?.source === "gallery" ? body.source : void 0;
				const entryId = typeof body?.entryId === "string" ? body.entryId : "";
				const imageIndex = Number(body?.imageIndex);
				const width = Number(body?.width);
				const height = Number(body?.height);
				if (source === void 0 || entryId === "" || !Number.isSafeInteger(imageIndex) || imageIndex < 0 || !Number.isSafeInteger(width) || width < 1 || !Number.isSafeInteger(height) || height < 1) {
					writeJson(res, 200, {
						ok: false,
						code: "bad-request",
						message: "source, entryId, imageIndex and dimensions are required"
					});
					return;
				}
				try {
					const backend = source === "history" ? history : gallery;
					const image = (await backend.list()).find((item) => item.id === entryId)?.images[imageIndex];
					if (image === void 0) {
						writeJson(res, 200, {
							ok: false,
							code: "not-found",
							message: "image not found"
						});
						return;
					}
					const base = source === "history" ? HISTORY_API.image : GALLERY_API.image;
					const file = imageFileFrom(image.url, base);
					const found = file === void 0 ? void 0 : await backend.readImage(file);
					if (found === void 0) {
						writeJson(res, 200, {
							ok: false,
							code: "not-found",
							message: "image not found"
						});
						return;
					}
					writeJson(res, 200, {
						ok: true,
						asset: await canvas.putImage({
							data: found.data,
							mime: found.mime,
							width,
							height,
							origin: source,
							originId: entryId,
							entryId,
							imageIndex
						})
					});
				} catch (error) {
					writeJson(res, 200, {
						ok: false,
						code: "canvas-asset-failed",
						message: messageOf(error)
					});
				}
			}
		},
		{
			kind: "prefix",
			path: CANVAS_API.asset,
			handler: async (req, res) => {
				if (!isLoopbackRequest(req)) {
					writeJson(res, 403, { error: "forbidden: loopback-only" });
					return;
				}
				if (req.method !== "GET") {
					writeJson(res, 405, { error: `method not allowed: ${req.method}` });
					return;
				}
				const file = imageFileFrom(req.url, CANVAS_API.asset);
				const found = file === void 0 ? void 0 : await canvas.readAsset(file);
				if (found === void 0) {
					writeJson(res, 404, { error: "not found" });
					return;
				}
				res.writeHead(200, {
					"content-type": found.mime,
					"content-length": found.data.length,
					"cache-control": "private, max-age=3600"
				});
				res.end(found.data);
			}
		},
		{
			kind: "exact",
			path: TEMPLATES_API.list,
			handler: async (req, res) => {
				if (!guard(req, res, "POST")) return;
				const body = await readJsonBody(req);
				const sourceId = templateSourceOf(body);
				if (sourceId === void 0) {
					writeJson(res, 200, {
						ok: false,
						code: "templates-source-unknown",
						message: `未知的模板库来源：${String(body?.source ?? "")}`
					});
					return;
				}
				try {
					writeJson(res, 200, {
						ok: true,
						...await templates.list(sourceId)
					});
				} catch (error) {
					writeJson(res, 200, {
						ok: false,
						code: "templates-failed",
						message: messageOf(error)
					});
				}
			}
		},
		{
			kind: "exact",
			path: TEMPLATES_API.refresh,
			handler: async (req, res) => {
				if (!guard(req, res, "POST")) return;
				const body = await readJsonBody(req);
				const sourceId = templateSourceOf(body);
				if (sourceId === void 0) {
					writeJson(res, 200, {
						ok: false,
						code: "templates-source-unknown",
						message: `未知的模板库来源：${String(body?.source ?? "")}`
					});
					return;
				}
				try {
					writeJson(res, 200, {
						ok: true,
						...await templates.refresh(sourceId)
					});
				} catch (error) {
					writeJson(res, 200, {
						ok: false,
						code: "templates-refresh-failed",
						message: messageOf(error)
					});
				}
			}
		},
		{
			kind: "exact",
			path: TEMPLATES_API.sample,
			handler: async (req, res) => {
				if (!guard(req, res, "POST")) return;
				const body = await readJsonBody(req);
				const requested = Number(body?.count);
				const count = Number.isFinite(requested) ? requested : 9;
				try {
					writeJson(res, 200, {
						ok: true,
						samples: await templates.sample(count)
					});
				} catch (error) {
					writeJson(res, 200, {
						ok: false,
						code: "templates-sample-failed",
						message: messageOf(error)
					});
				}
			}
		},
		{
			kind: "prefix",
			path: TEMPLATES_API.image,
			handler: async (req, res) => {
				if (!isLoopbackRequest(req)) {
					writeJson(res, 403, { error: "forbidden: loopback-only" });
					return;
				}
				if (req.method !== "GET") {
					writeJson(res, 405, { error: `method not allowed: ${req.method}` });
					return;
				}
				const raw = imageFileFrom(req.url, TEMPLATES_API.image);
				const slash = raw?.indexOf("/") ?? -1;
				const sourceId = slash > 0 ? raw.slice(0, slash) : "";
				const file = slash > 0 ? raw.slice(slash + 1) : "";
				if (sourceId === "" || !isTemplateSourceId(sourceId) || file === "") {
					writeJson(res, 404, { error: "not found" });
					return;
				}
				const found = await templates.readImage(sourceId, file);
				if (found === void 0) {
					writeJson(res, 404, { error: "not found" });
					return;
				}
				res.writeHead(200, {
					"content-type": found.mime,
					"content-length": found.data.length,
					"cache-control": "private, max-age=86400"
				});
				res.end(found.data);
			}
		},
		{
			kind: "exact",
			path: TEMPLATE_FAVORITES_API.list,
			handler: async (req, res) => {
				if (!guard(req, res, "POST")) return;
				try {
					writeJson(res, 200, {
						ok: true,
						favorites: await favorites.list()
					});
				} catch (error) {
					writeJson(res, 200, {
						ok: false,
						code: "template-favorites-failed",
						message: messageOf(error)
					});
				}
			}
		},
		{
			kind: "exact",
			path: TEMPLATE_FAVORITES_API.add,
			handler: async (req, res) => {
				if (!guard(req, res, "POST")) return;
				const body = await readJsonBody(req);
				const sourceId = templateSourceOf(body);
				const rawCase = body?.case;
				if (sourceId === void 0 || rawCase === null || typeof rawCase !== "object") {
					writeJson(res, 200, {
						ok: false,
						code: "template-favorite-invalid",
						message: "收藏请求缺少有效的来源或模板数据"
					});
					return;
				}
				const record = rawCase;
				const id = Number(record.id);
				const title = typeof record.title === "string" ? record.title.trim() : "";
				const prompt = typeof record.prompt === "string" ? record.prompt.trim() : "";
				if (!Number.isInteger(id) || title === "" || prompt === "") {
					writeJson(res, 200, {
						ok: false,
						code: "template-favorite-invalid",
						message: "收藏请求缺少有效的模板数据"
					});
					return;
				}
				try {
					writeJson(res, 200, {
						ok: true,
						favorites: await favorites.add(sourceId, rawCase)
					});
				} catch (error) {
					writeJson(res, 200, {
						ok: false,
						code: "template-favorites-failed",
						message: messageOf(error)
					});
				}
			}
		},
		{
			kind: "exact",
			path: TEMPLATE_FAVORITES_API.remove,
			handler: async (req, res) => {
				if (!guard(req, res, "POST")) return;
				const body = await readJsonBody(req);
				const key = typeof body?.key === "string" ? body.key : "";
				if (key === "") {
					writeJson(res, 200, {
						ok: false,
						code: "template-favorite-invalid",
						message: "取消收藏请求缺少模板标识"
					});
					return;
				}
				try {
					writeJson(res, 200, {
						ok: true,
						favorites: await favorites.remove(key)
					});
				} catch (error) {
					writeJson(res, 200, {
						ok: false,
						code: "template-favorites-failed",
						message: messageOf(error)
					});
				}
			}
		},
		{
			kind: "exact",
			path: DATA_FOLDER_API,
			handler: async (req, res) => {
				if (!guard(req, res, "POST")) return;
				const body = await readJsonBody(req);
				const dir = path.join(homedir(), ".dsh", "dsh-imagegen");
				try {
					await mkdir(dir, { recursive: true });
				} catch {}
				if (body?.open === false) {
					writeJson(res, 200, {
						ok: true,
						path: dir
					});
					return;
				}
				try {
					spawn(process.platform === "win32" ? "explorer.exe" : process.platform === "darwin" ? "open" : "xdg-open", [dir], {
						detached: true,
						stdio: "ignore"
					}).unref();
					writeJson(res, 200, {
						ok: true,
						path: dir
					});
				} catch (error) {
					writeJson(res, 200, {
						ok: false,
						code: "data-folder-failed",
						message: messageOf(error)
					});
				}
			}
		},
		{
			kind: "exact",
			path: STORAGE_API.test,
			handler: async (req, res) => {
				if (!guard(req, res, "POST")) return;
				const storage = deps.resolveStorage?.();
				if (storage === void 0) {
					writeJson(res, 200, {
						ok: false,
						code: "storage-unavailable",
						message: "存储配置不可用"
					});
					return;
				}
				try {
					const result = await testStorage(storage);
					writeJson(res, 200, {
						ok: true,
						ms: result.ms,
						key: result.key
					});
				} catch (error) {
					writeJson(res, 200, {
						ok: false,
						code: "storage-test-failed",
						message: messageOf(error)
					});
				}
			}
		}
	];
}
//#endregion
//#region src/agent-image-tools.ts
const imageRefSchema = {
	type: "object",
	additionalProperties: false,
	properties: {
		attachment_id: {
			type: "string",
			required: true
		},
		media_type: {
			type: "string",
			required: true
		},
		bytes: {
			type: "integer",
			required: true
		},
		width: {
			type: "integer",
			required: true
		},
		height: {
			type: "integer",
			required: true
		},
		name: { type: "string" }
	}
};
const taskResultSchema = {
	type: "object",
	additionalProperties: false,
	properties: {
		task_id: {
			type: "string",
			required: true
		},
		status: {
			type: "string",
			required: true
		},
		message: {
			type: "string",
			required: true
		},
		error: { type: "string" },
		images: {
			type: "array",
			required: true,
			items: imageRefSchema
		}
	}
};
/** Agent calls stay pending until the provider and history write settle. */
const AGENT_GENERATION_TIMEOUT_MS = 3e5;
function ensureAgentImageConfigured(config) {
	if (!config.enabled) throw new ImageGenError("AI image generation is disabled. Open Settings > Plugins > AI Image and enable it.", "plugin-disabled");
	if (!config.allowAgentImageGeneration) throw new ImageGenError("Agent image generation is disabled in Settings > Plugins > AI Image.", "agent-generation-disabled");
	if (!config.channels.some((channel) => channel.apiUrl.trim() !== "" && channel.apiKey.trim() !== "")) throw new ImageGenError("Image API credentials are not configured. Open Settings > Plugins > AI Image, add a channel and fill in its API URL and API key.", "image-api-not-configured");
}
/** Resolve a configured image alias and its owning channel. */
function resolveAgentImageModel(config, requested) {
	const entries = config.channels.flatMap((channel) => channel.models.map((model) => ({
		channel,
		alias: model.alias,
		upstream: model.id
	})));
	if (entries.length === 0) throw new ImageGenError("No image models are configured. Open Settings > Plugins > AI Image and add a channel with at least one model.", "no-models-configured");
	const wanted = typeof requested === "string" && requested.trim() !== "" ? requested.trim() : "";
	if (wanted === "") {
		if (entries.length === 1) return entries[0];
		throw new ImageGenError(`Multiple image models are available — ask the user which channel and model to use, then call this tool again with that exact model name. Options: ${config.channels.flatMap((channel) => channel.models.map((model) => `"${channel.name} · ${model.alias}"`)).join(", ")}.`, "model-choice-required");
	}
	const hosting = entries.filter((entry) => entry.alias === wanted);
	if (hosting.length === 0) throw new ImageGenError(`Image model "${wanted}" is not configured in any channel. Choose one of: ${[...new Set(entries.map((entry) => entry.alias))].join(", ")}.`, "image-model-not-configured");
	return hosting.find((entry) => entry.channel.id === config.defaultChannelId) ?? hosting[0];
}
function findAgentImageTask(runtime, id) {
	const task = runtime.queue.list().find((candidate) => candidate.id === id);
	if (task === void 0) throw new ImageGenError(`Image generation task ${id} was not found.`, "task-not-found");
	return task;
}
/** Wait for a queue task without sending anything through the chat model. */
function waitForAgentImageTask(runtime, id, signal) {
	return new Promise((resolveTask, rejectTask) => {
		let settled = false;
		let dispose = () => {};
		let timer;
		let abort = () => {};
		const cleanup = () => {
			dispose();
			if (timer !== void 0) clearTimeout(timer);
			signal?.removeEventListener("abort", abort);
		};
		const resolve = (task) => {
			if (settled) return;
			settled = true;
			cleanup();
			resolveTask(task);
		};
		const reject = (error) => {
			if (settled) return;
			settled = true;
			cleanup();
			rejectTask(error);
		};
		abort = () => {
			if (settled) return;
			const reason = signal?.reason instanceof Error ? signal.reason : /* @__PURE__ */ new Error("Image generation was cancelled.");
			settled = true;
			cleanup();
			runtime.queue.cancel(id);
			rejectTask(reason);
		};
		const onChange = (updated) => {
			if (updated.id === id && isFinalTask(updated)) resolve(updated);
		};
		if (signal?.aborted === true) {
			abort();
			return;
		}
		dispose = runtime.queue.subscribe(onChange);
		signal?.addEventListener("abort", abort, { once: true });
		timer = setTimeout(() => {
			if (settled) return;
			const timeout = new ImageGenError(`Image generation task ${id} timed out after ${AGENT_GENERATION_TIMEOUT_MS / 1e3} seconds.`, "generation-timeout");
			settled = true;
			cleanup();
			runtime.queue.cancel(id);
			rejectTask(timeout);
		}, AGENT_GENERATION_TIMEOUT_MS);
		let current;
		try {
			current = findAgentImageTask(runtime, id);
		} catch (error) {
			reject(error);
			return;
		}
		if (isFinalTask(current)) resolve(current);
	});
}
/** Submit the same image-edit request used by the Agent tool. */
async function submitAgentImageEdit(attachments, runtime, resolve, input) {
	const config = resolve();
	ensureAgentImageConfigured(config);
	const reference = await attachments.readImage(input.sourceImage, input.signal);
	const picked = resolveAgentImageModel(config, (config.channels.find((channel) => channel.id === config.defaultChannelId) ?? config.channels[0])?.models[0]?.alias ?? config.channels.flatMap((channel) => channel.models)[0]?.alias);
	return waitForAgentImageTask(runtime, runtime.queue.submit({
		mode: "edit",
		model: picked.alias,
		upstream: picked.upstream,
		channelId: picked.channel.id,
		channel: picked.channel.name,
		prompt: input.prompt.trim(),
		size: "auto",
		quality: "auto",
		n: 1,
		detail: "",
		image: imageDataUrl(reference),
		...reference.ref.name === void 0 ? {} : { refName: reference.ref.name }
	}).id, input.signal);
}
function acceptedMediaType(value) {
	return value === "image/png" || value === "image/jpeg" || value === "image/webp" || value === "image/gif";
}
function projectRef(ref) {
	return {
		attachment_id: String(ref.attachmentId),
		media_type: ref.mediaType,
		bytes: ref.bytes,
		width: ref.width,
		height: ref.height,
		...ref.name === void 0 ? {} : { name: ref.name }
	};
}
function restoreRef(value) {
	if (!acceptedMediaType(value.media_type)) throw new ImageGenError("source_image.media_type is not a supported image type", "bad-reference-image");
	if (!Number.isInteger(value.bytes) || value.bytes < 1 || !Number.isInteger(value.width) || value.width < 1 || !Number.isInteger(value.height) || value.height < 1) throw new ImageGenError("source_image metadata is invalid", "bad-reference-image");
	return {
		attachmentId: value.attachment_id,
		mediaType: value.media_type,
		bytes: value.bytes,
		width: value.width,
		height: value.height,
		...value.name === void 0 ? {} : { name: value.name }
	};
}
function imageDataUrl(image) {
	return `data:${image.ref.mediaType};base64,${Buffer.from(image.data).toString("base64")}`;
}
function renderTaskResult(value) {
	return [{
		type: "text",
		text: JSON.stringify(value)
	}];
}
/** The UI-only projection that keeps generated images beside the tool call. */
function imagePresentationMeta(value) {
	return { images: value.images.map((image) => {
		const ref = {
			attachment_id: image.attachment_id,
			media_type: image.media_type,
			bytes: image.bytes,
			width: image.width,
			height: image.height
		};
		if (image.name !== void 0) ref.name = image.name;
		return ref;
	}) };
}
function imageBlocksFromMeta(meta) {
	if (typeof meta !== "object" || meta === null || Array.isArray(meta)) return [];
	const images = meta.images;
	if (!Array.isArray(images)) return [];
	return images.flatMap((value) => {
		if (typeof value !== "object" || value === null || Array.isArray(value)) return [];
		const raw = value;
		if (typeof raw.attachment_id !== "string" || typeof raw.media_type !== "string" || typeof raw.bytes !== "number" || typeof raw.width !== "number" || typeof raw.height !== "number") return [];
		try {
			return [{
				type: "image",
				attachment: restoreRef({
					attachment_id: raw.attachment_id,
					media_type: raw.media_type,
					bytes: raw.bytes,
					width: raw.width,
					height: raw.height,
					...typeof raw.name === "string" ? { name: raw.name } : {}
				})
			}];
		} catch {
			return [];
		}
	});
}
/** Rehydrate image attachments for the host-computed tool result view only. */
function presentImageResult(_args, result) {
	const content = result.isError ? [] : imageBlocksFromMeta(result.meta);
	return content.length === 0 ? void 0 : {
		card: "generic",
		content
	};
}
/** Register the global Agent tools and unregister them with the plugin lifecycle. */
function registerAgentImageTools(ctx, runtime, resolve) {
	const attachmentRefs = /* @__PURE__ */ new Map();
	const ensureConfigured = () => {
		ensureAgentImageConfigured(resolve());
	};
	const resolveModel = (requested) => resolveAgentImageModel(resolve(), requested);
	const materializeTaskImages = (task) => {
		if (task.status !== "completed") return Promise.resolve([]);
		const existing = attachmentRefs.get(task.id);
		if (existing !== void 0) return existing;
		const pending = ctx.attachments.saveImages((task.result?.images ?? []).map((image, index) => toSaveImage(image, task.id, index))).then((refs) => refs.map(projectRef));
		attachmentRefs.set(task.id, pending);
		pending.catch(() => {
			if (attachmentRefs.get(task.id) === pending) attachmentRefs.delete(task.id);
		});
		return pending;
	};
	const taskResult = async (task) => {
		const images = await materializeTaskImages(task);
		return {
			task_id: task.id,
			status: task.status,
			message: task.status === "completed" ? "Generation completed. The images are shown beside this tool call and can be reused as source_image in edit_image." : task.status === "failed" ? "Generation failed." : task.status === "cancelled" ? "Generation was cancelled." : "Generation is still running. Query the task again when you need its current status.",
			...task.error === void 0 ? {} : { error: task.error },
			images
		};
	};
	const findTask = (id) => findAgentImageTask(runtime, id);
	const waitForTask = (id, signal) => waitForAgentImageTask(runtime, id, signal);
	const disposers = [
		ctx.tools.register(defineTool({
			name: "generate_image",
			description: "Generate an image. By default this tool call stays pending until the task reaches a final state; completed images are shown beside this tool call, while the model receives their attachment references, without creating a user message. Set wait_for_completion to false for background mode, then use get_image_generation_task explicitly. Only use models configured for this plugin; omit model to use the first configured image model.",
			parameters: {
				prompt: {
					type: "string",
					required: true,
					description: "Detailed image-generation prompt."
				},
				model: {
					type: "string",
					description: "One of the configured image models. Defaults to the first configured model."
				},
				size: {
					type: "string",
					description: "Aspect ratio such as 1:1, 16:9, 9:16, or auto."
				},
				quality: {
					type: "string",
					description: "auto, 1k, 2k, or 4k."
				},
				count: {
					type: "integer",
					description: "Number of images, 1 to 4. Defaults to 1."
				},
				detail: {
					type: "string",
					description: "Optional provider detail value, for example standard or high."
				},
				wait_for_completion: {
					type: "boolean",
					description: "Wait for images and return them in this tool result. Defaults to true; set false for background mode."
				}
			},
			output: {
				schema: taskResultSchema,
				render: (_args, value) => renderTaskResult(value),
				presentationMeta: (_args, value) => imagePresentationMeta(value)
			},
			presentResult: presentImageResult,
			async execute(args, exec) {
				ensureConfigured();
				const picked = resolveModel(args.model);
				const task = runtime.queue.submit({
					mode: "text",
					model: picked.alias,
					upstream: picked.upstream,
					channelId: picked.channel.id,
					channel: picked.channel.name,
					prompt: args.prompt.trim(),
					size: args.size ?? "auto",
					quality: args.quality ?? "auto",
					n: Math.min(4, Math.max(1, args.count ?? 1)),
					detail: args.detail ?? ""
				});
				return taskResult(args.wait_for_completion === false ? task : await waitForTask(task.id, exec.signal));
			}
		})),
		ctx.tools.register(defineTool({
			name: "edit_image",
			description: "Edit an image. By default this tool call stays pending until the task reaches a final state; completed images are shown beside this tool call, while the model receives their attachment references, without creating a user message. Set wait_for_completion to false for background mode, then use get_image_generation_task explicitly. source_image must be an image reference returned by a completed generation or get_image_generation_task; pass that entire object unchanged. Only configured image models are allowed; omit model to use the first configured model.",
			parameters: {
				prompt: {
					type: "string",
					required: true,
					description: "How to transform the source image."
				},
				source_image: {
					...imageRefSchema,
					required: true,
					description: "Image reference returned by get_image_generation_task."
				},
				model: {
					type: "string",
					description: "One of the configured image models. Defaults to the first configured model."
				},
				size: {
					type: "string",
					description: "Aspect ratio such as 1:1, 16:9, 9:16, or auto."
				},
				quality: {
					type: "string",
					description: "auto, 1k, 2k, or 4k."
				},
				count: {
					type: "integer",
					description: "Number of images, 1 to 4. Defaults to 1."
				},
				detail: {
					type: "string",
					description: "Optional provider detail value."
				},
				wait_for_completion: {
					type: "boolean",
					description: "Wait for images and return them in this tool result. Defaults to true; set false for background mode."
				}
			},
			output: {
				schema: taskResultSchema,
				render: (_args, value) => renderTaskResult(value),
				presentationMeta: (_args, value) => imagePresentationMeta(value)
			},
			presentResult: presentImageResult,
			async execute(args, exec) {
				ensureConfigured();
				const reference = await ctx.attachments.readImage(restoreRef(args.source_image), exec.signal);
				const picked = resolveModel(args.model);
				const task = runtime.queue.submit({
					mode: "edit",
					model: picked.alias,
					upstream: picked.upstream,
					channelId: picked.channel.id,
					channel: picked.channel.name,
					prompt: args.prompt.trim(),
					size: args.size ?? "auto",
					quality: args.quality ?? "auto",
					n: Math.min(4, Math.max(1, args.count ?? 1)),
					detail: args.detail ?? "",
					image: imageDataUrl(reference),
					...reference.ref.name === void 0 ? {} : { refName: reference.ref.name }
				});
				return taskResult(args.wait_for_completion === false ? task : await waitForTask(task.id, exec.signal));
			}
		})),
		ctx.tools.register(defineTool({
			name: "get_image_generation_task",
			description: "Check an image-generation task status. Completed tasks return image references; their images are shown beside this tool call and the references can be passed to edit_image. Generation tools normally wait for completion, so use this for explicit recovery or status checks.",
			parameters: { task_id: {
				type: "string",
				required: true,
				description: "Task id returned by generate_image or edit_image."
			} },
			output: {
				schema: taskResultSchema,
				render: (_args, value) => renderTaskResult(value),
				presentationMeta: (_args, value) => imagePresentationMeta(value)
			},
			presentResult: presentImageResult,
			async execute(args) {
				ensureConfigured();
				return taskResult(findTask(args.task_id));
			}
		})),
		ctx.tools.register(defineTool({
			name: "cancel_image_generation_task",
			description: "Cancel a queued or running image generation task.",
			parameters: { task_id: {
				type: "string",
				required: true,
				description: "Task id returned by generate_image or edit_image."
			} },
			output: {
				schema: taskResultSchema,
				render: (_args, value) => renderTaskResult(value),
				presentationMeta: (_args, value) => imagePresentationMeta(value)
			},
			presentResult: presentImageResult,
			async execute(args) {
				ensureConfigured();
				const task = runtime.queue.cancel(args.task_id);
				if (task === void 0) throw new ImageGenError(`Image generation task ${args.task_id} was not found.`, "task-not-found");
				return taskResult(task);
			}
		}))
	];
	return () => {
		for (const dispose of disposers) dispose();
	};
}
function isFinalTask(task) {
	return task.status === "completed" || task.status === "failed" || task.status === "cancelled";
}
function toSaveImage(image, taskId, index) {
	const data = Buffer.from(image.b64, "base64");
	const declaredMediaType = acceptedMediaType(image.mime) ? image.mime : "image/png";
	const mediaType = detectImageMime(data) ?? declaredMediaType;
	return {
		data,
		mediaType,
		name: `imagegen-${taskId}-${index + 1}.${mediaType === "image/jpeg" ? "jpg" : mediaType.slice(6)}`
	};
}
//#endregion
//#region src/edit-image-command.ts
function isImageReference(value) {
	if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
	const ref = value;
	return typeof ref.attachmentId === "string" && (ref.mediaType === "image/png" || ref.mediaType === "image/jpeg" || ref.mediaType === "image/webp" || ref.mediaType === "image/gif") && Number.isInteger(ref.bytes) && ref.bytes > 0 && Number.isInteger(ref.width) && ref.width > 0 && Number.isInteger(ref.height) && ref.height > 0;
}
function imageInContent(value) {
	if (!Array.isArray(value)) return void 0;
	for (let index = value.length - 1; index >= 0; index -= 1) {
		const block = value[index];
		if (typeof block !== "object" || block === null || Array.isArray(block)) continue;
		const raw = block;
		if (raw.type === "image" && isImageReference(raw.attachment)) return raw.attachment;
		if (raw.type === "tool-result") {
			const nested = imageInContent(raw.content);
			if (nested !== void 0) return nested;
		}
	}
}
/** Pick the newest image explicitly attached to this command invocation. */
function imageInInvocation(value) {
	if (!Array.isArray(value)) return void 0;
	for (let index = value.length - 1; index >= 0; index -= 1) {
		const block = value[index];
		if (typeof block !== "object" || block === null || Array.isArray(block)) continue;
		const raw = block;
		if (raw.type === "image" && isImageReference(raw.attachment)) return raw.attachment;
	}
}
/** Find the newest durable image reference, including nested tool results. */
function latestSessionImage(messages) {
	for (let index = messages.length - 1; index >= 0; index -= 1) {
		const message = messages[index];
		if (typeof message !== "object" || message === null || Array.isArray(message)) continue;
		const image = imageInContent(message.content);
		if (image !== void 0) return image;
	}
}
function commandError(error) {
	const text = error instanceof Error ? error.message : String(error);
	return {
		kind: "error",
		text: text.trim() === "" ? "图片编辑失败。" : text
	};
}
/** Register the host-side command; it never sends the command line to a chat model. */
function registerEditImageCommand(ctx, runtime, resolve, pendingImages) {
	return ctx.commands.register({
		name: "edit_image",
		description: "Edit the latest image in this conversation with the plugin image model",
		input: {
			hint: "Describe how to modify the latest image",
			images: true
		},
		async handler(invocation) {
			const prompt = invocation.rawInput.trim();
			if (prompt === "") return {
				kind: "error",
				text: "请提供图片修改描述，例如：/edit_image 把背景改成夜景"
			};
			const invocationImage = imageInInvocation(invocation.attachments);
			const pendingImage = pendingImages?.get(String(invocation.agent.id));
			const durableImage = latestSessionImage(invocation.agent.session.deriveMessages());
			const sourceImage = invocationImage ?? pendingImage ?? durableImage;
			if (sourceImage === void 0) return {
				kind: "error",
				text: "当前对话没有可用图片，请先上传图片或把画廊图片加入对话。"
			};
			try {
				const task = await submitAgentImageEdit(ctx.attachments, runtime, resolve, {
					prompt,
					sourceImage,
					signal: invocation.signal
				});
				if (task.status === "completed") {
					if (pendingImage !== void 0) pendingImages?.consume(String(invocation.agent.id), pendingImage);
					return {
						kind: "success",
						text: "图片编辑已完成，可在 AI 生图面板查看结果。"
					};
				}
				return {
					kind: "error",
					text: task.error ?? `图片编辑${task.status === "cancelled" ? "已取消" : "失败"}。`
				};
			} catch (error) {
				return commandError(error);
			}
		}
	});
}
//#endregion
//#region src/index.ts
/** Content type for a saved image file name (object uploads). */
function mimeOfPath(filePath) {
	switch (path.extname(filePath).toLowerCase()) {
		case ".jpg":
		case ".jpeg": return "image/jpeg";
		case ".webp": return "image/webp";
		case ".gif": return "image/gif";
		default: return "image/png";
	}
}
/** Stable cordis plugin name. */
const name = "imagegen";
/** Services required before the surfaces can mount. */
const inject = [
	"webServer",
	"systemPrompt",
	"commands"
];
/** The branded settings namespace of this plugin (the card edits it). */
const ImageGenSettingsNamespace = settingsNamespaceCompat(IMAGEGEN_SETTINGS_NAMESPACE);
const Config = z.object({
	enabled: z.boolean().default(true),
	announceToAgent: z.boolean().default(true),
	allowAgentImageGeneration: z.boolean().default(true),
	channels: z.array(z.object({
		id: z.string(),
		preset: z.string().default(""),
		name: z.string().default(""),
		apiUrl: z.string().default(""),
		models: z.array(z.object({
			alias: z.string(),
			id: z.string()
		})).default([])
	})).default([]),
	channelSecrets: z.dict(z.string().role("secret")).default({}),
	defaultChannelId: z.string().default(""),
	promptApiUrl: z.string().default(""),
	promptApiKey: z.string().role("secret").default(""),
	promptModel: z.string().default(""),
	storageEnabled: z.boolean().default(false),
	storageEndpoint: z.string().default(""),
	storageRegion: z.string().default(""),
	storagePrefix: z.string().default("dsh-imagegen"),
	storageAccessKey: z.string().default(""),
	storageSecretKey: z.string().role("secret").default(""),
	storageSyncGallery: z.boolean().default(true),
	storageSyncHistory: z.boolean().default(false),
	apiUrl: z.string().default(""),
	apiKey: z.string().role("secret").default(""),
	imageModels: z.array(z.string()).default([])
});
/** Schema defaults, re-read for hand-built contexts (the loader applies them normally). */
const DEFAULT_ENABLED = true;
const DEFAULT_ANNOUNCE = true;
const DEFAULT_ALLOW_AGENT_IMAGE_GENERATION = true;
/** Order of the announcement section within the tool-guidance band. */
const SECTION_ORDER = 150;
/** Model-facing announcement: plugin presence, capabilities, and limits. */
const IMAGEGEN_GUIDANCE = "本机已安装 dsh-imagegen 插件（DSH AI 生图）：侧边栏「AI 生图」入口。能力：通过「渠道」对接 OpenAI 兼容图像生成 API（每个渠道 = 一个 API 端点 + 各自的模型目录），支持文生图（/images/generations）与图生图（/images/edits，上传参考图，grok-imagine 模型按官方 JSON image_url 协议发送，nanobanana 系列按 aspect_ratio / image_size 参数协议发送；seedream 系列统一走 /images/generations，参考图以 JSON image 数组发送；智谱 `glm-image` 使用官方 `/api/paas/v4/images/generations`，当前仅支持文生图；qwen-image 系列使用阿里云 DashScope 原生接口（api_url 填 https://dashscope.aliyuncs.com/api/v1，不支持 OpenAI 兼容模式，该渠道不可复用于提示词增强，尺寸自动映射为宽*高）。API 地址与密钥在 GUI 设置中按渠道配置，密钥仅存于本机设置文档；生成请求由本地宿主代理转发，结果以 base64 返回面板，可预览与下载。模型只能使用用户在各渠道配置目录中的模型；检测模型时会过滤聊天、Embedding 等非图片模型，但模型出现在 /models 中仍不等于其网关原生支持生图协议，遇到 Qwen、Gemini 等非 OpenAI 生图协议时应如实说明上游兼容性。可一键把满意的图片加入「画廊」。内置「提示词模板库」（面板提示词框左下角「模板库」按钮）：多来源标签页（精选案例库 / 沧河案例库，后续可扩展），打包 awesome-gpt-image-2 的数百条提示词案例，可搜索、筛选、收藏（星标，宿主持久化）与复用；各来源列表独立刷新，宿主每 12 小时后台自动同步一次。Agent 可直接调用 `generate_image` 提交文生图，也可用 `edit_image` 图生图；默认保持工具调用等待直到任务完成，完成图片显示在工具调用对应的左侧结果区域，模型收到状态和附件引用，不会额外伪造用户消息。用户也可以使用 `/edit_image <修改描述>`，命令会直接读取当前对话最近图片并调用插件图片模型，不经过对话模型的图片能力检查。若明确需要后台执行，可传 `wait_for_completion: false`，之后再用 `get_image_generation_task` 查询；不要反复轮询。限制：生成消耗上游 API 额度；图片内容由上游模型生成，可能不符合预期或包含不适宜内容；api_key 以明文存储在设置文档中；参考图会发送至所配置的 API 服务；模板库在线刷新与参考图首次加载需要访问对应来源站点（vibeui.top / gpt-image2.canghe.ai）。用户提到「生图 / 绘画 / 生成图片 / 文生图 / 图生图 / 画廊 / 提示词模板」时即指本插件，请据此协作。";
/** Append the live channel × model table so an Agent can honor user choices. */
function guidanceFor(channels, defaultChannelId) {
	if (channels.length === 0) return `${IMAGEGEN_GUIDANCE} 尚未配置任何渠道：请先在「设置 → 插件 → AI 生图」添加渠道并填写 API 地址与密钥。`;
	const table = channels.map((channel) => {
		const aliases = channel.models.map((model) => model.alias).join("、");
		const mark = channel.id === defaultChannelId ? "（默认渠道）" : "";
		const key = channel.apiKey === "" ? "（未填密钥）" : "";
		const models = channel.models.length === 0 ? "未配置模型" : `可用模型：${aliases}`;
		return `渠道「${channel.name}」${mark}[${channel.apiUrl}] ${models}${key}`;
	}).join("；");
	return `${IMAGEGEN_GUIDANCE} 当前渠道与模型：${table}。用户指定模型名时取该模型所属渠道（多渠道同名用默认渠道）；未指定模型时若仅一个可用模型可直接生成，若有多个应先询问用户选择「渠道 + 模型」。`;
}
/** Normalize raw channel entries into the wire shape (schema-adjacent guard). */
function normalizeChannels(value) {
	if (!Array.isArray(value)) return [];
	const out = [];
	for (const item of value) {
		if (item === null || typeof item !== "object") continue;
		const raw = item;
		const id = typeof raw.id === "string" ? raw.id.trim() : "";
		if (id === "") continue;
		const models = [];
		if (Array.isArray(raw.models)) for (const entry of raw.models) {
			if (entry === null || typeof entry !== "object") continue;
			const record = entry;
			const alias = typeof record.alias === "string" ? record.alias.trim() : "";
			const upstream = typeof record.id === "string" ? record.id.trim() : "";
			if (alias === "") continue;
			models.push({
				alias,
				id: upstream === "" ? alias : upstream
			});
		}
		out.push({
			id,
			preset: typeof raw.preset === "string" ? raw.preset : "",
			name: typeof raw.name === "string" ? raw.name.trim() : "",
			apiUrl: typeof raw.apiUrl === "string" ? raw.apiUrl.trim() : "",
			models
		});
	}
	return out;
}
/**
* Mount the settings section, routes, and announcement.
* @param ctx - host plugin context carrying webServer/systemPrompt.
* @param config - resolved plugin config (schema defaults applied by the loader).
*/
function apply(ctx, config) {
	let current = () => config ?? {};
	const resolve = () => {
		const value = current() ?? {};
		let channels = normalizeChannels(value.channels);
		const secrets = { ...value.channelSecrets ?? {} };
		if (channels.length === 0) {
			const legacyUrl = typeof value.apiUrl === "string" ? value.apiUrl.trim() : "";
			const legacyModels = Array.isArray(value.imageModels) ? value.imageModels.filter((model) => typeof model === "string" && model.trim() !== "").map((model) => ({
				alias: model.trim(),
				id: model.trim()
			})) : [];
			if (legacyUrl !== "" || legacyModels.length > 0) {
				channels = [{
					id: "default",
					preset: "",
					name: "默认渠道",
					apiUrl: legacyUrl,
					models: legacyModels
				}];
				const legacyKey = typeof value.apiKey === "string" ? value.apiKey.trim() : "";
				if (legacyKey !== "") secrets["default"] = legacyKey;
			}
		}
		const named = channels.map((channel) => ({
			...channel,
			name: channel.name === "" ? presetById(channel.preset)?.name ?? "未命名渠道" : channel.name
		}));
		const defaultChannelId = typeof value.defaultChannelId === "string" && named.some((channel) => channel.id === value.defaultChannelId) ? value.defaultChannelId : named[0]?.id ?? "";
		return {
			enabled: value.enabled ?? DEFAULT_ENABLED,
			announceToAgent: value.announceToAgent ?? DEFAULT_ANNOUNCE,
			allowAgentImageGeneration: value.allowAgentImageGeneration ?? DEFAULT_ALLOW_AGENT_IMAGE_GENERATION,
			channels: named.map((channel) => ({
				...channel,
				apiKey: typeof secrets[channel.id] === "string" ? secrets[channel.id] : ""
			})),
			defaultChannelId,
			promptApiUrl: typeof value.promptApiUrl === "string" ? value.promptApiUrl.trim() : "",
			promptApiKey: typeof value.promptApiKey === "string" ? value.promptApiKey.trim() : "",
			promptModel: typeof value.promptModel === "string" ? value.promptModel.trim() : "",
			storage: {
				enabled: value.storageEnabled ?? false,
				endpoint: typeof value.storageEndpoint === "string" ? value.storageEndpoint.trim() : "",
				region: typeof value.storageRegion === "string" ? value.storageRegion.trim() : "",
				accessKey: typeof value.storageAccessKey === "string" ? value.storageAccessKey.trim() : "",
				secretKey: typeof value.storageSecretKey === "string" ? value.storageSecretKey.trim() : "",
				prefix: typeof value.storagePrefix === "string" && value.storagePrefix.trim() !== "" ? value.storagePrefix.trim() : "dsh-imagegen",
				syncGallery: value.storageSyncGallery ?? true,
				syncHistory: value.storageSyncHistory ?? false
			}
		};
	};
	const channelsView = () => {
		const value = resolve();
		return {
			channels: value.channels,
			defaultChannelId: value.defaultChannelId
		};
	};
	setStorageSyncHandler((kind, filePath) => {
		const storage = resolve().storage;
		if (!storage.enabled || !storage.endpoint.trim() || storage.secretKey.trim() === "") return;
		if (kind === "gallery" && !storage.syncGallery) return;
		if (kind === "history" && !storage.syncHistory) return;
		putObject(storage, `${storage.prefix}/${kind === "gallery" ? "gallery" : "images"}/${path.basename(filePath)}`, readFileSync(filePath), mimeOfPath(filePath)).catch(() => {});
	});
	const runtime = new ImageGenerationRuntime(channelsView);
	const pendingConversationImages = /* @__PURE__ */ new Map();
	ctx.inject(["settings", "attachments"], (sctx) => {
		const seam = sctx.get("settings");
		sctx.effect(() => {
			const disposers = makeRoutes({
				settings: seam,
				resolve: () => {
					const value = resolve();
					const channel = value.channels.find((candidate) => candidate.id === value.defaultChannelId) ?? value.channels[0];
					return {
						apiUrl: channel?.apiUrl ?? "",
						apiKey: channel?.apiKey ?? ""
					};
				},
				resolveChannels: channelsView,
				resolvePrompt: () => {
					const value = resolve();
					const channel = value.channels.find((candidate) => candidate.id === value.defaultChannelId) ?? value.channels[0];
					return {
						apiUrl: value.promptApiUrl !== "" ? value.promptApiUrl : channel?.apiUrl ?? "",
						apiKey: value.promptApiKey !== "" ? value.promptApiKey : channel?.apiKey ?? "",
						model: value.promptModel
					};
				},
				resolveImageModels: () => {
					const value = resolve();
					return [...new Set(value.channels.flatMap((channel) => channel.models.map((model) => model.alias)))];
				},
				attachments: sctx.attachments,
				pendingConversationImages,
				runtime,
				resolveStorage: () => resolve().storage
			}).map((route) => ctx.webServer.register(route));
			const TEMPLATE_SYNC_INITIAL_DELAY_MS = 3e4;
			const TEMPLATE_SYNC_INTERVAL_MS = 720 * 60 * 1e3;
			let syncTimer;
			const runSync = () => {
				if (!resolve().enabled) return;
				syncAllTemplates().catch(() => {});
			};
			const startTimer = setTimeout(runSync, TEMPLATE_SYNC_INITIAL_DELAY_MS);
			syncTimer = setInterval(runSync, TEMPLATE_SYNC_INTERVAL_MS);
			syncTimer.unref?.();
			return () => {
				clearTimeout(startTimer);
				clearInterval(syncTimer);
				for (const dispose of disposers) dispose();
			};
		}, "dsh-imagegen: routes");
	});
	ctx.inject([
		"tools",
		"attachments",
		"commands"
	], (tctx) => {
		tctx.effect(() => {
			const resolveAgentConfig = () => {
				const value = resolve();
				return {
					enabled: value.enabled,
					allowAgentImageGeneration: value.allowAgentImageGeneration,
					channels: value.channels,
					defaultChannelId: value.defaultChannelId
				};
			};
			const disposeTools = registerAgentImageTools(tctx, runtime, resolveAgentConfig);
			const disposeCommand = registerEditImageCommand(tctx, runtime, resolveAgentConfig, {
				get: (sessionId) => pendingConversationImages.get(sessionId),
				consume: (sessionId, ref) => {
					if (pendingConversationImages.get(sessionId)?.attachmentId === ref.attachmentId) pendingConversationImages.delete(sessionId);
				}
			});
			return () => {
				disposeCommand();
				disposeTools();
			};
		}, "dsh-imagegen: agent image tools and commands");
	});
	let disposeSection;
	const sync = () => {
		if (disposeSection !== void 0) {
			disposeSection();
			disposeSection = void 0;
		}
		const value = resolve();
		if (!value.enabled || !value.announceToAgent) return;
		disposeSection = ctx.systemPrompt.section({
			name: "plugin:dsh-imagegen",
			order: SECTION_ORDER,
			text: guidanceFor(value.channels, value.defaultChannelId)
		});
	};
	installSettingsSectionCompat(ctx, ImageGenSettingsNamespace, Config, config ?? {}, {
		setSource: (source) => {
			current = source;
			sync();
		},
		onChange: sync
	});
	sync();
	return () => {
		setStorageSyncHandler(void 0);
	};
}
//#endregion
export { CURRENT_VERSION, Config, IMAGEGEN_GUIDANCE, ImageGenError, ImageGenSettingsNamespace, ImageGenerationRuntime, addTemplateFavorite, appendGallery, apply, checkForUpdate, clearGallery, clearTemplateFavoritesMemo, clearTemplateMemo, clearUpdateCache, compareVersions, generateImage, inject, installUpdate, latestSessionImage, listGallery, listTemplateFavorites, listTemplates, makeRoutes, name, profileFromProcess, putObject, readGalleryImage, readTemplateImage, refreshTemplates, registerAgentImageTools, registerEditImageCommand, removeGallery, removeTemplateFavorite, sampleTemplates, setStorageSyncHandler, syncAllTemplates, testStorage, updateGalleryTags };

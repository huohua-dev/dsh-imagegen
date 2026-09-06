window.__ModuleLoader__.load({
	id: "@dickpy/dsh-imagegen",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_dom_client = require("react-dom/client");
		let react = require("react");
		let react_dom = require("react-dom");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		let _deepseek_ai_dsh_client_store = require("@deepseek-ai/dsh-client-store");
		//#region src/protocol.ts
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
		TEMPLATE_SOURCES[0].id;
		//#endregion
		//#region src/client/api.ts
		/**
		* Browser-side API client for the /api/dsh-imagegen route family. The only
		* data access path the panel uses — plain fetch, same origin.
		*/
		/** Error carrying the route's JSON error message. */
		var ImageGenApiError = class extends Error {
			/** Stable wire code from the host. */
			code;
			constructor(message, code = "generate-failed") {
				super(message);
				this.name = "ImageGenApiError";
				this.code = code;
			}
		};
		/** Parse the { ok, ... } envelope or throw an ImageGenApiError. */
		async function readEnvelope(response) {
			let body;
			try {
				body = await response.json();
			} catch {
				throw new ImageGenApiError(`HTTP ${response.status}: invalid JSON response`);
			}
			if (body === null || typeof body !== "object") throw new ImageGenApiError(`HTTP ${response.status}: malformed response`);
			const record = body;
			if (record.ok !== true) throw new ImageGenApiError(typeof record.message === "string" ? record.message : `HTTP ${response.status}`, typeof record.code === "string" ? record.code : "generate-failed");
			return body;
		}
		/** The browser half's data entry point. */
		var ImageGenApi = class {
			/** Ask the host to check the latest stable GitHub Release. */
			async updateCheck() {
				return (await readEnvelope(await fetch(UPDATE_API.check, { method: "POST" }))).update;
			}
			/** Ask the host to install a previously discovered Release. */
			async updateApply(version) {
				const body = await readEnvelope(await fetch(UPDATE_API.apply, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ version })
				}));
				return {
					updatedVersion: body.updatedVersion,
					restartRequired: body.restartRequired
				};
			}
			/** Forward one generate request to the host proxy. */
			async generate(request) {
				const body = await readEnvelope(await fetch(GENERATE_API, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify(request)
				}));
				return {
					images: body.images,
					...body.history === void 0 ? {} : { history: body.history },
					...body.historyError === void 0 ? {} : { historyError: body.historyError }
				};
			}
			/** Ask the configured chat model to expand a concise image prompt. */
			async enhancePrompt(prompt) {
				return (await readEnvelope(await fetch(PROMPT_ENHANCE_API.enhance, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ prompt })
				}))).prompt;
			}
			/** Stage a generated image as a durable reference for `/edit_image`. */
			async attachConversationImage(sessionId, dataUrl, name) {
				await readEnvelope(await fetch(CONVERSATION_IMAGE_API, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						sessionId,
						dataUrl,
						name
					})
				}));
			}
			async taskSubmit(request) {
				return (await readEnvelope(await fetch(TASK_API.submit, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify(request)
				}))).task;
			}
			async taskList() {
				return (await readEnvelope(await fetch(TASK_API.list, { method: "POST" }))).tasks;
			}
			async taskCancel(id) {
				return (await readEnvelope(await fetch(TASK_API.cancel, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ id })
				}))).task;
			}
			async taskRetry(id) {
				return (await readEnvelope(await fetch(TASK_API.retry, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ id })
				}))).task;
			}
			/** List the host-persisted history (newest first). */
			async historyList() {
				return (await readEnvelope(await fetch(HISTORY_API.list, { method: "POST" }))).entries;
			}
			/** Remove one history entry by id. */
			async historyRemove(id) {
				return (await readEnvelope(await fetch(HISTORY_API.remove, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ id })
				}))).entries;
			}
			/** Clear the entire history. */
			async historyClear() {
				return (await readEnvelope(await fetch(HISTORY_API.clear, { method: "POST" }))).entries;
			}
			/** List the host-persisted gallery (newest first). */
			async galleryList() {
				return (await readEnvelope(await fetch(GALLERY_API.list, { method: "POST" }))).entries;
			}
			/** Append one image to the gallery. The host assigns the id and skips the
			*  append when a content-identical image is already in the gallery. */
			async galleryAppend(entry) {
				const body = await readEnvelope(await fetch(GALLERY_API.append, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ entry })
				}));
				return {
					entries: body.entries,
					added: body.added
				};
			}
			/** Remove one gallery entry by id. */
			async galleryRemove(id) {
				return (await readEnvelope(await fetch(GALLERY_API.remove, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ id })
				}))).entries;
			}
			/** Clear the entire gallery. */
			async galleryClear() {
				return (await readEnvelope(await fetch(GALLERY_API.clear, { method: "POST" }))).entries;
			}
			async gallerySetTags(id, tags) {
				return (await readEnvelope(await fetch(GALLERY_API.tags, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						id,
						tags
					})
				}))).entries;
			}
			async canvasList() {
				return (await readEnvelope(await fetch(CANVAS_API.list, { method: "POST" }))).projects;
			}
			async canvasCreate(title) {
				return (await readEnvelope(await fetch(CANVAS_API.create, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ title })
				}))).document;
			}
			async canvasRead(id) {
				return (await readEnvelope(await fetch(CANVAS_API.read, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ id })
				}))).document;
			}
			async canvasSave(document, expectedRevision) {
				return (await readEnvelope(await fetch(CANVAS_API.save, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						document,
						expectedRevision
					})
				}))).document;
			}
			async canvasRemove(id) {
				return (await readEnvelope(await fetch(CANVAS_API.remove, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ id })
				}))).projects;
			}
			async canvasUpload(dataUrl, width, height, meta = {}) {
				return (await readEnvelope(await fetch(CANVAS_API.assetUpload, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						dataUrl,
						width,
						height,
						...meta
					})
				}))).asset;
			}
			async canvasImport(source, entryId, imageIndex, width, height) {
				return (await readEnvelope(await fetch(CANVAS_API.assetImport, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						source,
						entryId,
						imageIndex,
						width,
						height
					})
				}))).asset;
			}
			/** Fetch one template source's list (bundled snapshot or refreshed copy). */
			async templatesList(sourceId) {
				const body = await readEnvelope(await fetch(TEMPLATES_API.list, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ source: sourceId })
				}));
				return {
					sourceId: body.sourceId,
					cases: body.cases,
					total: body.total,
					origin: body.origin,
					repository: body.repository,
					fetchedAt: body.fetchedAt
				};
			}
			/** Re-download one template source's list from its upstream mirror (host-side). */
			async templatesRefresh(sourceId) {
				const body = await readEnvelope(await fetch(TEMPLATES_API.refresh, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ source: sourceId })
				}));
				return {
					sourceId: body.sourceId,
					total: body.total,
					fetchedAt: body.fetchedAt
				};
			}
			/** Draw random cases across every source (studio inspiration wall). */
			async templatesSample(count) {
				return (await readEnvelope(await fetch(TEMPLATES_API.sample, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ count })
				}))).samples;
			}
			/** List the host-persisted template favorites. */
			async favoritesList() {
				return (await readEnvelope(await fetch(TEMPLATE_FAVORITES_API.list, { method: "POST" }))).favorites;
			}
			/** Reveal the host data directory (saved images) in the OS file manager. */
			async openDataFolder() {
				return await readEnvelope(await fetch(DATA_FOLDER_API, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({})
				}));
			}
			/** Probe the configured S3-compatible object storage with a small upload. */
			async storageTest() {
				return await readEnvelope(await fetch(STORAGE_API.test, { method: "POST" }));
			}
			/** Star one template (the host keeps a full case snapshot). */
			async favoritesAdd(sourceId, item) {
				return (await readEnvelope(await fetch(TEMPLATE_FAVORITES_API.add, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						source: sourceId,
						case: item
					})
				}))).favorites;
			}
			/** Unstar one template by its favorites key. */
			async favoritesRemove(key) {
				return (await readEnvelope(await fetch(TEMPLATE_FAVORITES_API.remove, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ key })
				}))).favorites;
			}
		};
		//#endregion
		//#region src/client/controller.ts
		/** The panel state owner the sidebar entry toggles and the view renders from. */
		var ImageGenController = class {
			panelOpen = false;
			listeners = /* @__PURE__ */ new Set();
			getSnapshot() {
				return { panelOpen: this.panelOpen };
			}
			subscribe(fn) {
				this.listeners.add(fn);
				return () => {
					this.listeners.delete(fn);
				};
			}
			open() {
				if (this.panelOpen) return;
				this.panelOpen = true;
				this.notify();
			}
			close() {
				if (!this.panelOpen) return;
				this.panelOpen = false;
				this.notify();
			}
			toggle() {
				if (this.panelOpen) this.close();
				else this.open();
			}
			notify() {
				for (const fn of [...this.listeners]) fn();
			}
		};
		//#endregion
		//#region src/client/locales.ts
		/**
		* dsh-imagegen surface copy: zh is the key source, en mirrors every key.
		*/
		const zh = {
			"entry.label": "AI 生图",
			"entry.tooltip": "AI 生图面板（gpt-image-2 / glm-image / grok-imagine-image / nanobanana / seedream 系列）",
			"entry.newSession": "新会话",
			"entry.newSessionTooltip": "创建一个新的 DSH 会话",
			"entry.image": "生图",
			"panel.title": "AI 生图",
			"panel.githubTip": "觉得好用或有建议？欢迎来 GitHub 提 issues、点个 star 支持一下！",
			"conversation.add": "加入对话",
			"conversation.adding": "加入中…",
			"conversation.added": "图片已加入当前对话",
			"conversation.addHint": "加入对话后可使用 /edit_image 修改；命令使用插件图片模型",
			"conversation.noSession": "请先打开一个会话，再加入图片",
			"conversation.unavailable": "当前会话暂不可用",
			"conversation.busy": "当前对话正在发送，请稍后再试",
			"mode.text": "文生图",
			"mode.edit": "图生图",
			"workspace.label": "创作模式",
			"workspace.normal": "普通生图",
			"workspace.canvas": "无限画布",
			"workspace.ecommerce": "电商模式",
			"canvas.addImage": "添加图片",
			"canvas.addText": "添加文本",
			"canvas.generate": "生成图片",
			"canvas.addToCanvas": "加入画布",
			"canvas.untitled": "未命名画布",
			"canvas.imageNode": "图片节点",
			"canvas.textNode": "文本节点",
			"canvas.fromGallery": "素材库图片",
			"canvas.fromHistory": "历史图片",
			"canvas.project": "画布项目",
			"canvas.newCanvas": "新建画布",
			"canvas.deleteCanvas": "删除画布",
			"canvas.deleteCanvasConfirm": "再点一次确认删除",
			"canvas.rename": "重命名画布",
			"canvas.renameHint": "双击重命名",
			"canvas.background": "画布背景",
			"canvas.backgroundDots": "点阵",
			"canvas.backgroundLines": "网格线",
			"canvas.backgroundDiagonal": "斜线",
			"canvas.backgroundChecker": "棋盘格",
			"canvas.backgroundBlank": "空白",
			"canvas.backgroundUpload": "上传自定义背景…",
			"canvas.backgroundRemove": "移除自定义背景",
			"canvas.templateLibrary": "模板库（选择提示词生成文本+配置节点）",
			"canvas.undo": "撤销 (Ctrl+Z)",
			"canvas.redo": "重做 (Ctrl+Shift+Z)",
			"canvas.saving": "保存中…",
			"canvas.saved": "已保存",
			"canvas.saveFailed": "保存失败",
			"canvas.loading": "加载中…",
			"canvas.toolSelect": "选择 / 移动节点",
			"canvas.toolPan": "拖动画布（空格 / Ctrl + 拖动）",
			"canvas.delete": "删除",
			"canvas.duplicate": "创建副本 (Ctrl+D)",
			"canvas.download": "下载图片",
			"canvas.fitView": "适应全部内容",
			"canvas.minimapOpen": "打开缩略图",
			"canvas.minimapClose": "关闭缩略图",
			"canvas.minimap": "画布缩略图",
			"canvas.zoom": "缩放",
			"canvas.textPlaceholder": "输入文本内容…",
			"canvas.generatingNode": "生成中…",
			"canvas.generateFailed": "生成失败",
			"canvas.retry": "重试",
			"canvas.taskLost": "生成任务已丢失（服务重启），请重试",
			"canvas.emptyImageNode": "点击上传图片",
			"canvas.connectHint": "拖到其他节点建立连线",
			"canvas.resizeHint": "拖动调整大小（图片锁定比例）",
			"canvas.count": "生成数量",
			"canvas.configNode": "生成配置",
			"canvas.addConfigNode": "添加配置节点",
			"canvas.configHint": "把图片节点连线到左侧作为参考图，文本节点连线过来作为提示词；选中本节点后在下方输入或改写提示词并生成。",
			"canvas.composerLinked": "已连接 {count} 个输入节点",
			"canvas.composerPlaceholder": "描述要生成的图片；也可把文本节点连线过来作为提示词…",
			"canvas.countUnit": "{count} 张",
			"canvas.model": "生图模型",
			"canvas.modelPlaceholder": "选择模型",
			"canvas.size": "尺寸比例",
			"canvas.sizeAuto": "自动比例",
			"canvas.quality": "清晰度",
			"canvas.qualityAuto": "自动清晰度",
			"canvas.needApi": "请先配置生图 API",
			"canvas.needPrompt": "请输入生成描述",
			"canvas.needModel": "尚未配置可用生图模型",
			"canvas.openSettings": "打开设置",
			"canvas.deleteConnection": "删除连线",
			"canvas.paste": "粘贴 (Ctrl+V)",
			"canvas.addImageNode": "添加图片节点",
			"canvas.addTextNode": "添加文本节点",
			"canvas.dismiss": "关闭提示",
			"canvas.close": "关闭",
			"canvas.tabUpload": "上传",
			"canvas.tabHistory": "历史记录",
			"canvas.tabGallery": "素材库",
			"canvas.imageMenuUpload": "上传本地图片",
			"canvas.imageMenuAssets": "从素材库选择",
			"canvas.imageMenuHistory": "从历史记录选择",
			"canvas.imageMenuGenerate": "AI 生成新图",
			"canvas.tabGenerate": "AI 生成",
			"canvas.dropHint": "图片拖动到此处即可添加",
			"canvas.dropSub": "支持多选，PNG / JPG / WebP / GIF",
			"canvas.untitledWork": "未命名作品",
			"canvas.picked": "已选 {count} 张",
			"canvas.generateAndAdd": "生成并添加到画布",
			"chat.expand": "展开右侧对话",
			"chat.collapse": "收起右侧对话",
			"chat.toggle": "对话",
			"config.resizeHint": "拖拽调整参数栏宽度",
			"ecommerce.generation": "生成设置",
			"ecommerce.title": "电商模式",
			"ecommerce.badge": "预览",
			"ecommerce.short": "电商",
			"ecommerce.anchorPending": "已生成主图，其余图片正在自动参考主图生成，保证整套同款…",
			"ecommerce.anchorFailed": "主图生成失败，其余图片已暂停。请重试主图（或整组重新生成）后再继续。",
			"ecommerce.anchorNote": "锚定生成：先出主图，其余图片自动参考主图，保证整套同款",
			"ecommerce.noAssetWarn": "未上传商品图：主图将按文字描述生成并作为锚定基准，建议先上传商品主图获得更高一致性",
			"ecommerce.product": "商品信息",
			"ecommerce.productName": "商品名称（必填）",
			"ecommerce.projectName": "项目名称（可选）",
			"ecommerce.constraints": "卖点与约束",
			"ecommerce.sellingPoints": "商品卖点，例如：防水防污 / 大容量 / 便携",
			"ecommerce.protectedFeatures": "必须保留的特征，例如：颜色、Logo、包装文字、结构",
			"ecommerce.styleHint": "风格补充，例如：高级感 / 写实 / 自然光",
			"ecommerce.setStructure": "套图结构",
			"ecommerce.preview": "生成套图预览",
			"ecommerce.planTitle": "预计生成 {count} 张图片",
			"ecommerce.planSlot": "{count} 张 · {description}",
			"ecommerce.confirm": "确认生成整套图片",
			"ecommerce.uploadRef": "上传商品素材（可选，最多 4 张：主体 / 包装 / 细节 / 风格）",
			"ecommerce.uploadShort": "上传素材",
			"ecommerce.sellingTitle": "商品卖点",
			"ecommerce.advanced": "高级选项（平台 / 约束）",
			"ecommerce.params": "参数选择",
			"ecommerce.platformLabel": "平台",
			"ecommerce.languageLabel": "文案语言",
			"ecommerce.customLanguageOption": "自定义…",
			"ecommerce.customLanguageLabel": "自定义语言",
			"ecommerce.customLanguagePlaceholder": "输入语言名称，例如：Русский / 日本語 / Português",
			"ecommerce.ratioLabel": "比例",
			"ecommerce.categoryLabel": "类目",
			"ecommerce.multiSelect": "可多选",
			"ecommerce.countHint": "点击调整数量（1-4）",
			"ecommerce.refSettings": "参考图设置（可选）",
			"ecommerce.styleTitle": "风格 / 补充提示",
			"ecommerce.protectedLabel": "必须保留的特征（可选）",
			"ecommerce.assetsFull": "最多上传 4 张素材",
			"ecommerce.refSelect": "该用途使用的参考图",
			"ecommerce.refNone": "不使用参考图",
			"ecommerce.role.product": "商品主体",
			"ecommerce.role.packaging": "包装",
			"ecommerce.role.detail": "细节/角度",
			"ecommerce.role.style": "风格参考",
			"ecommerce.footerReady": "将生成 {count} 张套图",
			"ecommerce.footerEmpty": "请选择套图结构",
			"ecommerce.results.title": "套图结果",
			"ecommerce.results.progress": "{done}/{total} 已完成",
			"ecommerce.results.failed": "{count} 张失败",
			"ecommerce.results.empty": "确认生成后，每张图片的任务状态和结果会按用途显示在这里",
			"ecommerce.results.regenerate": "重新生成",
			"ecommerce.results.export": "导出清单",
			"ecommerce.results.newProduct": "新商品",
			"prompt.placeholder": "描述你想要的画面，例如：一只戴着宇航员头盔的橘猫，在月球上举起望远镜，水彩风格，柔和光线…",
			"prompt.required": "请输入提示词",
			"prompt.count": "{count}",
			"prompt.enhance": "增强",
			"prompt.enhancing": "增强中…",
			"prompt.enhanceHint": "使用已配置的对话模型扩写提示词",
			"prompt.configTitle": "请先配置提示词增强模型",
			"prompt.configHint": "已打开设置。进入「插件 → AI 生图」，填写或复用 API 地址和密钥，选择对话模型并保存。",
			"tasks.title": "生成任务",
			"tasks.queued": "排队中",
			"tasks.running": "生成中",
			"tasks.completed": "已完成",
			"tasks.failed": "失败",
			"tasks.cancelled": "已取消",
			"tasks.cancel": "取消",
			"tasks.retry": "重试",
			"params.size": "尺寸",
			"params.quality": "清晰度",
			"params.count": "生成数量",
			"params.detail": "细节",
			"size.auto": "自动",
			"size.square": "1:1 方图",
			"size.portrait34": "3:4 标准竖图",
			"size.landscape43": "4:3 标准横图",
			"size.portrait916": "9:16 竖屏",
			"size.portrait23": "2:3 竖图",
			"size.landscape32": "3:2 横图",
			"size.wide169": "16:9 宽屏",
			"size.ultrawide21": "21:9 超宽屏",
			"quality.auto": "自动",
			"quality.1k": "1K",
			"quality.2k": "2K",
			"quality.4k": "4K",
			"count.one": "1 张",
			"count.two": "2 张",
			"count.three": "3 张",
			"count.four": "4 张",
			"detail.auto": "自动",
			"detail.standard": "标准",
			"detail.high": "高清",
			"detail.hint": "透传参数，部分 gpt-image-2 网关支持；官方接口请保持「自动」",
			"model.label": "模型",
			"model.noEditModels": "当前模式暂无可用模型",
			"compare.enable": "多模型对比",
			"compare.models": "参与对比的模型",
			"compare.title": "多模型结果对比",
			"compare.fullscreen": "全屏对比",
			"compare.selectRequired": "请至少选择一个对比模型",
			"generate": "开始生成",
			"generating": "生成中…",
			"edit.upload": "点击或拖拽上传参考图片",
			"edit.uploadHint": "PNG / JPG / WEBP，不超过 10MB",
			"edit.change": "更换图片",
			"edit.remove": "移除",
			"edit.required": "请先上传参考图片",
			"canvas.emptyTitle": "开始你的创作",
			"canvas.emptyHint": "双击空白处或用底部工具添加图片/文本节点；把图片和文本节点连线到目标节点，选中后即可在底部生成器中出图",
			"canvas.new": "新建作图",
			"canvas.newHint": "开始新的作图并清空预览",
			"canvas.error": "生成失败：{error}",
			"canvas.submitting": "正在加入生成队列…",
			"canvas.queued": "已加入生成队列",
			"canvas.queueHint": "当前有 {count} 个任务等待处理",
			"canvas.generating": "正在生成图片…",
			"canvas.elapsed": "已用时 {seconds}s",
			"canvas.images": "本次生成 {count} 张",
			"download": "下载",
			"revisedPrompt": "优化提示词：{prompt}",
			"history.title": "历史记录",
			"history.empty": "暂无历史记录，生成图片后会保存在这里",
			"history.clear": "清空",
			"history.clearConfirm": "确定要清空全部历史记录吗？此操作不可撤销。",
			"history.restore": "恢复",
			"history.delete": "删除",
			"history.images": "张",
			"history.viewing": "历史 · {time}",
			"history.search": "搜索提示词或模型…",
			"history.model": "模型筛选",
			"history.ratio": "比例筛选",
			"history.allModels": "全部模型",
			"history.allRatios": "全部比例",
			"gallery.title": "素材库",
			"gallery.categories": "分类",
			"gallery.all": "全部素材",
			"gallery.upload": "上传素材",
			"gallery.uploadModel": "本地上传",
			"gallery.uploaded": "素材已入库",
			"gallery.uploadHint": "把本地图保存进素材库，画布随时可用",
			"gallery.gpt": "gpt-image-2",
			"gallery.grok": "grok-imagine-image",
			"gallery.ratio": "画面比例",
			"gallery.tags": "标签",
			"gallery.filterHint": "按生成模式、模型和比例筛选素材",
			"gallery.count": "· 共 {count} 幅",
			"gallery.viewMode": "视图模式",
			"gallery.masonry": "瀑布流",
			"gallery.grid": "整齐网格",
			"gallery.sort": "排序",
			"gallery.newest": "最新发布",
			"gallery.oldest": "最早发布",
			"gallery.untitled": "未命名作品",
			"gallery.search": "搜索作品或模型…",
			"gallery.tagsPlaceholder": "标签，用逗号分隔",
			"gallery.tagsApply": "添加标签",
			"gallery.editTags": "编辑标签",
			"gallery.tagsEditShort": "编辑",
			"gallery.tagsSave": "保存",
			"gallery.tagsCancel": "取消",
			"gallery.selected": "已选 {count} 项",
			"gallery.selectionDone": "完成选择",
			"gallery.selectionClear": "取消选择",
			"gallery.downloadSelected": "下载所选",
			"gallery.exportJson": "导出 JSON",
			"gallery.select": "选择作品",
			"gallery.add": "加入素材库",
			"gallery.added": "已加入素材库",
			"gallery.already": "已在素材库中",
			"gallery.delete": "移出素材库",
			"gallery.openFolder": "打开文件夹",
			"gallery.clear": "清空素材库",
			"gallery.openFolderHint": "在系统的文件管理器中打开图片保存目录（~/.dsh/dsh-imagegen）",
			"gallery.clearConfirm": "确定要清空整个素材库吗？此操作不可撤销。",
			"gallery.empty": "素材库还是空的，把喜欢的图片加入进来吧",
			"gallery.viewing": "素材库 · {time}",
			"preview.title": "图片预览",
			"preview.open": "点击预览",
			"preview.close": "关闭",
			"preview.prev": "上一张",
			"preview.next": "下一张",
			"preview.index": "{index} / {total}",
			"preview.zoomControls": "图片缩放控制",
			"preview.zoomIn": "放大",
			"preview.zoomOut": "缩小",
			"preview.zoomReset": "重置缩放",
			"preview.zoomLevel": "{percent}%",
			"preview.copyPrompt": "复制提示词",
			"preview.copied": "已复制",
			"preview.addToEdit": "添加到图生图",
			"config.missing": "尚未配置 API：请前往「设置 → 插件 → 可配置」为 AI 生图填写 api_url 与 api_key。",
			"config.generationTitle": "请先配置生图 API",
			"config.generationHint": "已自动打开 DSH「设置 → 插件 → AI 生图」。填写生图 API 地址与 API 密钥，保存后即可开始生成。",
			"config.enhancementTitle": "请先配置提示词增强模型",
			"config.enhancementHint": "已自动打开 DSH「设置 → 插件 → AI 生图」。填写或复用对话 API 地址和密钥，选择对话模型并保存。",
			"config.disabledTitle": "AI 生图插件已停用",
			"config.disabledHint": "已自动打开 DSH「设置 → 插件 → AI 生图」。开启「启用插件」后即可生成图片。",
			"config.configured": "已连接 {url}",
			"config.disabled": "插件已停用，请在设置中重新启用。",
			"connection.connected": "已连接",
			"connection.disconnected": "未连接",
			"panel.collapseConfig": "收起参数栏",
			"panel.expandConfig": "展开参数栏",
			"update.available": "检测到新版本：{version}",
			"update.install": "在线更新",
			"update.installing": "更新中…",
			"update.success": "已更新到 {version}，请重启 DSH",
			"update.failed": "更新失败，请重试",
			"update.release": "查看 Release",
			"settings.title": "AI 生图（dsh-imagegen）",
			"settings.description": "配置图像生成 API 地址与密钥",
			"settings.currentVersion": "当前版本",
			"settings.apiUrl": "API 地址（api_url）",
			"settings.apiUrlHint": "OpenAI 兼容接口基址，如 https://api.openai.com/v1；将自动拼接 /images/generations 与 /images/edits",
			"settings.apiKey": "API 密钥（api_key）",
			"settings.apiKeyHint": "Bearer 密钥，明文存于本机设置文档；界面只显示是否已设置",
			"settings.apiKeySet": "已保存密钥；输入新值可更换，点击「清除」可删除",
			"settings.apiKeyClear": "清除",
			"settings.imageModelsTitle": "生图模型",
			"settings.imageModelsHint": "保存 API 地址和密钥后检测候选模型；请只选择实际支持生图的项。",
			"settings.imageModels": "允许使用的生图模型",
			"settings.imageModelsManualHint": "一行一个模型；API 未提供 /models 时可手动填写。面板和 Agent 只能使用此列表。",
			"settings.imageModelsFetch": "检测可用模型",
			"settings.imageModelsLoading": "检测中…",
			"settings.imageModelsCandidates": "检测到的候选模型（勾选后保存）",
			"settings.addModel": "+ 手动添加",
			"settings.cancelAddModel": "收起添加",
			"settings.addModelPlaceholder": "输入模型名称，例如 qwen-image",
			"settings.addModelConfirm": "添加",
			"settings.removeModel": "移除模型",
			"settings.optional": "可选",
			"settings.moreOptions": "更多设置",
			"settings.storageTitle": "对象存储同步",
			"settings.storageEnabled": "启用对象存储同步",
			"settings.storageHint": "图片保存到本地后，异步上传一份到 S3 兼容对象存储（腾讯云 COS / 阿里云 OSS / 七牛云 S3 / MinIO / R2 等）",
			"settings.storageEndpoint": "接口地址（含存储桶）",
			"settings.storageEndpointHint": "S3 兼容地址，例如 https://bucket-appid.cos.ap-guangzhou.myqcloud.com 或 https://bucket.oss-cn-hangzhou.aliyuncs.com",
			"settings.storageRegion": "区域",
			"settings.storageRegionHint": "签名用区域 ID，例如 ap-guangzhou / oss-cn-hangzhou / cn-east-1",
			"settings.storagePrefix": "Key 前缀",
			"settings.storagePrefixHint": "上传目录前缀，对象键为 前缀/gallery|images/文件名",
			"settings.storageAccessKey": "Access Key",
			"settings.storageAccessKeyHint": "S3 兼容密钥 ID（COS SecretId / OSS AccessKeyId / 七牛 AK）",
			"settings.storageSecretKey": "Secret Key",
			"settings.storageSecretKeyHint": "S3 兼容密钥，仅保存在本机设置文档",
			"settings.storageSyncGallery": "同步素材库图片",
			"settings.storageSyncGalleryHint": "加入素材库的图片自动上传",
			"settings.storageSyncHistory": "同步历史记录图片",
			"settings.storageSyncHistoryHint": "所有生成结果也一并上传（数量可能较大）",
			"settings.storageTest": "测试连接",
			"settings.storageTesting": "测试中…",
			"settings.storageTestOk": "连接成功（{ms} ms），已上传探测文件",
			"settings.storageTestFailed": "连接失败：{error}",
			"settings.storageKeyHint": "提示：同步为尽力而为，失败不影响本地保存；可在对象存储控制台按前缀查看已同步文件。",
			"settings.promptEnhanceTitle": "提示词增强模型",
			"settings.promptEnhanceHint": "用于将简短描述扩写为更完整的生图提示词；留空的地址和密钥会复用生图配置。",
			"settings.promptApiUrl": "对话 API 地址（可选）",
			"settings.promptApiUrlHint": "OpenAI 兼容基址；留空则复用图像 API 地址。",
			"settings.promptApiKey": "对话 API 密钥（可选）",
			"settings.promptApiKeyHint": "留空则复用图像 API 密钥。",
			"settings.promptModel": "对话模型",
			"settings.promptModelHint": "选择或填写支持 /chat/completions 的模型。",
			"settings.promptModelDetectionHint": "默认复用生图 API；检测后点选一个模型即可。",
			"settings.promptModelsFetch": "获取可用模型",
			"settings.promptModelsLoading": "正在获取…",
			"settings.promptModelsSelect": "选择一个模型",
			"settings.promptModelsCandidates": "检测到的候选对话模型",
			"settings.addPromptModelPlaceholder": "输入对话模型名称，例如 gpt-4.1-mini",
			"settings.promptApiAdvanced": "使用独立对话 API（可选）",
			"settings.announceToAgent": "向 Agent 播报本插件",
			"settings.announceToAgentHint": "开启后，本插件的存在与能力会写入每个 Agent 的系统提示词",
			"settings.allowAgentImageGeneration": "允许 Agent 调用生图",
			"settings.allowAgentImageGenerationHint": "默认开启。关闭后，Agent 无法提交、查询或取消生图任务；侧边栏工作台不受影响。",
			"settings.enabled": "启用插件",
			"settings.enabledHint": "关闭后生图面板不可用（设置卡片始终可用）",
			"settings.save": "保存",
			"settings.saving": "保存中…",
			"settings.discard": "放弃修改",
			"settings.unsaved": "有未保存的修改",
			"settings.saveFailed": "保存失败，请重试",
			"settings.readOnly": "当前设置文档为只读，无法保存。",
			"settings.notExposed": "设置命名空间不可用：本部署未提供该插件的设置服务。",
			"settings.expand": "展开",
			"settings.collapse": "收起",
			"settings.inherit": "继承",
			"settings.on": "开",
			"settings.off": "关",
			"settings.overridden": "已覆盖",
			"settings.reset": "重置",
			"settings.invalidNumber": "请输入有效数字",
			"templates.open": "模板库",
			"templates.title": "提示词模板库",
			"templates.sources": "模板库来源",
			"templates.meta": "共 {count} 个模板 · {origin}",
			"templates.origin.bundled": "内置快照",
			"templates.origin.refreshed": "在线刷新",
			"templates.search": "搜索模板标题或提示词…",
			"templates.all": "全部",
			"templates.close": "关闭",
			"templates.back": "返回列表",
			"templates.use": "使用此提示词",
			"templates.copy": "复制提示词",
			"templates.copied": "已复制",
			"templates.refresh": "刷新本库",
			"templates.refreshing": "刷新中…",
			"templates.refreshed": "已刷新，共 {count} 个模板",
			"templates.refreshFailed": "刷新失败：{error}",
			"templates.favorites": "收藏",
			"templates.favoritesHint": "只看已收藏的模板",
			"templates.favoritesEmpty": "还没有收藏，点击模板卡片右上角的星标即可收藏",
			"templates.favoriteAdd": "收藏此模板",
			"templates.favoriteRemove": "取消收藏",
			"templates.favorite": "收藏",
			"templates.unfavorite": "已收藏",
			"templates.cacheAll": "缓存全部图片",
			"templates.cacheAllHint": "通过本机代理把当前模板库的全部参考图缓存到本地磁盘，之后离线也能浏览",
			"templates.caching": "缓存中 {done}/{total}…",
			"templates.cached": "图片已全部缓存",
			"templates.empty": "没有匹配的模板",
			"templates.loading": "正在加载模板库…",
			"templates.loadFailed": "模板库加载失败：{error}",
			"templates.retry": "重试",
			"templates.attribution": "模板与图片来自各来源站点，作者链接见模板详情",
			"templates.source": "来源：{label}",
			"templates.featured": "精选",
			"inspiration.title": "灵感案例",
			"inspiration.shuffle": "随机",
			"inspiration.shuffling": "换一批…",
			"inspiration.useHint": "点击使用该提示词",
			"channels.title": "渠道",
			"channels.hint": "填写各渠道的 API 地址与密钥即可使用对应模型",
			"channels.empty": "尚无渠道，点击下方按钮添加",
			"channels.addProvider": "添加提供方",
			"channels.addCustom": "添加自定义渠道",
			"channels.untitled": "未命名渠道",
			"channels.keySet": "密钥已设置",
			"channels.keyMissing": "未设置密钥",
			"channels.modelCount": "{n} 个模型",
			"channels.noModels": "未配置模型",
			"channels.defaultLabel": "默认",
			"channels.statusReady": "可用",
			"channels.statusIncomplete": "配置未完成",
			"channels.edit": "编辑",
			"channels.delete": "删除",
			"channels.deleteConfirmTitle": "删除渠道「{name}」？该渠道的密钥将被移除；历史与素材库中的记录仍会保留。",
			"channels.confirm": "确认删除",
			"channels.cancel": "取消",
			"channels.editorTitle": "渠道",
			"channels.editorSaveNote": "改动将随卡片底部「保存」一起生效",
			"channels.displayName": "显示名称",
			"channels.apiUrl": "API 地址",
			"channels.apiKey": "API 密钥",
			"channels.keyReplaceHint": "已配置 — 输入新值可替换",
			"channels.keyMissingHint": "填写密钥",
			"channels.keyClear": "清除密钥",
			"channels.modelCatalogTitle": "模型目录",
			"channels.noModelsHint": "暂无模型：点击「检测」拉取候选，或手动添加；别名（显示名）默认等于上游模型 id，可自行修改。",
			"channels.detect": "重新检测",
			"channels.detecting": "检测中…",
			"channels.detectSuccess": "连通 ✓ · {n} 个候选",
			"channels.detectFailed": "检测失败：{error}",
			"channels.detectOk": "已连接该 API",
			"channels.modelAliasLabel": "显示名（别名）",
			"channels.modelIdLabel": "上游模型 id",
			"channels.generated": "已生成 {n} 次",
			"channels.unknownProtocol": "未知协议，按通用 OpenAI 协议尝试",
			"channels.removeModel": "移除模型",
			"channels.manualAddPlaceholder": "输入模型 id，例如 qwen-image",
			"channels.addModelConfirm": "添加",
			"channels.copyFrom": "从其他渠道复制…",
			"channels.copyApply": "复制",
			"channels.candidatesTitle": "图片模型候选（点击加入）",
			"channels.deleteThisChannel": "删除此渠道",
			"channels.setDefault": "设为默认渠道",
			"channels.presetPickerTitle": "添加提供方",
			"channels.presetPickerHint": "选择一个内置提供方，仅需填写 API 密钥",
			"channels.presetCustomHint": "自行填写 API 地址、密钥与模型目录",
			"channels.presetLoadFailed": "加载提供方失败：{error}"
		};
		const en = {
			"entry.label": "AI Image",
			"entry.tooltip": "AI image generation studio (gpt-image-2 / glm-image / grok-imagine-image / nanobanana / seedream family)",
			"entry.newSession": "New session",
			"entry.newSessionTooltip": "Create a new DSH session",
			"entry.image": "Image",
			"panel.title": "AI Image",
			"panel.githubTip": "Like it or have suggestions? Head to GitHub to open issues and star us!",
			"conversation.add": "Add to chat",
			"conversation.adding": "Adding…",
			"conversation.added": "Image added to the current chat",
			"conversation.addHint": "After adding to chat, use /edit_image to modify it; the command uses the plugin image model",
			"conversation.noSession": "Open a session before adding an image",
			"conversation.unavailable": "The current session is unavailable",
			"conversation.busy": "The chat is sending a message; try again shortly",
			"mode.text": "Text to Image",
			"mode.edit": "Image to Image",
			"workspace.label": "Workspace",
			"workspace.normal": "Standard",
			"workspace.canvas": "Infinite canvas",
			"workspace.ecommerce": "E-commerce",
			"canvas.addImage": "Add image",
			"canvas.addText": "Add text",
			"canvas.generate": "Generate image",
			"canvas.addToCanvas": "Add to canvas",
			"canvas.untitled": "Untitled canvas",
			"canvas.imageNode": "Image node",
			"canvas.textNode": "Text node",
			"canvas.fromGallery": "Gallery image",
			"canvas.fromHistory": "History image",
			"canvas.project": "Canvas project",
			"canvas.newCanvas": "New canvas",
			"canvas.deleteCanvas": "Delete canvas",
			"canvas.deleteCanvasConfirm": "Click again to confirm",
			"canvas.rename": "Rename canvas",
			"canvas.renameHint": "Double-click to rename",
			"canvas.background": "Canvas background",
			"canvas.backgroundDots": "Dots",
			"canvas.backgroundLines": "Grid lines",
			"canvas.backgroundDiagonal": "Diagonal",
			"canvas.backgroundChecker": "Checkerboard",
			"canvas.backgroundBlank": "Blank",
			"canvas.backgroundUpload": "Upload custom background…",
			"canvas.backgroundRemove": "Remove custom background",
			"canvas.templateLibrary": "Template library (pick a prompt to create text + config nodes)",
			"canvas.undo": "Undo (Ctrl+Z)",
			"canvas.redo": "Redo (Ctrl+Shift+Z)",
			"canvas.saving": "Saving…",
			"canvas.saved": "Saved",
			"canvas.saveFailed": "Save failed",
			"canvas.loading": "Loading…",
			"canvas.toolSelect": "Select / move nodes",
			"canvas.toolPan": "Pan canvas (Space / Ctrl + drag)",
			"canvas.delete": "Delete",
			"canvas.duplicate": "Duplicate (Ctrl+D)",
			"canvas.download": "Download image",
			"canvas.fitView": "Fit all content",
			"canvas.minimapOpen": "Open minimap",
			"canvas.minimapClose": "Close minimap",
			"canvas.minimap": "Canvas minimap",
			"canvas.zoom": "Zoom",
			"canvas.textPlaceholder": "Type text…",
			"canvas.generatingNode": "Generating…",
			"canvas.generateFailed": "Generation failed",
			"canvas.retry": "Retry",
			"canvas.taskLost": "Generation task lost (service restarted); please retry",
			"canvas.emptyImageNode": "Click to upload an image",
			"canvas.connectHint": "Drag onto another node to connect",
			"canvas.resizeHint": "Drag to resize (image ratio locked)",
			"canvas.count": "Image count",
			"canvas.configNode": "Generation config",
			"canvas.addConfigNode": "Add config node",
			"canvas.configHint": "Connect image nodes on the left as references and text nodes as prompts; select this node to write the prompt in the composer below and generate.",
			"canvas.composerLinked": "{count} input node(s) connected",
			"canvas.composerPlaceholder": "Describe the image to generate; or connect text nodes as the prompt…",
			"canvas.countUnit": "{count}",
			"canvas.model": "Image model",
			"canvas.modelPlaceholder": "Choose a model",
			"canvas.size": "Size ratio",
			"canvas.sizeAuto": "Auto ratio",
			"canvas.quality": "Quality",
			"canvas.qualityAuto": "Auto quality",
			"canvas.needApi": "Configure the image API first",
			"canvas.needPrompt": "Enter a generation prompt first",
			"canvas.needModel": "No image model available",
			"canvas.openSettings": "Open settings",
			"canvas.deleteConnection": "Delete connection",
			"canvas.paste": "Paste (Ctrl+V)",
			"canvas.addImageNode": "Add image node",
			"canvas.addTextNode": "Add text node",
			"canvas.dismiss": "Dismiss",
			"canvas.close": "Close",
			"canvas.tabUpload": "Upload",
			"canvas.tabHistory": "History",
			"canvas.tabGallery": "Assets",
			"canvas.imageMenuUpload": "Upload local image",
			"canvas.imageMenuAssets": "Pick from assets",
			"canvas.imageMenuHistory": "Pick from history",
			"canvas.imageMenuGenerate": "Generate with AI",
			"canvas.tabGenerate": "AI generate",
			"canvas.dropHint": "Drop images here to add them",
			"canvas.dropSub": "Multiple files, PNG / JPG / WebP / GIF",
			"canvas.untitledWork": "Untitled work",
			"canvas.picked": "{count} selected",
			"canvas.generateAndAdd": "Generate and add to canvas",
			"chat.expand": "Expand the conversation pane",
			"chat.collapse": "Collapse the conversation pane",
			"chat.toggle": "Chat",
			"config.resizeHint": "Drag to resize the parameter panel",
			"ecommerce.generation": "Generation settings",
			"ecommerce.title": "E-commerce Mode",
			"ecommerce.badge": "Beta",
			"ecommerce.short": "Store",
			"ecommerce.anchorPending": "Main image generated — remaining images are being generated with the main image as reference to keep the set consistent…",
			"ecommerce.anchorFailed": "Main image failed; remaining images are paused. Retry the main image or regenerate the set.",
			"ecommerce.anchorNote": "Anchored: main image first, remaining images reference it automatically for a consistent set",
			"ecommerce.noAssetWarn": "No product image uploaded: the main image will be generated from text as the anchor. Upload one for higher consistency.",
			"ecommerce.product": "Product details",
			"ecommerce.productName": "Product name (required)",
			"ecommerce.projectName": "Project name (optional)",
			"ecommerce.constraints": "Selling points & constraints",
			"ecommerce.sellingPoints": "Selling points, e.g. waterproof / large capacity / portable",
			"ecommerce.protectedFeatures": "Features to preserve: color, logo, packaging text, structure",
			"ecommerce.styleHint": "Style hint, e.g. premium / realistic / natural light",
			"ecommerce.setStructure": "Image set structure",
			"ecommerce.preview": "Preview product set",
			"ecommerce.planTitle": "Plan to generate {count} images",
			"ecommerce.planSlot": "{count} images · {description}",
			"ecommerce.confirm": "Confirm and generate set",
			"ecommerce.uploadRef": "Upload product assets (optional, up to 4: product / packaging / detail / style)",
			"ecommerce.uploadShort": "Upload",
			"ecommerce.sellingTitle": "Selling points",
			"ecommerce.advanced": "Advanced (platform / constraints)",
			"ecommerce.params": "Parameters",
			"ecommerce.platformLabel": "Platform",
			"ecommerce.languageLabel": "Copy language",
			"ecommerce.customLanguageOption": "Custom…",
			"ecommerce.customLanguageLabel": "Custom language",
			"ecommerce.customLanguagePlaceholder": "Enter a language, e.g. Русский / 日本語 / Português",
			"ecommerce.ratioLabel": "Aspect ratio",
			"ecommerce.categoryLabel": "Category",
			"ecommerce.multiSelect": "multi-select",
			"ecommerce.countHint": "Click to adjust count (1-4)",
			"ecommerce.refSettings": "Reference images (optional)",
			"ecommerce.styleTitle": "Style / extra hints",
			"ecommerce.protectedLabel": "Features to preserve (optional)",
			"ecommerce.assetsFull": "Up to 4 assets",
			"ecommerce.refSelect": "Reference image for this slot",
			"ecommerce.refNone": "No reference",
			"ecommerce.role.product": "Product",
			"ecommerce.role.packaging": "Packaging",
			"ecommerce.role.detail": "Detail / angle",
			"ecommerce.role.style": "Style",
			"ecommerce.footerReady": "{count} images in this set",
			"ecommerce.footerEmpty": "Select the image set structure",
			"ecommerce.results.title": "Product set results",
			"ecommerce.results.progress": "{done}/{total} completed",
			"ecommerce.results.failed": "{count} failed",
			"ecommerce.results.empty": "After confirming, each image task and result will show here grouped by purpose",
			"ecommerce.results.regenerate": "Regenerate",
			"ecommerce.results.export": "Export manifest",
			"ecommerce.results.newProduct": "New product",
			"prompt.placeholder": "Describe the picture you want, e.g. an orange cat in an astronaut helmet raising a telescope on the moon, watercolor style, soft light…",
			"prompt.required": "Enter a prompt first",
			"prompt.count": "{count}",
			"prompt.enhance": "Enhance",
			"prompt.enhancing": "Enhancing…",
			"prompt.enhanceHint": "Expand the prompt with the configured chat model",
			"prompt.configTitle": "Configure a prompt enhancement model first",
			"prompt.configHint": "Settings has opened. Go to Plugins → AI Image, configure or reuse an API URL and key, choose a chat model, then save.",
			"tasks.title": "Generation tasks",
			"tasks.queued": "Queued",
			"tasks.running": "Generating",
			"tasks.completed": "Completed",
			"tasks.failed": "Failed",
			"tasks.cancelled": "Cancelled",
			"tasks.cancel": "Cancel",
			"tasks.retry": "Retry",
			"params.size": "Size",
			"params.quality": "Quality",
			"params.count": "Count",
			"params.detail": "Detail",
			"size.auto": "Auto",
			"size.square": "1:1 Square",
			"size.portrait34": "3:4 Portrait",
			"size.landscape43": "4:3 Landscape",
			"size.portrait916": "9:16 Vertical",
			"size.portrait23": "2:3 Portrait",
			"size.landscape32": "3:2 Landscape",
			"size.wide169": "16:9 Widescreen",
			"size.ultrawide21": "21:9 Ultrawide",
			"quality.auto": "Auto",
			"quality.1k": "1K",
			"quality.2k": "2K",
			"quality.4k": "4K",
			"count.one": "1",
			"count.two": "2",
			"count.three": "3",
			"count.four": "4",
			"detail.auto": "Auto",
			"detail.standard": "Standard",
			"detail.high": "High",
			"detail.hint": "Passthrough parameter supported by some gpt-image-2 gateways; keep \"Auto\" for official endpoints",
			"model.label": "Model",
			"model.noEditModels": "No model is available for this mode",
			"compare.enable": "Multi-model comparison",
			"compare.models": "Models to compare",
			"compare.title": "Multi-model comparison",
			"compare.fullscreen": "Fullscreen comparison",
			"compare.selectRequired": "Select at least one model",
			"generate": "Generate",
			"generating": "Generating…",
			"edit.upload": "Click or drag to upload a reference image",
			"edit.uploadHint": "PNG / JPG / WEBP, up to 10MB",
			"edit.change": "Change image",
			"edit.remove": "Remove",
			"edit.required": "Upload a reference image first",
			"canvas.emptyTitle": "Start creating",
			"canvas.emptyHint": "Double-click the canvas or use the bottom dock to add image/text nodes; wire image and text nodes into a target node, select it and generate from the composer below",
			"canvas.new": "New creation",
			"canvas.newHint": "Start a new creation and clear the preview",
			"canvas.error": "Generation failed: {error}",
			"canvas.submitting": "Adding to the generation queue…",
			"canvas.queued": "Added to the generation queue",
			"canvas.queueHint": "{count} task(s) waiting or generating",
			"canvas.generating": "Generating images…",
			"canvas.elapsed": "Elapsed {seconds}s",
			"canvas.images": "{count} image(s) generated",
			"download": "Download",
			"revisedPrompt": "Refined prompt: {prompt}",
			"history.title": "History",
			"history.empty": "No history yet — generations will be saved here",
			"history.clear": "Clear",
			"history.clearConfirm": "Clear all history? This action cannot be undone.",
			"history.restore": "Restore",
			"history.delete": "Delete",
			"history.images": "images",
			"history.viewing": "History · {time}",
			"history.search": "Search prompt or model…",
			"history.model": "Model filter",
			"history.ratio": "Ratio filter",
			"history.allModels": "All models",
			"history.allRatios": "All ratios",
			"gallery.title": "Assets",
			"gallery.categories": "Categories",
			"gallery.all": "All assets",
			"gallery.upload": "Upload",
			"gallery.uploadModel": "Local upload",
			"gallery.uploaded": "Asset saved",
			"gallery.uploadHint": "Save local images for reuse on the canvas",
			"gallery.gpt": "gpt-image-2",
			"gallery.grok": "grok-imagine-image",
			"gallery.ratio": "Aspect ratio",
			"gallery.tags": "Tags",
			"gallery.filterHint": "Filter by mode, model, and aspect ratio",
			"gallery.count": "· {count} works",
			"gallery.viewMode": "View mode",
			"gallery.masonry": "Masonry",
			"gallery.grid": "Grid",
			"gallery.sort": "Sort",
			"gallery.newest": "Newest",
			"gallery.oldest": "Oldest",
			"gallery.untitled": "Untitled work",
			"gallery.search": "Search works or models…",
			"gallery.tagsPlaceholder": "Tags, comma separated",
			"gallery.tagsApply": "Add tags",
			"gallery.editTags": "Edit tags",
			"gallery.tagsEditShort": "Edit",
			"gallery.tagsSave": "Save",
			"gallery.tagsCancel": "Cancel",
			"gallery.selected": "{count} selected",
			"gallery.selectionDone": "Done selecting",
			"gallery.selectionClear": "Clear selection",
			"gallery.downloadSelected": "Download selected",
			"gallery.exportJson": "Export JSON",
			"gallery.select": "Select work",
			"gallery.add": "Add to gallery",
			"gallery.added": "Added to gallery",
			"gallery.already": "Already in gallery",
			"gallery.delete": "Remove",
			"gallery.openFolder": "Open folder",
			"gallery.clear": "Clear gallery",
			"gallery.openFolderHint": "Open the image save directory (~/.dsh/dsh-imagegen) in the system file manager",
			"gallery.clearConfirm": "Clear the entire gallery? This action cannot be undone.",
			"gallery.empty": "The gallery is empty — add images you like here",
			"gallery.viewing": "Gallery · {time}",
			"preview.title": "Image preview",
			"preview.open": "Click to preview",
			"preview.close": "Close",
			"preview.prev": "Previous",
			"preview.next": "Next",
			"preview.index": "{index} / {total}",
			"preview.zoomControls": "Image zoom controls",
			"preview.zoomIn": "Zoom in",
			"preview.zoomOut": "Zoom out",
			"preview.zoomReset": "Reset zoom",
			"preview.zoomLevel": "{percent}%",
			"preview.copyPrompt": "Copy prompt",
			"preview.copied": "Copied",
			"preview.addToEdit": "Add to image to image",
			"config.missing": "API not configured: open \"Settings → Plugins → Configurable\" and fill in api_url and api_key for AI Image.",
			"config.generationTitle": "Configure the image API first",
			"config.generationHint": "DSH Settings → Plugins → AI Image has opened. Enter the image API URL and API key, then save before generating.",
			"config.enhancementTitle": "Configure a prompt enhancement model first",
			"config.enhancementHint": "DSH Settings → Plugins → AI Image has opened. Configure or reuse a chat API URL and key, choose a chat model, then save.",
			"config.disabledTitle": "The AI Image plugin is disabled",
			"config.disabledHint": "DSH Settings → Plugins → AI Image has opened. Enable the plugin, then generate images.",
			"config.configured": "Connected to {url}",
			"config.disabled": "The plugin is disabled — re-enable it in Settings.",
			"connection.connected": "Connected",
			"connection.disconnected": "Disconnected",
			"panel.collapseConfig": "Collapse settings panel",
			"panel.expandConfig": "Expand settings panel",
			"update.available": "A new version is available: {version}",
			"update.install": "Update online",
			"update.installing": "Updating…",
			"update.success": "Updated to {version}; restart DSH to load it",
			"update.failed": "Update failed; please try again",
			"update.release": "View Release",
			"settings.title": "AI Image (dsh-imagegen)",
			"settings.description": "Configure the image generation API endpoint and key",
			"settings.currentVersion": "Current version",
			"settings.apiUrl": "API URL (api_url)",
			"settings.apiUrlHint": "OpenAI-compatible base URL, e.g. https://api.openai.com/v1; /images/generations and /images/edits are appended",
			"settings.apiKey": "API Key (api_key)",
			"settings.apiKeyHint": "Bearer key, stored in plaintext in the local settings document; the UI only shows whether it is set",
			"settings.apiKeySet": "A key is stored; type a new value to replace it, or click \"Clear\" to remove it",
			"settings.apiKeyClear": "Clear",
			"settings.imageModelsTitle": "Image generation models",
			"settings.imageModelsHint": "Save the API URL and key, then detect candidate models. Select only models that actually support image generation.",
			"settings.imageModels": "Allowed image models",
			"settings.imageModelsManualHint": "One model per line. Add models manually when the API does not provide /models. The panel and Agent can use only this list.",
			"settings.imageModelsFetch": "Detect available models",
			"settings.imageModelsLoading": "Detecting…",
			"settings.imageModelsCandidates": "Detected candidate models (select, then save)",
			"settings.addModel": "+ Add manually",
			"settings.cancelAddModel": "Hide add",
			"settings.addModelPlaceholder": "Enter a model name, e.g. qwen-image",
			"settings.addModelConfirm": "Add",
			"settings.removeModel": "Remove model",
			"settings.optional": "Optional",
			"settings.moreOptions": "More settings",
			"settings.storageTitle": "Object storage sync",
			"settings.storageEnabled": "Enable object storage sync",
			"settings.storageHint": "After images land locally, mirror them to an S3-compatible store (Tencent COS / Alibaba OSS / Qiniu S3 / MinIO / R2 …)",
			"settings.storageEndpoint": "Endpoint (with bucket)",
			"settings.storageEndpointHint": "S3-compatible URL, e.g. https://bucket-appid.cos.ap-guangzhou.myqcloud.com or https://bucket.oss-cn-hangzhou.aliyuncs.com",
			"settings.storageRegion": "Region",
			"settings.storageRegionHint": "Region id used for signing, e.g. ap-guangzhou / oss-cn-hangzhou / cn-east-1",
			"settings.storagePrefix": "Key prefix",
			"settings.storagePrefixHint": "Object keys look like prefix/gallery|images/<file>",
			"settings.storageAccessKey": "Access Key",
			"settings.storageAccessKeyHint": "S3-compatible access key id (COS SecretId / OSS AccessKeyId / Qiniu AK)",
			"settings.storageSecretKey": "Secret Key",
			"settings.storageSecretKeyHint": "S3-compatible secret, stored only in the local settings document",
			"settings.storageSyncGallery": "Sync gallery images",
			"settings.storageSyncGalleryHint": "Upload images when they are added to the gallery",
			"settings.storageSyncHistory": "Sync history images",
			"settings.storageSyncHistoryHint": "Also upload every generation result (can be a lot)",
			"settings.storageTest": "Test connection",
			"settings.storageTesting": "Testing…",
			"settings.storageTestOk": "Connected ({ms} ms), probe file uploaded",
			"settings.storageTestFailed": "Connection failed: {error}",
			"settings.storageKeyHint": "Note: syncing is best-effort and never blocks local saving; browse synced files under this prefix in your provider console.",
			"settings.promptEnhanceTitle": "Prompt enhancement model",
			"settings.promptEnhanceHint": "Expands short requests into complete image prompts. Blank URL and key reuse the image API configuration.",
			"settings.promptApiUrl": "Chat API URL (optional)",
			"settings.promptApiUrlHint": "OpenAI-compatible base URL. Leave blank to reuse the image API URL.",
			"settings.promptApiKey": "Chat API key (optional)",
			"settings.promptApiKeyHint": "Leave blank to reuse the image API key.",
			"settings.promptModel": "Chat model",
			"settings.promptModelHint": "Select or enter a model supporting /chat/completions.",
			"settings.promptModelDetectionHint": "Uses the image API by default. Detect and select one model.",
			"settings.promptModelsFetch": "Fetch available models",
			"settings.promptModelsLoading": "Fetching…",
			"settings.promptModelsSelect": "Select a model",
			"settings.promptModelsCandidates": "Detected chat model candidates",
			"settings.addPromptModelPlaceholder": "Enter a chat model name, e.g. gpt-4.1-mini",
			"settings.promptApiAdvanced": "Use a separate chat API (optional)",
			"settings.announceToAgent": "Announce this plugin to agents",
			"settings.announceToAgentHint": "When on, the plugin presence and capabilities are written into every agent system prompt",
			"settings.allowAgentImageGeneration": "Allow agents to generate images",
			"settings.allowAgentImageGenerationHint": "On by default. When off, agents cannot submit, query, or cancel image tasks; the sidebar studio remains available.",
			"settings.enabled": "Enable plugin",
			"settings.enabledHint": "When off, the generation studio is unavailable (this card stays available)",
			"settings.save": "Save",
			"settings.saving": "Saving…",
			"settings.discard": "Discard",
			"settings.unsaved": "Unsaved changes",
			"settings.saveFailed": "Save failed, please retry",
			"settings.readOnly": "The settings document is read-only; saving is disabled.",
			"settings.notExposed": "Settings namespace unavailable: this deployment does not serve this plugin's settings.",
			"settings.expand": "Expand",
			"settings.collapse": "Collapse",
			"settings.inherit": "Inherit",
			"settings.on": "On",
			"settings.off": "Off",
			"settings.overridden": "Overridden",
			"settings.reset": "Reset",
			"settings.invalidNumber": "Enter a valid number",
			"templates.open": "Templates",
			"templates.title": "Prompt Template Library",
			"templates.sources": "Template sources",
			"templates.meta": "{count} templates · {origin}",
			"templates.origin.bundled": "bundled snapshot",
			"templates.origin.refreshed": "refreshed online",
			"templates.search": "Search template titles or prompts…",
			"templates.all": "All",
			"templates.close": "Close",
			"templates.back": "Back to list",
			"templates.use": "Use this prompt",
			"templates.copy": "Copy prompt",
			"templates.copied": "Copied",
			"templates.refresh": "Refresh this library",
			"templates.refreshing": "Refreshing…",
			"templates.refreshed": "Refreshed — {count} templates",
			"templates.refreshFailed": "Refresh failed: {error}",
			"templates.favorites": "Favorites",
			"templates.favoritesHint": "Show favorited templates only",
			"templates.favoritesEmpty": "No favorites yet — tap the star in a card's top-right corner to save one",
			"templates.favoriteAdd": "Favorite this template",
			"templates.favoriteRemove": "Remove from favorites",
			"templates.favorite": "Favorite",
			"templates.unfavorite": "Favorited",
			"templates.cacheAll": "Cache all images",
			"templates.cacheAllHint": "Mirror every reference image of the current library to local disk through the host proxy, for offline browsing",
			"templates.caching": "Caching {done}/{total}…",
			"templates.cached": "All images cached",
			"templates.empty": "No matching templates",
			"templates.loading": "Loading the template library…",
			"templates.loadFailed": "Failed to load the library: {error}",
			"templates.retry": "Retry",
			"templates.attribution": "Templates and images come from each source site; author links are on each template",
			"templates.source": "Source: {label}",
			"templates.featured": "Featured",
			"inspiration.title": "Inspiration",
			"inspiration.shuffle": "Shuffle",
			"inspiration.shuffling": "Shuffling…",
			"inspiration.useHint": "Click to use this prompt",
			"channels.title": "Channels",
			"channels.hint": "Fill in each channel's API URL and key to use its models",
			"channels.empty": "No channels yet — add one below",
			"channels.addProvider": "Add provider",
			"channels.addCustom": "Add custom channel",
			"channels.untitled": "Untitled channel",
			"channels.keySet": "Key set",
			"channels.keyMissing": "Key missing",
			"channels.modelCount": "{n} model(s)",
			"channels.noModels": "No models",
			"channels.defaultLabel": "Default",
			"channels.statusReady": "Ready",
			"channels.statusIncomplete": "Config incomplete",
			"channels.edit": "Edit",
			"channels.delete": "Delete",
			"channels.deleteConfirmTitle": "Delete channel \"{name}\"? Its key will be removed; history and gallery records are kept.",
			"channels.confirm": "Delete",
			"channels.cancel": "Cancel",
			"channels.editorTitle": "Channel",
			"channels.editorSaveNote": "Changes take effect with the card's \"Save\" button",
			"channels.displayName": "Display name",
			"channels.apiUrl": "API URL",
			"channels.apiKey": "API key",
			"channels.keyReplaceHint": "Configured — type a new value to replace it",
			"channels.keyMissingHint": "Enter a key",
			"channels.keyClear": "Clear key",
			"channels.modelCatalogTitle": "Model catalog",
			"channels.noModelsHint": "No models yet: run \"Detect\" to pull candidates, or add one manually; the alias (display name) defaults to the upstream model id and can be renamed.",
			"channels.detect": "Re-detect",
			"channels.detecting": "Detecting…",
			"channels.detectSuccess": "Connected ✓ · {n} candidates",
			"channels.detectFailed": "Detection failed: {error}",
			"channels.detectOk": "Connected to this API",
			"channels.modelAliasLabel": "Display name (alias)",
			"channels.modelIdLabel": "Upstream model id",
			"channels.generated": "Generated {n} time(s)",
			"channels.unknownProtocol": "Unknown protocol — best-effort OpenAI",
			"channels.removeModel": "Remove model",
			"channels.manualAddPlaceholder": "Enter a model id, e.g. qwen-image",
			"channels.addModelConfirm": "Add",
			"channels.copyFrom": "Copy from another channel…",
			"channels.copyApply": "Copy",
			"channels.candidatesTitle": "Image model candidates (click to add)",
			"channels.deleteThisChannel": "Delete this channel",
			"channels.setDefault": "Set as default channel",
			"channels.presetPickerTitle": "Add provider",
			"channels.presetPickerHint": "Pick a built-in provider — only the API key is needed",
			"channels.presetCustomHint": "Configure the API URL, key, and model catalog yourself",
			"channels.presetLoadFailed": "Failed to load providers: {error}"
		};
		/** Russian mirror of every key (полный словарь интерфейса). */
		const ru = {
			"entry.label": "ИИ-генерация",
			"entry.tooltip": "Панель ИИ-генерации изображений (gpt-image-2 / glm-image / grok-imagine-image / nanobanana / seedream)",
			"entry.newSession": "Новая сессия",
			"entry.newSessionTooltip": "Создать новую сессию DSH",
			"entry.image": "Генерация",
			"panel.title": "ИИ-генерация изображений",
			"panel.githubTip": "Понравился плагин или есть идеи? Поставьте звезду или откройте issue на GitHub!",
			"conversation.add": "В диалог",
			"conversation.adding": "Добавляем…",
			"conversation.added": "Изображение добавлено в текущий диалог",
			"conversation.addHint": "После добавления можно править через /edit_image; команда использует модель плагина",
			"conversation.noSession": "Сначала откройте сессию, затем добавьте изображение",
			"conversation.unavailable": "Текущая сессия недоступна",
			"conversation.busy": "Диалог отправляет сообщение, попробуйте позже",
			"mode.text": "Из текста",
			"mode.edit": "Из изображения",
			"workspace.label": "Режим работы",
			"workspace.normal": "Генерация",
			"workspace.canvas": "Бесконечный холст",
			"workspace.ecommerce": "E-commerce",
			"canvas.addImage": "Добавить изображение",
			"canvas.addText": "Добавить текст",
			"canvas.generate": "Создать изображение",
			"canvas.addToCanvas": "Добавить на холст",
			"canvas.untitled": "Безымянный холст",
			"canvas.imageNode": "Узел изображения",
			"canvas.textNode": "Текстовый узел",
			"canvas.fromGallery": "Из галереи",
			"canvas.fromHistory": "Из истории",
			"canvas.project": "Проект холста",
			"canvas.newCanvas": "Новый холст",
			"canvas.deleteCanvas": "Удалить холст",
			"canvas.deleteCanvasConfirm": "Нажмите ещё раз для подтверждения",
			"canvas.rename": "Переименовать холст",
			"canvas.renameHint": "Двойной клик — переименовать",
			"canvas.background": "Фон холста",
			"canvas.backgroundDots": "Точки",
			"canvas.backgroundLines": "Сетка",
			"canvas.backgroundDiagonal": "Диагональ",
			"canvas.backgroundChecker": "Шахматка",
			"canvas.backgroundBlank": "Пустой",
			"canvas.backgroundUpload": "Загрузить свой фон…",
			"canvas.backgroundRemove": "Убрать свой фон",
			"canvas.templateLibrary": "Библиотека шаблонов (выберите промпт — создадутся текстовый узел и узел конфигурации)",
			"canvas.undo": "Отменить (Ctrl+Z)",
			"canvas.redo": "Повторить (Ctrl+Shift+Z)",
			"canvas.saving": "Сохранение…",
			"canvas.saved": "Сохранено",
			"canvas.saveFailed": "Ошибка сохранения",
			"canvas.loading": "Загрузка…",
			"canvas.toolSelect": "Выбор / перемещение узлов",
			"canvas.toolPan": "Перетаскивание холста (Space / Ctrl)",
			"canvas.delete": "Удалить",
			"canvas.duplicate": "Дублировать (Ctrl+D)",
			"canvas.download": "Скачать изображение",
			"canvas.fitView": "Показать всё содержимое",
			"canvas.minimapOpen": "Открыть мини-карту",
			"canvas.minimapClose": "Скрыть мини-карту",
			"canvas.minimap": "Мини-карта холста",
			"canvas.zoom": "Масштаб",
			"canvas.textPlaceholder": "Введите текст…",
			"canvas.generatingNode": "Генерация…",
			"canvas.generateFailed": "Не удалось создать изображение",
			"canvas.retry": "Повторить",
			"canvas.taskLost": "Задача генерации потеряна (сервис перезапущен); повторите",
			"canvas.emptyImageNode": "Нажмите, чтобы загрузить изображение",
			"canvas.connectHint": "Потяните к другому узлу, чтобы соединить",
			"canvas.resizeHint": "Потяните, чтобы изменить размер (пропорции зафиксированы)",
			"canvas.count": "Кол-во изображений",
			"canvas.configNode": "Конфигурация генерации",
			"canvas.addConfigNode": "Добавить узел конфигурации",
			"canvas.configHint": "Подключите узлы изображений слева как референсы и текстовые узлы как промпт; выберите этот узел и генерируйте через панель ниже.",
			"canvas.composerLinked": "Подключено узлов ввода: {count}",
			"canvas.composerPlaceholder": "Опишите изображение; либо подключите текстовые узлы как промпт…",
			"canvas.countUnit": "{count} шт.",
			"canvas.model": "Модель изображений",
			"canvas.modelPlaceholder": "Выберите модель",
			"canvas.size": "Пропорции",
			"canvas.sizeAuto": "Авто",
			"canvas.quality": "Качество",
			"canvas.qualityAuto": "Авто",
			"canvas.needApi": "Сначала настройте API генерации",
			"canvas.needPrompt": "Введите описание генерации",
			"canvas.needModel": "Нет доступной модели изображений",
			"canvas.openSettings": "Открыть настройки",
			"canvas.deleteConnection": "Удалить связь",
			"canvas.paste": "Вставить (Ctrl+V)",
			"canvas.addImageNode": "Добавить узел изображения",
			"canvas.addTextNode": "Добавить текстовый узел",
			"canvas.dismiss": "Закрыть",
			"canvas.close": "Закрыть",
			"canvas.tabUpload": "Загрузка",
			"canvas.tabHistory": "История",
			"canvas.tabGallery": "Материалы",
			"canvas.imageMenuUpload": "Загрузить локальное изображение",
			"canvas.imageMenuAssets": "Выбрать из материалов",
			"canvas.imageMenuHistory": "Выбрать из истории",
			"canvas.imageMenuGenerate": "Создать через AI",
			"canvas.tabGenerate": "AI-генерация",
			"canvas.dropHint": "Перетащите изображения сюда",
			"canvas.dropSub": "Несколько файлов, PNG / JPG / WebP / GIF",
			"canvas.untitledWork": "Без названия",
			"canvas.picked": "Выбрано: {count}",
			"canvas.generateAndAdd": "Создать и добавить на холст",
			"chat.expand": "Показать диалог",
			"chat.collapse": "Скрыть диалог",
			"chat.toggle": "Диалог",
			"config.resizeHint": "Потяните, чтобы изменить ширину панели параметров",
			"ecommerce.generation": "Параметры генерации",
			"ecommerce.title": "Режим e-commerce",
			"ecommerce.badge": "Превью",
			"ecommerce.short": "E-com",
			"ecommerce.anchorPending": "Главное изображение готово, остальные генерируются по нему для единого стиля…",
			"ecommerce.anchorFailed": "Не удалось создать главное изображение, остальные приостановлены. Повторите главное (или всю группу) и продолжите.",
			"ecommerce.anchorNote": "Якорная генерация: сначала главное изображение, остальные создаются по нему для единого стиля",
			"ecommerce.noAssetWarn": "Товар не загружен: главное изображение будет создано по описанию и станет якорем; загрузите фото товара для большей точности",
			"ecommerce.product": "Товар",
			"ecommerce.productName": "Название товара (обязательно)",
			"ecommerce.projectName": "Название проекта (необязательно)",
			"ecommerce.constraints": "Преимущества и ограничения",
			"ecommerce.sellingPoints": "Преимущества товара, например: водостойкость / большая вместимость / компактность",
			"ecommerce.protectedFeatures": "Что обязательно сохранить: цвет, логотип, текст упаковки, конструкцию",
			"ecommerce.styleHint": "Стиль, например: премиальный / реалистичный / естественный свет",
			"ecommerce.setStructure": "Структура комплекта",
			"ecommerce.preview": "Создать превью комплекта",
			"ecommerce.planTitle": "Будет сгенерировано изображений: {count}",
			"ecommerce.planSlot": "{count} шт. · {description}",
			"ecommerce.confirm": "Сгенерировать весь комплект",
			"ecommerce.uploadRef": "Материалы товара (необязательно, до 4 шт.: товар / упаковка / детали / стиль)",
			"ecommerce.uploadShort": "Загрузить материалы",
			"ecommerce.sellingTitle": "Преимущества товара",
			"ecommerce.advanced": "Дополнительно (площадка / ограничения)",
			"ecommerce.params": "Параметры",
			"ecommerce.platformLabel": "Площадка",
			"ecommerce.languageLabel": "Язык текста",
			"ecommerce.customLanguageOption": "Свой язык…",
			"ecommerce.customLanguageLabel": "Свой язык",
			"ecommerce.customLanguagePlaceholder": "Введите язык, например: Русский / 日本語 / Português",
			"ecommerce.ratioLabel": "Пропорции",
			"ecommerce.categoryLabel": "Категория",
			"ecommerce.multiSelect": "Можно выбрать несколько",
			"ecommerce.countHint": "Нажмите, чтобы изменить количество (1-4)",
			"ecommerce.refSettings": "Настройки референсов (необязательно)",
			"ecommerce.styleTitle": "Стиль / дополнения",
			"ecommerce.protectedLabel": "Обязательно сохранить (необязательно)",
			"ecommerce.assetsFull": "Не более 4 материалов",
			"ecommerce.refSelect": "Референс для этого назначения",
			"ecommerce.refNone": "Без референса",
			"ecommerce.role.product": "Товар",
			"ecommerce.role.packaging": "Упаковка",
			"ecommerce.role.detail": "Детали/ракурс",
			"ecommerce.role.style": "Стиль",
			"ecommerce.footerReady": "Будет сгенерировано {count} изображений",
			"ecommerce.footerEmpty": "Выберите структуру комплекта",
			"ecommerce.results.title": "Результаты комплекта",
			"ecommerce.results.progress": "{done}/{total} готово",
			"ecommerce.results.failed": "{count} с ошибкой",
			"ecommerce.results.empty": "После запуска генерации здесь появятся статус и результат каждого изображения",
			"ecommerce.results.regenerate": "Сгенерировать заново",
			"ecommerce.results.export": "Экспорт списка",
			"ecommerce.results.newProduct": "Новый товар",
			"prompt.placeholder": "Опишите желаемое изображение, например: рыжий кот в шлеме космонавта смотрит в телескоп на Луне, акварель, мягкий свет…",
			"prompt.required": "Введите промпт",
			"prompt.count": "{count}",
			"prompt.enhance": "Улучш.",
			"prompt.enhancing": "Улучшаем…",
			"prompt.enhanceHint": "Развернуть краткий промпт через настроенную диалоговую модель",
			"prompt.configTitle": "Сначала настройте модель улучшения промптов",
			"prompt.configHint": "Настройки открыты. Перейдите в «Плагины → ИИ-генерация», укажите или переиспользуйте API-адрес и ключ, выберите диалоговую модель и сохраните.",
			"tasks.title": "Задачи генерации",
			"tasks.queued": "В очереди",
			"tasks.running": "Генерация",
			"tasks.completed": "Готово",
			"tasks.failed": "Ошибка",
			"tasks.cancelled": "Отменено",
			"tasks.cancel": "Отменить",
			"tasks.retry": "Повторить",
			"params.size": "Размер",
			"params.quality": "Чёткость",
			"params.count": "Количество",
			"params.detail": "Детализация",
			"size.auto": "Авто",
			"size.square": "1:1 квадрат",
			"size.portrait34": "3:4 верт.",
			"size.landscape43": "4:3 гориз.",
			"size.portrait916": "9:16 верт.",
			"size.portrait23": "2:3 верт.",
			"size.landscape32": "3:2 гориз.",
			"size.wide169": "16:9 шир.",
			"size.ultrawide21": "21:9 ультрашир.",
			"quality.auto": "Авто",
			"quality.1k": "1K",
			"quality.2k": "2K",
			"quality.4k": "4K",
			"count.one": "1 шт.",
			"count.two": "2 шт.",
			"count.three": "3 шт.",
			"count.four": "4 шт.",
			"detail.auto": "Авто",
			"detail.standard": "Стандарт",
			"detail.high": "Высокая",
			"detail.hint": "Сквозной параметр, поддерживают некоторые шлюзы gpt-image-2; для официального API оставьте «Авто»",
			"model.label": "Модель",
			"model.noEditModels": "В текущем режиме нет доступных моделей",
			"compare.enable": "Сравнение моделей",
			"compare.models": "Модели для сравнения",
			"compare.title": "Сравнение результатов моделей",
			"compare.fullscreen": "Полноэкранное сравнение",
			"compare.selectRequired": "Выберите хотя бы одну модель для сравнения",
			"generate": "Сгенерировать",
			"generating": "Генерация…",
			"edit.upload": "Нажмите или перетащите референс",
			"edit.uploadHint": "PNG / JPG / WEBP, до 10 МБ",
			"edit.change": "Заменить изображение",
			"edit.remove": "Убрать",
			"edit.required": "Сначала загрузите референс",
			"canvas.emptyTitle": "Начните творить",
			"canvas.emptyHint": "Двойной клик или нижняя панель добавляют узлы; соедините узлы изображений и текста с целевым узлом, выберите его и генерируйте внизу",
			"canvas.new": "Новая генерация",
			"canvas.newHint": "Начать новую генерацию и очистить просмотр",
			"canvas.error": "Ошибка генерации: {error}",
			"canvas.submitting": "Ставим в очередь…",
			"canvas.queued": "Задача в очереди",
			"canvas.queueHint": "Сейчас ожидают {count} задач",
			"canvas.generating": "Генерируем изображение…",
			"canvas.elapsed": "Прошло {seconds} с",
			"canvas.images": "Сгенерировано: {count}",
			"download": "Скачать",
			"revisedPrompt": "Улучшенный промпт: {prompt}",
			"history.title": "История",
			"history.empty": "Истории пока нет — созданные изображения появятся здесь",
			"history.clear": "Очистить",
			"history.clearConfirm": "Очистить всю историю? Действие необратимо.",
			"history.restore": "Восстановить",
			"history.delete": "Удалить",
			"history.images": "шт.",
			"history.viewing": "История · {time}",
			"history.search": "Поиск по промптам и моделям…",
			"history.model": "Фильтр по модели",
			"history.ratio": "Фильтр по пропорциям",
			"history.allModels": "Все модели",
			"history.allRatios": "Все пропорции",
			"gallery.title": "Материалы",
			"gallery.categories": "Категории",
			"gallery.all": "Все материалы",
			"gallery.upload": "Загрузить",
			"gallery.uploadModel": "Локальный файл",
			"gallery.uploaded": "Материал добавлен",
			"gallery.uploadHint": "Сохраните локальные изображения для холста",
			"gallery.gpt": "gpt-image-2",
			"gallery.grok": "grok-imagine-image",
			"gallery.ratio": "Пропорции",
			"gallery.tags": "Метки",
			"gallery.filterHint": "Фильтр галереи по режиму, модели и пропорциям",
			"gallery.count": "· всего {count}",
			"gallery.viewMode": "Вид",
			"gallery.masonry": "Плитка",
			"gallery.grid": "Сетка",
			"gallery.sort": "Сортировка",
			"gallery.newest": "Сначала новые",
			"gallery.oldest": "Сначала старые",
			"gallery.untitled": "Без названия",
			"gallery.search": "Поиск по работам и моделям…",
			"gallery.tagsPlaceholder": "Метки через запятую",
			"gallery.tagsApply": "Добавить метки",
			"gallery.editTags": "Править метки",
			"gallery.tagsEditShort": "Правка",
			"gallery.tagsSave": "Сохранить",
			"gallery.tagsCancel": "Отмена",
			"gallery.selected": "Выбрано: {count}",
			"gallery.selectionDone": "Завершить выбор",
			"gallery.selectionClear": "Снять выбор",
			"gallery.downloadSelected": "Скачать выбранные",
			"gallery.exportJson": "Экспорт JSON",
			"gallery.select": "Выбрать работы",
			"gallery.add": "В галерею",
			"gallery.added": "Добавлено в галерею",
			"gallery.already": "Уже в галерее",
			"gallery.delete": "Убрать из галереи",
			"gallery.openFolder": "Открыть папку",
			"gallery.clear": "Очистить галерею",
			"gallery.openFolderHint": "Открыть каталог сохранения изображений (~/.dsh/dsh-imagegen) в проводнике",
			"gallery.clearConfirm": "Очистить всю галерею? Действие необратимо.",
			"gallery.empty": "Галерея пуста — добавьте понравившиеся изображения",
			"gallery.viewing": "Галерея · {time}",
			"preview.title": "Просмотр изображения",
			"preview.open": "Открыть просмотр",
			"preview.close": "Закрыть",
			"preview.prev": "Назад",
			"preview.next": "Вперёд",
			"preview.index": "{index} / {total}",
			"preview.zoomControls": "Управление масштабом",
			"preview.zoomIn": "Увеличить",
			"preview.zoomOut": "Уменьшить",
			"preview.zoomReset": "Сбросить масштаб",
			"preview.zoomLevel": "{percent}%",
			"preview.copyPrompt": "Копировать промпт",
			"preview.copied": "Скопировано",
			"preview.addToEdit": "В режим img2img",
			"config.missing": "API не настроен: откройте «Настройки → Плагины → Настраиваемые» и заполните api_url и api_key для ИИ-генерации.",
			"config.generationTitle": "Сначала настройте API генерации",
			"config.generationHint": "Открыты «Настройки → Плагины → ИИ-генерация». Укажите адрес и ключ API генерации, сохраните — и можно творить.",
			"config.enhancementTitle": "Сначала настройте модель улучшения промптов",
			"config.enhancementHint": "Открыты «Настройки → Плагины → ИИ-генерация». Укажите или переиспользуйте адрес и ключ диалогового API, выберите модель и сохраните.",
			"config.disabledTitle": "Плагин ИИ-генерации отключён",
			"config.disabledHint": "Открыты «Настройки → Плагины → ИИ-генерация». Включите плагин — и генерация заработает.",
			"config.configured": "Подключено: {url}",
			"config.disabled": "Плагин отключён — включите его в настройках.",
			"connection.connected": "Подключено",
			"connection.disconnected": "Нет подключения",
			"panel.collapseConfig": "Свернуть параметры",
			"panel.expandConfig": "Развернуть параметры",
			"update.available": "Доступна новая версия: {version}",
			"update.install": "Обновить онлайн",
			"update.installing": "Обновляем…",
			"update.success": "Обновлено до {version}, перезапустите DSH",
			"update.failed": "Не удалось обновить, попробуйте ещё раз",
			"update.release": "Открыть релиз",
			"settings.title": "ИИ-генерация (dsh-imagegen)",
			"settings.description": "Адрес и ключ API генерации изображений",
			"settings.currentVersion": "Текущая версия",
			"settings.apiUrl": "Адрес API (api_url)",
			"settings.apiUrlHint": "База OpenAI-совместимого API, например https://api.openai.com/v1; /images/generations и /images/edits дописываются автоматически",
			"settings.apiKey": "Ключ API (api_key)",
			"settings.apiKeyHint": "Bearer-ключ хранится открыто в локальном документе настроек; интерфейс показывает лишь факт его наличия",
			"settings.apiKeySet": "Ключ сохранён; введите новый, чтобы заменить, или нажмите «Очистить»",
			"settings.apiKeyClear": "Очистить",
			"settings.imageModelsTitle": "Модели генерации",
			"settings.imageModelsHint": "После сохранения адреса и ключа будут найдены кандидаты; выбирайте только те, что реально умеют генерировать изображения.",
			"settings.imageModels": "Разрешённые модели генерации",
			"settings.imageModelsManualHint": "По одной модели в строке; можно заполнить вручную, если API не отдаёт /models. Панель и агент используют только этот список.",
			"settings.imageModelsFetch": "Найти модели",
			"settings.imageModelsLoading": "Ищем…",
			"settings.imageModelsCandidates": "Найденные кандидаты (отметьте и сохраните)",
			"settings.addModel": "+ Добавить вручную",
			"settings.cancelAddModel": "Скрыть добавление",
			"settings.addModelPlaceholder": "Имя модели, например qwen-image",
			"settings.addModelConfirm": "Добавить",
			"settings.removeModel": "Удалить модель",
			"settings.optional": "необязательно",
			"settings.moreOptions": "Дополнительно",
			"settings.storageTitle": "Синхронизация с объектным хранилищем",
			"settings.storageEnabled": "Включить синхронизацию",
			"settings.storageHint": "После сохранения локально изображения выгружаются в S3-совместимое хранилище (Tencent COS / Alibaba OSS / Qiniu S3 / MinIO / R2…)",
			"settings.storageEndpoint": "Адрес (с бакетом)",
			"settings.storageEndpointHint": "S3-совместимый URL, например https://bucket-appid.cos.ap-guangzhou.myqcloud.com",
			"settings.storageRegion": "Регион",
			"settings.storageRegionHint": "ID региона для подписи, например ap-guangzhou / oss-cn-hangzhou / cn-east-1",
			"settings.storagePrefix": "Префикс ключей",
			"settings.storagePrefixHint": "Ключи объекта: префикс/gallery|images/<файл>",
			"settings.storageAccessKey": "Access Key",
			"settings.storageAccessKeyHint": "S3-совместимый идентификатор ключа",
			"settings.storageSecretKey": "Secret Key",
			"settings.storageSecretKeyHint": "S3-совместимый секрет, хранится только в локальных настройках",
			"settings.storageSyncGallery": "Синхронизировать галерею",
			"settings.storageSyncGalleryHint": "Выгружать изображения при добавлении в галерею",
			"settings.storageSyncHistory": "Синхронизировать историю",
			"settings.storageSyncHistoryHint": "Также выгружать все результаты генерации (их может быть много)",
			"settings.storageTest": "Проверить соединение",
			"settings.storageTesting": "Проверяем…",
			"settings.storageTestOk": "Соединение в порядке ({ms} мс), тестовый файл загружен",
			"settings.storageTestFailed": "Ошибка соединения: {error}",
			"settings.storageKeyHint": "Синхронизация выполняется по возможности и никогда не блокирует локальное сохранение.",
			"settings.promptEnhanceTitle": "Модель улучшения промптов",
			"settings.promptEnhanceHint": "Разворачивает краткое описание в полноценный промпт; пустые адрес и ключ наследуют настройки генерации.",
			"settings.promptApiUrl": "Адрес диалогового API (необязательно)",
			"settings.promptApiUrlHint": "OpenAI-совместимая база; если пусто — используется адрес API генерации.",
			"settings.promptApiKey": "Ключ диалогового API (необязательно)",
			"settings.promptApiKeyHint": "Если пусто — используется ключ API генерации.",
			"settings.promptModel": "Диалоговая модель",
			"settings.promptModelHint": "Выберите или впишите модель с поддержкой /chat/completions.",
			"settings.promptModelDetectionHint": "По умолчанию используется API генерации; после поиска просто выберите модель.",
			"settings.promptModelsFetch": "Получить модели",
			"settings.promptModelsLoading": "Получаем…",
			"settings.promptModelsSelect": "Выберите модель",
			"settings.promptModelsCandidates": "Найденные диалоговые модели",
			"settings.addPromptModelPlaceholder": "Имя диалоговой модели, например gpt-4.1-mini",
			"settings.promptApiAdvanced": "Отдельный диалоговый API (необязательно)",
			"settings.announceToAgent": "Оповещать агентов о плагине",
			"settings.announceToAgentHint": "Включено — возможности плагина добавляются в системный промпт каждого агента",
			"settings.allowAgentImageGeneration": "Разрешить агентам генерацию",
			"settings.allowAgentImageGenerationHint": "Включено по умолчанию. Выключено — агенты не могут создавать, смотреть или отменять задачи; боковая панель работает.",
			"settings.enabled": "Включить плагин",
			"settings.enabledHint": "Выключено — панель генерации недоступна (карточка настроек работает всегда)",
			"settings.save": "Сохранить",
			"settings.saving": "Сохраняем…",
			"settings.discard": "Отменить правки",
			"settings.unsaved": "Есть несохранённые правки",
			"settings.saveFailed": "Не удалось сохранить, попробуйте ещё раз",
			"settings.readOnly": "Документ настроек сейчас только для чтения, сохранить нельзя.",
			"settings.notExposed": "Пространство настроек недоступно: этот деплой не предоставляет сервис настроек плагина.",
			"settings.expand": "Развернуть",
			"settings.collapse": "Свернуть",
			"settings.inherit": "Наследовать",
			"settings.on": "Вкл",
			"settings.off": "Выкл",
			"settings.overridden": "Переопределено",
			"settings.reset": "Сбросить",
			"settings.invalidNumber": "Введите корректное число",
			"templates.open": "Шаблоны",
			"templates.title": "Библиотека промпт-шаблонов",
			"templates.sources": "Источники шаблонов",
			"templates.meta": "Всего шаблонов: {count} · {origin}",
			"templates.origin.bundled": "встроенный снимок",
			"templates.origin.refreshed": "обновлено онлайн",
			"templates.search": "Поиск по названиям и промптам…",
			"templates.all": "Все",
			"templates.close": "Закрыть",
			"templates.back": "К списку",
			"templates.use": "Использовать промпт",
			"templates.copy": "Копировать промпт",
			"templates.copied": "Скопировано",
			"templates.refresh": "Обновить библиотеку",
			"templates.refreshing": "Обновляем…",
			"templates.refreshed": "Обновлено, шаблонов: {count}",
			"templates.refreshFailed": "Ошибка обновления: {error}",
			"templates.favorites": "Избранное",
			"templates.favoritesHint": "Показать только избранные шаблоны",
			"templates.favoritesEmpty": "Пока пусто — нажмите звёздочку в углу карточки, чтобы сохранить шаблон",
			"templates.favoriteAdd": "Добавить в избранное",
			"templates.favoriteRemove": "Убрать из избранного",
			"templates.favorite": "В избранное",
			"templates.unfavorite": "В избранном",
			"templates.cacheAll": "Кэшировать все картинки",
			"templates.cacheAllHint": "Через локальный прокси сохранит все референсы этой библиотеки на диск — дальше доступно офлайн",
			"templates.caching": "Кэшируем {done}/{total}…",
			"templates.cached": "Все картинки закэшированы",
			"templates.empty": "Нет подходящих шаблонов",
			"templates.loading": "Загружаем библиотеку…",
			"templates.loadFailed": "Не удалось загрузить библиотеку: {error}",
			"templates.retry": "Повторить",
			"templates.attribution": "Шаблоны и изображения принадлежат сайтам-источникам; ссылки на авторов — в карточках",
			"templates.source": "Источник: {label}",
			"templates.featured": "Выбор редакции",
			"inspiration.title": "Вдохновение",
			"inspiration.shuffle": "Другие",
			"inspiration.shuffling": "Подбираем…",
			"inspiration.useHint": "Нажмите, чтобы использовать промпт",
			"channels.title": "Каналы",
			"channels.hint": "Укажите адрес и ключ API каждого канала — и модели станут доступны",
			"channels.empty": "Каналов пока нет — добавьте кнопкой ниже",
			"channels.addProvider": "Добавить провайдера",
			"channels.addCustom": "Добавить свой канал",
			"channels.untitled": "Канал без названия",
			"channels.keySet": "Ключ задан",
			"channels.keyMissing": "Ключ не задан",
			"channels.modelCount": "Моделей: {n}",
			"channels.noModels": "Модели не настроены",
			"channels.defaultLabel": "По умолчанию",
			"channels.statusReady": "Готов",
			"channels.statusIncomplete": "Настройка не завершена",
			"channels.edit": "Править",
			"channels.delete": "Удалить",
			"channels.deleteConfirmTitle": "Удалить канал «{name}»? Ключ канала будет удалён; история и галерея сохранятся.",
			"channels.confirm": "Удалить",
			"channels.cancel": "Отмена",
			"channels.editorTitle": "Канал",
			"channels.editorSaveNote": "Изменения вступят в силу после «Сохранить» внизу карточки",
			"channels.displayName": "Название",
			"channels.apiUrl": "Адрес API",
			"channels.apiKey": "Ключ API",
			"channels.keyReplaceHint": "Задан — введите новый, чтобы заменить",
			"channels.keyMissingHint": "Введите ключ",
			"channels.keyClear": "Очистить ключ",
			"channels.modelCatalogTitle": "Каталог моделей",
			"channels.noModelsHint": "Моделей пока нет: нажмите «Найти» для списка кандидатов или добавьте вручную; псевдоним по умолчанию равен id модели и его можно менять.",
			"channels.detect": "Найти снова",
			"channels.detecting": "Ищем…",
			"channels.detectSuccess": "Связь есть ✓ · кандидатов: {n}",
			"channels.detectFailed": "Ошибка поиска: {error}",
			"channels.detectOk": "API отвечает",
			"channels.modelAliasLabel": "Псевдоним (отображается)",
			"channels.modelIdLabel": "id модели у провайдера",
			"channels.generated": "Сгенерировано: {n}",
			"channels.unknownProtocol": "Протокол неизвестен — пробуем универсальный OpenAI",
			"channels.removeModel": "Удалить модель",
			"channels.manualAddPlaceholder": "id модели, например qwen-image",
			"channels.addModelConfirm": "Добавить",
			"channels.copyFrom": "Скопировать из канала…",
			"channels.copyApply": "Копировать",
			"channels.candidatesTitle": "Кандидаты (нажмите, чтобы добавить)",
			"channels.deleteThisChannel": "Удалить этот канал",
			"channels.setDefault": "Сделать каналом по умолчанию",
			"channels.presetPickerTitle": "Добавить провайдера",
			"channels.presetPickerHint": "Выберите встроенного провайдера — останется ввести только ключ API",
			"channels.presetCustomHint": "Свой адрес, ключ и каталог моделей",
			"channels.presetLoadFailed": "Не удалось загрузить провайдеров: {error}"
		};
		//#endregion
		//#region src/client/helpers.ts
		/**
		* Shared panel helpers: the active-dictionary pick bound to the dsh-imagegen
		* interpolator, the plugin locale that follows the DSH interface language
		* (bridged in client/index.ts from ctx.locale — the plugin ships zh / en / ru
		* and registers itself as a DSH language pack for Русский), plus a small
		* error-message extractor. All copy stays in the locale dictionaries.
		*/
		const DICTIONARIES = {
			zh,
			en,
			ru
		};
		/** The active DSH locale mapped onto our dictionary (module-level, one value per app). */
		let activeLocale = "zh";
		/** Bumped on every locale change; useSyncExternalStore version. */
		let languageVersion = 0;
		const languageListeners = /* @__PURE__ */ new Set();
		/**
		* Adopt the DSH interface language. Unknown ids (future language packs)
		* resolve to English — the same per-key fallback convention the host locale
		* chain uses.
		*/
		function applyHostLocale(id) {
			const next = id === "zh" || id === "ru" ? id : "en";
			if (next === activeLocale) return;
			activeLocale = next;
			languageVersion += 1;
			for (const listener of [...languageListeners]) listener();
		}
		/** Monotonic version of the active locale (external-store snapshot). */
		function getImageGenLanguageVersion() {
			return languageVersion;
		}
		/** Observe locale changes; returns the unsubscriber. */
		function subscribeImageGenLanguage(listener) {
			languageListeners.add(listener);
			return () => {
				languageListeners.delete(listener);
			};
		}
		/** Active dictionary for the current DSH language. */
		function dictionary() {
			return DICTIONARIES[activeLocale];
		}
		/** Translate a key with optional {name} template params (current language). */
		function tt(key, values) {
			const text = dictionary()[key] ?? key;
			if (values === void 0) return text;
			let rendered = text;
			for (const [name, value] of Object.entries(values)) rendered = rendered.replaceAll(`{${name}}`, String(value));
			return rendered;
		}
		/** Human-readable error text from an unknown thrown value. */
		function errorMessage(error) {
			if (error instanceof Error) return error.message;
			return String(error);
		}
		//#endregion
		//#region \0dsh-css:/Users/shigure/claude-home/audit/dsh-imagegen/src/client/templates.module.css.mjs
		const css$5 = ".HNYu5a_overlay,.HNYu5a_overlay *,.HNYu5a_overlay :before,.HNYu5a_overlay :after{box-sizing:border-box}.HNYu5a_overlay{z-index:130;background:var(--dsw-alias-bg-mask-1);color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family);justify-content:center;align-items:center;padding:28px;display:flex;position:fixed;inset:0}.HNYu5a_shell{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);border-radius:14px;flex-direction:column;width:min(1180px,100%);height:100%;max-height:100%;display:flex;overflow:hidden;box-shadow:0 18px 60px #00000047}.HNYu5a_header{flex:none;justify-content:space-between;align-items:center;gap:12px;padding:14px 18px 10px;display:flex}.HNYu5a_heading{align-items:baseline;gap:10px;min-width:0;display:flex}.HNYu5a_title{margin:0;font-size:15px;font-weight:650}.HNYu5a_meta{color:var(--dsw-alias-label-tertiary);white-space:nowrap;font-size:12px}.HNYu5a_headerActions{flex:none;align-items:center;gap:8px;display:inline-flex}.HNYu5a_close{width:28px;height:28px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;border-radius:8px;justify-content:center;align-items:center;display:inline-flex}.HNYu5a_close:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.HNYu5a_sourceTabs{border-bottom:1px solid var(--dsw-alias-border-l1);flex:none;align-items:center;gap:6px;padding:0 18px 10px;display:flex}.HNYu5a_sourceTab{height:30px;color:var(--dsw-alias-label-secondary);cursor:pointer;white-space:nowrap;background:0 0;border:1px solid #0000;border-bottom:none;border-radius:9px 9px 0 0;align-items:center;gap:6px;padding:0 14px;font-family:inherit;font-size:13px;font-weight:600;display:inline-flex}.HNYu5a_sourceTab:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}.HNYu5a_sourceTab[data-active]{border-color:var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-brand-primary);border-radius:9px}.HNYu5a_sourceTabCount{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-tertiary);border-radius:999px;padding:0 6px;font-size:11px;font-weight:500}.HNYu5a_sourceTab[data-active] .HNYu5a_sourceTabCount{color:var(--dsw-alias-label-secondary)}.HNYu5a_toolbar{flex-direction:column;flex:none;gap:10px;padding:0 18px 12px;display:flex}.HNYu5a_search{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);width:100%;height:34px;color:var(--dsw-alias-label-primary);border-radius:9px;outline:none;padding:0 12px;font-family:inherit;font-size:13px}.HNYu5a_search:focus{border-color:var(--dsw-alias-brand-primary)}.HNYu5a_search::placeholder{color:var(--dsw-alias-label-dimmed)}.HNYu5a_categoryRow{flex-wrap:wrap;gap:6px;max-height:64px;display:flex;overflow-y:auto}.HNYu5a_categoryPill{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);height:26px;color:var(--dsw-alias-label-secondary);cursor:pointer;white-space:nowrap;border-radius:999px;padding:0 11px;font-family:inherit;font-size:12px}.HNYu5a_categoryPill:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}.HNYu5a_categoryPill[data-active]{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-base)}.HNYu5a_notice{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);border-radius:9px;flex:none;margin:0 18px 10px;padding:8px 12px;font-size:12px}.HNYu5a_body{flex:1;min-height:0;padding:2px 18px 14px;overflow-y:auto}.HNYu5a_state{height:100%;min-height:220px;color:var(--dsw-alias-label-tertiary);flex-direction:column;justify-content:center;align-items:center;gap:12px;font-size:13px;display:flex}.HNYu5a_spinner{border:2px solid var(--dsw-alias-border-l2);border-top-color:var(--dsw-alias-brand-primary);border-radius:50%;width:26px;height:26px;animation:.9s linear infinite HNYu5a_dsh-imagegen-templates-spin}@keyframes HNYu5a_dsh-imagegen-templates-spin{to{transform:rotate(360deg)}}.HNYu5a_grid{grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;display:grid}.HNYu5a_card{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);cursor:pointer;text-align:left;color:var(--dsw-alias-label-primary);border-radius:11px;flex-direction:column;gap:0;padding:0;font-family:inherit;transition:border-color .15s,transform .15s;display:flex;overflow:hidden}.HNYu5a_card:hover{border-color:var(--dsw-alias-brand-primary);transform:translateY(-1px)}.HNYu5a_thumbWrap{aspect-ratio:1;background:var(--dsw-alias-bg-layer-2);width:100%;display:block;position:relative}.HNYu5a_thumb{object-fit:cover;width:100%;height:100%;display:block}.HNYu5a_thumbPlaceholder{width:100%;height:100%;color:var(--dsw-alias-label-dimmed);justify-content:center;align-items:center;display:flex}.HNYu5a_featuredBadge{background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-base);border-radius:999px;padding:2px 8px;font-size:11px;font-weight:600;position:absolute;top:8px;left:8px}.HNYu5a_favStar{color:#ffffffd9;cursor:pointer;opacity:0;background:#00000059;border:none;border-radius:8px;justify-content:center;align-items:center;width:26px;height:26px;padding:0;transition:opacity .15s;display:inline-flex;position:absolute;top:6px;right:6px}.HNYu5a_card:hover .HNYu5a_favStar,.HNYu5a_favStar:focus-visible,.HNYu5a_favStar[data-active]{opacity:1}.HNYu5a_favStar:hover{color:#fff;background:#0000008c}.HNYu5a_favStar[data-active]{color:#ffb020}@media (hover:none){.HNYu5a_favStar{opacity:1}}.HNYu5a_cardBody{flex-direction:column;gap:4px;min-width:0;padding:9px 11px 10px;display:flex}.HNYu5a_cardTitle{-webkit-line-clamp:2;-webkit-box-orient:vertical;font-size:12.5px;font-weight:600;line-height:1.35;display:-webkit-box;overflow:hidden}.HNYu5a_cardMeta{min-width:0;color:var(--dsw-alias-label-tertiary);align-items:center;gap:6px;font-size:11px;display:flex}.HNYu5a_cardCategory{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);border-radius:999px;flex:none;padding:1px 7px}.HNYu5a_cardSource{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.HNYu5a_footer{border-top:1px solid var(--dsw-alias-border-l1);flex:none;justify-content:space-between;align-items:center;gap:10px;padding:9px 18px;display:flex}.HNYu5a_attribution{color:var(--dsw-alias-label-dimmed);min-width:0;font-size:11.5px}.HNYu5a_sourceLink{color:var(--dsw-alias-brand-primary);white-space:nowrap;flex:none;font-size:11.5px;font-weight:600;text-decoration:none}.HNYu5a_sourceLink:hover{text-decoration:underline}.HNYu5a_detailOverlay{background:var(--dsw-alias-bg-mask-1);justify-content:center;align-items:center;padding:34px;display:flex;position:absolute;inset:0}.HNYu5a_detail{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);border-radius:14px;grid-template-rows:minmax(0,1fr);grid-template-columns:minmax(0,5fr) minmax(0,4fr);gap:0;width:min(980px,100%);max-height:100%;display:grid;overflow:hidden;box-shadow:0 18px 60px #00000052}.HNYu5a_detailMedia{background:var(--dsw-alias-bg-layer-2);justify-content:center;align-items:center;min-height:0;display:flex;overflow:hidden}.HNYu5a_detailImage{object-fit:contain;width:100%;height:100%;display:block}.HNYu5a_detailInfo{flex-direction:column;gap:10px;min-height:0;padding:18px;display:flex;overflow-y:auto}.HNYu5a_detailTitle{margin:0;font-size:15px;font-weight:650;line-height:1.4}.HNYu5a_detailMeta{color:var(--dsw-alias-label-tertiary);flex-wrap:wrap;align-items:center;gap:8px;font-size:12px;display:flex}.HNYu5a_detailLink{color:var(--dsw-alias-brand-primary);text-overflow:ellipsis;white-space:nowrap;text-decoration:none;overflow:hidden}.HNYu5a_detailLink:hover{text-decoration:underline}.HNYu5a_detailPrompt{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);min-height:0;color:var(--dsw-alias-label-primary);white-space:pre-wrap;word-break:break-word;user-select:text;border-radius:10px;flex:1;margin:0;padding:12px;font-family:inherit;font-size:12.5px;line-height:1.6;overflow-y:auto}.HNYu5a_detailActions{background:var(--dsw-alias-bg-base);border-top:1px solid var(--dsw-alias-border-l1);flex:none;gap:8px;margin:0 -18px -18px;padding:12px 18px;display:flex;position:sticky;bottom:0}@media (width<=760px){.HNYu5a_detail{grid-template-rows:minmax(0,3fr) minmax(0,4fr);grid-template-columns:1fr}}";
		const tagId$5 = "@dickpy/dsh-imagegen/templates.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$5) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dickpy/dsh-imagegen";
			tag.dataset.pluginCss = tagId$5;
			tag.textContent = css$5;
			document.head.appendChild(tag);
		}
		var templates_module_css_default = {
			"featuredBadge": "HNYu5a_featuredBadge",
			"card": "HNYu5a_card",
			"heading": "HNYu5a_heading",
			"cardMeta": "HNYu5a_cardMeta",
			"notice": "HNYu5a_notice",
			"sourceTab": "HNYu5a_sourceTab",
			"headerActions": "HNYu5a_headerActions",
			"thumb": "HNYu5a_thumb",
			"cardBody": "HNYu5a_cardBody",
			"detailPrompt": "HNYu5a_detailPrompt",
			"body": "HNYu5a_body",
			"grid": "HNYu5a_grid",
			"toolbar": "HNYu5a_toolbar",
			"spinner": "HNYu5a_spinner",
			"detailLink": "HNYu5a_detailLink",
			"detailImage": "HNYu5a_detailImage",
			"categoryPill": "HNYu5a_categoryPill",
			"categoryRow": "HNYu5a_categoryRow",
			"cardCategory": "HNYu5a_cardCategory",
			"detailOverlay": "HNYu5a_detailOverlay",
			"header": "HNYu5a_header",
			"overlay": "HNYu5a_overlay",
			"detailInfo": "HNYu5a_detailInfo",
			"detailMeta": "HNYu5a_detailMeta",
			"shell": "HNYu5a_shell",
			"detailMedia": "HNYu5a_detailMedia",
			"state": "HNYu5a_state",
			"title": "HNYu5a_title",
			"footer": "HNYu5a_footer",
			"attribution": "HNYu5a_attribution",
			"sourceLink": "HNYu5a_sourceLink",
			"detail": "HNYu5a_detail",
			"detailActions": "HNYu5a_detailActions",
			"dsh-imagegen-templates-spin": "HNYu5a_dsh-imagegen-templates-spin",
			"cardTitle": "HNYu5a_cardTitle",
			"thumbPlaceholder": "HNYu5a_thumbPlaceholder",
			"sourceTabCount": "HNYu5a_sourceTabCount",
			"favStar": "HNYu5a_favStar",
			"detailTitle": "HNYu5a_detailTitle",
			"close": "HNYu5a_close",
			"search": "HNYu5a_search",
			"meta": "HNYu5a_meta",
			"thumbWrap": "HNYu5a_thumbWrap",
			"cardSource": "HNYu5a_cardSource",
			"sourceTabs": "HNYu5a_sourceTabs"
		};
		//#endregion
		//#region src/client/TemplateLibrary.tsx
		/**
		* Prompt-template library overlay: a multi-source, searchable, category-
		* filtered gallery. Each registered source (TEMPLATE_SOURCES) renders as its
		* own tab with an independent list, refresh state, and image pool; case lists
		* are served by the host (bundled snapshot, optionally refreshed online or
		* auto-synced in the background) and reference images load lazily through the
		* host's caching proxy, so browsing progressively mirrors the gallery onto the
		* local disk. Templates can be starred; favorites persist host-side as full
		* case snapshots and are reachable through the ★ filter pill per tab. Picking
		* a template hands its prompt back to the studio form.
		*/
		/** Concurrent image downloads while caching the whole gallery offline. */
		const CACHE_ALL_CONCURRENCY = 4;
		/** Stable favorites key of one case within a source. */
		function favoriteKeyOf(sourceId, item) {
			return `${sourceId}:${item.id}`;
		}
		/** Same-origin URL of one case's reference image (host caching proxy). */
		function imageUrlOf$1(sourceId, item) {
			return `${TEMPLATES_API.image}/${encodeURIComponent(sourceId)}/${encodeURIComponent(item.image)}`;
		}
		/** A card thumbnail that falls back to a placeholder when the proxy 404s. */
		function TemplateThumb(props) {
			const [failed, setFailed] = (0, react.useState)(false);
			if (props.item.image === "" || failed) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: templates_module_css_default.thumbPlaceholder,
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
					viewBox: "0 0 24 24",
					width: "26",
					height: "26",
					fill: "none",
					stroke: "currentColor",
					strokeWidth: "1.2",
					strokeLinecap: "round",
					strokeLinejoin: "round",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
							x: "3",
							y: "3",
							width: "18",
							height: "18",
							rx: "3"
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
							cx: "8.5",
							cy: "8.5",
							r: "1.5"
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M21 15l-5-5L5 21" })
					]
				})
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
				className: templates_module_css_default.thumb,
				src: imageUrlOf$1(props.sourceId, props.item),
				alt: props.item.title,
				loading: "lazy",
				onError: () => {
					setFailed(true);
				}
			});
		}
		/** Card-corner star toggle; the click must not open the detail view. Rendered
		*  as a span (a button cannot nest inside the card button). */
		function FavoriteStar(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				role: "button",
				tabIndex: 0,
				className: templates_module_css_default.favStar,
				"data-active": props.active ? "" : void 0,
				"aria-label": props.title,
				title: props.title,
				onClick: (event) => {
					event.stopPropagation();
					props.onToggle();
				},
				onKeyDown: (event) => {
					if (event.key !== "Enter" && event.key !== " ") return;
					event.stopPropagation();
					event.preventDefault();
					props.onToggle();
				},
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
					viewBox: "0 0 24 24",
					width: "15",
					height: "15",
					fill: props.active ? "currentColor" : "none",
					stroke: "currentColor",
					strokeWidth: "1.6",
					strokeLinecap: "round",
					strokeLinejoin: "round",
					"aria-hidden": "true",
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 9.7l5.8-.8z" })
				})
			});
		}
		/** The template-library modal. Rendered through a portal above the studio. */
		function TemplateLibrary(props) {
			const { api, onUse, onClose } = props;
			const [activeSource, setActiveSource] = (0, react.useState)(TEMPLATE_SOURCES[0].id);
			const [lists, setLists] = (0, react.useState)({});
			const [loadErrors, setLoadErrors] = (0, react.useState)({});
			const [favorites, setFavorites] = (0, react.useState)([]);
			const [query, setQuery] = (0, react.useState)("");
			const [category, setCategory] = (0, react.useState)("");
			const [favoritesOnly, setFavoritesOnly] = (0, react.useState)(false);
			const [selected, setSelected] = (0, react.useState)(null);
			const [copied, setCopied] = (0, react.useState)(false);
			const [refreshing, setRefreshing] = (0, react.useState)(false);
			const [notice, setNotice] = (0, react.useState)(null);
			const [cacheAll, setCacheAll] = (0, react.useState)({
				running: false,
				done: 0,
				total: 0
			});
			const searchRef = (0, react.useRef)(null);
			const list = lists[activeSource];
			const loadError = loadErrors[activeSource] || null;
			/** Fetch one source's list into the per-source cache. */
			const loadSource = (sourceId) => {
				api.templatesList(sourceId).then((result) => {
					setLists((current) => ({
						...current,
						[sourceId]: result
					}));
					setLoadErrors((current) => ({
						...current,
						[sourceId]: ""
					}));
				}).catch((caught) => {
					setLoadErrors((current) => ({
						...current,
						[sourceId]: errorMessage(caught)
					}));
				});
			};
			(0, react.useEffect)(() => {
				loadSource(TEMPLATE_SOURCES[0].id);
				api.favoritesList().then(setFavorites).catch(() => {});
				searchRef.current?.focus();
			}, []);
			const switchSource = (sourceId) => {
				if (sourceId === activeSource) return;
				setActiveSource(sourceId);
				setCategory("");
				setFavoritesOnly(false);
				setSelected(null);
				setNotice(null);
				if (lists[sourceId] === void 0) loadSource(sourceId);
			};
			const categories = (0, react.useMemo)(() => {
				if (list === void 0) return [];
				const counts = /* @__PURE__ */ new Map();
				for (const item of list.cases) {
					const entry = counts.get(item.category) ?? {
						label: item.categoryZh || item.category,
						count: 0
					};
					entry.count += 1;
					counts.set(item.category, entry);
				}
				return [...counts.entries()].map(([key, value]) => ({
					key,
					label: value.label,
					count: value.count
				}));
			}, [list]);
			/** Favorites of the active source, as standalone case snapshots. */
			const activeFavorites = (0, react.useMemo)(() => favorites.filter((entry) => entry.sourceId === activeSource).map((entry) => entry.case), [favorites, activeSource]);
			const favKeys = (0, react.useMemo)(() => new Set(favorites.map((entry) => entry.key)), [favorites]);
			const filtered = (0, react.useMemo)(() => {
				const pool = favoritesOnly ? activeFavorites : list?.cases ?? [];
				const needle = query.trim().toLowerCase();
				return pool.filter((item) => {
					if (category !== "" && item.category !== category) return false;
					if (needle === "") return true;
					return item.title.toLowerCase().includes(needle) || item.prompt.toLowerCase().includes(needle) || item.sourceLabel.toLowerCase().includes(needle);
				});
			}, [
				list,
				activeFavorites,
				favoritesOnly,
				query,
				category
			]);
			(0, react.useEffect)(() => {
				const onKey = (event) => {
					if (event.key !== "Escape") return;
					event.stopPropagation();
					if (selected !== null) setSelected(null);
					else onClose();
				};
				window.addEventListener("keydown", onKey, true);
				return () => window.removeEventListener("keydown", onKey, true);
			}, [selected, onClose]);
			const refresh = async () => {
				if (refreshing) return;
				setRefreshing(true);
				setNotice(null);
				try {
					const result = await api.templatesRefresh(activeSource);
					const reloaded = await api.templatesList(activeSource);
					setLists((current) => ({
						...current,
						[activeSource]: reloaded
					}));
					setNotice(tt("templates.refreshed", { count: result.total }));
				} catch (caught) {
					setNotice(tt("templates.refreshFailed", { error: errorMessage(caught) }));
				} finally {
					setRefreshing(false);
				}
			};
			/** Star / unstar one template of the active source. */
			const toggleFavorite = (item) => {
				const key = favoriteKeyOf(activeSource, item);
				(favKeys.has(key) ? api.favoritesRemove(key) : api.favoritesAdd(activeSource, item)).then(setFavorites).catch(() => {});
			};
			/** Mirror every reference image of the active source through the host cache. */
			const cacheAllImages = async () => {
				if (cacheAll.running || list === void 0) return;
				const files = [...new Set(list.cases.map((item) => item.image).filter((name) => name !== ""))];
				setCacheAll({
					running: true,
					done: 0,
					total: files.length
				});
				let index = 0;
				const worker = async () => {
					while (index < files.length) {
						const file = files[index];
						index += 1;
						try {
							await fetch(`${TEMPLATES_API.image}/${encodeURIComponent(activeSource)}/${encodeURIComponent(file)}`);
						} catch {}
						setCacheAll((current) => ({
							...current,
							done: current.done + 1
						}));
					}
				};
				await Promise.all(Array.from({ length: CACHE_ALL_CONCURRENCY }, () => worker()));
				setCacheAll({
					running: false,
					done: files.length,
					total: files.length
				});
			};
			const copyPrompt = async (text) => {
				try {
					if (navigator.clipboard?.writeText !== void 0) await navigator.clipboard.writeText(text);
					else {
						const textarea = document.createElement("textarea");
						textarea.value = text;
						textarea.style.position = "fixed";
						textarea.style.opacity = "0";
						document.body.appendChild(textarea);
						textarea.select();
						const copiedOk = document.execCommand("copy");
						textarea.remove();
						if (!copiedOk) throw new Error("copy failed");
					}
					setCopied(true);
					window.setTimeout(() => {
						setCopied(false);
					}, 1800);
				} catch {
					setCopied(false);
				}
			};
			const originLabel = list === void 0 ? "" : tt(list.origin === "refreshed" ? "templates.origin.refreshed" : "templates.origin.bundled");
			const activeMeta = TEMPLATE_SOURCES.find((source) => source.id === activeSource);
			return (0, react_dom.createPortal)(/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: templates_module_css_default.overlay,
				role: "dialog",
				"aria-modal": "true",
				"aria-label": tt("templates.title"),
				onClick: onClose,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
					className: templates_module_css_default.shell,
					onClick: (event) => {
						event.stopPropagation();
					},
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
							className: templates_module_css_default.header,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: templates_module_css_default.heading,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
									className: templates_module_css_default.title,
									children: tt("templates.title")
								}), list !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: templates_module_css_default.meta,
									children: tt("templates.meta", {
										count: list.total,
										origin: originLabel
									})
								}) : null]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: templates_module_css_default.headerActions,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										variant: "outline",
										size: "sm",
										disabled: refreshing || cacheAll.running,
										onClick: () => {
											refresh();
										},
										children: refreshing ? tt("templates.refreshing") : tt("templates.refresh")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										variant: "outline",
										size: "sm",
										disabled: list === void 0 || cacheAll.running,
										title: tt("templates.cacheAllHint"),
										onClick: () => {
											cacheAllImages();
										},
										children: cacheAll.running ? tt("templates.caching", {
											done: cacheAll.done,
											total: cacheAll.total
										}) : cacheAll.total > 0 && cacheAll.done === cacheAll.total ? tt("templates.cached") : tt("templates.cacheAll")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: templates_module_css_default.close,
										"aria-label": tt("templates.close"),
										title: tt("templates.close"),
										onClick: onClose,
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
											viewBox: "0 0 16 16",
											width: "16",
											height: "16",
											fill: "none",
											stroke: "currentColor",
											strokeWidth: "1.6",
											strokeLinecap: "round",
											"aria-hidden": "true",
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M4 4l8 8M12 4l-8 8" })
										})
									})
								]
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: templates_module_css_default.sourceTabs,
							role: "tablist",
							"aria-label": tt("templates.sources"),
							children: TEMPLATE_SOURCES.map((source) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								role: "tab",
								"aria-selected": source.id === activeSource,
								className: templates_module_css_default.sourceTab,
								"data-active": source.id === activeSource ? "" : void 0,
								title: source.description,
								onClick: () => {
									switchSource(source.id);
								},
								children: [source.label, lists[source.id] !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: templates_module_css_default.sourceTabCount,
									children: lists[source.id].total
								}) : null]
							}, source.id))
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: templates_module_css_default.toolbar,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								ref: searchRef,
								type: "search",
								className: templates_module_css_default.search,
								placeholder: tt("templates.search"),
								value: query,
								onChange: (event) => {
									setQuery(event.target.value);
								}
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: templates_module_css_default.categoryRow,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: templates_module_css_default.categoryPill,
										"data-active": favoritesOnly ? "" : void 0,
										title: tt("templates.favoritesHint"),
										onClick: () => {
											setFavoritesOnly((value) => !value);
										},
										children: [
											"★ ",
											tt("templates.favorites"),
											activeFavorites.length > 0 ? ` ${activeFavorites.length}` : ""
										]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: templates_module_css_default.categoryPill,
										"data-active": !favoritesOnly && category === "" ? "" : void 0,
										onClick: () => {
											setFavoritesOnly(false);
											setCategory("");
										},
										children: [tt("templates.all"), list !== void 0 ? ` ${list.total}` : ""]
									}),
									categories.map((entry) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: templates_module_css_default.categoryPill,
										"data-active": !favoritesOnly && category === entry.key ? "" : void 0,
										onClick: () => {
											setFavoritesOnly(false);
											setCategory(entry.key);
										},
										children: [
											entry.label,
											" ",
											entry.count
										]
									}, entry.key))
								]
							})]
						}),
						notice !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: templates_module_css_default.notice,
							role: "status",
							children: notice
						}) : null,
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: templates_module_css_default.body,
							children: [
								list === void 0 && loadError === null ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: templates_module_css_default.state,
									role: "status",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: templates_module_css_default.spinner }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: tt("templates.loading") })]
								}) : null,
								loadError !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: templates_module_css_default.state,
									role: "alert",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: tt("templates.loadFailed", { error: loadError }) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										variant: "outline",
										size: "sm",
										onClick: () => {
											setLoadErrors((current) => ({
												...current,
												[activeSource]: ""
											}));
											loadSource(activeSource);
										},
										children: tt("templates.retry")
									})]
								}) : null,
								loadError === null && (list !== void 0 || favoritesOnly) && filtered.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: templates_module_css_default.state,
									children: favoritesOnly && activeFavorites.length === 0 ? tt("templates.favoritesEmpty") : tt("templates.empty")
								}) : null,
								filtered.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: templates_module_css_default.grid,
									children: filtered.map((item) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: templates_module_css_default.card,
										onClick: () => {
											setSelected(item);
											setCopied(false);
										},
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											className: templates_module_css_default.thumbWrap,
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)(TemplateThumb, {
													sourceId: activeSource,
													item
												}),
												item.featured ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: templates_module_css_default.featuredBadge,
													children: tt("templates.featured")
												}) : null,
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)(FavoriteStar, {
													active: favKeys.has(favoriteKeyOf(activeSource, item)),
													title: favKeys.has(favoriteKeyOf(activeSource, item)) ? tt("templates.favoriteRemove") : tt("templates.favoriteAdd"),
													onToggle: () => {
														toggleFavorite(item);
													}
												})
											]
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											className: templates_module_css_default.cardBody,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: templates_module_css_default.cardTitle,
												children: item.title
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
												className: templates_module_css_default.cardMeta,
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: templates_module_css_default.cardCategory,
													children: item.categoryZh || item.category
												}), item.sourceLabel !== "" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: templates_module_css_default.cardSource,
													children: item.sourceLabel
												}) : null]
											})]
										})]
									}, `${activeSource}:${item.id}`))
								}) : null
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("footer", {
							className: templates_module_css_default.footer,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: templates_module_css_default.attribution,
								children: tt("templates.attribution")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
								className: templates_module_css_default.sourceLink,
								href: activeMeta.homepage,
								target: "_blank",
								rel: "noreferrer",
								children: tt("templates.source", { label: activeMeta.label })
							})]
						})
					]
				}), selected !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: templates_module_css_default.detailOverlay,
					onClick: () => {
						setSelected(null);
					},
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: templates_module_css_default.detail,
						onClick: (event) => {
							event.stopPropagation();
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: templates_module_css_default.detailMedia,
							children: selected.image !== "" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
								className: templates_module_css_default.detailImage,
								src: imageUrlOf$1(activeSource, selected),
								alt: selected.title
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: templates_module_css_default.thumbPlaceholder,
								"aria-hidden": "true"
							})
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: templates_module_css_default.detailInfo,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h4", {
									className: templates_module_css_default.detailTitle,
									children: selected.title
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: templates_module_css_default.detailMeta,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: templates_module_css_default.cardCategory,
											children: selected.categoryZh || selected.category
										}),
										selected.sourceUrl !== "" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
											className: templates_module_css_default.detailLink,
											href: selected.sourceUrl,
											target: "_blank",
											rel: "noreferrer",
											children: selected.sourceLabel || selected.sourceUrl
										}) : null,
										selected.githubUrl !== "" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
											className: templates_module_css_default.detailLink,
											href: selected.githubUrl,
											target: "_blank",
											rel: "noreferrer",
											children: "GitHub"
										}) : null
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
									className: templates_module_css_default.detailPrompt,
									children: selected.prompt
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: templates_module_css_default.detailActions,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
											variant: "primary",
											size: "md",
											onClick: () => {
												onUse(selected.prompt);
											},
											children: tt("templates.use")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
											variant: "outline",
											size: "md",
											onClick: () => {
												copyPrompt(selected.prompt);
											},
											children: copied ? tt("templates.copied") : tt("templates.copy")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
											variant: "outline",
											size: "md",
											onClick: () => {
												toggleFavorite(selected);
											},
											children: favKeys.has(favoriteKeyOf(activeSource, selected)) ? tt("templates.unfavorite") : tt("templates.favorite")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
											variant: "outline",
											size: "md",
											onClick: () => {
												setSelected(null);
											},
											children: tt("templates.back")
										})
									]
								})
							]
						})]
					})
				}) : null]
			}), document.body);
		}
		//#endregion
		//#region \0dsh-css:/Users/shigure/claude-home/audit/dsh-imagegen/src/client/inspiration.module.css.mjs
		const css$4 = ".F0ARAG_wrap{width:min(880px,100%);font-family:var(--dsw-font-family);flex-direction:column;align-items:center;gap:16px;margin:auto;padding:24px;display:flex}.F0ARAG_title{color:var(--dsw-alias-label-primary);font-size:15px;font-weight:650}.F0ARAG_emptyIcon{color:var(--dsw-alias-label-dimmed);display:inline-flex}.F0ARAG_emptyTitle{color:var(--dsw-alias-label-primary);margin-top:-6px;font-size:15px;font-weight:650}.F0ARAG_emptyHint{color:var(--dsw-alias-label-tertiary);font-size:12.5px}.F0ARAG_grid{grid-template-columns:repeat(4,1fr);gap:12px;width:100%;display:grid}@media (width<=900px){.F0ARAG_grid{grid-template-columns:repeat(3,1fr)}}@media (width<=560px){.F0ARAG_grid{grid-template-columns:repeat(2,1fr)}}.F0ARAG_tile{aspect-ratio:1;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);cursor:pointer;border-radius:12px;width:100%;padding:0;transition:transform .15s,border-color .15s,box-shadow .15s;display:block;position:relative;overflow:hidden}.F0ARAG_tile:hover{border-color:var(--dsw-alias-brand-primary);transform:translateY(-2px);box-shadow:0 6px 18px #0000001f}.F0ARAG_thumbWrap{display:block;position:absolute;inset:0}.F0ARAG_thumb{object-fit:cover;width:100%;height:100%;display:block}.F0ARAG_thumbFallback{background:var(--dsw-alias-bg-layer-2);width:100%;height:100%;color:var(--dsw-alias-label-tertiary);text-align:center;justify-content:center;align-items:center;padding:6px;font-size:11px;line-height:1.4;display:flex;overflow:hidden}.F0ARAG_thumbTitle{text-overflow:ellipsis;white-space:nowrap;color:#fff;text-align:center;opacity:0;pointer-events:none;background:linear-gradient(#0000,#0000008c);padding:14px 8px 6px;font-size:10.5px;transition:opacity .15s;position:absolute;inset:auto 0 0;overflow:hidden}.F0ARAG_tile:hover .F0ARAG_thumbTitle{opacity:1}.F0ARAG_spinner{border:2px solid var(--dsw-alias-border-l2);border-top-color:var(--dsw-alias-brand-primary);border-radius:50%;width:20px;height:20px;animation:.9s linear infinite F0ARAG_dsh-imagegen-inspiration-spin}@keyframes F0ARAG_dsh-imagegen-inspiration-spin{to{transform:rotate(360deg)}}@media (hover:none){.F0ARAG_thumbTitle{opacity:1}}";
		const tagId$4 = "@dickpy/dsh-imagegen/inspiration.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$4) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dickpy/dsh-imagegen";
			tag.dataset.pluginCss = tagId$4;
			tag.textContent = css$4;
			document.head.appendChild(tag);
		}
		var inspiration_module_css_default = {
			"spinner": "F0ARAG_spinner",
			"dsh-imagegen-inspiration-spin": "F0ARAG_dsh-imagegen-inspiration-spin",
			"thumbFallback": "F0ARAG_thumbFallback",
			"title": "F0ARAG_title",
			"tile": "F0ARAG_tile",
			"thumb": "F0ARAG_thumb",
			"emptyHint": "F0ARAG_emptyHint",
			"emptyIcon": "F0ARAG_emptyIcon",
			"emptyTitle": "F0ARAG_emptyTitle",
			"wrap": "F0ARAG_wrap",
			"thumbWrap": "F0ARAG_thumbWrap",
			"thumbTitle": "F0ARAG_thumbTitle",
			"grid": "F0ARAG_grid"
		};
		//#endregion
		//#region src/client/InspirationGallery.tsx
		/**
		* Inspiration wall for the studio's empty canvas: a small grid of random
		* template cases sampled host-side across every library source. Clicking a
		* card hands its prompt to the form; the 随机 button re-rolls the pick. On
		* failure the wall collapses to nothing (the panel falls back to the plain
		* empty-state hint).
		*/
		/** Card count per deal — a 4×3 wall that uses the canvas's spare width. */
		const SAMPLE_COUNT = 12;
		/** Same-origin proxy URL of one sampled case's reference image. */
		function imageUrlOf(sample) {
			return `${TEMPLATES_API.image}/${encodeURIComponent(sample.sourceId)}/${encodeURIComponent(sample.case.image)}`;
		}
		/** One thumbnail that degrades to a text tile when the image 404s. */
		function SampleThumb(props) {
			const [failed, setFailed] = (0, react.useState)(false);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
				className: inspiration_module_css_default.thumbWrap,
				children: [props.sample.case.image !== "" && !failed ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
					className: inspiration_module_css_default.thumb,
					src: imageUrlOf(props.sample),
					alt: props.sample.case.title,
					loading: "lazy",
					onError: () => {
						setFailed(true);
					}
				}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: inspiration_module_css_default.thumbFallback,
					"aria-hidden": "true",
					children: props.sample.case.title
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: inspiration_module_css_default.thumbTitle,
					children: props.sample.case.title
				})]
			});
		}
		/** The random-case wall shown while the canvas has no results. */
		function InspirationGallery(props) {
			const { api, onUse } = props;
			const [samples, setSamples] = (0, react.useState)(null);
			const [loading, setLoading] = (0, react.useState)(false);
			const deal = () => {
				if (loading) return;
				setLoading(true);
				api.templatesSample(SAMPLE_COUNT).then(setSamples).catch(() => {
					setSamples((current) => current ?? []);
				}).finally(() => {
					setLoading(false);
				});
			};
			(0, react.useEffect)(() => {
				deal();
			}, []);
			if (samples !== null && samples.length === 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: inspiration_module_css_default.wrap,
				"aria-label": tt("inspiration.title"),
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: inspiration_module_css_default.emptyIcon,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
							viewBox: "0 0 24 24",
							width: "34",
							height: "34",
							fill: "none",
							stroke: "currentColor",
							strokeWidth: "1.2",
							strokeLinecap: "round",
							strokeLinejoin: "round",
							"aria-hidden": "true",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
									x: "3",
									y: "3",
									width: "18",
									height: "18",
									rx: "3"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
									cx: "8.5",
									cy: "8.5",
									r: "1.5"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M21 15l-5-5L5 21" })
							]
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: inspiration_module_css_default.emptyTitle,
						children: tt("canvas.emptyTitle")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: inspiration_module_css_default.emptyHint,
						children: tt("canvas.emptyHint")
					})
				]
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: inspiration_module_css_default.wrap,
				"aria-label": tt("inspiration.title"),
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: inspiration_module_css_default.title,
					children: tt("inspiration.title")
				}), samples === null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: inspiration_module_css_default.spinner,
					"aria-hidden": "true"
				}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: inspiration_module_css_default.grid,
					children: samples.map((sample) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: inspiration_module_css_default.tile,
						title: tt("inspiration.useHint"),
						onClick: () => {
							onUse(sample.case.prompt);
						},
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SampleThumb, { sample })
					}, `${sample.sourceId}:${sample.case.id}`))
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Button, {
					variant: "outline",
					size: "sm",
					disabled: loading,
					onClick: deal,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
						viewBox: "0 0 24 24",
						width: "14",
						height: "14",
						fill: "none",
						stroke: "currentColor",
						strokeWidth: "1.8",
						strokeLinecap: "round",
						strokeLinejoin: "round",
						"aria-hidden": "true",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.8-1.1 2-1.7 3.3-1.7H22" }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "m18 2 4 4-4 4" }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M2 6h1.9c1.5 0 2.9.9 3.6 2.2" }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8" }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "m18 14 4 4-4 4" })
						]
					}), loading ? tt("inspiration.shuffling") : tt("inspiration.shuffle")]
				})] })]
			});
		}
		//#endregion
		//#region \0dsh-css:/Users/shigure/claude-home/audit/dsh-imagegen/src/client/canvas-workspace.module.css.mjs
		const css$3 = ".kPMeEa_root{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);min-width:0;height:100%;min-height:0;color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family,inherit);user-select:none;border-radius:10px;flex-direction:column;flex:auto;display:flex;position:relative;overflow:hidden}.kPMeEa_selectCursor{cursor:default}.kPMeEa_panCursor{cursor:grab}.kPMeEa_panCursor:active{cursor:grabbing}.kPMeEa_topBar{border-bottom:1px solid var(--dsw-alias-border-l1);z-index:40;background:var(--dsw-alias-bg-layer-1);flex:none;align-items:center;gap:8px;padding:8px 12px;display:flex}.kPMeEa_projectSelect{border:1px solid var(--dsw-alias-border-l1);max-width:180px;height:30px;color:var(--dsw-alias-label-primary);background:0 0;border-radius:8px;padding:0 8px;font-size:12.5px}.kPMeEa_titleButton{height:30px;color:var(--dsw-alias-label-primary);text-overflow:ellipsis;white-space:nowrap;cursor:text;background:0 0;border:1px solid #0000;border-radius:8px;max-width:260px;padding:0 10px;font-size:13px;font-weight:600;overflow:hidden}.kPMeEa_titleButton:hover{border-color:var(--dsw-alias-border-l1)}.kPMeEa_titleInput{border:1px solid var(--dsw-alias-brand-primary);height:30px;color:var(--dsw-alias-label-primary);background:0 0;border-radius:8px;outline:none;width:240px;padding:0 10px;font-size:13px;font-weight:600}.kPMeEa_topBarSpacer{flex:1}.kPMeEa_saveState{color:var(--dsw-alias-label-tertiary);white-space:nowrap;font-size:11.5px}.kPMeEa_saveState[data-state=error]{color:var(--dsw-alias-label-error)}.kPMeEa_saveState[data-state=saving]{color:var(--dsw-alias-state-warn-primary,var(--dsw-alias-label-secondary))}.kPMeEa_iconButton{width:30px;height:30px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;border-radius:8px;flex:none;justify-content:center;align-items:center;gap:5px;padding:0;display:inline-flex}.kPMeEa_iconButton:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.kPMeEa_iconButton[data-active]{background:color-mix(in srgb, var(--dsw-alias-brand-primary) 16%, transparent);color:var(--dsw-alias-brand-primary)}.kPMeEa_iconButton:disabled{opacity:.35;cursor:not-allowed}.kPMeEa_iconButton:disabled:hover{color:var(--dsw-alias-label-secondary);background:0 0}.kPMeEa_viewport{touch-action:none;flex:1;min-height:0;position:relative;overflow:hidden}.kPMeEa_grid{pointer-events:none;opacity:.5;position:absolute;inset:0}.kPMeEa_grid[data-mode=dots]{background-image:radial-gradient(circle, color-mix(in srgb, var(--dsw-alias-label-primary) 30%, transparent) 1.1px, transparent 1.4px)}.kPMeEa_grid[data-mode=lines]{background-image:linear-gradient(color-mix(in srgb, var(--dsw-alias-label-primary) 9%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--dsw-alias-label-primary) 9%, transparent) 1px, transparent 1px)}.kPMeEa_grid[data-mode=blank]{background-image:none}.kPMeEa_grid[data-mode=diagonal]{background-image:repeating-linear-gradient(45deg, color-mix(in srgb, var(--dsw-alias-label-primary) 8%, transparent) 0 1px, transparent 1px 16px)}.kPMeEa_grid[data-mode=checker]{background-image:conic-gradient(color-mix(in srgb, var(--dsw-alias-label-primary) 7%, transparent) 90deg, transparent 90deg 180deg, color-mix(in srgb, var(--dsw-alias-label-primary) 7%, transparent) 180deg 270deg, transparent 270deg);background-size:48px 48px}.kPMeEa_grid[data-mode=image]{background-image:none}.kPMeEa_gridScrim{background:var(--dsw-alias-bg-layer-1);opacity:.6;position:absolute;inset:0}.kPMeEa_backgroundMenu{z-index:45;border:1px solid var(--dsw-alias-border-l1);background:color-mix(in srgb, var(--dsw-alias-bg-layer-1) 96%, transparent);border-radius:11px;flex-direction:column;min-width:168px;padding:5px;display:flex;position:absolute;transform:translate(-50%,-100%);box-shadow:0 16px 40px #0f172a33}.kPMeEa_backgroundMenu button{color:var(--dsw-alias-label-primary);cursor:pointer;text-align:left;background:0 0;border:none;border-radius:7px;justify-content:space-between;align-items:center;padding:7px 10px;font-size:12.5px;display:flex}.kPMeEa_backgroundMenu button:hover{background:var(--dsw-alias-interactive-bg-hover)}.kPMeEa_backgroundMenu button[data-active]{color:var(--dsw-alias-brand-primary);background:color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent)}.kPMeEa_backgroundMenuDivider{background:var(--dsw-alias-border-l1);height:1px;margin:4px 6px}.kPMeEa_world{transform-origin:0 0;position:absolute;top:0;left:0}.kPMeEa_marquee{z-index:20;border:1px solid var(--dsw-alias-brand-primary);background:color-mix(in srgb, var(--dsw-alias-brand-primary) 8%, transparent);pointer-events:none;border-radius:4px;position:absolute}.kPMeEa_node{border:1.5px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);cursor:grab;touch-action:none;border-radius:14px;flex-direction:column;display:flex;position:absolute;overflow:visible;box-shadow:0 8px 24px #0f172a1f}.kPMeEa_node:active{cursor:grabbing}.kPMeEa_nodeGlow{pointer-events:none;opacity:0;border-radius:18px;transition:opacity .15s;position:absolute;inset:-6px}.kPMeEa_nodeSelected{border-color:var(--dsw-alias-brand-primary);z-index:2}.kPMeEa_nodeSelected .kPMeEa_nodeGlow{opacity:1;box-shadow:0 0 0 3px color-mix(in srgb, var(--dsw-alias-brand-primary) 22%, transparent)}.kPMeEa_nodeRelated{border-color:color-mix(in srgb, var(--dsw-alias-brand-primary) 45%, transparent)}.kPMeEa_nodeConnectTarget{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 4px color-mix(in srgb, var(--dsw-alias-brand-primary) 26%, transparent)}.kPMeEa_nodeHeader{color:var(--dsw-alias-label-secondary);cursor:inherit;flex:none;align-items:center;gap:6px;padding:7px 12px 5px;font-size:11.5px;display:flex}.kPMeEa_nodeTitle{text-overflow:ellipsis;white-space:nowrap;font-weight:600;overflow:hidden}.kPMeEa_nodeSize{color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;margin-left:auto;font-size:10.5px}.kPMeEa_nodeSpinner{border:1.5px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 30%, transparent);border-top-color:var(--dsw-alias-brand-primary);border-radius:50%;flex:none;width:11px;height:11px;animation:.8s linear infinite kPMeEa_canvasSpin}.kPMeEa_nodeBody{background:color-mix(in srgb, var(--dsw-alias-label-primary) 6%, transparent);pointer-events:none;border-radius:9px;flex:1;justify-content:center;align-items:center;min-height:0;margin:0 8px 8px;display:flex;overflow:hidden}.kPMeEa_nodeBody img{object-fit:contain;width:100%;height:100%;display:block}.kPMeEa_imageInfo{z-index:2;background:color-mix(in srgb, var(--dsw-alias-label-primary) 62%, transparent);color:var(--dsw-alias-bg-layer-1);pointer-events:none;backdrop-filter:blur(3px);text-overflow:ellipsis;white-space:nowrap;border-radius:6px;max-width:calc(100% - 90px);padding:3px 8px;font-size:10.5px;line-height:1.4;position:absolute;top:6px;overflow:hidden}.kPMeEa_imageInfoLeft{font-weight:600;left:6px}.kPMeEa_imageInfoRight{font-variant-numeric:tabular-nums;opacity:.85;left:auto;right:6px}.kPMeEa_nodeState,.kPMeEa_nodeStateError{color:var(--dsw-alias-label-secondary);text-align:center;pointer-events:auto;flex-direction:column;align-items:center;gap:8px;padding:12px;font-size:12px;display:flex}.kPMeEa_nodeStateError{color:var(--dsw-alias-label-error)}.kPMeEa_nodeStateError button{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);cursor:pointer;border:none;border-radius:7px;padding:4px 12px;font-size:12px}.kPMeEa_nodeEmpty{border:1.5px dashed color-mix(in srgb, var(--dsw-alias-label-primary) 24%, transparent);color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border-radius:9px;flex-direction:column;align-items:center;gap:8px;margin:6px;padding:14px;font-size:12px;display:flex}.kPMeEa_nodeEmpty:hover{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}.kPMeEa_textNode{cursor:default}.kPMeEa_imageNode .kPMeEa_nodeBody{margin:6px}.kPMeEa_textArea{resize:none;min-height:0;color:var(--dsw-alias-label-primary);cursor:text;pointer-events:auto;background:0 0;border:none;outline:none;flex:1;margin:0 8px 8px;padding:4px 6px;font-size:13px;line-height:1.55}.kPMeEa_textArea::placeholder{color:var(--dsw-alias-label-tertiary)}.kPMeEa_dock{z-index:30;border:1px solid var(--dsw-alias-border-l1);background:color-mix(in srgb, var(--dsw-alias-bg-layer-1) 92%, transparent);backdrop-filter:blur(10px);border-radius:13px;align-items:center;gap:2px;padding:6px;display:flex;position:absolute;bottom:14px;left:50%;transform:translate(-50%);box-shadow:0 10px 30px #0f172a24}.kPMeEa_dock .kPMeEa_iconButton{border-radius:11px;width:40px;height:40px;transition:transform .18s cubic-bezier(.34,1.9,.64,1),background .15s,color .15s,box-shadow .18s;position:relative;overflow:hidden}.kPMeEa_dock .kPMeEa_iconButton:before{content:\"\";background:linear-gradient(105deg, transparent, color-mix(in srgb, currentColor 26%, transparent), transparent);opacity:0;pointer-events:none;width:65%;position:absolute;top:-4px;bottom:-4px;left:-150%;transform:skew(-18deg)}.kPMeEa_dock .kPMeEa_iconButton:not(:disabled):hover{transform:translateY(calc(-3px - var(--dock-lift,0px)));box-shadow:0 6px 14px color-mix(in srgb, var(--dsw-alias-label-primary) 20%, transparent)}.kPMeEa_dock .kPMeEa_iconButton:not(:disabled):hover:before{animation:.55s forwards kPMeEa_dockShine}.kPMeEa_dock .kPMeEa_iconButton:not(:disabled):active{transform:translateY(-1px)scale(.96)}@keyframes kPMeEa_dockShine{0%{opacity:1;left:-150%}to{opacity:1;left:170%}}.kPMeEa_dock .kPMeEa_iconButton[data-active],.kPMeEa_dock .kPMeEa_iconButton[data-active]:hover{background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-layer-1)}.kPMeEa_dockDivider{background:var(--dsw-alias-border-l1);width:1px;height:18px;margin:0 4px}.kPMeEa_composer{z-index:35;border:1px solid var(--dsw-alias-border-l1);background:color-mix(in srgb, var(--dsw-alias-bg-layer-1) 96%, transparent);backdrop-filter:blur(10px);border-radius:14px;flex-direction:column;gap:8px;width:560px;padding:10px;display:flex;position:absolute;box-shadow:0 16px 44px #0f172a2e}.kPMeEa_composerPrompt{resize:none;width:100%;min-height:38px;max-height:120px;color:var(--dsw-alias-label-primary);cursor:text;background:0 0;border:none;outline:none;padding:2px 4px;font-size:13px;line-height:1.5}.kPMeEa_composerPrompt::placeholder{color:var(--dsw-alias-label-tertiary)}.kPMeEa_composerMeta{display:flex}.kPMeEa_composerChip{border:1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 45%, transparent);color:var(--dsw-alias-brand-primary);background:color-mix(in srgb, var(--dsw-alias-brand-primary) 8%, transparent);border-radius:999px;align-items:center;gap:5px;padding:2px 9px;font-size:11px;display:inline-flex}.kPMeEa_composerControls{align-items:center;gap:6px;display:flex}.kPMeEa_composerControls select{border:1px solid var(--dsw-alias-border-l1);height:28px;color:var(--dsw-alias-label-primary);background:0 0;border-radius:999px;min-width:0;max-width:128px;padding:0 8px;font-size:11.5px}.kPMeEa_composerSend{background:var(--dsw-alias-label-primary);width:34px;height:34px;color:var(--dsw-alias-bg-layer-1);cursor:pointer;border:none;border-radius:50%;flex:none;justify-content:center;align-items:center;margin-left:auto;display:inline-flex}.kPMeEa_composerSend:hover{opacity:.88}.kPMeEa_composerSend:disabled{opacity:.35;cursor:not-allowed}.kPMeEa_configNode{cursor:grab;padding:0 14px 14px}.kPMeEa_configNode .kPMeEa_nodeHeader{padding:10px 2px 6px;font-size:12px}.kPMeEa_configLinks{flex:none;align-items:center;margin:4px 0 10px;display:flex}.kPMeEa_configLinks .kPMeEa_composerChip{padding:3px 10px;font-size:11px}.kPMeEa_configHint{min-height:0;color:var(--dsw-alias-label-tertiary);flex:1;margin:0;font-size:11.5px;line-height:1.7;overflow:auto}.kPMeEa_handle{background:var(--dsw-alias-bg-layer-1);border:2px solid var(--dsw-alias-brand-primary);opacity:0;cursor:crosshair;z-index:3;border-radius:50%;width:12px;height:12px;transition:opacity .12s,transform .12s;position:absolute;top:50%;transform:translateY(-50%)scale(.6)}.kPMeEa_handleLeft{left:-7px}.kPMeEa_handleRight{right:-7px}.kPMeEa_node:hover .kPMeEa_handle,.kPMeEa_nodeSelected .kPMeEa_handle,.kPMeEa_nodeConnectTarget .kPMeEa_handle{opacity:1;transform:translateY(-50%)scale(1)}.kPMeEa_handle:hover{background:var(--dsw-alias-brand-primary)}.kPMeEa_resizeHandle{background:var(--dsw-alias-brand-primary);border:2px solid var(--dsw-alias-bg-layer-1);cursor:nwse-resize;z-index:3;border-radius:4px;width:14px;height:14px;position:absolute;bottom:-5px;right:-5px}.kPMeEa_hoverToolbar{border:1px solid var(--dsw-alias-border-l1);background:color-mix(in srgb, var(--dsw-alias-bg-layer-1) 92%, transparent);opacity:0;pointer-events:none;z-index:4;border-radius:10px;gap:2px;padding:4px;transition:opacity .12s;display:flex;position:absolute;top:-36px;left:50%;transform:translate(-50%);box-shadow:0 8px 22px #0f172a24}.kPMeEa_node:hover .kPMeEa_hoverToolbar,.kPMeEa_nodeSelected .kPMeEa_hoverToolbar{opacity:1;pointer-events:auto}.kPMeEa_connectionLayer{pointer-events:none;z-index:0;position:absolute;overflow:visible}.kPMeEa_connectionPath{fill:none;stroke:color-mix(in srgb, var(--dsw-alias-label-primary) 38%, transparent);stroke-width:2px;stroke-opacity:.85;pointer-events:none}.kPMeEa_connectionActive{stroke:var(--dsw-alias-brand-primary);stroke-width:3px;stroke-opacity:1;filter:drop-shadow(0 0 6px color-mix(in srgb, var(--dsw-alias-brand-primary) 45%, transparent))}.kPMeEa_connectionPreview{fill:none;stroke:var(--dsw-alias-brand-primary);stroke-width:2px;stroke-dasharray:5 5;pointer-events:none}.kPMeEa_emptyHint{text-align:center;color:var(--dsw-alias-label-tertiary);pointer-events:none;z-index:5;flex-direction:column;align-items:center;gap:6px;display:flex;position:absolute;top:44%;left:50%;transform:translate(-50%,-50%)}.kPMeEa_emptyHint strong{color:var(--dsw-alias-label-secondary);font-size:16px}.kPMeEa_emptyHint span{max-width:320px;font-size:12.5px;line-height:1.6}.kPMeEa_zoomDock{z-index:30;border:1px solid var(--dsw-alias-border-l1);background:color-mix(in srgb, var(--dsw-alias-bg-layer-1) 88%, transparent);backdrop-filter:blur(10px);border-radius:12px;align-items:center;gap:6px;padding:6px 8px;display:flex;position:absolute;bottom:14px;left:14px;box-shadow:0 10px 30px #0f172a1f}.kPMeEa_zoomDock input[type=range]{width:96px;accent-color:var(--dsw-alias-brand-primary)}.kPMeEa_zoomValue{text-align:right;width:40px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;font-size:11.5px}.kPMeEa_minimap{z-index:30;border:1px solid var(--dsw-alias-border-l1);background:color-mix(in srgb, var(--dsw-alias-bg-layer-1) 88%, transparent);backdrop-filter:blur(10px);border-radius:12px;width:220px;height:150px;position:absolute;bottom:62px;left:14px;overflow:hidden;box-shadow:0 10px 30px #0f172a1f}.kPMeEa_minimapCanvas{cursor:crosshair;width:100%;height:100%;position:relative}.kPMeEa_minimapNode{opacity:.8;border-radius:2px;position:absolute}.kPMeEa_minimapImage{background:var(--dsw-alias-brand-primary)}.kPMeEa_minimapText{background:color-mix(in srgb, var(--dsw-alias-label-primary) 40%, transparent)}.kPMeEa_minimapSelected{outline:1.5px solid var(--dsw-alias-brand-primary)}.kPMeEa_minimapViewport{border:1.5px solid var(--dsw-alias-brand-primary);background:color-mix(in srgb, var(--dsw-alias-brand-primary) 10%, transparent);pointer-events:none;border-radius:2px;position:absolute}.kPMeEa_inspectorRow{gap:8px;display:flex}.kPMeEa_inspectorRow>*{flex:1;min-width:0}.kPMeEa_contextMenu{z-index:90;border:1px solid var(--dsw-alias-border-l1);background:color-mix(in srgb, var(--dsw-alias-bg-layer-1) 96%, transparent);border-radius:11px;flex-direction:column;min-width:176px;padding:5px;display:flex;position:fixed;box-shadow:0 16px 40px #0f172a33}.kPMeEa_contextMenu button{color:var(--dsw-alias-label-primary);cursor:pointer;text-align:left;background:0 0;border:none;border-radius:7px;align-items:center;gap:8px;padding:7px 10px;font-size:12.5px;display:flex}.kPMeEa_contextMenu button:hover{background:var(--dsw-alias-interactive-bg-hover)}.kPMeEa_contextMenu button[data-danger]{color:var(--dsw-alias-label-error)}.kPMeEa_errorToast{z-index:60;border:1px solid color-mix(in srgb, var(--dsw-alias-label-error) 35%, transparent);background:color-mix(in srgb, var(--dsw-alias-label-error) 12%, var(--dsw-alias-bg-layer-1));max-width:min(560px,80%);color:var(--dsw-alias-label-error);border-radius:10px;align-items:center;gap:10px;padding:9px 12px;font-size:12.5px;display:flex;position:absolute;bottom:18px;left:50%;transform:translate(-50%);box-shadow:0 12px 30px #0f172a2e}.kPMeEa_errorToast button{color:inherit;cursor:pointer;background:0 0;border:none;flex:none;padding:2px;display:inline-flex}.kPMeEa_modalBackdrop{z-index:70;background:color-mix(in srgb, var(--dsw-alias-label-primary) 32%, transparent);justify-content:center;align-items:center;display:flex;position:absolute;inset:0}.kPMeEa_picker{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);border-radius:14px;flex-direction:column;width:min(720px,92%);max-height:84%;display:flex;overflow:hidden;box-shadow:0 24px 60px #0f172a42}.kPMeEa_pickerHeader{border-bottom:1px solid var(--dsw-alias-border-l1);justify-content:space-between;align-items:center;padding:12px 14px;font-size:14px;display:flex}.kPMeEa_pickerHeader button{color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;padding:0 4px;font-size:18px}.kPMeEa_pickerTabs{gap:4px;padding:10px 14px 0;display:flex}.kPMeEa_pickerTabs button{color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;border-radius:8px 8px 0 0;padding:7px 12px;font-size:12.5px}.kPMeEa_pickerTabs button[data-active]{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-brand-primary)}.kPMeEa_pickerBody{flex:1;min-height:0;padding:14px;overflow:auto}.kPMeEa_pickerGrid{grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;display:grid}.kPMeEa_pickerCard{border:1.5px solid var(--dsw-alias-border-l1);cursor:pointer;text-align:left;color:var(--dsw-alias-label-primary);background:0 0;border-radius:10px;flex-direction:column;gap:6px;padding:6px;display:flex}.kPMeEa_pickerCard[data-selected]{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary) 25%, transparent)}.kPMeEa_pickerCard img{object-fit:cover;border-radius:7px;width:100%;height:110px}.kPMeEa_pickerCardPrompt{text-overflow:ellipsis;white-space:nowrap;font-size:11.5px;overflow:hidden}.kPMeEa_pickerCard small{color:var(--dsw-alias-label-tertiary);font-size:10.5px}.kPMeEa_pickerFooter{color:var(--dsw-alias-label-secondary);justify-content:space-between;align-items:center;padding-top:12px;font-size:12.5px;display:flex}.kPMeEa_pickerFooter button,.kPMeEa_generateForm button{background:var(--dsw-alias-brand-primary);height:32px;color:var(--dsw-alias-bg-base,#fff);cursor:pointer;border:none;border-radius:8px;align-items:center;gap:6px;padding:0 16px;font-size:12.5px;font-weight:600;display:inline-flex}.kPMeEa_pickerFooter button:disabled,.kPMeEa_generateForm button:disabled{opacity:.45;cursor:not-allowed}.kPMeEa_uploadBox{border:1.5px dashed color-mix(in srgb, var(--dsw-alias-label-primary) 22%, transparent);min-height:220px;color:var(--dsw-alias-label-secondary);cursor:pointer;text-align:center;border-radius:12px;flex-direction:column;justify-content:center;align-items:center;gap:8px;display:flex}.kPMeEa_uploadBox:hover{border-color:var(--dsw-alias-brand-primary)}.kPMeEa_uploadBox input{display:none}.kPMeEa_uploadBox small{color:var(--dsw-alias-label-tertiary);font-size:11px}.kPMeEa_uploadIcon{color:var(--dsw-alias-brand-primary)}.kPMeEa_generateForm{flex-direction:column;gap:10px;display:flex}.kPMeEa_generateForm textarea{resize:vertical;border:1px solid var(--dsw-alias-border-l1);min-height:110px;color:var(--dsw-alias-label-primary);background:0 0;border-radius:9px;outline:none;padding:8px 10px;font-size:12.5px}.kPMeEa_generateForm select{border:1px solid var(--dsw-alias-border-l1);height:30px;color:var(--dsw-alias-label-primary);background:0 0;border-radius:8px;padding:0 8px;font-size:12.5px}@keyframes kPMeEa_canvasSpin{to{transform:rotate(360deg)}}";
		const tagId$3 = "@dickpy/dsh-imagegen/canvas-workspace.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$3) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dickpy/dsh-imagegen";
			tag.dataset.pluginCss = tagId$3;
			tag.textContent = css$3;
			document.head.appendChild(tag);
		}
		var canvas_workspace_module_css_default = {
			"gridScrim": "kPMeEa_gridScrim",
			"nodeStateError": "kPMeEa_nodeStateError",
			"resizeHandle": "kPMeEa_resizeHandle",
			"nodeEmpty": "kPMeEa_nodeEmpty",
			"composerSend": "kPMeEa_composerSend",
			"minimap": "kPMeEa_minimap",
			"connectionLayer": "kPMeEa_connectionLayer",
			"backgroundMenu": "kPMeEa_backgroundMenu",
			"nodeConnectTarget": "kPMeEa_nodeConnectTarget",
			"picker": "kPMeEa_picker",
			"dock": "kPMeEa_dock",
			"minimapText": "kPMeEa_minimapText",
			"topBarSpacer": "kPMeEa_topBarSpacer",
			"connectionPreview": "kPMeEa_connectionPreview",
			"pickerHeader": "kPMeEa_pickerHeader",
			"imageNode": "kPMeEa_imageNode",
			"pickerCard": "kPMeEa_pickerCard",
			"node": "kPMeEa_node",
			"imageInfoRight": "kPMeEa_imageInfoRight",
			"errorToast": "kPMeEa_errorToast",
			"viewport": "kPMeEa_viewport",
			"imageInfoLeft": "kPMeEa_imageInfoLeft",
			"contextMenu": "kPMeEa_contextMenu",
			"emptyHint": "kPMeEa_emptyHint",
			"panCursor": "kPMeEa_panCursor",
			"minimapImage": "kPMeEa_minimapImage",
			"nodeRelated": "kPMeEa_nodeRelated",
			"world": "kPMeEa_world",
			"projectSelect": "kPMeEa_projectSelect",
			"hoverToolbar": "kPMeEa_hoverToolbar",
			"nodeSelected": "kPMeEa_nodeSelected",
			"inspectorRow": "kPMeEa_inspectorRow",
			"nodeTitle": "kPMeEa_nodeTitle",
			"minimapViewport": "kPMeEa_minimapViewport",
			"modalBackdrop": "kPMeEa_modalBackdrop",
			"textArea": "kPMeEa_textArea",
			"root": "kPMeEa_root",
			"titleButton": "kPMeEa_titleButton",
			"titleInput": "kPMeEa_titleInput",
			"connectionActive": "kPMeEa_connectionActive",
			"uploadBox": "kPMeEa_uploadBox",
			"topBar": "kPMeEa_topBar",
			"grid": "kPMeEa_grid",
			"iconButton": "kPMeEa_iconButton",
			"minimapNode": "kPMeEa_minimapNode",
			"pickerBody": "kPMeEa_pickerBody",
			"backgroundMenuDivider": "kPMeEa_backgroundMenuDivider",
			"imageInfo": "kPMeEa_imageInfo",
			"pickerGrid": "kPMeEa_pickerGrid",
			"nodeSize": "kPMeEa_nodeSize",
			"composerControls": "kPMeEa_composerControls",
			"handle": "kPMeEa_handle",
			"composerPrompt": "kPMeEa_composerPrompt",
			"composerMeta": "kPMeEa_composerMeta",
			"dockShine": "kPMeEa_dockShine",
			"textNode": "kPMeEa_textNode",
			"marquee": "kPMeEa_marquee",
			"selectCursor": "kPMeEa_selectCursor",
			"composer": "kPMeEa_composer",
			"generateForm": "kPMeEa_generateForm",
			"zoomValue": "kPMeEa_zoomValue",
			"nodeHeader": "kPMeEa_nodeHeader",
			"composerChip": "kPMeEa_composerChip",
			"nodeGlow": "kPMeEa_nodeGlow",
			"zoomDock": "kPMeEa_zoomDock",
			"pickerTabs": "kPMeEa_pickerTabs",
			"handleLeft": "kPMeEa_handleLeft",
			"nodeSpinner": "kPMeEa_nodeSpinner",
			"configLinks": "kPMeEa_configLinks",
			"configHint": "kPMeEa_configHint",
			"pickerCardPrompt": "kPMeEa_pickerCardPrompt",
			"uploadIcon": "kPMeEa_uploadIcon",
			"saveState": "kPMeEa_saveState",
			"dockDivider": "kPMeEa_dockDivider",
			"pickerFooter": "kPMeEa_pickerFooter",
			"minimapSelected": "kPMeEa_minimapSelected",
			"nodeBody": "kPMeEa_nodeBody",
			"connectionPath": "kPMeEa_connectionPath",
			"nodeState": "kPMeEa_nodeState",
			"minimapCanvas": "kPMeEa_minimapCanvas",
			"canvasSpin": "kPMeEa_canvasSpin",
			"handleRight": "kPMeEa_handleRight",
			"configNode": "kPMeEa_configNode"
		};
		//#endregion
		//#region src/client/CanvasWorkspace.tsx
		/** Infinite canvas workspace, rebuilt after the node-graph model of
		* basketikun/infinite-canvas: free nodes (image/text), drag-to-connect edges,
		* marquee + multi selection, context menus, minimap, undo/redo and a floating
		* generation composer. Selecting a node pops the composer: the prompt is typed
		* there (or supplied by connected text nodes), every upstream image node joins
		* as a reference, and results land as new image nodes on the right. */
		const MIN_SCALE = .05;
		const MAX_SCALE = 5;
		const GRID_SIZE = 48;
		const IMAGE_NODE_SIZE = {
			width: 320,
			height: 320
		};
		const TEXT_NODE_SIZE = {
			width: 280,
			height: 150
		};
		const CONFIG_NODE_SIZE = {
			width: 320,
			height: 190
		};
		const LEGACY_CONFIG_NODE_SIZE = {
			width: 240,
			height: 96
		};
		const WORLD_PAD = 12e3;
		function newId(prefix) {
			return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
		}
		function imageDataUrl(image) {
			return `data:${image.mime};base64,${image.b64}`;
		}
		function readImageSize(src) {
			return new Promise((resolve, reject) => {
				const image = new Image();
				image.onload = () => resolve({
					width: image.naturalWidth || 1,
					height: image.naturalHeight || 1
				});
				image.onerror = () => reject(/* @__PURE__ */ new Error("无法读取图片尺寸"));
				image.src = src;
			});
		}
		async function assetToDataUrl(asset) {
			if (asset.url.startsWith("data:")) return asset.url;
			const response = await fetch(asset.url);
			if (!response.ok) throw new Error("读取画布图片失败");
			const blob = await response.blob();
			return await new Promise((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = () => resolve(String(reader.result));
				reader.onerror = () => reject(/* @__PURE__ */ new Error("读取画布图片失败"));
				reader.readAsDataURL(blob);
			});
		}
		function clampScale(scale) {
			return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
		}
		function sizeForAsset(asset) {
			const ratio = asset.width > 0 && asset.height > 0 ? asset.width / asset.height : 1;
			if (ratio >= 1) return {
				width: IMAGE_NODE_SIZE.width,
				height: Math.max(160, Math.round(IMAGE_NODE_SIZE.width / ratio))
			};
			return {
				width: Math.max(200, Math.round(IMAGE_NODE_SIZE.height * ratio)),
				height: IMAGE_NODE_SIZE.height
			};
		}
		/** Node footprint for a generation size ratio such as '1:1' or '16:9'. */
		function nodeSizeFromRatio(size, spec) {
			const match = /^(\d+):(\d+)$/.exec(size ?? "");
			if (match === null) return { ...spec };
			const width = Number(match[1]);
			const height = Number(match[2]);
			if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return { ...spec };
			const ratio = width / height;
			return ratio >= 1 ? {
				width: spec.width,
				height: Math.max(160, Math.round(spec.width / ratio))
			} : {
				width: Math.max(200, Math.round(spec.height * ratio)),
				height: spec.height
			};
		}
		function nodesBounds(nodes) {
			return nodes.reduce((acc, node) => ({
				minX: Math.min(acc.minX, node.x),
				minY: Math.min(acc.minY, node.y),
				maxX: Math.max(acc.maxX, node.x + node.width),
				maxY: Math.max(acc.maxY, node.y + node.height)
			}), {
				minX: Infinity,
				minY: Infinity,
				maxX: -Infinity,
				maxY: -Infinity
			});
		}
		/** Enlarge config nodes still stored at the pre-expansion default so the
		* roomier layout applies to existing canvases too. */
		function normalizeConfigNodeSizes(document) {
			const nodes = document.nodes.map((node) => node.type === "config" && node.width === LEGACY_CONFIG_NODE_SIZE.width && node.height === LEGACY_CONFIG_NODE_SIZE.height ? {
				...node,
				width: CONFIG_NODE_SIZE.width,
				height: CONFIG_NODE_SIZE.height
			} : node);
			return nodes === document.nodes ? document : {
				...document,
				nodes
			};
		}
		function summaryOf(document) {
			return {
				id: document.id,
				title: document.title,
				revision: document.revision,
				nodeCount: document.nodes.length,
				createdAt: document.createdAt,
				updatedAt: document.updatedAt
			};
		}
		function nodeMetadata(node) {
			return node.metadata ?? {};
		}
		function assetOf(node) {
			return node.type === "image" ? nodeMetadata(node).asset : void 0;
		}
		function usableAsset(node) {
			const asset = assetOf(node);
			return asset !== void 0 && asset.url !== "" ? asset : void 0;
		}
		function bezierPath(from, to) {
			const distance = Math.abs(to.x - from.x);
			const bend = Math.max(distance * .5, 50);
			return `M ${from.x} ${from.y} C ${from.x + bend} ${from.y}, ${to.x - bend} ${to.y}, ${to.x} ${to.y}`;
		}
		function nodeAnchor(node, side) {
			return {
				x: side === "right" ? node.x + node.width : node.x,
				y: node.y + node.height / 2
			};
		}
		function ToolbarIcon({ name, size = 16 }) {
			const common = {
				width: size,
				height: size,
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: 1.35,
				strokeLinecap: "round",
				strokeLinejoin: "round",
				"aria-hidden": true
			};
			if (name === "new") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				...common,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M8 3v10M3 8h10" })
			});
			if (name === "select") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				...common,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M3 2.5l9.3 6.2-4 1.1-1.5 3.7L3 2.5z" })
			});
			if (name === "pan") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				...common,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M8 2v12M2 8h12M5 5l3-3 3 3M5 11l3 3 3-3" })
			});
			if (name === "image") return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				...common,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
						x: "2",
						y: "2.5",
						width: "12",
						height: "11",
						rx: "1.5"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
						cx: "5.5",
						cy: "5.8",
						r: "1"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M2.5 12.5l3.3-3.2 2.4 2.2 2.8-2.8 2.5 2.7M12 2v4M10 4h4" })
				]
			});
			if (name === "text") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				...common,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M3 3h10M8 3v10M5.5 13h5" })
			});
			if (name === "trash") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				...common,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M3.5 4.5h9M6 2.5h4M5 4.5l.6 9h4.8l.6-9M6.5 6.5v4.5M9.5 6.5v4.5" })
			});
			if (name === "undo") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				...common,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M3 7a5 5 0 1 1 1.5 4M3 3v4h4" })
			});
			if (name === "redo") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				...common,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M13 7a5 5 0 1 0-1.5 4M13 3v4h-4" })
			});
			if (name === "fit") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				...common,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" })
			});
			if (name === "minimap") return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				...common,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
					x: "2",
					y: "3",
					width: "12",
					height: "10",
					rx: "1.5"
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M5 6h3v4H5zM10 8h2v3h-2" })]
			});
			if (name === "background") return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				...common,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
					x: "2",
					y: "4.5",
					width: "10.5",
					height: "9",
					rx: "1.5"
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M4.5 2h10a1.5 1.5 0 0 1 1.5 1.5V11M4.5 10.5l2.6-2.8 2.1 2.2 2.3-2.4 1.5 1.5" })]
			});
			if (name === "template") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				...common,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M8 3.6C6.9 2.5 5 2 2.5 2v10.6c2.5 0 4.4.5 5.5 1.6 1.1-1.1 3-1.6 5.5-1.6V2C11 2 9.1 2.5 8 3.6zM8 3.6V14" })
			});
			if (name === "download") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				...common,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M8 2.5v8M5 7.5l3 3 3-3M3 13.5h10" })
			});
			if (name === "duplicate") return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				...common,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
					x: "5.5",
					y: "5.5",
					width: "8",
					height: "8",
					rx: "1.2"
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M10.5 3h-7a.5.5 0 0 0-.5.5v7" })]
			});
			if (name === "send") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				...common,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M14 2L7 9M14 2L9.5 14l-2.5-5L2 6.5 14 2z" })
			});
			if (name === "close") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				...common,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M4 4l8 8M12 4l-8 8" })
			});
			if (name === "deleteProject") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				...common,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M2.5 5h11M6.5 5V3h3v2M4 5l.8 8.5h6.4L12 5M6.7 7.5v3.5M9.3 7.5v3.5" })
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				...common,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M8 2l1.2 4.2L13.5 8l-4.3 1.8L8 14l-1.2-4.2L2.5 8l4.3-1.8L8 2z" })
			});
		}
		function IconButton(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				className: canvas_workspace_module_css_default.iconButton,
				"data-active": props.active ? "" : void 0,
				"aria-label": props.label,
				title: props.label,
				disabled: props.disabled,
				onClick: props.onClick,
				onMouseEnter: props.onMouseEnter,
				onMouseLeave: props.onMouseLeave,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ToolbarIcon, {
					name: props.name,
					size: props.size
				})
			});
		}
		function CanvasWorkspace(props) {
			const { api, imageModels, defaultChannelId, connected, history, gallery, tasks, importRequest, onImportRequestHandled, onOpenSettings } = props;
			const [projects, setProjects] = (0, react.useState)([]);
			const [document, setDocument] = (0, react.useState)(null);
			const [selectedIds, setSelectedIds] = (0, react.useState)(() => /* @__PURE__ */ new Set());
			const [selectedConnectionId, setSelectedConnectionId] = (0, react.useState)(null);
			const [tool, setTool] = (0, react.useState)("select");
			const [spacePressed, setSpacePressed] = (0, react.useState)(false);
			const [ctrlPressed, setCtrlPressed] = (0, react.useState)(false);
			const [viewportSize, setViewportSize] = (0, react.useState)({
				width: 0,
				height: 0
			});
			const [marquee, setMarquee] = (0, react.useState)(null);
			const [connecting, setConnecting] = (0, react.useState)(null);
			const [contextMenu, setContextMenu] = (0, react.useState)(null);
			const [createMenu, setCreateMenu] = (0, react.useState)(null);
			const [minimapOpen, setMinimapOpen] = (0, react.useState)(true);
			const [pickerOpen, setPickerOpen] = (0, react.useState)(false);
			const [backgroundMenu, setBackgroundMenu] = (0, react.useState)(null);
			const [imageMenu, setImageMenu] = (0, react.useState)(null);
			const menuCloseTimer = (0, react.useRef)(null);
			const clearMenuCloseTimer = () => {
				if (menuCloseTimer.current !== null) {
					window.clearTimeout(menuCloseTimer.current);
					menuCloseTimer.current = null;
				}
			};
			const scheduleMenuClose = (0, react.useCallback)(() => {
				clearMenuCloseTimer();
				menuCloseTimer.current = window.setTimeout(() => {
					setBackgroundMenu(null);
					setImageMenu(null);
				}, 280);
			}, []);
			/** Open one dock menu anchored to its button (root-relative) and close the
			*  other: the two menus are mutually exclusive. */
			const openDockMenu = (0, react.useCallback)((kind, button) => {
				clearMenuCloseTimer();
				const bounds = button.getBoundingClientRect();
				const rootRect = rootRef.current?.getBoundingClientRect();
				const screen = {
					x: bounds.left + bounds.width / 2 - (rootRect?.left ?? 0),
					y: bounds.top - (rootRect?.top ?? 0)
				};
				if (kind === "image") {
					setImageMenu(screen);
					setBackgroundMenu(null);
				} else {
					setBackgroundMenu(screen);
					setImageMenu(null);
				}
			}, []);
			const [libraryOpen, setLibraryOpen] = (0, react.useState)(false);
			const [pickerTab, setPickerTab] = (0, react.useState)("upload");
			const backgroundFileRef = (0, react.useRef)(null);
			const imageFileRef = (0, react.useRef)(null);
			const [renamingTitle, setRenamingTitle] = (0, react.useState)(false);
			const [confirmDeleteProject, setConfirmDeleteProject] = (0, react.useState)(false);
			const [saveState, setSaveState] = (0, react.useState)("loading");
			const [error, setError] = (0, react.useState)(null);
			const [historyVersion, setHistoryVersion] = (0, react.useState)(0);
			const [composerPrompt, setComposerPrompt] = (0, react.useState)("");
			const [composerModel, setComposerModel] = (0, react.useState)(imageModels[0] ?? "");
			const [composerSize, setComposerSize] = (0, react.useState)("auto");
			const [composerQuality, setComposerQuality] = (0, react.useState)("auto");
			const [composerCount, setComposerCount] = (0, react.useState)(1);
			const [composerBusy, setComposerBusy] = (0, react.useState)(false);
			const rootRef = (0, react.useRef)(null);
			const viewportRef = (0, react.useRef)(null);
			const documentRef = (0, react.useRef)(null);
			const selectedIdsRef = (0, react.useRef)(selectedIds);
			const dragRef = (0, react.useRef)(null);
			const panRef = (0, react.useRef)(null);
			const connectRef = (0, react.useRef)(null);
			const resizeRef = (0, react.useRef)(null);
			const marqueeRef = (0, react.useRef)(null);
			const panFrameRef = (0, react.useRef)(null);
			const syncedRef = (0, react.useRef)("");
			const processedTasks = (0, react.useRef)(/* @__PURE__ */ new Set());
			const processedImport = (0, react.useRef)("");
			const localTaskIds = (0, react.useRef)(/* @__PURE__ */ new Set());
			const mountedAtRef = (0, react.useRef)(Date.now());
			const internalClipboard = (0, react.useRef)(null);
			const pastRef = (0, react.useRef)([]);
			const futureRef = (0, react.useRef)([]);
			const composerTargetRef = (0, react.useRef)(null);
			documentRef.current = document;
			selectedIdsRef.current = selectedIds;
			const screenToWorld = (0, react.useCallback)((clientX, clientY) => {
				const bounds = viewportRef.current?.getBoundingClientRect();
				const current = documentRef.current;
				if (bounds === void 0 || current === null) return {
					x: clientX,
					y: clientY
				};
				return {
					x: (clientX - bounds.left - current.viewport.x) / current.viewport.k,
					y: (clientY - bounds.top - current.viewport.y) / current.viewport.k
				};
			}, []);
			const canvasCenter = (0, react.useCallback)(() => {
				const bounds = viewportRef.current?.getBoundingClientRect();
				const current = documentRef.current;
				if (bounds === void 0 || current === null) return {
					x: 0,
					y: 0
				};
				return screenToWorld(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
			}, [screenToWorld]);
			const beginHistory = (0, react.useCallback)(() => {
				const current = documentRef.current;
				if (current === null) return null;
				const snapshot = JSON.stringify(current);
				if (pastRef.current[pastRef.current.length - 1] === snapshot) return snapshot;
				pastRef.current = [...pastRef.current.slice(-60), snapshot];
				futureRef.current = [];
				setHistoryVersion((version) => version + 1);
				return snapshot;
			}, []);
			const commitSnapshot = (0, react.useCallback)((snapshot) => {
				if (snapshot === null) return;
				const current = documentRef.current;
				if (current === null || JSON.stringify(current) === snapshot) return;
				pastRef.current = [...pastRef.current.slice(-60), snapshot];
				futureRef.current = [];
				setHistoryVersion((version) => version + 1);
			}, []);
			const updateDocument = (0, react.useCallback)((updater) => {
				setDocument((previous) => previous === null ? previous : updater(previous));
			}, []);
			const mutate = (0, react.useCallback)((updater) => {
				beginHistory();
				updateDocument(updater);
			}, [beginHistory, updateDocument]);
			const undo = (0, react.useCallback)(() => {
				const snapshot = pastRef.current[pastRef.current.length - 1];
				const current = documentRef.current;
				if (snapshot === void 0 || current === null) return;
				pastRef.current = pastRef.current.slice(0, -1);
				futureRef.current = [...futureRef.current, JSON.stringify(current)];
				setDocument(JSON.parse(snapshot));
				setHistoryVersion((version) => version + 1);
				setSelectedIds(/* @__PURE__ */ new Set());
				setSelectedConnectionId(null);
			}, []);
			const redo = (0, react.useCallback)(() => {
				const snapshot = futureRef.current[futureRef.current.length - 1];
				const current = documentRef.current;
				if (snapshot === void 0 || current === null) return;
				futureRef.current = futureRef.current.slice(0, -1);
				pastRef.current = [...pastRef.current.slice(-60), JSON.stringify(current)];
				setDocument(JSON.parse(snapshot));
				setHistoryVersion((version) => version + 1);
				setSelectedIds(/* @__PURE__ */ new Set());
				setSelectedConnectionId(null);
			}, []);
			const setViewport = (0, react.useCallback)((viewport) => {
				updateDocument((previous) => ({
					...previous,
					viewport
				}));
			}, [updateDocument]);
			const placeNewNode = (0, react.useCallback)((node) => {
				mutate((previous) => ({
					...previous,
					nodes: [...previous.nodes, node]
				}));
				setSelectedIds(/* @__PURE__ */ new Set([node.id]));
				setSelectedConnectionId(null);
			}, [mutate]);
			const createImageNode = (0, react.useCallback)((asset, position) => {
				const size = sizeForAsset(asset);
				const center = position ?? canvasCenter();
				return {
					id: newId("node"),
					type: "image",
					title: asset.origin === "gallery" ? tt("canvas.fromGallery") : asset.origin === "history" ? tt("canvas.fromHistory") : tt("canvas.imageNode"),
					x: Math.round(center.x - size.width / 2),
					y: Math.round(center.y - size.height / 2),
					width: size.width,
					height: size.height,
					metadata: {
						asset,
						status: "success"
					}
				};
			}, [canvasCenter]);
			const createTextNode = (0, react.useCallback)((position) => {
				const center = position ?? canvasCenter();
				return {
					id: newId("node"),
					type: "text",
					title: tt("canvas.textNode"),
					x: Math.round(center.x - TEXT_NODE_SIZE.width / 2),
					y: Math.round(center.y - TEXT_NODE_SIZE.height / 2),
					width: TEXT_NODE_SIZE.width,
					height: TEXT_NODE_SIZE.height,
					metadata: {
						text: "",
						fontSize: 14
					}
				};
			}, [canvasCenter]);
			const createConfigNode = (0, react.useCallback)((position) => {
				const center = position ?? canvasCenter();
				return {
					id: newId("node"),
					type: "config",
					title: tt("canvas.configNode"),
					x: Math.round(center.x - CONFIG_NODE_SIZE.width / 2),
					y: Math.round(center.y - CONFIG_NODE_SIZE.height / 2),
					width: CONFIG_NODE_SIZE.width,
					height: CONFIG_NODE_SIZE.height,
					metadata: { status: "idle" }
				};
			}, [canvasCenter]);
			const updateNodes = (0, react.useCallback)((updater) => {
				updateDocument((previous) => ({
					...previous,
					nodes: updater(previous.nodes)
				}));
			}, [updateDocument]);
			const patchNode = (0, react.useCallback)((nodeId, patch) => {
				updateNodes((nodes) => nodes.map((node) => node.id === nodeId ? {
					...node,
					..."title" in patch ? { title: patch.title ?? node.title } : {},
					..."x" in patch || "y" in patch || "width" in patch || "height" in patch ? {
						x: patch.x ?? node.x,
						y: patch.y ?? node.y,
						width: patch.width ?? node.width,
						height: patch.height ?? node.height
					} : {},
					metadata: {
						...nodeMetadata(node),
						...patch
					}
				} : node));
			}, [updateNodes]);
			const deleteSelection = (0, react.useCallback)(() => {
				const ids = selectedIdsRef.current;
				const connectionId = selectedConnectionId;
				if (ids.size === 0 && connectionId === null) return;
				mutate((previous) => ({
					...previous,
					nodes: previous.nodes.filter((node) => !ids.has(node.id)),
					connections: previous.connections.filter((connection) => !ids.has(connection.fromNodeId) && !ids.has(connection.toNodeId) && connection.id !== connectionId)
				}));
				setSelectedIds(/* @__PURE__ */ new Set());
				setSelectedConnectionId(null);
			}, [mutate, selectedConnectionId]);
			const duplicateSelection = (0, react.useCallback)(() => {
				const current = documentRef.current;
				if (current === null || selectedIdsRef.current.size === 0) return;
				const clones = current.nodes.filter((node) => selectedIdsRef.current.has(node.id)).map((node) => ({
					...node,
					id: newId("node"),
					x: node.x + 40,
					y: node.y + 40,
					metadata: { ...nodeMetadata(node) }
				}));
				if (clones.length === 0) return;
				const idMap = new Map(current.nodes.filter((node) => selectedIdsRef.current.has(node.id)).map((node, index) => [node.id, clones[index].id]));
				const connections = current.connections.filter((connection) => idMap.has(connection.fromNodeId) && idMap.has(connection.toNodeId)).map((connection) => ({
					id: newId("edge"),
					fromNodeId: idMap.get(connection.fromNodeId),
					toNodeId: idMap.get(connection.toNodeId)
				}));
				mutate((previous) => ({
					...previous,
					nodes: [...previous.nodes, ...clones],
					connections: [...previous.connections, ...connections]
				}));
				setSelectedIds(new Set(clones.map((node) => node.id)));
			}, [mutate]);
			const copySelection = (0, react.useCallback)(() => {
				const current = documentRef.current;
				if (current === null || selectedIdsRef.current.size === 0) return;
				internalClipboard.current = {
					nodes: current.nodes.filter((node) => selectedIdsRef.current.has(node.id)).map((node) => ({
						...node,
						metadata: { ...nodeMetadata(node) }
					})),
					connections: current.connections.filter((connection) => selectedIdsRef.current.has(connection.fromNodeId) && selectedIdsRef.current.has(connection.toNodeId)).map((connection) => ({
						fromNodeId: connection.fromNodeId,
						toNodeId: connection.toNodeId
					}))
				};
			}, []);
			const pasteClipboard = (0, react.useCallback)((position) => {
				const clipboard = internalClipboard.current;
				if (clipboard === null || clipboard.nodes.length === 0) return;
				const bounds = nodesBounds(clipboard.nodes);
				const target = position ?? canvasCenter();
				const dx = target.x - (bounds.minX + (bounds.maxX - bounds.minX) / 2);
				const dy = target.y - (bounds.minY + (bounds.maxY - bounds.minY) / 2);
				const idMap = /* @__PURE__ */ new Map();
				const clones = clipboard.nodes.map((node) => {
					const id = newId("node");
					idMap.set(node.id, id);
					return {
						...node,
						id,
						x: Math.round(node.x + dx),
						y: Math.round(node.y + dy),
						metadata: { ...nodeMetadata(node) }
					};
				});
				const connections = clipboard.connections.map((connection) => ({
					id: newId("edge"),
					fromNodeId: idMap.get(connection.fromNodeId),
					toNodeId: idMap.get(connection.toNodeId)
				}));
				mutate((previous) => ({
					...previous,
					nodes: [...previous.nodes, ...clones],
					connections: [...previous.connections, ...connections]
				}));
				setSelectedIds(new Set(clones.map((node) => node.id)));
			}, [canvasCenter, mutate]);
			const connectNodes = (0, react.useCallback)((fromNodeId, toNodeId) => {
				if (fromNodeId === toNodeId) return;
				const current = documentRef.current;
				if (current === null) return;
				if (current.connections.some((connection) => connection.fromNodeId === fromNodeId && connection.toNodeId === toNodeId)) return;
				mutate((previous) => ({
					...previous,
					connections: [...previous.connections, {
						id: newId("edge"),
						fromNodeId,
						toNodeId
					}]
				}));
			}, [mutate]);
			const downloadNode = (0, react.useCallback)((node) => {
				const asset = assetOf(node);
				if (asset === void 0 || asset.url === "") return;
				const link = globalThis.document.createElement("a");
				link.href = asset.url;
				link.download = `${node.title || "canvas-image"}.${asset.assetId.split(".").pop() ?? "png"}`;
				link.target = "_blank";
				link.rel = "noopener";
				link.click();
			}, []);
			const upstreamNodes = (0, react.useCallback)((canvasDocument, nodeId) => {
				const byId = new Map(canvasDocument.nodes.map((node) => [node.id, node]));
				return canvasDocument.connections.filter((connection) => connection.toNodeId === nodeId).map((connection) => byId.get(connection.fromNodeId)).filter((node) => node !== void 0);
			}, []);
			const submitComposer = (0, react.useCallback)(async (target) => {
				const current = documentRef.current;
				if (current === null || composerBusy) return;
				if (!connected) {
					setError(tt("canvas.needApi"));
					onOpenSettings?.();
					return;
				}
				const inputs = target === null ? [] : upstreamNodes(current, target.id);
				const referenceImages = inputs.filter((node) => node.type === "image" && usableAsset(node) !== void 0);
				const upstreamText = inputs.filter((node) => node.type === "text" && (nodeMetadata(node).text ?? "").trim() !== "").map((node) => nodeMetadata(node).text.trim());
				const prompt = composerPrompt.trim() !== "" ? composerPrompt.trim() : upstreamText.join("\n").trim();
				if (prompt === "") {
					setError(tt("canvas.needPrompt"));
					return;
				}
				const model = imageModels.includes(composerModel) ? composerModel : imageModels[0] ?? "";
				if (model === "") {
					setError(tt("canvas.needModel"));
					return;
				}
				const count = Math.min(4, Math.max(1, Math.round(composerCount)));
				const baseAsset = referenceImages[0] !== void 0 ? usableAsset(referenceImages[0]) : void 0;
				setComposerBusy(true);
				try {
					let image;
					let images;
					let refName;
					if (baseAsset !== void 0) {
						image = await assetToDataUrl(baseAsset);
						refName = "canvas-reference.png";
						const extras = [];
						for (const reference of referenceImages.slice(1, 4)) {
							const asset = usableAsset(reference);
							if (asset === void 0) continue;
							try {
								extras.push(await assetToDataUrl(asset));
							} catch {}
						}
						if (extras.length > 0) images = extras;
					}
					const footprint = nodeSizeFromRatio(composerSize, IMAGE_NODE_SIZE);
					const request = {
						mode: image === void 0 ? "text" : "edit",
						model,
						prompt,
						size: composerSize,
						quality: composerQuality,
						n: count,
						detail: "",
						...defaultChannelId === void 0 ? {} : { channelId: defaultChannelId },
						...image === void 0 ? {} : {
							image,
							refName
						},
						...images === void 0 ? {} : { images },
						canvas: {
							canvasId: current.id,
							...target === null ? {} : {
								sourceNodeId: referenceImages[0]?.id ?? target.id,
								parentNodeId: target.id,
								placement: "right"
							}
						}
					};
					const task = await api.taskSubmit(request);
					localTaskIds.current.add(task.id);
					mutate((previous) => {
						const nodes = [...previous.nodes];
						const connections = [...previous.connections];
						const anchor = target !== null ? previous.nodes.find((node) => node.id === target.id) : void 0;
						const originX = anchor !== void 0 ? anchor.x + anchor.width + 80 : Math.round(canvasCenter().x - footprint.width / 2);
						const originY = anchor !== void 0 ? anchor.y : Math.round(canvasCenter().y - footprint.height / 2);
						for (let index = 0; index < count; index += 1) {
							const id = newId("node");
							nodes.push({
								id,
								type: "image",
								title: tt("canvas.imageNode"),
								x: Math.round(originX),
								y: Math.round(originY + index * (footprint.height + 48)),
								width: footprint.width,
								height: footprint.height,
								metadata: {
									status: "generating",
									taskId: task.id,
									...anchor !== void 0 ? { sourceNodeId: anchor.id } : {},
									prompt,
									model
								}
							});
							if (anchor !== void 0) connections.push({
								id: newId("edge"),
								fromNodeId: anchor.id,
								toNodeId: id
							});
						}
						return {
							...previous,
							nodes,
							connections
						};
					});
					setComposerPrompt("");
					setError(null);
				} catch (caught) {
					setError(caught instanceof Error ? caught.message : String(caught));
				} finally {
					setComposerBusy(false);
				}
			}, [
				api,
				canvasCenter,
				composerBusy,
				composerCount,
				composerModel,
				composerPrompt,
				composerQuality,
				composerSize,
				connected,
				defaultChannelId,
				imageModels,
				mutate,
				onOpenSettings,
				upstreamNodes
			]);
			/** Re-run a failed image node's generation from its recorded prompt/model,
			* re-deriving the edit base from the connected source config node. */
			const retryGeneration = (0, react.useCallback)(async (node) => {
				const current = documentRef.current;
				if (current === null || !connected) {
					setError(tt("canvas.needApi"));
					onOpenSettings?.();
					return;
				}
				const metadata = nodeMetadata(node);
				const prompt = (metadata.prompt ?? "").trim();
				if (prompt === "") {
					setError(tt("canvas.needPrompt"));
					return;
				}
				const model = imageModels.includes(metadata.model ?? "") ? metadata.model : imageModels[0] ?? "";
				if (model === "") {
					setError(tt("canvas.needModel"));
					return;
				}
				const sourceId = metadata.sourceNodeId;
				const references = sourceId === void 0 ? [] : upstreamNodes(current, sourceId).filter((item) => item.type === "image" && usableAsset(item) !== void 0);
				const baseAsset = references[0] !== void 0 ? usableAsset(references[0]) : void 0;
				try {
					let image;
					let images;
					let refName;
					if (baseAsset !== void 0) {
						image = await assetToDataUrl(baseAsset);
						refName = "canvas-reference.png";
						const extras = [];
						for (const reference of references.slice(1, 4)) {
							const asset = usableAsset(reference);
							if (asset === void 0) continue;
							try {
								extras.push(await assetToDataUrl(asset));
							} catch {}
						}
						if (extras.length > 0) images = extras;
					}
					const request = {
						mode: image === void 0 ? "text" : "edit",
						model,
						prompt,
						size: metadata.size ?? "auto",
						quality: metadata.quality ?? "auto",
						n: 1,
						detail: "",
						...defaultChannelId === void 0 ? {} : { channelId: defaultChannelId },
						...image === void 0 ? {} : {
							image,
							refName
						},
						...images === void 0 ? {} : { images },
						canvas: {
							canvasId: current.id,
							sourceNodeId: references[0]?.id ?? sourceId,
							parentNodeId: node.id,
							placement: "right"
						}
					};
					const task = await api.taskSubmit(request);
					localTaskIds.current.add(task.id);
					patchNode(node.id, {
						status: "generating",
						error: void 0,
						taskId: task.id
					});
					setError(null);
				} catch (caught) {
					setError(caught instanceof Error ? caught.message : String(caught));
				}
			}, [
				api,
				connected,
				defaultChannelId,
				imageModels,
				onOpenSettings,
				patchNode,
				upstreamNodes
			]);
			(0, react.useEffect)(() => {
				if (document === null) return;
				if (!(tasks.length > 0 || Date.now() - mountedAtRef.current > 8e3)) return;
				const feedIds = new Set(tasks.map((task) => task.id));
				if (document.nodes.filter((node) => {
					if (node.type !== "image" || nodeMetadata(node).status !== "generating") return false;
					const taskId = nodeMetadata(node).taskId;
					return taskId !== void 0 && !feedIds.has(taskId) && !localTaskIds.current.has(taskId);
				}).length === 0) return;
				updateNodes((nodes) => nodes.map((node) => {
					const taskId = node.type === "image" ? nodeMetadata(node).taskId : void 0;
					if (node.type !== "image" || nodeMetadata(node).status !== "generating" || taskId === void 0 || feedIds.has(taskId) || localTaskIds.current.has(taskId)) return node;
					return {
						...node,
						metadata: {
							...nodeMetadata(node),
							status: "error",
							error: tt("canvas.taskLost")
						}
					};
				}));
			}, [
				document,
				tasks,
				updateNodes
			]);
			(0, react.useEffect)(() => {
				if (document === null) return;
				const canvasTasks = tasks.filter((task) => task.request.canvas?.canvasId === document.id);
				for (const task of canvasTasks) {
					if (task.status !== "completed" && task.status !== "failed" && task.status !== "cancelled") continue;
					if (processedTasks.current.has(task.id)) continue;
					const targets = document.nodes.filter((node) => node.type === "image" && nodeMetadata(node).taskId === task.id && nodeMetadata(node).status === "generating");
					if (targets.length === 0) continue;
					processedTasks.current.add(task.id);
					const sourceId = nodeMetadata(targets[0]).sourceNodeId;
					const fail = (message) => {
						updateNodes((nodes) => nodes.map((node) => node.type === "image" && nodeMetadata(node).taskId === task.id && nodeMetadata(node).status === "generating" ? {
							...node,
							metadata: {
								...nodeMetadata(node),
								status: "error",
								error: message
							}
						} : node));
					};
					if (task.status !== "completed" || task.result === void 0 || task.result.images.length === 0) {
						fail(task.error ?? tt("canvas.generateFailed"));
						continue;
					}
					(async () => {
						const assets = [];
						for (const image of task.result.images) {
							const dataUrl = imageDataUrl(image);
							const dimensions = await readImageSize(dataUrl);
							assets.push(await api.canvasUpload(dataUrl, dimensions.width, dimensions.height, {
								origin: "generated",
								originId: task.id
							}));
						}
						updateDocument((previous) => {
							const ordered = previous.nodes.filter((node) => node.type === "image" && nodeMetadata(node).taskId === task.id && nodeMetadata(node).status === "generating");
							if (ordered.length === 0) return previous;
							const last = ordered[ordered.length - 1];
							const nodes = previous.nodes.map((node) => {
								const index = ordered.indexOf(node);
								if (index < 0) return node;
								const asset = assets[index];
								return asset === void 0 ? {
									...node,
									metadata: {
										...nodeMetadata(node),
										status: "error",
										error: tt("canvas.generateFailed")
									}
								} : {
									...node,
									metadata: {
										...nodeMetadata(node),
										asset,
										status: "success",
										error: void 0
									}
								};
							});
							const siblings = [];
							const connections = [];
							assets.slice(ordered.length).forEach((asset, offset) => {
								const id = newId("node");
								siblings.push({
									id,
									type: "image",
									title: tt("canvas.imageNode"),
									x: Math.round(last.x),
									y: Math.round(last.y + (ordered.length + offset) * (last.height + 48)),
									width: last.width,
									height: last.height,
									metadata: {
										status: "success",
										asset,
										taskId: task.id,
										...sourceId === void 0 ? {} : { sourceNodeId: sourceId }
									}
								});
								if (sourceId !== void 0) connections.push({
									id: newId("edge"),
									fromNodeId: sourceId,
									toNodeId: id
								});
							});
							return {
								...previous,
								nodes: [...nodes, ...siblings],
								connections: [...previous.connections, ...connections]
							};
						});
					})().catch((caught) => fail(caught instanceof Error ? caught.message : String(caught)));
				}
			}, [
				api,
				document,
				tasks,
				updateDocument,
				updateNodes
			]);
			const addAssets = (0, react.useCallback)((assets, position) => {
				if (assets.length === 0) return;
				position ?? canvasCenter();
				mutate((previous) => {
					const nodes = assets.map((asset, index) => {
						const node = createImageNode(asset);
						return {
							...node,
							x: node.x + index % 3 * (IMAGE_NODE_SIZE.width + 40),
							y: node.y + Math.floor(index / 3) * (IMAGE_NODE_SIZE.height + 40)
						};
					});
					return {
						...previous,
						nodes: [...previous.nodes, ...nodes]
					};
				});
				setSelectedIds(/* @__PURE__ */ new Set());
			}, [
				canvasCenter,
				createImageNode,
				mutate
			]);
			(0, react.useEffect)(() => {
				if (importRequest === void 0) {
					processedImport.current = "";
					return;
				}
				if (document === null) return;
				const requestKey = `${importRequest.source}:${importRequest.entryId}:${importRequest.imageIndex}`;
				if (processedImport.current === requestKey) return;
				const entry = (importRequest.source === "history" ? history : gallery).find((item) => item.id === importRequest.entryId);
				const image = entry?.images[importRequest.imageIndex];
				if (entry === void 0 || image === void 0) {
					processedImport.current = requestKey;
					onImportRequestHandled?.();
					return;
				}
				processedImport.current = requestKey;
				(async () => {
					const dimensions = await readImageSize(image.url);
					const asset = await api.canvasImport(importRequest.source, importRequest.entryId, importRequest.imageIndex, dimensions.width, dimensions.height);
					addAssets([asset]);
					onImportRequestHandled?.();
				})().catch((caught) => {
					setError(caught instanceof Error ? caught.message : String(caught));
					onImportRequestHandled?.();
				});
			}, [
				addAssets,
				api,
				document,
				gallery,
				history,
				importRequest,
				onImportRequestHandled
			]);
			(0, react.useEffect)(() => {
				let disposed = false;
				api.canvasList().then(async (list) => {
					if (disposed) return;
					const first = list[0] === void 0 ? await api.canvasCreate(tt("canvas.untitled")) : await api.canvasRead(list[0].id);
					if (disposed) return;
					setProjects(list[0] === void 0 ? [summaryOf(first)] : list);
					setDocument(normalizeConfigNodeSizes(first));
					syncedRef.current = JSON.stringify(first);
					setSaveState("saved");
				}).catch((caught) => {
					if (!disposed) {
						setError(caught instanceof Error ? caught.message : String(caught));
						setSaveState("error");
					}
				});
				return () => {
					disposed = true;
				};
			}, [api]);
			(0, react.useEffect)(() => {
				if (document === null || saveState === "loading") return;
				if (JSON.stringify(document) === syncedRef.current) return;
				setSaveState("saving");
				const timer = window.setTimeout(() => {
					const saveWithRetry = async () => {
						try {
							return await api.canvasSave(document, document.revision);
						} catch (caught) {
							if (!(caught instanceof Error ? caught.message : String(caught)).includes("其他窗口")) throw caught;
							const server = await api.canvasRead(document.id);
							return await api.canvasSave(document, server.revision);
						}
					};
					saveWithRetry().then((next) => {
						syncedRef.current = JSON.stringify(next);
						setDocument(next);
						setProjects((previous) => [summaryOf(next), ...previous.filter((item) => item.id !== next.id)]);
						setSaveState("saved");
					}).catch((caught) => {
						setError(caught instanceof Error ? caught.message : String(caught));
						setSaveState("error");
					});
				}, 650);
				return () => window.clearTimeout(timer);
			}, [
				api,
				document,
				saveState
			]);
			const singleSelectedId = selectedIds.size === 1 ? [...selectedIds][0] : null;
			const singleSelected = (0, react.useMemo)(() => document?.nodes.find((node) => node.id === singleSelectedId) ?? null, [document, singleSelectedId]);
			const composerTarget = singleSelected !== null && singleSelected.type === "config" ? singleSelected : null;
			const composerInputs = (0, react.useMemo)(() => composerTarget === null || document === null ? [] : upstreamNodes(document, composerTarget.id), [
				composerTarget,
				document,
				upstreamNodes
			]);
			const composerReferenceCount = composerInputs.filter((node) => node.type === "image" && usableAsset(node) !== void 0).length;
			const composerTextCount = composerInputs.filter((node) => node.type === "text" && (nodeMetadata(node).text ?? "").trim() !== "").length;
			const composerVisible = composerTarget !== null;
			(0, react.useEffect)(() => {
				const targetId = composerTarget?.id ?? null;
				if (targetId === composerTargetRef.current) return;
				composerTargetRef.current = targetId;
				if (composerTarget === null) return;
				const texts = (document?.connections ?? []).filter((connection) => connection.toNodeId === composerTarget.id).map((connection) => document?.nodes.find((node) => node.id === connection.fromNodeId)).filter((node) => node !== void 0 && node.type === "text" && (nodeMetadata(node).text ?? "").trim() !== "").map((node) => nodeMetadata(node).text.trim());
				setComposerPrompt(texts.join("\n"));
			}, [composerTarget, document]);
			(0, react.useEffect)(() => {
				const isEditingTarget = (target) => target instanceof Element && target.matches("input, textarea, select, [contenteditable=\"true\"]");
				const onKeyDown = (event) => {
					if (event.key === "Control") setCtrlPressed(true);
					if (event.code === "Space" && !isEditingTarget(event.target)) {
						event.preventDefault();
						setSpacePressed(true);
					}
					if (documentRef.current === null) return;
					const mod = event.ctrlKey || event.metaKey;
					if (event.key === "Escape") {
						setContextMenu(null);
						setCreateMenu(null);
						setBackgroundMenu(null);
						setImageMenu(null);
						if (!isEditingTarget(event.target)) {
							setSelectedIds(/* @__PURE__ */ new Set());
							setSelectedConnectionId(null);
						}
						return;
					}
					if (isEditingTarget(event.target)) return;
					if (mod && event.key.toLowerCase() === "z") {
						event.preventDefault();
						if (event.shiftKey) redo();
						else undo();
					} else if (mod && event.key.toLowerCase() === "y") {
						event.preventDefault();
						redo();
					} else if (mod && event.key.toLowerCase() === "c") copySelection();
					else if (mod && event.key.toLowerCase() === "v") pasteClipboard();
					else if (mod && event.key.toLowerCase() === "d") {
						event.preventDefault();
						duplicateSelection();
					} else if (mod && event.key.toLowerCase() === "a") {
						event.preventDefault();
						const nodes = documentRef.current?.nodes ?? [];
						setSelectedIds(new Set(nodes.map((node) => node.id)));
					} else if (event.key === "Delete" || event.key === "Backspace") {
						event.preventDefault();
						deleteSelection();
					}
				};
				const onKeyUp = (event) => {
					if (event.code === "Space") setSpacePressed(false);
					if (event.key === "Control") setCtrlPressed(false);
				};
				const onBlur = () => {
					setSpacePressed(false);
					setCtrlPressed(false);
				};
				const onPaste = (event) => {
					if (isEditingTarget(event.target)) return;
					const files = [...event.clipboardData?.files ?? []].filter((file) => file.type.startsWith("image/"));
					if (files.length > 0) {
						event.preventDefault();
						Promise.all(files.map(async (file) => {
							const dataUrl = await new Promise((resolve, reject) => {
								const reader = new FileReader();
								reader.onload = () => resolve(String(reader.result));
								reader.onerror = () => reject(/* @__PURE__ */ new Error("读取图片失败"));
								reader.readAsDataURL(file);
							});
							const dimensions = await readImageSize(dataUrl);
							return api.canvasUpload(dataUrl, dimensions.width, dimensions.height, {
								origin: "upload",
								originId: file.name
							});
						})).then((assets) => addAssets(assets, canvasCenter())).catch((caught) => setError(caught instanceof Error ? caught.message : String(caught)));
						return;
					}
					pasteClipboard();
				};
				window.addEventListener("keydown", onKeyDown);
				window.addEventListener("keyup", onKeyUp);
				window.addEventListener("blur", onBlur);
				window.addEventListener("paste", onPaste);
				return () => {
					window.removeEventListener("keydown", onKeyDown);
					window.removeEventListener("keyup", onKeyUp);
					window.removeEventListener("blur", onBlur);
					window.removeEventListener("paste", onPaste);
				};
			}, [
				addAssets,
				api,
				canvasCenter,
				copySelection,
				deleteSelection,
				duplicateSelection,
				pasteClipboard,
				redo,
				undo
			]);
			(0, react.useEffect)(() => {
				const container = viewportRef.current;
				if (container === null) return;
				const measure = () => setViewportSize({
					width: container.clientWidth,
					height: container.clientHeight
				});
				measure();
				const observer = new ResizeObserver(measure);
				observer.observe(container);
				const preventWheel = (event) => {
					if (event.target instanceof Element && event.target.closest(`[data-canvas-no-zoom]`)) return;
					event.preventDefault();
				};
				container.addEventListener("wheel", preventWheel, { passive: false });
				return () => {
					observer.disconnect();
					container.removeEventListener("wheel", preventWheel);
				};
			}, []);
			const temporaryPanTool = spacePressed || ctrlPressed;
			const onViewportPointerDown = (event) => {
				const target = event.target instanceof Element ? event.target : null;
				setContextMenu(null);
				setCreateMenu(null);
				if (!target?.closest("[data-canvas-no-zoom]")) {
					setBackgroundMenu(null);
					setImageMenu(null);
				}
				const isBackground = target?.closest("[data-node-id],[data-connection-hit]") === null;
				if (event.button === 1 || event.button === 0 && (tool === "pan" || temporaryPanTool) && isBackground) {
					event.preventDefault();
					event.currentTarget.setPointerCapture(event.pointerId);
					const current = documentRef.current;
					if (current !== null) panRef.current = {
						startX: event.clientX,
						startY: event.clientY,
						viewportX: current.viewport.x,
						viewportY: current.viewport.y,
						hasMoved: false,
						startedOnBackground: isBackground
					};
					return;
				}
				if (event.button === 0 && isBackground && tool === "select") {
					event.preventDefault();
					event.currentTarget.setPointerCapture(event.pointerId);
					const world = screenToWorld(event.clientX, event.clientY);
					const next = {
						start: world,
						current: world,
						additive: event.shiftKey,
						initialIds: event.shiftKey ? [...selectedIdsRef.current] : []
					};
					marqueeRef.current = next;
					setMarquee(next);
					if (!event.shiftKey) {
						setSelectedIds(/* @__PURE__ */ new Set());
						setSelectedConnectionId(null);
					}
				}
			};
			const onWheel = (event) => {
				const current = documentRef.current;
				if (current === null) return;
				if (event.target instanceof Element && event.target.closest("[data-canvas-no-zoom]")) return;
				event.preventDefault();
				const bounds = viewportRef.current?.getBoundingClientRect();
				if (bounds === void 0) return;
				const mouseX = event.clientX - bounds.left;
				const mouseY = event.clientY - bounds.top;
				const scale = clampScale(current.viewport.k * Math.pow(1.1, -event.deltaY / 100));
				const worldX = (mouseX - current.viewport.x) / current.viewport.k;
				const worldY = (mouseY - current.viewport.y) / current.viewport.k;
				setViewport({
					x: mouseX - worldX * scale,
					y: mouseY - worldY * scale,
					k: scale
				});
			};
			const setZoomAtCenter = (0, react.useCallback)((scale) => {
				const current = documentRef.current;
				const bounds = viewportRef.current?.getBoundingClientRect();
				if (current === null || bounds === void 0) return;
				const next = clampScale(scale);
				const centerX = bounds.width / 2;
				const centerY = bounds.height / 2;
				const worldX = (centerX - current.viewport.x) / current.viewport.k;
				const worldY = (centerY - current.viewport.y) / current.viewport.k;
				setViewport({
					x: centerX - worldX * next,
					y: centerY - worldY * next,
					k: next
				});
			}, [setViewport]);
			const fitView = (0, react.useCallback)(() => {
				const current = documentRef.current;
				const bounds = viewportRef.current?.getBoundingClientRect();
				if (current === null || bounds === void 0) return;
				if (current.nodes.length === 0) {
					setViewport({
						x: 0,
						y: 0,
						k: 1
					});
					return;
				}
				const content = nodesBounds(current.nodes);
				const padding = 80;
				const contentWidth = Math.max(1, content.maxX - content.minX);
				const contentHeight = Math.max(1, content.maxY - content.minY);
				const scale = clampScale(Math.min((bounds.width - padding * 2) / contentWidth, (bounds.height - padding * 2) / contentHeight));
				setViewport({
					k: scale,
					x: (bounds.width - contentWidth * scale) / 2 - content.minX * scale,
					y: (bounds.height - contentHeight * scale) / 2 - content.minY * scale
				});
			}, [setViewport]);
			(0, react.useEffect)(() => {
				const move = (event) => {
					const drag = dragRef.current;
					if (drag !== null) {
						const scale = documentRef.current?.viewport.k ?? 1;
						const dx = (event.clientX - drag.startX) / scale;
						const dy = (event.clientY - drag.startY) / scale;
						if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 3) {
							drag.moved = true;
							commitSnapshot(drag.snapshot);
						}
						if (drag.moved) updateNodes((nodes) => nodes.map((node) => {
							const origin = drag.origins.get(node.id);
							return origin === void 0 ? node : {
								...node,
								x: Math.round(origin.x + dx),
								y: Math.round(origin.y + dy)
							};
						}));
						return;
					}
					const connect = connectRef.current;
					if (connect !== null) {
						const world = screenToWorld(event.clientX, event.clientY);
						const nodes = documentRef.current?.nodes ?? [];
						let targetId = null;
						for (let index = nodes.length - 1; index >= 0; index -= 1) {
							const node = nodes[index];
							if (node.id === connect.nodeId) continue;
							if (world.x >= node.x && world.x <= node.x + node.width && world.y >= node.y && world.y <= node.y + node.height) {
								targetId = node.id;
								break;
							}
						}
						const next = {
							...connect,
							mouse: world,
							targetId
						};
						connectRef.current = next;
						setConnecting(next);
						return;
					}
					const resize = resizeRef.current;
					if (resize !== null) {
						const scale = documentRef.current?.viewport.k ?? 1;
						const dx = (event.clientX - resize.startX) / scale;
						const dy = (event.clientY - resize.startY) / scale;
						const minWidth = 140;
						const minHeight = 100;
						let width = Math.max(minWidth, resize.width + (resize.corner === "bottom-right" ? dx : -dx));
						let height = Math.max(minHeight, resize.height + dy);
						if (resize.ratio !== null) height = Math.max(minHeight, Math.round(width * resize.ratio));
						updateNodes((nodes) => nodes.map((node) => node.id === resize.nodeId ? {
							...node,
							x: Math.round(resize.corner === "bottom-right" ? resize.x : resize.x + (resize.width - width)),
							y: Math.round(resize.y),
							width: Math.round(width),
							height: Math.round(height)
						} : node));
						return;
					}
					const activeMarquee = marqueeRef.current;
					if (activeMarquee !== null) {
						const next = {
							...activeMarquee,
							current: screenToWorld(event.clientX, event.clientY)
						};
						marqueeRef.current = next;
						setMarquee(next);
						return;
					}
					const pan = panRef.current;
					if (pan !== null) {
						const dx = event.clientX - pan.startX;
						const dy = event.clientY - pan.startY;
						if (Math.abs(dx) > 3 || Math.abs(dy) > 3) pan.hasMoved = true;
						const next = {
							x: pan.viewportX + dx,
							y: pan.viewportY + dy
						};
						if (panFrameRef.current !== null) return;
						panFrameRef.current = requestAnimationFrame(() => {
							panFrameRef.current = null;
							updateDocument((previous) => ({
								...previous,
								viewport: {
									...previous.viewport,
									x: next.x,
									y: next.y
								}
							}));
						});
					}
				};
				const up = () => {
					if (dragRef.current !== null) {
						dragRef.current = null;
						return;
					}
					const connect = connectRef.current;
					if (connect !== null) {
						connectRef.current = null;
						setConnecting(null);
						if (connect.targetId !== null) if (connect.handleType === "source") connectNodes(connect.nodeId, connect.targetId);
						else connectNodes(connect.targetId, connect.nodeId);
						return;
					}
					if (resizeRef.current !== null) {
						resizeRef.current = null;
						return;
					}
					const activeMarquee = marqueeRef.current;
					if (activeMarquee !== null) {
						marqueeRef.current = null;
						setMarquee(null);
						const minX = Math.min(activeMarquee.start.x, activeMarquee.current.x);
						const minY = Math.min(activeMarquee.start.y, activeMarquee.current.y);
						const maxX = Math.max(activeMarquee.start.x, activeMarquee.current.x);
						const maxY = Math.max(activeMarquee.start.y, activeMarquee.current.y);
						const hits = (documentRef.current?.nodes ?? []).filter((node) => node.x < maxX && node.x + node.width > minX && node.y < maxY && node.y + node.height > minY).map((node) => node.id);
						if (Math.abs(activeMarquee.current.x - activeMarquee.start.x) < 4 && Math.abs(activeMarquee.current.y - activeMarquee.start.y) < 4) {
							setSelectedConnectionId(null);
							return;
						}
						const next = activeMarquee.additive ? /* @__PURE__ */ new Set([...activeMarquee.initialIds, ...hits]) : new Set(hits);
						setSelectedIds(next);
						setSelectedConnectionId(null);
						return;
					}
					const pan = panRef.current;
					if (pan !== null) {
						panRef.current = null;
						if (!pan.hasMoved && pan.startedOnBackground) {
							setSelectedIds(/* @__PURE__ */ new Set());
							setSelectedConnectionId(null);
						}
					}
				};
				window.addEventListener("pointermove", move);
				window.addEventListener("pointerup", up);
				window.addEventListener("pointercancel", up);
				return () => {
					window.removeEventListener("pointermove", move);
					window.removeEventListener("pointerup", up);
					window.removeEventListener("pointercancel", up);
				};
			}, [
				commitSnapshot,
				connectNodes,
				screenToWorld,
				updateDocument,
				updateNodes
			]);
			const handleNodePointerDown = (0, react.useCallback)((event, nodeId) => {
				if (event.button !== 0 || tool === "pan" || temporaryPanTool) return;
				const current = documentRef.current;
				if (current === null) return;
				if (current.nodes.find((item) => item.id === nodeId) === void 0) return;
				event.stopPropagation();
				const additive = event.shiftKey || event.ctrlKey || event.metaKey;
				let nextSelection = selectedIdsRef.current;
				if (additive) {
					nextSelection = new Set(selectedIdsRef.current);
					if (nextSelection.has(nodeId)) nextSelection.delete(nodeId);
					else nextSelection.add(nodeId);
				} else if (!nextSelection.has(nodeId)) nextSelection = /* @__PURE__ */ new Set([nodeId]);
				setSelectedIds(nextSelection);
				setSelectedConnectionId(null);
				const origins = /* @__PURE__ */ new Map();
				for (const id of nextSelection) {
					const item = current.nodes.find((candidate) => candidate.id === id);
					if (item !== void 0) origins.set(id, {
						x: item.x,
						y: item.y
					});
				}
				dragRef.current = {
					pointerId: event.pointerId,
					startX: event.clientX,
					startY: event.clientY,
					moved: false,
					snapshot: JSON.stringify(current),
					origins
				};
			}, [temporaryPanTool, tool]);
			const handleConnectStart = (0, react.useCallback)((event, nodeId, handleType) => {
				if (event.button !== 0) return;
				event.stopPropagation();
				event.preventDefault();
				const next = {
					nodeId,
					handleType,
					mouse: screenToWorld(event.clientX, event.clientY),
					targetId: null
				};
				connectRef.current = next;
				setConnecting(next);
				setSelectedConnectionId(null);
			}, [screenToWorld]);
			const handleResizeStart = (0, react.useCallback)((event, node, corner) => {
				if (event.button !== 0) return;
				event.stopPropagation();
				event.preventDefault();
				const asset = assetOf(node);
				const ratio = node.type === "image" && asset !== void 0 && asset.width > 0 && asset.height > 0 ? asset.width / asset.height : null;
				resizeRef.current = {
					nodeId: node.id,
					corner,
					startX: event.clientX,
					startY: event.clientY,
					width: node.width,
					height: node.height,
					x: node.x,
					y: node.y,
					ratio
				};
				beginHistory();
			}, [beginHistory]);
			const handleConnectionSelect = (0, react.useCallback)((connectionId) => {
				setSelectedConnectionId(connectionId);
				setSelectedIds(/* @__PURE__ */ new Set());
			}, []);
			const onDrop = (0, react.useCallback)((event) => {
				event.preventDefault();
				const files = [...event.dataTransfer.files ?? []].filter((file) => file.type.startsWith("image/"));
				if (files.length === 0) return;
				const world = screenToWorld(event.clientX, event.clientY);
				Promise.all(files.map(async (file) => {
					const dataUrl = await new Promise((resolve, reject) => {
						const reader = new FileReader();
						reader.onload = () => resolve(String(reader.result));
						reader.onerror = () => reject(/* @__PURE__ */ new Error("读取图片失败"));
						reader.readAsDataURL(file);
					});
					const dimensions = await readImageSize(dataUrl);
					return api.canvasUpload(dataUrl, dimensions.width, dimensions.height, {
						origin: "upload",
						originId: file.name
					});
				})).then((assets) => addAssets(assets, world)).catch((caught) => setError(caught instanceof Error ? caught.message : String(caught)));
			}, [
				addAssets,
				api,
				screenToWorld
			]);
			const newCanvas = (0, react.useCallback)(async () => {
				try {
					const next = await api.canvasCreate(tt("canvas.untitled"));
					setProjects((previous) => [summaryOf(next), ...previous]);
					setDocument(next);
					setSelectedIds(/* @__PURE__ */ new Set());
					setSelectedConnectionId(null);
					syncedRef.current = JSON.stringify(next);
					setSaveState("saved");
					pastRef.current = [];
					futureRef.current = [];
					setHistoryVersion((version) => version + 1);
				} catch (caught) {
					setError(caught instanceof Error ? caught.message : String(caught));
				}
			}, [api]);
			const selectProject = (0, react.useCallback)(async (id) => {
				try {
					const next = await api.canvasRead(id);
					setDocument(normalizeConfigNodeSizes(next));
					setSelectedIds(/* @__PURE__ */ new Set());
					setSelectedConnectionId(null);
					syncedRef.current = JSON.stringify(next);
					setSaveState("saved");
					pastRef.current = [];
					futureRef.current = [];
					setHistoryVersion((version) => version + 1);
				} catch (caught) {
					setError(caught instanceof Error ? caught.message : String(caught));
				}
			}, [api]);
			const removeCurrentProject = (0, react.useCallback)(async () => {
				const current = documentRef.current;
				if (current === null) return;
				try {
					const remaining = await api.canvasRemove(current.id);
					setConfirmDeleteProject(false);
					const nextId = remaining[0]?.id;
					if (nextId === void 0) {
						const created = await api.canvasCreate(tt("canvas.untitled"));
						setProjects([summaryOf(created)]);
						setDocument(created);
						syncedRef.current = JSON.stringify(created);
						setSaveState("saved");
					} else {
						setProjects(remaining);
						await selectProject(nextId);
					}
					setSelectedIds(/* @__PURE__ */ new Set());
					setSelectedConnectionId(null);
				} catch (caught) {
					setError(caught instanceof Error ? caught.message : String(caught));
				}
			}, [api, selectProject]);
			const nodeById = (0, react.useMemo)(() => new Map((document?.nodes ?? []).map((node) => [node.id, node])), [document]);
			const relatedIds = (0, react.useMemo)(() => {
				const related = /* @__PURE__ */ new Set();
				if (document === null) return related;
				for (const connection of document.connections) {
					if (selectedIds.has(connection.fromNodeId)) related.add(connection.toNodeId);
					if (selectedIds.has(connection.toNodeId)) related.add(connection.fromNodeId);
				}
				return related;
			}, [document, selectedIds]);
			const cursorClass = tool === "pan" || temporaryPanTool ? canvas_workspace_module_css_default.panCursor : canvas_workspace_module_css_default.selectCursor;
			const backgroundMode = document?.background ?? "dots";
			const setBackgroundMode = (0, react.useCallback)((mode) => {
				mutate((previous) => ({
					...previous,
					background: mode,
					...mode === "image" ? {} : { backgroundImage: void 0 }
				}));
				setBackgroundMenu(null);
			}, [mutate]);
			const uploadBackgroundImage = (0, react.useCallback)(async (file) => {
				try {
					const dataUrl = await new Promise((resolve, reject) => {
						const reader = new FileReader();
						reader.onload = () => resolve(String(reader.result));
						reader.onerror = () => reject(/* @__PURE__ */ new Error("读取图片失败"));
						reader.readAsDataURL(file);
					});
					const dimensions = await readImageSize(dataUrl);
					const asset = await api.canvasUpload(dataUrl, dimensions.width, dimensions.height, {
						origin: "upload",
						originId: "canvas-background"
					});
					mutate((previous) => ({
						...previous,
						background: "image",
						backgroundImage: asset.url
					}));
					setBackgroundMenu(null);
					setError(null);
				} catch (caught) {
					setError(caught instanceof Error ? caught.message : String(caught));
				}
			}, [api, mutate]);
			const removeBackgroundImage = (0, react.useCallback)(() => {
				mutate((previous) => ({
					...previous,
					background: "dots",
					backgroundImage: void 0
				}));
				setBackgroundMenu(null);
			}, [mutate]);
			const applyTemplate = (0, react.useCallback)((prompt) => {
				const center = canvasCenter();
				const config = createConfigNode(center);
				const placed = {
					...createTextNode(),
					x: Math.round(config.x - TEXT_NODE_SIZE.width - 80),
					y: Math.round(config.y + (config.height - TEXT_NODE_SIZE.height) / 2),
					metadata: {
						text: prompt,
						fontSize: 14
					}
				};
				mutate((previous) => ({
					...previous,
					nodes: [
						...previous.nodes,
						placed,
						config
					],
					connections: [...previous.connections, {
						id: newId("edge"),
						fromNodeId: placed.id,
						toNodeId: config.id
					}]
				}));
				setSelectedIds(/* @__PURE__ */ new Set([config.id]));
				setSelectedConnectionId(null);
				setLibraryOpen(false);
			}, [
				canvasCenter,
				createConfigNode,
				createTextNode,
				mutate
			]);
			const gridSize = GRID_SIZE * (document?.viewport.k ?? 1);
			const gridOffsetX = (document?.viewport.x ?? 0) % gridSize;
			const gridOffsetY = (document?.viewport.y ?? 0) % gridSize;
			const renderNode = (node) => {
				const metadata = nodeMetadata(node);
				const isSelected = selectedIds.has(node.id);
				const isRelated = relatedIds.has(node.id);
				const asset = assetOf(node);
				const isGenerating = node.type === "image" && metadata.status === "generating";
				const isError = node.type === "image" && metadata.status === "error";
				const isConnectTarget = connecting?.targetId === node.id;
				const hasImage = asset !== void 0 && asset.url !== "";
				const isConfig = node.type === "config";
				const isTextual = node.type === "text" || isConfig;
				return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					"data-node-id": node.id,
					className: `${canvas_workspace_module_css_default.node} ${isConfig ? canvas_workspace_module_css_default.configNode : isTextual ? canvas_workspace_module_css_default.textNode : canvas_workspace_module_css_default.imageNode} ${isSelected ? canvas_workspace_module_css_default.nodeSelected : ""} ${isRelated ? canvas_workspace_module_css_default.nodeRelated : ""} ${isConnectTarget ? canvas_workspace_module_css_default.nodeConnectTarget : ""}`,
					style: {
						left: node.x,
						top: node.y,
						width: node.width,
						height: node.height
					},
					onPointerDown: (event) => handleNodePointerDown(event, node.id),
					onContextMenu: (event) => {
						if (event.target.closest("textarea, input, select")) return;
						event.preventDefault();
						event.stopPropagation();
						if (!selectedIds.has(node.id)) setSelectedIds(/* @__PURE__ */ new Set([node.id]));
						setContextMenu({
							type: "node",
							screen: {
								x: event.clientX,
								y: event.clientY
							},
							nodeId: node.id
						});
					},
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: canvas_workspace_module_css_default.nodeGlow,
							"aria-hidden": "true"
						}),
						isTextual ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("header", {
							className: canvas_workspace_module_css_default.nodeHeader,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: canvas_workspace_module_css_default.nodeTitle,
								children: node.title
							})
						}) : null,
						isConfig ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: canvas_workspace_module_css_default.configLinks,
							"data-config-links": node.id,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: canvas_workspace_module_css_default.composerChip,
								children: tt("canvas.composerLinked", { count: (document?.connections ?? []).filter((connection) => connection.toNodeId === node.id).length })
							})
						}) : null,
						isConfig ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: canvas_workspace_module_css_default.configHint,
							children: tt("canvas.configHint")
						}) : isTextual ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
							className: canvas_workspace_module_css_default.textArea,
							value: metadata.text ?? "",
							placeholder: tt("canvas.textPlaceholder"),
							onPointerDown: (event) => event.stopPropagation(),
							onChange: (event) => patchNode(node.id, { text: event.target.value })
						}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: canvas_workspace_module_css_default.nodeBody,
							children: [hasImage ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								"aria-hidden": "true",
								children: [metadata.model !== void 0 && metadata.model !== "" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: `${canvas_workspace_module_css_default.imageInfo} ${canvas_workspace_module_css_default.imageInfoLeft}`,
									children: metadata.model
								}) : asset.origin === "gallery" || asset.origin === "history" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: `${canvas_workspace_module_css_default.imageInfo} ${canvas_workspace_module_css_default.imageInfoLeft}`,
									children: asset.origin === "gallery" ? tt("canvas.fromGallery") : tt("canvas.fromHistory")
								}) : null, asset !== void 0 && asset.width > 1 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: `${canvas_workspace_module_css_default.imageInfo} ${canvas_workspace_module_css_default.imageInfoRight}`,
									children: [
										asset.width,
										"×",
										asset.height
									]
								}) : null]
							}) : null, isGenerating ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: canvas_workspace_module_css_default.nodeState,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: canvas_workspace_module_css_default.spinner,
									"aria-hidden": "true"
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: tt("canvas.generatingNode") })]
							}) : isError ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: canvas_workspace_module_css_default.nodeStateError,
								children: [metadata.error ?? tt("canvas.generateFailed"), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => {
										retryGeneration(node);
									},
									children: tt("canvas.retry")
								})]
							}) : hasImage ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
								src: asset.url,
								alt: node.title,
								draggable: false,
								onDragStart: (event) => event.preventDefault()
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: canvas_workspace_module_css_default.nodeEmpty,
								onClick: () => imageFileRef.current?.click(),
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ToolbarIcon, { name: "image" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: tt("canvas.emptyImageNode") })]
							})]
						}),
						isSelected ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: canvas_workspace_module_css_default.resizeHandle,
							onPointerDown: (event) => handleResizeStart(event, node, "bottom-right"),
							title: tt("canvas.resizeHint")
						}) : null,
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: `${canvas_workspace_module_css_default.handle} ${canvas_workspace_module_css_default.handleLeft}`,
							title: tt("canvas.connectHint"),
							onPointerDown: (event) => handleConnectStart(event, node.id, "target")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: `${canvas_workspace_module_css_default.handle} ${canvas_workspace_module_css_default.handleRight}`,
							title: tt("canvas.connectHint"),
							onPointerDown: (event) => handleConnectStart(event, node.id, "source")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: canvas_workspace_module_css_default.hoverToolbar,
							onPointerDown: (event) => event.stopPropagation(),
							children: [
								node.type === "image" && hasImage ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
									name: "download",
									label: tt("canvas.download"),
									onClick: () => downloadNode(node)
								}) : null,
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
									name: "duplicate",
									label: tt("canvas.duplicate"),
									onClick: duplicateSelection
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
									name: "trash",
									label: tt("canvas.delete"),
									onClick: deleteSelection
								})
							]
						})
					]
				}, node.id);
			};
			const renderConnections = () => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				className: canvas_workspace_module_css_default.connectionLayer,
				width: WORLD_PAD * 2,
				height: WORLD_PAD * 2,
				style: {
					left: -12e3,
					top: -12e3
				},
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("g", {
					transform: `translate(${WORLD_PAD},${WORLD_PAD})`,
					children: [(document?.connections ?? []).map((connection) => {
						const from = nodeById.get(connection.fromNodeId);
						const to = nodeById.get(connection.toNodeId);
						if (from === void 0 || to === void 0) return null;
						const path = bezierPath(nodeAnchor(from, "right"), nodeAnchor(to, "left"));
						const active = connection.id === selectedConnectionId;
						return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("g", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
							"data-connection-hit": connection.id,
							d: path,
							stroke: "transparent",
							strokeWidth: 16,
							fill: "none",
							style: {
								cursor: "pointer",
								pointerEvents: "stroke"
							},
							onPointerDown: (event) => {
								event.stopPropagation();
								handleConnectionSelect(connection.id);
							},
							onContextMenu: (event) => {
								event.preventDefault();
								event.stopPropagation();
								handleConnectionSelect(connection.id);
								setContextMenu({
									type: "connection",
									screen: {
										x: event.clientX,
										y: event.clientY
									},
									connectionId: connection.id
								});
							}
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
							d: path,
							className: `${canvas_workspace_module_css_default.connectionPath} ${active ? canvas_workspace_module_css_default.connectionActive : ""}`
						})] }, connection.id);
					}), connecting !== null ? (() => {
						const node = nodeById.get(connecting.nodeId);
						if (node === void 0) return null;
						const mouse = connecting.targetId !== void 0 && connecting.targetId !== null && nodeById.has(connecting.targetId) ? nodeAnchor(nodeById.get(connecting.targetId), connecting.handleType === "source" ? "left" : "right") : connecting.mouse;
						return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
							d: connecting.handleType === "source" ? bezierPath(nodeAnchor(node, "right"), mouse) : bezierPath(mouse, nodeAnchor(node, "left")),
							className: canvas_workspace_module_css_default.connectionPreview
						});
					})() : null]
				})
			});
			const renderComposer = () => {
				if (!composerVisible || document === null || composerTarget === null) return null;
				const linkedCount = composerReferenceCount + composerTextCount;
				const k = document.viewport.k;
				const topOffset = viewportRef.current?.offsetTop ?? 0;
				const centerX = topOffset * 0 + document.viewport.x + (composerTarget.x + composerTarget.width / 2) * k;
				const clampedX = Math.min(Math.max(centerX, 292), Math.max(292, viewportSize.width - 292));
				const belowY = topOffset + document.viewport.y + (composerTarget.y + composerTarget.height) * k + 14;
				const top = belowY > viewportSize.height + topOffset - 170 ? Math.max(64, topOffset + document.viewport.y + composerTarget.y * k - 158) : belowY;
				return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: canvas_workspace_module_css_default.composer,
					"data-canvas-no-zoom": "",
					style: {
						left: clampedX - 280,
						top
					},
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
							className: canvas_workspace_module_css_default.composerPrompt,
							value: composerPrompt,
							placeholder: tt("canvas.composerPlaceholder"),
							rows: 1,
							onPointerDown: (event) => event.stopPropagation(),
							onChange: (event) => setComposerPrompt(event.target.value),
							onKeyDown: (event) => {
								if (event.key === "Enter" && !event.shiftKey) {
									event.preventDefault();
									submitComposer(composerTarget);
								}
							}
						}),
						linkedCount > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: canvas_workspace_module_css_default.composerMeta,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: canvas_workspace_module_css_default.composerChip,
								children: tt("canvas.composerLinked", { count: linkedCount })
							})
						}) : null,
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: canvas_workspace_module_css_default.composerControls,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
									value: composerModel,
									onChange: (event) => setComposerModel(event.target.value),
									"aria-label": tt("canvas.model"),
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: "",
										children: tt("canvas.modelPlaceholder")
									}), imageModels.map((item) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: item,
										children: item
									}, item))]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
									value: composerSize,
									onChange: (event) => setComposerSize(event.target.value),
									"aria-label": tt("canvas.size"),
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
											value: "auto",
											children: tt("canvas.sizeAuto")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
											value: "1:1",
											children: "1:1"
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
											value: "3:4",
											children: "3:4"
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
											value: "16:9",
											children: "16:9"
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
											value: "9:16",
											children: "9:16"
										})
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
									value: composerQuality,
									onChange: (event) => setComposerQuality(event.target.value),
									"aria-label": tt("canvas.quality"),
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
											value: "auto",
											children: tt("canvas.qualityAuto")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
											value: "1k",
											children: "1K"
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
											value: "2k",
											children: "2K"
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
											value: "4k",
											children: "4K"
										})
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
									value: composerCount,
									onChange: (event) => setComposerCount(Number(event.target.value)),
									"aria-label": tt("canvas.count"),
									children: [
										1,
										2,
										3,
										4
									].map((item) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: item,
										children: tt("canvas.countUnit", { count: item })
									}, item))
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: canvas_workspace_module_css_default.composerSend,
									"aria-label": tt("canvas.generate"),
									title: tt("canvas.generate"),
									disabled: !connected || composerBusy || composerPrompt.trim() === "" && composerTextCount === 0,
									onClick: () => {
										submitComposer(composerTarget);
									},
									children: composerBusy ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: canvas_workspace_module_css_default.spinner,
										"aria-hidden": "true"
									}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ToolbarIcon, { name: "send" })
								})
							]
						})
					]
				});
			};
			const renderMinimap = () => {
				if (document === null || viewportSize.width === 0) return null;
				const width = 220;
				const height = 150;
				const nodes = document.nodes;
				let worldBounds = {
					x: -600,
					y: -600,
					w: 1200,
					h: 1200
				};
				let scale = Math.min(width / worldBounds.w, height / worldBounds.h);
				let offset = {
					x: (width - worldBounds.w * scale) / 2,
					y: (height - worldBounds.h * scale) / 2
				};
				if (nodes.length > 0) {
					const content = nodesBounds(nodes);
					worldBounds = {
						x: content.minX - 500,
						y: content.minY - 500,
						w: content.maxX - content.minX + 1e3,
						h: content.maxY - content.minY + 1e3
					};
					scale = Math.min(width / worldBounds.w, height / worldBounds.h);
					offset = {
						x: (width - worldBounds.w * scale) / 2,
						y: (height - worldBounds.h * scale) / 2
					};
				}
				const toMap = (worldX, worldY) => ({
					x: (worldX - worldBounds.x) * scale + offset.x,
					y: (worldY - worldBounds.y) * scale + offset.y
				});
				const toWorld = (mapX, mapY) => ({
					x: (mapX - offset.x) / scale + worldBounds.x,
					y: (mapY - offset.y) / scale + worldBounds.y
				});
				const viewportRect = (() => {
					const vx = -document.viewport.x / document.viewport.k;
					const vy = -document.viewport.y / document.viewport.k;
					const p1 = toMap(vx, vy);
					const p2 = toMap(vx + viewportSize.width / document.viewport.k, vy + viewportSize.height / document.viewport.k);
					return {
						x: p1.x,
						y: p1.y,
						w: Math.max(p2.x - p1.x, 4),
						h: Math.max(p2.y - p1.y, 4)
					};
				})();
				const jump = (event) => {
					const bounds = event.currentTarget.getBoundingClientRect();
					const world = toWorld(event.clientX - bounds.left, event.clientY - bounds.top);
					setViewport({
						k: document.viewport.k,
						x: viewportSize.width / 2 - world.x * document.viewport.k,
						y: viewportSize.height / 2 - world.y * document.viewport.k
					});
				};
				return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("aside", {
					className: canvas_workspace_module_css_default.minimap,
					"data-canvas-no-zoom": "",
					"aria-label": tt("canvas.minimap"),
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: canvas_workspace_module_css_default.minimapCanvas,
						onPointerDown: (event) => {
							event.preventDefault();
							event.currentTarget.setPointerCapture(event.pointerId);
							jump(event);
						},
						onPointerMove: (event) => {
							if (event.buttons === 1) jump(event);
						},
						children: [nodes.map((node) => {
							const position = toMap(node.x, node.y);
							return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: `${canvas_workspace_module_css_default.minimapNode} ${node.type === "image" ? canvas_workspace_module_css_default.minimapImage : canvas_workspace_module_css_default.minimapText} ${selectedIds.has(node.id) ? canvas_workspace_module_css_default.minimapSelected : ""}`,
								style: {
									left: position.x,
									top: position.y,
									width: Math.max(node.width * scale, 2),
									height: Math.max(node.height * scale, 2)
								}
							}, node.id);
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: canvas_workspace_module_css_default.minimapViewport,
							style: {
								left: viewportRect.x,
								top: viewportRect.y,
								width: viewportRect.w,
								height: viewportRect.h
							}
						})]
					})
				});
			};
			const renderContextMenu = () => {
				if (contextMenu !== null) {
					const close = () => setContextMenu(null);
					const items = [];
					if (contextMenu.type === "node") {
						const node = nodeById.get(contextMenu.nodeId);
						if (node !== void 0 && node.type === "image" && (assetOf(node)?.url.length ?? 0) > 0) items.push({
							label: tt("canvas.download"),
							icon: "download",
							action: () => downloadNode(node)
						});
						items.push({
							label: tt("canvas.duplicate"),
							icon: "duplicate",
							action: duplicateSelection
						});
						items.push({
							label: tt("canvas.delete"),
							icon: "trash",
							action: deleteSelection,
							danger: true
						});
					} else if (contextMenu.type === "connection") items.push({
						label: tt("canvas.deleteConnection"),
						icon: "close",
						danger: true,
						action: () => {
							mutate((previous) => ({
								...previous,
								connections: previous.connections.filter((connection) => connection.id !== contextMenu.connectionId)
							}));
							setSelectedConnectionId(null);
						}
					});
					else {
						items.push({
							label: tt("canvas.addImage"),
							icon: "image",
							action: () => setPickerOpen(true)
						});
						items.push({
							label: tt("canvas.addTextNode"),
							icon: "text",
							action: () => placeNewNode(createTextNode(contextMenu.world))
						});
						items.push({
							label: tt("canvas.paste"),
							icon: "duplicate",
							action: () => pasteClipboard(contextMenu.world)
						});
						items.push({
							label: tt("canvas.fitView"),
							icon: "fit",
							action: fitView
						});
					}
					return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: canvas_workspace_module_css_default.contextMenu,
						style: {
							left: contextMenu.screen.x,
							top: contextMenu.screen.y
						},
						"data-canvas-no-zoom": "",
						role: "menu",
						children: items.map((item) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							role: "menuitem",
							"data-danger": item.danger ? "" : void 0,
							onClick: () => {
								item.action();
								close();
							},
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ToolbarIcon, { name: item.icon }), item.label]
						}, item.label))
					});
				}
				if (createMenu !== null) return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: canvas_workspace_module_css_default.contextMenu,
					style: {
						left: createMenu.screen.x,
						top: createMenu.screen.y
					},
					"data-canvas-no-zoom": "",
					role: "menu",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						role: "menuitem",
						onClick: () => {
							placeNewNode(createImageNode({
								assetId: "",
								url: "",
								mime: "image/png",
								bytes: 0,
								width: 1,
								height: 1,
								origin: "upload"
							}, createMenu.world));
							setCreateMenu(null);
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ToolbarIcon, { name: "image" }), tt("canvas.addImageNode")]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						role: "menuitem",
						onClick: () => {
							placeNewNode(createTextNode(createMenu.world));
							setCreateMenu(null);
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ToolbarIcon, { name: "text" }), tt("canvas.addTextNode")]
					})]
				});
				return null;
			};
			const emptyState = document !== null && document.nodes.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: canvas_workspace_module_css_default.emptyHint,
				"data-canvas-no-zoom": "",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: tt("canvas.emptyTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: tt("canvas.emptyHint") })]
			}) : null;
			const marqueeRect = marquee === null ? null : (() => {
				const x1 = Math.min(marquee.start.x, marquee.current.x) * (document?.viewport.k ?? 1) + (document?.viewport.x ?? 0);
				const y1 = Math.min(marquee.start.y, marquee.current.y) * (document?.viewport.k ?? 1) + (document?.viewport.y ?? 0);
				const x2 = Math.max(marquee.start.x, marquee.current.x) * (document?.viewport.k ?? 1) + (document?.viewport.x ?? 0);
				const y2 = Math.max(marquee.start.y, marquee.current.y) * (document?.viewport.k ?? 1) + (document?.viewport.y ?? 0);
				return {
					left: x1,
					top: y1,
					width: x2 - x1,
					height: y2 - y1
				};
			})();
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				ref: rootRef,
				className: canvas_workspace_module_css_default.root,
				"data-canvas-workspace": "",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
						className: canvas_workspace_module_css_default.topBar,
						"data-canvas-no-zoom": "",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
								className: canvas_workspace_module_css_default.projectSelect,
								value: document?.id ?? "",
								onChange: (event) => {
									selectProject(event.target.value);
								},
								"aria-label": tt("canvas.project"),
								children: projects.map((project) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
									value: project.id,
									children: project.title
								}, project.id))
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
								name: "new",
								label: tt("canvas.newCanvas"),
								onClick: () => {
									newCanvas();
								}
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
								name: "deleteProject",
								label: confirmDeleteProject ? tt("canvas.deleteCanvasConfirm") : tt("canvas.deleteCanvas"),
								active: confirmDeleteProject,
								disabled: document === null,
								onClick: () => {
									if (confirmDeleteProject) removeCurrentProject();
									else {
										setConfirmDeleteProject(true);
										window.setTimeout(() => setConfirmDeleteProject(false), 3e3);
									}
								}
							}),
							renamingTitle && document !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								className: canvas_workspace_module_css_default.titleInput,
								value: document.title,
								autoFocus: true,
								"aria-label": tt("canvas.rename"),
								onChange: (event) => updateDocument((previous) => ({
									...previous,
									title: event.target.value
								})),
								onBlur: () => setRenamingTitle(false),
								onKeyDown: (event) => {
									if (event.key === "Enter" || event.key === "Escape") setRenamingTitle(false);
								}
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: canvas_workspace_module_css_default.titleButton,
								onDoubleClick: () => setRenamingTitle(true),
								title: tt("canvas.renameHint"),
								children: document?.title ?? ""
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: canvas_workspace_module_css_default.topBarSpacer }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: canvas_workspace_module_css_default.saveState,
								"data-state": saveState,
								children: saveState === "saving" ? tt("canvas.saving") : saveState === "saved" ? tt("canvas.saved") : saveState === "error" ? tt("canvas.saveFailed") : tt("canvas.loading")
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						ref: viewportRef,
						className: `${canvas_workspace_module_css_default.viewport} ${cursorClass}`,
						onPointerDown: onViewportPointerDown,
						onWheel,
						onDoubleClick: (event) => {
							if ((event.target instanceof Element ? event.target : null)?.closest("[data-node-id],[data-canvas-no-zoom]")) return;
							setCreateMenu({
								screen: {
									x: event.clientX,
									y: event.clientY
								},
								world: screenToWorld(event.clientX, event.clientY)
							});
						},
						onContextMenu: (event) => {
							if ((event.target instanceof Element ? event.target : null)?.closest("[data-node-id],[data-connection-hit],[data-canvas-no-zoom]")) return;
							event.preventDefault();
							setCreateMenu(null);
							setContextMenu({
								type: "canvas",
								screen: {
									x: event.clientX,
									y: event.clientY
								},
								world: screenToWorld(event.clientX, event.clientY)
							});
						},
						onDragOver: (event) => event.preventDefault(),
						onDrop,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: canvas_workspace_module_css_default.grid,
								style: backgroundMode === "image" && document?.backgroundImage ? {
									backgroundImage: `url(${document.backgroundImage})`,
									backgroundSize: "cover",
									backgroundPosition: "center"
								} : {
									backgroundSize: `${gridSize}px ${gridSize}px`,
									backgroundPosition: `${gridOffsetX}px ${gridOffsetY}px`
								},
								"data-mode": backgroundMode,
								"aria-hidden": "true",
								children: backgroundMode === "image" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: canvas_workspace_module_css_default.gridScrim }) : null
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: canvas_workspace_module_css_default.world,
								style: { transform: `translate(${document?.viewport.x ?? 0}px, ${document?.viewport.y ?? 0}px) scale(${document?.viewport.k ?? 1})` },
								children: [renderConnections(), document?.nodes.map(renderNode)]
							}),
							marqueeRect !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: canvas_workspace_module_css_default.marquee,
								style: marqueeRect,
								"aria-hidden": "true"
							}) : null,
							emptyState
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: `${canvas_workspace_module_css_default.dock} ${cursorClass}`,
						"data-canvas-no-zoom": "",
						onPointerMove: (event) => {
							const buttons = [...event.currentTarget.querySelectorAll(".iconButton")];
							for (const button of buttons) {
								const rect = button.getBoundingClientRect();
								const distance = Math.abs(event.clientX - (rect.left + rect.width / 2)) / 40;
								button.style.setProperty("--dock-lift", `${Math.max(0, 4 - distance * 1.5)}px`);
							}
						},
						onPointerLeave: (event) => {
							for (const button of event.currentTarget.querySelectorAll(".iconButton")) button.style.removeProperty("--dock-lift");
						},
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
								name: "select",
								size: 18,
								label: tt("canvas.toolSelect"),
								active: tool === "select",
								onClick: () => setTool("select")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
								name: "pan",
								size: 18,
								label: tt("canvas.toolPan"),
								active: tool === "pan",
								onClick: () => setTool("pan")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: canvas_workspace_module_css_default.dockDivider }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
								name: "image",
								size: 18,
								label: tt("canvas.addImage"),
								active: imageMenu !== null,
								onClick: (event) => openDockMenu("image", event.currentTarget),
								onMouseEnter: (event) => openDockMenu("image", event.currentTarget),
								onMouseLeave: scheduleMenuClose
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
								name: "text",
								size: 18,
								label: tt("canvas.addText"),
								onClick: () => placeNewNode(createTextNode())
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
								name: "sparkle",
								size: 18,
								label: tt("canvas.addConfigNode"),
								onClick: () => placeNewNode(createConfigNode())
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
								name: "template",
								size: 18,
								label: tt("canvas.templateLibrary"),
								active: libraryOpen,
								onClick: () => setLibraryOpen((previous) => !previous)
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: canvas_workspace_module_css_default.dockDivider }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
								name: "background",
								size: 18,
								label: tt("canvas.background"),
								active: backgroundMenu !== null,
								onClick: (event) => openDockMenu("background", event.currentTarget),
								onMouseEnter: (event) => openDockMenu("background", event.currentTarget),
								onMouseLeave: scheduleMenuClose
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
								name: "undo",
								size: 18,
								label: tt("canvas.undo"),
								disabled: pastRef.current.length === 0,
								onClick: undo
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
								name: "redo",
								size: 18,
								label: tt("canvas.redo"),
								disabled: futureRef.current.length === 0,
								onClick: redo
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: canvas_workspace_module_css_default.dockDivider }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
								name: "trash",
								size: 18,
								label: tt("canvas.delete"),
								disabled: selectedIds.size === 0 && selectedConnectionId === null,
								onClick: deleteSelection
							})
						]
					}),
					imageMenu !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: canvas_workspace_module_css_default.backgroundMenu,
						style: {
							left: imageMenu.x,
							top: imageMenu.y - 10
						},
						"data-canvas-no-zoom": "",
						role: "menu",
						onMouseEnter: clearMenuCloseTimer,
						onMouseLeave: scheduleMenuClose,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								role: "menuitem",
								onClick: () => {
									imageFileRef.current?.click();
									setImageMenu(null);
								},
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ToolbarIcon, {
									name: "image",
									size: 16
								}), tt("canvas.imageMenuUpload")]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								role: "menuitem",
								onClick: () => {
									setPickerTab("gallery");
									setPickerOpen(true);
									setImageMenu(null);
								},
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ToolbarIcon, {
									name: "template",
									size: 16
								}), tt("canvas.imageMenuAssets")]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								role: "menuitem",
								onClick: () => {
									setPickerTab("history");
									setPickerOpen(true);
									setImageMenu(null);
								},
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ToolbarIcon, {
									name: "undo",
									size: 16
								}), tt("canvas.imageMenuHistory")]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								role: "menuitem",
								onClick: () => {
									setPickerTab("generate");
									setPickerOpen(true);
									setImageMenu(null);
								},
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ToolbarIcon, {
									name: "sparkle",
									size: 16
								}), tt("canvas.imageMenuGenerate")]
							})
						]
					}) : null,
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
						ref: imageFileRef,
						type: "file",
						accept: "image/png,image/jpeg,image/webp,image/gif",
						multiple: true,
						hidden: true,
						onChange: (event) => {
							const files = [...event.target.files ?? []].filter((file) => file.type.startsWith("image/"));
							event.target.value = "";
							if (files.length === 0) return;
							const world = canvasCenter();
							Promise.all(files.map(async (file) => {
								const dataUrl = await new Promise((resolve, reject) => {
									const reader = new FileReader();
									reader.onload = () => resolve(String(reader.result));
									reader.onerror = () => reject(/* @__PURE__ */ new Error("读取图片失败"));
									reader.readAsDataURL(file);
								});
								const dimensions = await readImageSize(dataUrl);
								return api.canvasUpload(dataUrl, dimensions.width, dimensions.height, {
									origin: "upload",
									originId: file.name
								});
							})).then((assets) => {
								const current = documentRef.current;
								const selectedId = selectedIdsRef.current.size === 1 ? [...selectedIdsRef.current][0] : void 0;
								const selectedNode = current?.nodes.find((node) => node.id === selectedId);
								if (selectedNode?.type === "image" && usableAsset(selectedNode) === void 0 && assets[0] !== void 0) {
									mutate((previous) => ({
										...previous,
										nodes: previous.nodes.map((node) => node.id === selectedNode.id ? {
											...node,
											width: sizeForAsset(assets[0]).width,
											height: sizeForAsset(assets[0]).height,
											metadata: {
												...nodeMetadata(node),
												asset: assets[0],
												status: "success",
												error: void 0
											}
										} : node)
									}));
									if (assets.length > 1) addAssets(assets.slice(1), world);
								} else addAssets(assets, world);
							}).catch((caught) => setError(caught instanceof Error ? caught.message : String(caught)));
						}
					}),
					backgroundMenu !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: canvas_workspace_module_css_default.backgroundMenu,
						style: {
							left: backgroundMenu.x,
							top: backgroundMenu.y - 10
						},
						"data-canvas-no-zoom": "",
						role: "menu",
						onMouseEnter: clearMenuCloseTimer,
						onMouseLeave: scheduleMenuClose,
						children: [
							[
								["dots", tt("canvas.backgroundDots")],
								["lines", tt("canvas.backgroundLines")],
								["diagonal", tt("canvas.backgroundDiagonal")],
								["checker", tt("canvas.backgroundChecker")],
								["blank", tt("canvas.backgroundBlank")]
							].map(([mode, label]) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								role: "menuitem",
								"data-active": backgroundMode === mode ? "" : void 0,
								onClick: () => setBackgroundMode(mode),
								children: label
							}, mode)),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: canvas_workspace_module_css_default.backgroundMenuDivider }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								role: "menuitem",
								"data-active": backgroundMode === "image" ? "" : void 0,
								onClick: () => backgroundFileRef.current?.click(),
								children: tt("canvas.backgroundUpload")
							}),
							backgroundMode === "image" && document?.backgroundImage ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								role: "menuitem",
								onClick: removeBackgroundImage,
								children: tt("canvas.backgroundRemove")
							}) : null,
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								ref: backgroundFileRef,
								type: "file",
								accept: "image/png,image/jpeg,image/webp,image/gif",
								hidden: true,
								onChange: (event) => {
									const file = event.target.files?.[0];
									if (file !== void 0) uploadBackgroundImage(file);
									event.target.value = "";
								}
							})
						]
					}) : null,
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: canvas_workspace_module_css_default.zoomDock,
						"data-canvas-no-zoom": "",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
								name: "minimap",
								label: minimapOpen ? tt("canvas.minimapClose") : tt("canvas.minimapOpen"),
								active: minimapOpen,
								onClick: () => setMinimapOpen((previous) => !previous)
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconButton, {
								name: "fit",
								label: tt("canvas.fitView"),
								onClick: fitView
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								type: "range",
								min: 5,
								max: 500,
								step: 1,
								value: Math.round((document?.viewport.k ?? 1) * 100),
								onChange: (event) => setZoomAtCenter(Number(event.target.value) / 100),
								"aria-label": tt("canvas.zoom")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: canvas_workspace_module_css_default.zoomValue,
								children: [Math.round((document?.viewport.k ?? 1) * 100), "%"]
							})
						]
					}),
					minimapOpen ? renderMinimap() : null,
					renderComposer(),
					renderContextMenu(),
					libraryOpen ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(TemplateLibrary, {
						api,
						onClose: () => setLibraryOpen(false),
						onUse: applyTemplate
					}) : null,
					error !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: canvas_workspace_module_css_default.errorToast,
						role: "status",
						"data-canvas-no-zoom": "",
						children: [error, /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-label": tt("canvas.dismiss"),
							onClick: () => setError(null),
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ToolbarIcon, { name: "close" })
						})]
					}) : null,
					pickerOpen ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ImagePicker, {
						api,
						history,
						gallery,
						imageModels,
						defaultChannelId,
						canvasId: document?.id ?? "",
						connected,
						initialTab: pickerTab,
						onClose: () => setPickerOpen(false),
						onAssets: (assets) => {
							addAssets(assets);
							setPickerOpen(false);
						},
						onTask: (task) => {
							if (document === null) return;
							const center = canvasCenter();
							const size = nodeSizeFromRatio(task.request.size, IMAGE_NODE_SIZE);
							const node = {
								id: newId("node"),
								type: "image",
								title: tt("canvas.imageNode"),
								x: Math.round(center.x - size.width / 2),
								y: Math.round(center.y - size.height / 2),
								width: size.width,
								height: size.height,
								metadata: {
									status: "generating",
									prompt: task.request.prompt,
									model: task.request.model,
									size: task.request.size,
									quality: task.request.quality,
									taskId: task.id,
									sourceNodeId: task.request.canvas?.sourceNodeId
								}
							};
							placeNewNode(node);
							setPickerOpen(false);
						}
					}) : null
				]
			});
		}
		function ImagePicker(props) {
			const { api, history, gallery, imageModels, defaultChannelId, canvasId, connected, onClose, onAssets } = props;
			const [tab, setTab] = (0, react.useState)(props.initialTab ?? "upload");
			const [selected, setSelected] = (0, react.useState)([]);
			const [dimensions, setDimensions] = (0, react.useState)({});
			const [prompt, setPrompt] = (0, react.useState)("");
			const [model, setModel] = (0, react.useState)(imageModels[0] ?? "");
			const [size, setSize] = (0, react.useState)("auto");
			const [quality, setQuality] = (0, react.useState)("auto");
			const [busy, setBusy] = (0, react.useState)(false);
			const toggle = (key) => setSelected((previous) => previous.includes(key) ? previous.filter((item) => item !== key) : [...previous, key]);
			const items = (tab === "history" ? history : gallery).flatMap((entry) => entry.images.map((image, index) => ({
				key: `${entry.id}:${index}`,
				entry,
				image,
				index
			})));
			const uploadFiles = (files) => {
				setBusy(true);
				Promise.all(files.map(async (file) => {
					const dataUrl = await new Promise((resolve, reject) => {
						const reader = new FileReader();
						reader.onload = () => resolve(String(reader.result));
						reader.onerror = () => reject(/* @__PURE__ */ new Error("读取图片失败"));
						reader.readAsDataURL(file);
					});
					const sizeOf = await readImageSize(dataUrl);
					return api.canvasUpload(dataUrl, sizeOf.width, sizeOf.height, {
						origin: "upload",
						originId: file.name
					});
				})).then((assets) => {
					onAssets(assets);
				}).catch(() => {}).finally(() => setBusy(false));
			};
			const addSelected = async () => {
				setBusy(true);
				try {
					const assets = [];
					for (const key of selected) {
						const [entryId, indexText] = key.split(":");
						const index = Number(indexText);
						const item = items.find((candidate) => candidate.key === key);
						if (entryId === void 0 || item === void 0) continue;
						const sizeOf = dimensions[key] ?? await readImageSize(item.image.url).catch(() => ({
							width: 1024,
							height: 1024
						}));
						assets.push(await api.canvasImport(tab === "history" ? "history" : "gallery", entryId, index, sizeOf.width, sizeOf.height));
					}
					if (assets.length > 0) onAssets(assets);
				} finally {
					setBusy(false);
				}
			};
			const generate = async () => {
				if (!connected || prompt.trim() === "") return;
				setBusy(true);
				try {
					const task = await api.taskSubmit({
						mode: "text",
						model,
						prompt: prompt.trim(),
						size,
						quality,
						n: 1,
						detail: "",
						...defaultChannelId === void 0 ? {} : { channelId: defaultChannelId },
						canvas: { canvasId }
					});
					props.onTask(task);
				} finally {
					setBusy(false);
				}
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: canvas_workspace_module_css_default.modalBackdrop,
				role: "dialog",
				"aria-modal": "true",
				"data-canvas-no-zoom": "",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
					className: canvas_workspace_module_css_default.picker,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
							className: canvas_workspace_module_css_default.pickerHeader,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: tt("canvas.addImage") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-label": tt("canvas.close"),
								title: tt("canvas.close"),
								onClick: onClose,
								children: "×"
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("nav", {
							className: canvas_workspace_module_css_default.pickerTabs,
							role: "tablist",
							children: [
								"upload",
								"history",
								"gallery",
								"generate"
							].map((item) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								role: "tab",
								"aria-selected": tab === item,
								"data-active": tab === item ? "" : void 0,
								onClick: () => {
									setTab(item);
									setSelected([]);
								},
								children: item === "upload" ? tt("canvas.tabUpload") : item === "history" ? tt("canvas.tabHistory") : item === "gallery" ? tt("canvas.tabGallery") : tt("canvas.tabGenerate")
							}, item))
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: canvas_workspace_module_css_default.pickerBody,
							children: [
								tab === "upload" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
									className: canvas_workspace_module_css_default.uploadBox,
									onDragOver: (event) => event.preventDefault(),
									onDrop: (event) => {
										event.preventDefault();
										const files = [...event.dataTransfer.files ?? []].filter((file) => file.type.startsWith("image/"));
										if (files.length === 0) return;
										uploadFiles(files);
									},
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											type: "file",
											accept: "image/png,image/jpeg,image/webp,image/gif",
											multiple: true,
											disabled: busy,
											onChange: (event) => {
												const files = [...event.target.files ?? []];
												if (files.length > 0) uploadFiles(files);
											}
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: canvas_workspace_module_css_default.uploadIcon,
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ToolbarIcon, { name: "image" })
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: tt("canvas.dropHint") }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: tt("canvas.dropSub") })
									]
								}) : null,
								tab === "history" || tab === "gallery" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: canvas_workspace_module_css_default.pickerGrid,
									children: items.map((item) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										role: "option",
										"aria-selected": selected.includes(item.key),
										className: canvas_workspace_module_css_default.pickerCard,
										"data-selected": selected.includes(item.key) ? "" : void 0,
										onClick: () => toggle(item.key),
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
												draggable: false,
												src: item.image.url,
												alt: item.entry.prompt,
												onLoad: (event) => {
													const image = event.currentTarget;
													setDimensions((previous) => ({
														...previous,
														[item.key]: {
															width: image.naturalWidth || 1,
															height: image.naturalHeight || 1
														}
													}));
												}
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: canvas_workspace_module_css_default.pickerCardPrompt,
												children: item.entry.prompt || tt("canvas.untitledWork")
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("small", { children: [
												item.entry.model,
												" · ",
												item.index + 1,
												"/",
												item.entry.images.length
											] })
										]
									}, item.key))
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("footer", {
									className: canvas_workspace_module_css_default.pickerFooter,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: tt("canvas.picked", { count: selected.length }) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										disabled: busy || selected.length === 0,
										onClick: () => {
											addSelected();
										},
										children: tt("canvas.addToCanvas")
									})]
								})] }) : null,
								tab === "generate" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: canvas_workspace_module_css_default.generateForm,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
											value: prompt,
											onChange: (event) => setPrompt(event.target.value),
											placeholder: tt("canvas.composerPlaceholder")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
											value: model,
											onChange: (event) => setModel(event.target.value),
											children: imageModels.map((item) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
												value: item,
												children: item
											}, item))
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: canvas_workspace_module_css_default.inspectorRow,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
												value: size,
												onChange: (event) => setSize(event.target.value),
												children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
														value: "auto",
														children: tt("canvas.sizeAuto")
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
														value: "1:1",
														children: "1:1"
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
														value: "3:4",
														children: "3:4"
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
														value: "16:9",
														children: "16:9"
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
														value: "9:16",
														children: "9:16"
													})
												]
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
												value: quality,
												onChange: (event) => setQuality(event.target.value),
												children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
														value: "auto",
														children: tt("canvas.qualityAuto")
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
														value: "1k",
														children: "1K"
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
														value: "2k",
														children: "2K"
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
														value: "4k",
														children: "4K"
													})
												]
											})]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
											type: "button",
											disabled: !connected || busy || prompt.trim() === "",
											onClick: () => {
												generate();
											},
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ToolbarIcon, { name: "sparkle" }), tt("canvas.generateAndAdd")]
										}),
										!connected ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: tt("canvas.needApi") }) : null
									]
								}) : null
							]
						})
					]
				})
			});
		}
		//#endregion
		//#region src/client/use-language.ts
		/**
		* React binding for the plugin locale, which follows the DSH interface
		* language (bridged from ctx.locale in client/index.ts). Surfaces that render
		* tt() output subscribe to this tick so a DSH language switch re-renders them
		* immediately.
		*/
		/** Re-render the calling component whenever the DSH language changes. */
		function useImageGenLanguageTick() {
			return (0, react.useSyncExternalStore)(subscribeImageGenLanguage, getImageGenLanguageVersion);
		}
		//#endregion
		//#region src/client/settings-scope.ts
		/**
		* Browser-side settings scope for the dsh-imagegen namespace, served by the
		* plugin's own loopback bridge routes (/api/dsh-imagegen/settings). The
		* official rc.6 settings scope answers "unavailable" for every third-party
		* namespace (the host-apiproxy allowlist is hard-coded), so this package
		* re-serves its namespace through the host settings seam over a same-origin,
		* loopback-only HTTP pair — the same pattern the dsh-web-ui family bridge
		* uses, self-contained per plugin.
		*/
		/** Settings wire face over the bridge routes (fetch-backed). */
		function createBridgeApi(fetchFn) {
			const post = async (path, body) => {
				try {
					const response = await fetchFn(path, {
						method: "POST",
						headers: { "content-type": "application/json" },
						body: JSON.stringify(body)
					});
					if (!response.ok) return { result: {
						ok: false,
						code: "internal",
						message: `bridge HTTP ${response.status}`
					} };
					return { result: await response.json() };
				} catch {
					return { result: {
						ok: false,
						code: "internal",
						message: "settings bridge unreachable"
					} };
				}
			};
			return { settings: {
				describe: async (payload) => post(SETTINGS_API.describe, payload),
				mutate: async (payload) => post(SETTINGS_API.mutate, payload)
			} };
		}
		/**
		* A SettingsScope over the bridge face: serialized queue, revision-fenced
		* writes, recovery read after a refusal. Mirrors the official controller's
		* ordering but trusts the Host-seam value without re-running the wire-schema
		* validation — the seam already validated it.
		*/
		var BridgeScopeController = class {
			api;
			spec;
			store;
			/** Whether the namespace currently holds a stored secret (e.g. apiKey). */
			keySet;
			/** Individual secret presence bits, keyed by the settings field name. */
			secretSets;
			tail = Promise.resolve();
			disposed = false;
			constructor(api, spec) {
				this.api = api;
				this.spec = spec;
				this.store = (0, _deepseek_ai_dsh_client_store.createSnapshotStore)({
					status: "loading",
					value: void 0,
					base: void 0,
					user: void 0,
					revision: void 0,
					writable: false,
					mode: "host"
				});
				this.keySet = (0, _deepseek_ai_dsh_client_store.createSnapshotStore)(false);
				this.secretSets = (0, _deepseek_ai_dsh_client_store.createSnapshotStore)({});
			}
			getSnapshot() {
				return this.store.getSnapshot();
			}
			/** Whether a stored secret exists (from the redacted view's secrets list). */
			getKeySetSnapshot() {
				return this.keySet.getSnapshot();
			}
			/** Observe the secret-set flag. */
			subscribeKeySet(listener) {
				return this.keySet.subscribe(listener);
			}
			/** Whether a specific secret field currently has a stored value. */
			getSecretSetSnapshot(field) {
				return this.secretSets.getSnapshot()[field] === true;
			}
			/** Observe changes to individual secret-field presence bits. */
			subscribeSecretSets(listener) {
				return this.secretSets.subscribe(listener);
			}
			subscribe(listener) {
				return this.store.subscribe(listener);
			}
			/** Queue a bridge refresh. */
			load() {
				return this.enqueue(() => this.read());
			}
			set(field, value) {
				return this.enqueue(() => this.writeOps([{
					op: "set",
					path: [field],
					value
				}]));
			}
			unset(field) {
				return this.enqueue(() => this.writeOps([{
					op: "unset",
					path: [field]
				}]));
			}
			mutate(ops, expectedRevision) {
				return this.enqueue(() => this.writeOps([...ops], expectedRevision));
			}
			/** Apply several path ops in one revision-fenced mutate call (atomic save).
			*  Path ops may address plain-object fields (e.g. `channelSecrets.<id>`),
			*  but never navigate *inside* arrays — write array fields wholesale. */
			mutateOps(ops) {
				return this.enqueue(() => this.writeOps(ops));
			}
			async dispose() {
				this.disposed = true;
				await this.tail;
			}
			enqueue(operation) {
				if (this.disposed) return Promise.resolve();
				const task = this.tail.then(async () => {
					if (this.disposed) return;
					await operation();
				});
				this.tail = task.catch(() => {});
				return task;
			}
			async read() {
				let response;
				try {
					response = await this.api.describe({});
				} catch {
					if (!this.disposed) this.store.update((draft) => {
						draft.status = "unavailable";
					});
					return;
				}
				if (!response.result.ok || this.disposed) {
					if (!this.disposed) this.store.update((draft) => {
						draft.status = "unavailable";
					});
					return;
				}
				const { namespaces, writable } = response.result.value;
				const view = namespaces?.find((candidate) => candidate.ns === this.spec.namespace);
				if (view === void 0) {
					this.store.update((draft) => {
						draft.status = "unavailable";
						draft.writable = writable === true;
					});
					this.keySet.set(false);
					this.secretSets.set({});
					return;
				}
				this.accept(view, writable);
			}
			async writeOps(ops, expectedRevision) {
				const revision = expectedRevision ?? this.getSnapshot().revision;
				let response;
				try {
					response = await this.api.mutate({
						ns: this.spec.namespace,
						ops,
						...revision === void 0 ? {} : { expectedRevision: revision }
					});
				} catch {
					await this.read();
					return;
				}
				if (!response.result.ok || this.disposed) {
					await this.read();
					return;
				}
				this.accept(response.result.value, void 0);
			}
			accept(view, writable) {
				this.store.update((draft) => {
					draft.revision = view.revision;
					draft.base = view.base;
					draft.user = view.user;
					if (writable !== void 0) draft.writable = writable;
					draft.status = "ready";
					draft.value = view.value;
				});
				const secretSets = Object.fromEntries((view.secrets ?? []).map((secret) => [secret.path.join("."), secret.set]));
				this.keySet.set(Object.values(secretSets).some(Boolean));
				this.secretSets.set(secretSets);
			}
		};
		/**
		* Bind the dsh-imagegen settings scope over the bridge routes and start its
		* initial read (the caller mounts nothing until the scope settles).
		* @param fetchFn - the fetch implementation (the global fetch on loopback).
		* @returns the scope; unavailable when the bridge is unreachable.
		*/
		function bindImageGenScope(fetchFn = fetch) {
			const controller = new BridgeScopeController(createBridgeApi(fetchFn).settings, { namespace: "dsh-imagegen" });
			controller.load();
			return controller;
		}
		/**
		* Flatten the configured channels into the model options the panel lists
		* (aliases; the default channel's models first) plus the default channel id.
		* Falls back to the legacy flat allow-list while no channels exist (upgrade
		* path). Pure projection — no host calls.
		*/
		function imageModelOptions(config) {
			const channels = config?.channels ?? [];
			if (channels.length === 0) return { models: Array.isArray(config?.imageModels) ? config.imageModels.filter((model) => typeof model === "string" && model.trim() !== "") : [] };
			const defaultId = config?.defaultChannelId !== void 0 && channels.some((channel) => channel.id === config.defaultChannelId) ? config.defaultChannelId : channels[0].id;
			const ordered = [defaultId, ...channels.filter((channel) => channel.id !== defaultId).map((channel) => channel.id)];
			const models = [];
			for (const id of ordered) {
				const channel = channels.find((candidate) => candidate.id === id);
				for (const model of channel.models) if (model.alias !== "" && !models.includes(model.alias)) models.push(model.alias);
			}
			return models.length > 0 ? {
				models,
				defaultChannelId: defaultId
			} : {
				models: [],
				defaultChannelId: defaultId
			};
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
			},
			minimax: {
				label: "MiniMax",
				labelZh: "MiniMax 图像",
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
			if (/^(?:minimax[-_/])?image-\d+/i.test(id)) return {
				family: "minimax",
				...ENTRIES.minimax
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
		//#endregion
		//#region src/client/conversation-sync.ts
		/** Document event used to bridge chat tool results into the image workspace. */
		const CHAT_IMAGE_EVENT = "dsh-imagegen:chat-images";
		//#endregion
		//#region \0dsh-css:/Users/shigure/claude-home/audit/dsh-imagegen/src/client/panel.module.css.mjs
		const css$2 = "[data-pane=conversation],[class*=centerCol]{min-width:0;min-height:0;position:relative}[data-dsh-imagegen-view]{z-index:60;background:var(--dsw-alias-bg-base);grid-area:1/1;min-width:0;min-height:0;display:none;position:relative}html[data-dsh-imagegen-active]:not([data-dsh-taskboard-active]):not([data-dsh-ssh-active]) [data-pane=conversation],html[data-dsh-imagegen-active]:not([data-dsh-taskboard-active]):not([data-dsh-ssh-active]) [class*=centerCol]{grid-template-columns:minmax(0, 1fr) 8px minmax(320px, clamp(320px, var(--dsh-imagegen-chat-width,36%), 70%));background:var(--dsw-alias-border-l1);grid-template-rows:minmax(0,1fr);gap:1px;overflow:hidden;display:grid!important}html[data-dsh-imagegen-active]:not([data-dsh-taskboard-active]):not([data-dsh-ssh-active]) [data-dsh-imagegen-view]{display:block}html[data-dsh-imagegen-active]:not([data-dsh-taskboard-active]):not([data-dsh-ssh-active]) [data-slot=conversation]{background:var(--dsw-alias-bg-base);grid-area:1/3;align-items:stretch;width:auto;min-width:0;min-height:0;overflow:hidden;display:flex!important}html[data-dsh-imagegen-active] [data-slot=conversation]>[data-phase]{flex:auto;align-self:stretch;width:100%;min-width:0;max-width:none}html[data-dsh-imagegen-active]:not([data-dsh-taskboard-active]):not([data-dsh-ssh-active]) [data-dsh-imagegen-chat-resizer]{grid-area:1/2}.Co7cmG_chatResizer{z-index:70;width:8px;min-width:8px;color:var(--dsw-alias-label-tertiary);background:var(--dsw-alias-border-l1);cursor:col-resize;touch-action:none;justify-content:center;align-items:center;display:none;position:relative}.Co7cmG_chatResizer:before{content:\"\";opacity:.55;background:currentColor;border-radius:3px;width:3px;height:36px}.Co7cmG_chatResizer:hover,.Co7cmG_chatResizer:focus-visible{color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-2);outline:none}html[data-dsh-imagegen-active] [data-dsh-imagegen-chat-resizer]{display:flex!important}html[data-dsh-imagegen-active]:not([data-dsh-taskboard-active]):not([data-dsh-ssh-active]) [data-pane=conversation]>:not([data-dsh-imagegen-view]):not([data-slot=conversation]):not([data-dsh-imagegen-chat-resizer]),html[data-dsh-imagegen-active]:not([data-dsh-taskboard-active]):not([data-dsh-ssh-active]) [class*=centerCol]>:not([data-dsh-imagegen-view]):not([data-slot=conversation]):not([data-dsh-imagegen-chat-resizer]),html[data-dsh-imagegen-active] [data-dsh-imagegen-sidebar-root]>:not([data-dsh-imagegen-session-tabs]):not([class*=logoRow]):not([class*=regionArea]):not([class*=footArea]){display:none!important}@media (width<=760px){html[data-dsh-imagegen-active]:not([data-dsh-taskboard-active]):not([data-dsh-ssh-active]) [data-pane=conversation],html[data-dsh-imagegen-active]:not([data-dsh-taskboard-active]):not([data-dsh-ssh-active]) [class*=centerCol]{grid-template-rows:minmax(0,1fr) minmax(340px,.9fr);grid-template-columns:minmax(0,1fr);overflow-y:auto}html[data-dsh-imagegen-active]:not([data-dsh-taskboard-active]):not([data-dsh-ssh-active]) [data-slot=conversation]{grid-area:2/1}html[data-dsh-imagegen-active] [data-dsh-imagegen-chat-resizer]{display:none!important}}.Co7cmG_entry{width:100%;height:32px;color:var(--dsw-alias-label-secondary);cursor:pointer;white-space:nowrap;background:0 0;border:none;border-radius:8px;align-items:center;gap:8px;padding:0 12px;font-size:13px;display:flex}.Co7cmG_entry:hover{background:var(--dsw-specific-sidebar-nav-item-hover);color:var(--dsw-alias-label-primary)}.Co7cmG_entry[data-active]{background:var(--dsw-specific-sidebar-nav-item-active);color:var(--dsw-alias-label-primary);font-weight:600}.Co7cmG_entryIcon{flex:none;justify-content:center;align-items:center;display:inline-flex}.Co7cmG_entryLabel{text-overflow:ellipsis;overflow:hidden}.Co7cmG_sessionTabs{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);border-radius:9px;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:2px;width:100%;min-width:0;padding:3px;display:grid}.Co7cmG_sessionTab{min-width:0;height:30px;color:var(--dsw-alias-label-secondary);cursor:pointer;font:inherit;white-space:nowrap;background:0 0;border:0;border-radius:7px;justify-content:center;align-items:center;gap:6px;padding:0 8px;font-size:12px;display:inline-flex}[data-sidebar-collapsed] .Co7cmG_sessionTabs{background:0 0;border:none;border-radius:0;flex-direction:column;gap:6px;width:auto;padding:0;display:flex}[data-sidebar-collapsed] .Co7cmG_sessionTab{border-radius:9px;width:34px;height:34px;padding:0;font-size:0}[data-sidebar-collapsed] .Co7cmG_sessionTabLabel{display:none}.Co7cmG_sessionTab:hover,.Co7cmG_sessionTab[data-active]{color:var(--dsw-alias-label-primary);background:var(--dsw-specific-sidebar-nav-item-active)}.Co7cmG_sessionTabIcon{flex:none;justify-content:center;align-items:center;display:inline-flex}.Co7cmG_sessionTabLabel{text-overflow:ellipsis;min-width:0;overflow:hidden}[class*=regionArea]{min-height:0;position:relative}.Co7cmG_sidebarHistoryHost{z-index:30;background:var(--dsw-alias-bg-base);min-width:0;min-height:0;padding:6px 4px;display:none;position:absolute;inset:0;overflow:hidden}html[data-dsh-imagegen-active] .Co7cmG_sidebarHistoryHost{display:flex}.Co7cmG_sidebarHistoryHost .Co7cmG_history{background:0 0;border:0;border-radius:8px;width:100%;height:100%}[data-dsh-frame][data-sidebar-collapsed] .Co7cmG_sidebarHistoryHost{display:none}[data-dsh-frame][data-sidebar-collapsed] .Co7cmG_entry{justify-content:center;width:100%;padding:0}[data-dsh-frame][data-sidebar-collapsed] .Co7cmG_entryLabel{display:none}.Co7cmG_view{width:100%;min-width:0;min-height:0;overflow:hidden}.Co7cmG_panel,.Co7cmG_panel *,.Co7cmG_panel :before,.Co7cmG_panel :after{box-sizing:border-box}.Co7cmG_panel{background:var(--dsw-alias-bg-base);min-width:0;height:100%;min-height:0;color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family);flex-direction:column;gap:10px;padding:14px 16px 16px;display:flex;position:relative;overflow:hidden}.Co7cmG_panelHeader{flex:none;justify-content:space-between;align-items:center;gap:12px;display:flex;position:relative}.Co7cmG_panelHeading{align-items:baseline;gap:10px;min-width:0;display:flex}.Co7cmG_panelTitle{color:var(--dsw-alias-label-primary);white-space:nowrap;margin:0;font-size:16px;font-weight:700}.Co7cmG_githubLink{width:22px;height:22px;color:var(--dsw-alias-label-secondary);border-radius:6px;flex:none;justify-content:center;align-items:center;text-decoration:none;transition:color .12s,background .12s;display:inline-flex}.Co7cmG_githubLink:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2)}.Co7cmG_connectionStatus{border:1px solid var(--dsw-alias-label-error);height:28px;color:var(--dsw-alias-label-error);font:inherit;white-space:nowrap;background:0 0;border-radius:8px;flex:none;align-items:center;gap:6px;padding:0 10px;font-size:12px;line-height:1;display:inline-flex}.Co7cmG_connectionStatus[data-connected=true]{border-color:var(--dsw-alias-state-success-primary);color:var(--dsw-alias-state-success-primary)}.Co7cmG_connectionDot{background:currentColor;border-radius:50%;width:6px;height:6px}.Co7cmG_updateBanner{border:1px solid var(--dsw-alias-state-warn-primary);color:var(--dsw-alias-state-warn-primary);overflow-wrap:anywhere;border-radius:10px;flex:none;justify-content:space-between;align-items:center;gap:12px;padding:7px 10px 7px 12px;font-size:12px;line-height:1.5;display:flex}.Co7cmG_updateBanner[data-kind=ok]{color:var(--dsw-alias-state-success-primary);border-color:var(--dsw-alias-state-success-primary)}.Co7cmG_updateText{min-width:0}.Co7cmG_updateActions{flex:none;align-items:center;gap:10px;display:inline-flex}.Co7cmG_updateRelease{color:inherit;text-underline-offset:2px;white-space:nowrap;text-decoration:underline}@media (width<=700px){.Co7cmG_panelHeader{align-items:flex-start}.Co7cmG_panelHeading{flex-direction:column;align-items:flex-start;gap:2px}.Co7cmG_updateBanner{flex-direction:column;align-items:flex-start}.Co7cmG_updateActions{justify-content:space-between;width:100%}}.Co7cmG_studio{flex:1;min-width:0;min-height:0;display:flex}.Co7cmG_generation{gap:14px;width:100%;min-width:0;min-height:0;display:flex}.Co7cmG_generation[data-workspace=canvas]{height:100%;display:flex}.Co7cmG_generation[data-workspace=canvas]>.Co7cmG_config,.Co7cmG_generation[data-workspace=canvas]>.Co7cmG_canvas{display:none!important}.Co7cmG_config{width:clamp(240px, var(--dsh-imagegen-config-width,300px), 480px);flex-direction:column;flex:none;gap:12px;min-width:240px;max-width:480px;height:100%;min-height:0;display:flex;position:relative;overflow:hidden}.Co7cmG_configHeader{flex:none;justify-content:flex-end;min-height:28px;display:flex}.Co7cmG_configToggle{border:1px solid var(--dsw-alias-border-l1);width:28px;height:28px;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-1);cursor:pointer;border-radius:7px;justify-content:center;align-items:center;padding:0;display:inline-flex}.Co7cmG_configToggle:hover,.Co7cmG_configToggle:focus-visible{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary);outline:none}.Co7cmG_config[data-collapsed=true]{gap:0;width:38px;min-width:38px;max-width:38px}.Co7cmG_config[data-collapsed=true] .Co7cmG_configHeader{justify-content:center}.Co7cmG_config[data-collapsed=true]>:not(.Co7cmG_configHeader){display:none}.Co7cmG_configScroll{scrollbar-width:thin;scrollbar-color:var(--dsw-alias-border-l2) transparent;flex-direction:column;flex:1;gap:12px;min-height:0;padding-right:2px;display:flex;overflow-y:auto}.Co7cmG_configScroll::-webkit-scrollbar{width:8px}.Co7cmG_configScroll::-webkit-scrollbar-thumb{background:var(--dsw-alias-border-l2);border-radius:999px}.Co7cmG_canvas{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);border-radius:12px;flex-direction:column;flex:1;min-width:0;min-height:0;display:flex;position:relative;overflow:hidden}.Co7cmG_taskTray{z-index:6;border:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb, var(--dsw-alias-bg-layer-1) 92%, transparent);backdrop-filter:blur(10px);border-radius:9px;flex-direction:column;width:min(360px,100% - 24px);max-height:calc(100% - 24px);display:flex;position:absolute;top:12px;right:12px;overflow:hidden;box-shadow:0 8px 24px #0000001f}.Co7cmG_taskTray[data-open=false]{width:auto;max-width:calc(100% - 24px)}.Co7cmG_taskTrayHeader{min-height:34px;color:var(--dsw-alias-label-primary);border-bottom:1px solid var(--dsw-alias-border-l1);align-items:stretch;font-size:12px;font-weight:600;display:flex}.Co7cmG_taskTray[data-open=false] .Co7cmG_taskTrayHeader{border-bottom:0}.Co7cmG_taskTrayToggle{min-width:0;color:inherit;cursor:pointer;font:inherit;font-size:inherit;font-weight:inherit;text-align:left;background:0 0;border:0;flex:1;align-items:center;gap:8px;padding:8px 10px;display:flex}.Co7cmG_taskTrayToggle:hover{background:var(--dsw-alias-bg-layer-2)}.Co7cmG_taskTrayCount{min-width:18px;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2);text-align:center;border-radius:999px;padding:1px 5px;font-size:11px;font-weight:500}.Co7cmG_taskTrayChevron{color:var(--dsw-alias-label-tertiary);margin-left:auto;font-size:12px;font-weight:400}.Co7cmG_taskTrayClose{border:0;border-left:1px solid var(--dsw-alias-border-l1);width:32px;color:var(--dsw-alias-label-tertiary);cursor:pointer;font:inherit;background:0 0;font-size:17px}.Co7cmG_taskTrayClose:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2)}.Co7cmG_taskTray[data-open=false] .Co7cmG_taskTrayToggle{min-height:34px}.Co7cmG_taskRows{min-height:0;overflow-y:auto}.Co7cmG_taskTray[data-open=false] .Co7cmG_taskRows{display:none}.Co7cmG_taskRow{border-top:1px solid var(--dsw-alias-border-l1);grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:7px;padding:7px 10px;display:grid}.Co7cmG_taskRow:first-of-type{border-top:0}.Co7cmG_taskStatus{color:var(--dsw-alias-label-tertiary);white-space:nowrap;font-size:11px}.Co7cmG_taskRow[data-status=running] .Co7cmG_taskStatus{color:var(--dsw-alias-brand-primary)}.Co7cmG_taskRow[data-status=failed] .Co7cmG_taskStatus{color:var(--dsw-alias-label-error)}.Co7cmG_taskPrompt{color:var(--dsw-alias-label-secondary);text-overflow:ellipsis;white-space:nowrap;font-size:11px;overflow:hidden}.Co7cmG_taskRow button{color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2);cursor:pointer;font:inherit;border:0;border-radius:5px;padding:2px 7px;font-size:11px}.Co7cmG_taskRow button:hover{color:var(--dsw-alias-brand-primary)}.Co7cmG_configGuide{z-index:1100;background:#00000059;place-items:center;padding:20px;display:grid;position:fixed;inset:0}.Co7cmG_configGuideBody{border:1px solid var(--dsw-alias-border-l2);width:min(360px,100%);color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-1);border-radius:10px;flex-direction:column;gap:12px;padding:18px;display:flex;box-shadow:0 14px 40px #0003}.Co7cmG_configGuideBody span{color:var(--dsw-alias-label-secondary);font-size:13px;line-height:1.55}.Co7cmG_configGuideBody button{min-height:30px;color:var(--dsw-alias-bg-layer-1);background:var(--dsw-alias-brand-primary);cursor:pointer;font:inherit;border:0;border-radius:7px;align-self:flex-end;padding:0 12px;font-size:12px}.Co7cmG_history{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);border-radius:12px;flex-direction:column;width:auto;min-width:0;max-width:none;min-height:0;display:flex;overflow:hidden}.Co7cmG_historyHeader{border-bottom:1px solid var(--dsw-alias-border-l1);flex:none;justify-content:space-between;align-items:center;gap:8px;padding:10px 12px;display:flex}.Co7cmG_historyHeaderActions{flex:none;align-items:center;gap:6px;display:flex}.Co7cmG_historyFilters{border-bottom:1px solid var(--dsw-alias-border-l1);grid-template-columns:1fr 1fr;gap:6px;padding:8px 10px;display:grid}.Co7cmG_historySearch,.Co7cmG_historyFilters select,.Co7cmG_gallerySearch{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);min-width:0;min-height:29px;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2);font:inherit;border-radius:7px;padding:0 8px;font-size:11px}.Co7cmG_historySearch{grid-column:1/-1}.Co7cmG_gallerySearch{width:156px}.Co7cmG_galleryTagInput{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);width:130px;min-height:29px;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2);font:inherit;border-radius:7px;padding:0 8px;font-size:11px}.Co7cmG_galleryBulkButton{border:1px solid var(--dsw-alias-border-l2);min-height:29px;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-1);cursor:pointer;font:inherit;border-radius:7px;padding:0 8px;font-size:11px}.Co7cmG_galleryBulkButton:hover:not(:disabled){color:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary)}.Co7cmG_galleryBulkButton:disabled{opacity:.45;cursor:default}.Co7cmG_historyTitle{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:600}.Co7cmG_historyNew{width:26px;height:26px;color:var(--dsw-alias-label-secondary);border:1px solid var(--dsw-alias-border-l2);cursor:pointer;background:0 0;border-radius:7px;justify-content:center;align-items:center;padding:0;display:inline-flex}.Co7cmG_historyNew:hover{color:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary)}.Co7cmG_historyClear{font:inherit;color:var(--dsw-alias-label-tertiary);border:1px solid var(--dsw-alias-border-l2);cursor:pointer;background:0 0;border-radius:999px;padding:2px 8px;font-size:11.5px}.Co7cmG_historyClear:hover{color:var(--dsw-alias-label-error);border-color:var(--dsw-alias-label-error)}.Co7cmG_historyList{scrollbar-width:thin;scrollbar-color:var(--dsw-alias-border-l2) transparent;flex-direction:column;flex:1;gap:8px;min-height:0;padding:10px;display:flex;overflow-y:auto}.Co7cmG_historyList::-webkit-scrollbar{width:8px}.Co7cmG_historyList::-webkit-scrollbar-thumb{background:var(--dsw-alias-border-l2);border-radius:999px}.Co7cmG_historyEmpty{text-align:center;color:var(--dsw-alias-label-tertiary);flex:1;justify-content:center;align-items:center;padding:20px;font-size:12px;line-height:1.6;display:flex}.Co7cmG_historyItem{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);border-radius:10px;flex-direction:column;flex:none;gap:6px;padding:8px;display:flex}.Co7cmG_historyItem:hover{border-color:var(--dsw-alias-border-l2)}.Co7cmG_historyItem[data-active]{border-color:var(--dsw-alias-brand-primary)}.Co7cmG_historyMain{font:inherit;color:inherit;text-align:left;cursor:pointer;background:0 0;border:none;align-items:flex-start;gap:8px;min-width:0;padding:0;display:flex}.Co7cmG_historyThumb{object-fit:cover;background:var(--dsw-alias-bg-base);border-radius:8px;flex:none;width:52px;height:52px}.Co7cmG_historyThumbPlaceholder{background:var(--dsw-alias-bg-layer-3);border-radius:8px;flex:none;width:52px;height:52px}.Co7cmG_historyInfo{flex-direction:column;flex:1;gap:4px;min-width:0;display:flex}.Co7cmG_historyPrompt{color:var(--dsw-alias-label-primary);-webkit-line-clamp:2;-webkit-box-orient:vertical;font-size:12px;line-height:1.4;display:-webkit-box;overflow:hidden}.Co7cmG_historyMeta{color:var(--dsw-alias-label-tertiary);white-space:nowrap;text-overflow:ellipsis;font-size:11px;overflow:hidden}.Co7cmG_historyActions{justify-content:flex-end;gap:4px;display:flex}.Co7cmG_historyIconAction{width:26px;height:24px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:1px solid #0000;border-radius:7px;justify-content:center;align-items:center;padding:0;display:inline-flex}.Co7cmG_historyIconAction:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}.Co7cmG_historyIconAction:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}.Co7cmG_historyIconAction:disabled{opacity:.5;cursor:default}.Co7cmG_historyIconAction[data-danger]:hover{color:var(--dsw-alias-state-error);background:color-mix(in srgb, var(--dsw-alias-state-error) 10%, transparent)}.Co7cmG_card{background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);border-radius:12px;flex-direction:column;flex:none;gap:10px;padding:12px;display:flex}.Co7cmG_ecommerceWorkspace{flex-direction:column;gap:18px;max-width:760px;margin:0 auto;padding:10px 8px 18px;display:flex}.Co7cmG_ecommerceSection{border:none;border-bottom:1px solid var(--dsw-alias-border-l1);background:0 0;border-radius:0;flex-direction:column;gap:10px;padding:0 0 16px;display:flex}.Co7cmG_ecommerceSection:last-of-type{border-bottom:none;padding-bottom:4px}.Co7cmG_ecommerceSection h3{align-items:baseline;gap:7px;margin:0 0 2px;font-size:14px;font-weight:650;display:flex}.Co7cmG_ecommerceSectionHint{color:var(--dsw-alias-label-tertiary);font-size:11px;font-weight:400}.Co7cmG_ecommerceSection input:not([type=checkbox]),.Co7cmG_ecommerceSection select,.Co7cmG_ecommerceSection textarea{box-sizing:border-box;width:100%;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-3);border:1px solid var(--dsw-alias-border-l2);font:inherit;border-radius:9px;padding:9px 11px}.Co7cmG_ecommerceSection input:not([type=checkbox]):focus-visible,.Co7cmG_ecommerceSection select:focus-visible,.Co7cmG_ecommerceSection textarea:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}.Co7cmG_ecommerceSection textarea{resize:vertical;min-height:68px;line-height:1.5}.Co7cmG_ecommerceField{flex-direction:column;gap:5px;min-width:0;display:flex}.Co7cmG_ecommerceFieldLabel{color:var(--dsw-alias-label-secondary);font-size:11.5px}.Co7cmG_ecommerceParamGrid{grid-template-columns:1fr 1fr;gap:12px 10px;display:grid}.Co7cmG_ecommerceUploadHero{border:1.5px dashed var(--dsw-alias-border-l2);min-height:78px;color:var(--dsw-alias-label-secondary);cursor:pointer;font:inherit;text-align:center;background:0 0;border-radius:10px;flex-direction:column;justify-content:center;align-items:center;gap:4px;padding:12px;display:flex}.Co7cmG_ecommerceUploadHero:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-dimmed);background:var(--dsw-alias-interactive-bg-hover)}.Co7cmG_ecommerceUploadHero:focus-visible,.Co7cmG_ecommerceAssetAdd:focus-visible,.Co7cmG_ecommerceSlotCard:focus-visible,.Co7cmG_ecommerceAdvancedToggle:focus-visible,.Co7cmG_ecommerceAsset button:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}.Co7cmG_ecommerceUploadHero span{font-size:12px}.Co7cmG_ecommerceUploadHero small{color:var(--dsw-alias-label-tertiary);font-size:10.5px}.Co7cmG_ecommerceStructureGrid{grid-template-columns:repeat(3,1fr);gap:6px;display:grid}.Co7cmG_ecommerceSlotCard{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);height:34px;color:var(--dsw-alias-label-primary);cursor:pointer;font:inherit;white-space:nowrap;border-radius:8px;justify-content:center;align-items:center;font-size:12px;display:flex;position:relative}.Co7cmG_ecommerceSlotCard:hover{border-color:var(--dsw-alias-label-dimmed)}.Co7cmG_ecommerceSlotCard[data-active]{background:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-base);font-weight:600}.Co7cmG_ecommerceSlotCount{background:var(--dsw-alias-brand-primary);color:#fff;text-align:center;border-radius:8px;min-width:16px;height:16px;padding:0 4px;font-size:10px;font-weight:600;line-height:16px;position:absolute;top:-6px;right:-6px}.Co7cmG_ecommerceRefRow{grid-template-columns:64px 1fr;align-items:center;gap:8px;display:grid}.Co7cmG_ecommerceRefRow>span{color:var(--dsw-alias-label-secondary);font-size:12px}.Co7cmG_ecommercePrimaryAction{border-radius:999px;width:100%;height:38px;font-size:13.5px}.Co7cmG_previewBadge{background:var(--dsw-alias-brand-primary);color:#fff;letter-spacing:.02em;border-radius:4px;margin-left:5px;padding:0 4px;font-size:9px;font-weight:700;line-height:13px}.Co7cmG_ecommercePlanNote{color:var(--dsw-alias-label-secondary);font-size:11.5px;line-height:1.5}.Co7cmG_ecommercePlanWarn{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);border-radius:6px;padding:6px 8px;font-size:11.5px;line-height:1.5}.Co7cmG_ecommerceAssets{grid-template-columns:repeat(3,1fr);gap:6px;display:grid}.Co7cmG_ecommerceAsset{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-3);border-radius:8px;flex-direction:column;gap:3px;padding:4px;display:flex;position:relative}.Co7cmG_ecommerceAsset img{object-fit:cover;border-radius:5px;width:100%;height:44px}.Co7cmG_ecommerceAsset select{width:100%;min-width:0;padding:2px;font-size:10px}.Co7cmG_ecommerceAsset button{color:#fff;cursor:pointer;text-align:center;background:#0000008c;border:none;border-radius:50%;width:16px;height:16px;padding:0;font-size:11px;line-height:15px;position:absolute;top:7px;right:7px}.Co7cmG_ecommerceAsset button:hover{background:#000c}.Co7cmG_ecommerceAssetAdd{border:1.5px dashed var(--dsw-alias-border-l2);min-height:78px;color:var(--dsw-alias-label-secondary);cursor:pointer;font:inherit;background:0 0;border-radius:8px;flex-direction:column;justify-content:center;align-items:center;gap:2px;display:flex}.Co7cmG_ecommerceAssetAdd:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-dimmed)}.Co7cmG_ecommerceAssetAdd span{font-size:16px;line-height:1}.Co7cmG_ecommerceAssetAdd small{font-size:10px}.Co7cmG_ecommerceAdvancedToggle{width:100%;color:var(--dsw-alias-label-secondary);cursor:pointer;font:inherit;background:0 0;border:none;justify-content:space-between;align-items:center;padding:0;font-size:12.5px;display:flex}.Co7cmG_ecommerceAdvancedToggle:hover{color:var(--dsw-alias-label-primary)}.Co7cmG_ecommerceAdvancedChevron{font-size:11px}.Co7cmG_ecommerceAdvancedBody{flex-direction:column;gap:8px;margin-top:8px;display:flex}.Co7cmG_ecommerceFooterBody{flex-direction:column;gap:8px;display:flex}.Co7cmG_ecommercePlanMini{border:1px solid var(--dsw-alias-brand-primary);border-radius:10px;flex-direction:column;gap:6px;padding:10px;display:flex}.Co7cmG_ecommercePlanMini>strong{font-size:12.5px}.Co7cmG_ecommercePlanList{flex-direction:column;gap:3px;max-height:116px;display:flex;overflow-y:auto}.Co7cmG_ecommercePlanList>div{color:var(--dsw-alias-label-secondary);justify-content:space-between;gap:12px;font-size:11.5px;display:flex}.Co7cmG_ecommercePlanBack{color:var(--dsw-alias-label-tertiary);cursor:pointer;font:inherit;background:0 0;border:none;padding:0;font-size:12px}.Co7cmG_ecommercePlanBack:hover{color:var(--dsw-alias-label-primary)}.Co7cmG_ecommerceFooterHint{color:var(--dsw-alias-label-secondary);font-size:12px}.Co7cmG_ecommerceResults{flex-direction:column;gap:14px;width:100%;margin:0 auto;padding:16px 18px;display:flex;overflow-y:auto}.Co7cmG_ecommerceResultsHeader{justify-content:space-between;align-items:center;gap:12px;display:flex}.Co7cmG_ecommerceResultsHeader h3{margin:0;font-size:15px}.Co7cmG_ecommerceResultsHeader>div:first-child{align-items:baseline;gap:10px;display:flex}.Co7cmG_ecommerceResultsHeader span{color:var(--dsw-alias-label-secondary);font-size:12px}.Co7cmG_ecommerceResultsActions{gap:8px;display:flex}.Co7cmG_ecommerceResultsEmpty{color:var(--dsw-alias-label-tertiary);text-align:center;border:1.5px dashed var(--dsw-alias-border-l2);border-radius:12px;padding:32px 16px;font-size:13px}.Co7cmG_ecommerceGroups{flex-direction:column;gap:16px;display:flex}.Co7cmG_ecommerceGroup{background:0 0;border:none;border-radius:0;flex-direction:column;gap:8px;padding:0;display:flex}.Co7cmG_ecommerceGroup>header{align-items:center;gap:10px;font-size:13px;display:flex}.Co7cmG_ecommerceGroup>header strong{font-size:13px}.Co7cmG_ecommerceGroup>header span{color:var(--dsw-alias-label-secondary);font-size:12px}.Co7cmG_ecommerceGroup>header button{margin-left:auto}.Co7cmG_ecommerceGroupGrid{grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;display:grid}.Co7cmG_ecommerceTaskCard{aspect-ratio:1;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-3);border-radius:10px;justify-content:center;align-items:center;width:100%;min-height:0;padding:0;display:flex;position:relative;overflow:hidden}.Co7cmG_ecommerceTaskCard[data-status=failed],.Co7cmG_ecommerceTaskCard[data-status=cancelled]{color:var(--dsw-alias-label-tertiary);font-size:12px}.Co7cmG_ecommerceTaskCard .Co7cmG_imageCard{border:none;border-radius:0;width:100%;height:100%;margin:0}.Co7cmG_ecommerceTaskCard .Co7cmG_image{object-fit:cover;width:100%;height:100%}.Co7cmG_ecommerceResultBadge{color:#fff;pointer-events:none;background:#0000008c;border-radius:999px;padding:0 7px;font-size:10px;line-height:16px;position:absolute;top:6px;left:6px}.Co7cmG_ecommerceTaskActions{opacity:0;background:linear-gradient(#0000,#0000008c);justify-content:center;gap:4px;padding:10px 4px 5px;transition:opacity .12s;display:flex;position:absolute;bottom:0;left:0;right:0}.Co7cmG_ecommerceTaskCard:hover .Co7cmG_ecommerceTaskActions{opacity:1}.Co7cmG_ecommerceActionChip{color:#111;cursor:pointer;white-space:nowrap;background:#ffffffeb;border:none;border-radius:6px;padding:0 6px;font-size:10px;font-weight:500;line-height:18px;text-decoration:none}.Co7cmG_ecommerceActionChip:hover{background:#fff}.Co7cmG_ecommerceActionChip:disabled{opacity:.5;cursor:default}.Co7cmG_ecommerceTaskState{color:var(--dsw-alias-label-secondary);text-align:center;word-break:break-all;flex-direction:column;gap:3px;padding:10px 8px;font-size:11px;display:flex}.Co7cmG_ecommerceTaskState b{color:var(--dsw-alias-label-primary);font-size:12px}.Co7cmG_topNav{flex:none;justify-content:center;align-items:center;gap:2px;display:flex;position:absolute;left:50%;transform:translate(-50%)}.Co7cmG_topNavItem{height:30px;color:var(--dsw-alias-label-secondary);cursor:pointer;font:inherit;background:0 0;border:none;border-radius:999px;align-items:center;gap:4px;padding:0 14px;font-size:13px;display:inline-flex}.Co7cmG_topNavItem,.Co7cmG_topNavItem span{white-space:nowrap}.Co7cmG_topNavItem:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}.Co7cmG_topNavItem[data-active]{background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-base);font-weight:600}.Co7cmG_topNavDivider{background:var(--dsw-alias-border-l2);width:1px;height:16px;margin:0 8px}.Co7cmG_panelHeaderActions{align-items:center;gap:10px;display:inline-flex}.Co7cmG_chatToggle{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);height:26px;color:var(--dsw-alias-label-secondary);cursor:pointer;font:inherit;border-radius:999px;align-items:center;gap:5px;padding:0 10px;font-size:12px;display:inline-flex}.Co7cmG_chatToggle:hover{color:var(--dsw-alias-label-primary)}.Co7cmG_chatToggle[data-open=true]{color:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary)}html[data-dsh-imagegen-chat-collapsed][data-dsh-imagegen-active]:not([data-dsh-taskboard-active]):not([data-dsh-ssh-active]) [data-pane=conversation],html[data-dsh-imagegen-chat-collapsed][data-dsh-imagegen-active]:not([data-dsh-taskboard-active]):not([data-dsh-ssh-active]) [class*=centerCol]{grid-template-columns:minmax(0,1fr)}html[data-dsh-imagegen-chat-collapsed][data-dsh-imagegen-active]:not([data-dsh-taskboard-active]):not([data-dsh-ssh-active]) [data-slot=conversation],html[data-dsh-imagegen-chat-collapsed] [data-dsh-imagegen-chat-resizer]{display:none!important}.Co7cmG_configResizer{cursor:col-resize;z-index:6;width:6px;height:100%;position:absolute;top:0;right:0}.Co7cmG_configResizer:hover{background:linear-gradient(90deg, transparent, var(--dsw-alias-border-l2))}.Co7cmG_config[data-collapsed=true] .Co7cmG_configResizer{display:none}.Co7cmG_modeRow{align-items:center;gap:8px;display:flex}.Co7cmG_modePill{flex:1;justify-content:center;height:28px;font-size:12.5px}.Co7cmG_modePill,.Co7cmG_modePill span,.Co7cmG_modePill div{white-space:nowrap;min-width:0}.Co7cmG_uploadBox{min-height:128px;color:var(--dsw-alias-label-secondary);border:1.5px dashed var(--dsw-alias-border-l2);cursor:pointer;font:inherit;text-align:center;background:0 0;border-radius:12px;flex-direction:column;justify-content:center;align-items:center;gap:6px;padding:16px;font-size:12.5px;display:flex}.Co7cmG_uploadBox:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-dimmed);background:var(--dsw-alias-interactive-bg-hover)}.Co7cmG_uploadBox:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}.Co7cmG_uploadIcon{color:var(--dsw-alias-label-tertiary);display:inline-flex}.Co7cmG_uploadHint{color:var(--dsw-alias-label-tertiary);font-size:11px}.Co7cmG_reference{flex-direction:column;gap:8px;display:flex}.Co7cmG_referenceImage{object-fit:contain;background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l1);border-radius:10px;width:100%;max-height:176px}.Co7cmG_referenceActions{gap:8px;display:flex}.Co7cmG_hiddenFile{display:none}.Co7cmG_prompt{width:100%;min-height:120px;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-3);border:1px solid var(--dsw-alias-border-l2);resize:vertical;box-sizing:border-box;border-radius:10px;outline:none;padding:10px 12px;font-family:inherit;font-size:13px;line-height:1.6}.Co7cmG_prompt:focus-visible{border-color:var(--dsw-alias-brand-primary)}.Co7cmG_prompt::placeholder{color:var(--dsw-alias-label-tertiary)}.Co7cmG_promptFooter{justify-content:space-between;align-items:center;gap:8px;margin-top:-6px;display:flex}.Co7cmG_templatesButton{border:1px solid var(--dsw-alias-brand-primary);background:linear-gradient(135deg, color-mix(in srgb, var(--dsw-alias-brand-primary) 14%, transparent), color-mix(in srgb, var(--dsw-alias-brand-primary) 5%, transparent));height:26px;color:var(--dsw-alias-brand-primary);cursor:pointer;box-shadow:0 1px 0 color-mix(in srgb, var(--dsw-alias-brand-primary) 22%, transparent);border-radius:999px;align-items:center;gap:6px;padding:0 12px;font-family:inherit;font-size:12px;font-weight:600;transition:transform .12s,box-shadow .12s,background .12s;display:inline-flex}.Co7cmG_templatesButton svg{flex:none}.Co7cmG_templatesButton:hover{background:linear-gradient(135deg, color-mix(in srgb, var(--dsw-alias-brand-primary) 24%, transparent), color-mix(in srgb, var(--dsw-alias-brand-primary) 8%, transparent));color:var(--dsw-alias-brand-primary);box-shadow:0 2px 6px color-mix(in srgb, var(--dsw-alias-brand-primary) 30%, transparent);transform:translateY(-1px)}.Co7cmG_templatesButton:active{transform:translateY(0)}.Co7cmG_enhanceButton{border:1px solid var(--dsw-alias-border-l2);height:26px;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2);font:inherit;cursor:pointer;border-radius:999px;margin-left:auto;padding:0 11px;font-size:12px}.Co7cmG_enhanceButton:hover:not(:disabled){color:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary)}.Co7cmG_enhanceButton:disabled{opacity:.5;cursor:default}.Co7cmG_promptCount{color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;font-size:11px}.Co7cmG_paramGroup{flex-direction:column;gap:8px;display:flex}.Co7cmG_paramLabel{color:var(--dsw-alias-label-secondary);font-size:12px;font-weight:600}.Co7cmG_optionRow{flex-wrap:wrap;gap:6px;display:flex}.Co7cmG_optionGrid{grid-template-columns:repeat(3,1fr);gap:6px;display:grid}.Co7cmG_optionPill{justify-content:center}.Co7cmG_paramHint{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:1.45}.Co7cmG_footer{border-top:1px solid var(--dsw-alias-border-l1);flex-direction:column;flex:none;align-items:stretch;gap:8px;padding:10px 2px 0 0;display:flex}.Co7cmG_modelWrap{flex-direction:column;gap:5px;min-width:0;display:flex}.Co7cmG_modelLabel{color:var(--dsw-alias-label-secondary);font-size:12px;font-weight:600}.Co7cmG_modelSelect{width:100%;height:36px;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l2);cursor:pointer;text-align:left;border-radius:18px;outline:none;justify-content:space-between;align-items:center;gap:8px;padding:0 12px;font-family:inherit;font-size:13px;display:flex}.Co7cmG_modelSelect:focus-visible{border-color:var(--dsw-alias-brand-primary)}.Co7cmG_modelSelect:disabled{opacity:.55;cursor:default}.Co7cmG_modelMenu{min-width:0;display:block;position:relative}.Co7cmG_modelMenuList{z-index:40;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l2);border-radius:12px;flex-direction:column;padding:4px;display:flex;position:absolute;bottom:calc(100% + 6px);left:0;right:0;overflow:hidden;box-shadow:0 -8px 24px #0000002e}.Co7cmG_modelMenuItem{width:100%;font:inherit;color:var(--dsw-alias-label-primary);cursor:pointer;text-align:left;white-space:nowrap;text-overflow:ellipsis;background:0 0;border:none;border-radius:8px;padding:7px 10px;font-size:13px;display:block;overflow:hidden}.Co7cmG_modelMenuItem:hover{background:var(--dsw-alias-bg-hover)}.Co7cmG_modelMenuItem[data-selected]{color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-1);font-weight:600}.Co7cmG_generateButton{width:100%}.Co7cmG_generateInner{align-items:center;gap:7px;display:inline-flex}.Co7cmG_canvasState{text-align:center;color:var(--dsw-alias-label-tertiary);flex-direction:column;flex:1;justify-content:center;align-items:center;gap:8px;padding:24px;display:flex}.Co7cmG_canvasStateTitle{color:var(--dsw-alias-label-secondary);font-size:14px;font-weight:600}.Co7cmG_canvasStateHint{max-width:380px;font-size:12px;line-height:1.6}.Co7cmG_canvasEmptyIcon{color:var(--dsw-alias-label-tertiary);margin-bottom:4px;display:inline-flex}.Co7cmG_canvasError{color:var(--dsw-alias-label-error);background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-label-error);overflow-wrap:anywhere;border-radius:10px;flex:none;margin:14px;padding:10px 14px;font-size:12.5px;line-height:1.6}.Co7cmG_canvasBody{scrollbar-width:thin;scrollbar-color:var(--dsw-alias-border-l2) transparent;flex-direction:column;flex:1;gap:10px;min-height:0;padding:14px;display:flex;overflow-y:auto}.Co7cmG_canvasBody::-webkit-scrollbar{width:8px}.Co7cmG_canvasBody::-webkit-scrollbar-thumb{background:var(--dsw-alias-border-l2);border-radius:999px}.Co7cmG_canvasMeta{color:var(--dsw-alias-label-tertiary);flex:none;align-items:center;gap:8px;font-size:12px;display:flex}.Co7cmG_canvasHistoryTag{color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l2);white-space:nowrap;border-radius:999px;padding:1px 8px;font-size:11px}.Co7cmG_grid{flex:1;grid-template-rows:repeat(2,minmax(0,1fr));grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;min-height:0;display:grid}.Co7cmG_grid[data-count=\"1\"] .Co7cmG_imageCard{grid-area:1/1/3/3}.Co7cmG_imageCard{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);cursor:zoom-in;border-radius:12px;flex-direction:column;min-height:0;margin:0;display:flex;position:relative;overflow:hidden}.Co7cmG_imageCard:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}.Co7cmG_image{object-fit:cover;background:var(--dsw-alias-bg-base);flex:1;width:100%;min-height:0;display:block}.Co7cmG_imageCaption{color:var(--dsw-alias-label-tertiary);white-space:nowrap;text-overflow:ellipsis;border-top:1px solid var(--dsw-alias-border-l1);padding:7px 10px;font-size:11px;line-height:1.5;overflow:hidden}.Co7cmG_download{color:#fff;opacity:0;backdrop-filter:blur(4px);background:#0f1218d1;border:1px solid #ffffff9e;border-radius:999px;padding:2px 10px;font-size:12px;font-weight:500;line-height:20px;text-decoration:none;transition:opacity .12s;position:absolute;top:8px;right:8px;box-shadow:0 2px 8px #00000047}.Co7cmG_imageCard:hover .Co7cmG_download{opacity:1}.Co7cmG_download:hover{background:#0f1218f0}.Co7cmG_download:focus-visible{opacity:1;outline-offset:2px;outline:2px solid #fff}.Co7cmG_galleryAdd{font:inherit;color:#fff;cursor:pointer;opacity:0;backdrop-filter:blur(4px);background:#0f1218d1;border:1px solid #ffffff9e;border-radius:999px;align-items:center;gap:5px;padding:2px 10px;font-size:12px;font-weight:500;line-height:20px;transition:opacity .12s;display:inline-flex;position:absolute;top:8px;left:8px;box-shadow:0 2px 8px #00000047}.Co7cmG_imageCard:hover .Co7cmG_galleryAdd{opacity:1}.Co7cmG_galleryAdd:hover{background:#0f1218f0}.Co7cmG_galleryAdd:focus-visible{opacity:1;outline-offset:2px;outline:2px solid #fff}.Co7cmG_galleryAdd:disabled{opacity:.4;cursor:default}.Co7cmG_conversationAdd{color:#fff;cursor:pointer;font:inherit;opacity:0;backdrop-filter:blur(4px);background:#0f1218d1;border:1px solid #ffffff9e;border-radius:999px;align-items:center;gap:5px;padding:2px 10px;font-size:12px;font-weight:500;line-height:20px;transition:opacity .12s;display:inline-flex;position:absolute;top:38px;left:8px;box-shadow:0 2px 8px #00000047}.Co7cmG_imageCard:hover .Co7cmG_conversationAdd,.Co7cmG_conversationAdd:focus-visible{opacity:1}.Co7cmG_conversationAdd:hover{background:#0f1218f0}.Co7cmG_conversationAdd:focus-visible{opacity:1;outline-offset:2px;outline:2px solid #fff}.Co7cmG_conversationAdd:disabled{opacity:.4;cursor:default}.Co7cmG_zoomHint{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-mask-1);border:1px solid var(--dsw-alias-border-l2);opacity:0;backdrop-filter:blur(4px);pointer-events:none;border-radius:999px;align-items:center;gap:5px;padding:2px 10px;font-size:12px;font-weight:500;line-height:20px;transition:opacity .12s;display:inline-flex;position:absolute;bottom:8px;left:8px}.Co7cmG_imageCard:hover .Co7cmG_zoomHint{opacity:1}.Co7cmG_spinner,.Co7cmG_bigSpinner{border:2px solid;border-top-color:#0000;border-radius:50%;flex:none;animation:.8s linear infinite Co7cmG_dshImageGenSpin;display:inline-block}.Co7cmG_spinner{width:11px;height:11px}.Co7cmG_bigSpinner{width:30px;height:30px;color:var(--dsw-alias-state-business-primary);border-width:3px;margin-bottom:6px}.Co7cmG_lightbox{z-index:1000;backdrop-filter:blur(6px);background:#000000b8;justify-content:center;align-items:center;padding:24px;display:flex;position:fixed;inset:0}.Co7cmG_lightboxClose{color:#fff;cursor:pointer;background:#ffffff24;border:1px solid #ffffff47;border-radius:50%;justify-content:center;align-items:center;width:38px;height:38px;display:inline-flex;position:absolute;top:16px;right:16px}.Co7cmG_lightboxClose:hover{background:#ffffff42}.Co7cmG_lightboxNav{color:#fff;cursor:pointer;background:#ffffff24;border:1px solid #ffffff47;border-radius:50%;justify-content:center;align-items:center;width:42px;height:42px;display:inline-flex;position:absolute;top:50%;transform:translateY(-50%)}.Co7cmG_lightboxNav:hover{background:#ffffff42}.Co7cmG_lightboxNav[data-dir=prev]{left:max(20px,50% - 640px)}.Co7cmG_lightboxNav[data-dir=next]{right:max(20px,50% - 640px)}.Co7cmG_lightboxFigure{flex-direction:column;gap:10px;width:min(1100px,100vw - 160px);max-width:min(1100px,100vw - 160px);height:min(820px,100vh - 48px);min-height:0;margin:0;display:flex}.Co7cmG_lightboxStage{background:#ffffff0a;border-radius:10px;flex:1;min-height:0;position:relative;overflow:auto}.Co7cmG_lightboxScaleFrame{justify-content:center;align-items:center;min-width:100%;min-height:100%;display:flex}.Co7cmG_lightboxImage{object-fit:contain;border-radius:10px;max-width:100%;max-height:100%;display:block;box-shadow:0 24px 80px #00000080}.Co7cmG_lightboxTools{justify-content:center;align-items:center;gap:6px;display:flex}.Co7cmG_lightboxTool,.Co7cmG_lightboxZoomLevel,.Co7cmG_lightboxCopy{color:#fff;cursor:pointer;background:#ffffff24;border:1px solid #ffffff47;justify-content:center;align-items:center;display:inline-flex}.Co7cmG_lightboxTool,.Co7cmG_lightboxZoomLevel{height:32px}.Co7cmG_lightboxTool{border-radius:50%;width:32px}.Co7cmG_lightboxZoomLevel{min-width:58px;font:inherit;font-variant-numeric:tabular-nums;border-radius:999px;padding:0 9px;font-size:12px}.Co7cmG_lightboxTool:hover,.Co7cmG_lightboxZoomLevel:hover,.Co7cmG_lightboxCopy:hover{background:#ffffff42}.Co7cmG_lightboxCaptionRow{align-items:flex-start;gap:8px;min-width:0;display:flex}.Co7cmG_lightboxCaption{color:#ffffffe6;-webkit-line-clamp:3;-webkit-box-orient:vertical;flex:1;min-width:0;font-size:12px;line-height:1.6;display:-webkit-box;overflow:hidden}.Co7cmG_lightboxCopy{min-height:28px;font:inherit;white-space:nowrap;border-radius:999px;flex:none;gap:5px;padding:4px 9px;font-size:12px}.Co7cmG_lightboxMeta{justify-content:space-between;align-items:center;gap:12px;display:flex}.Co7cmG_lightboxIndex{color:#fffc;font-variant-numeric:tabular-nums;font-size:12px}.Co7cmG_lightboxActions{align-items:center;gap:8px;display:inline-flex}.Co7cmG_lightboxDownload,.Co7cmG_lightboxEdit{font:inherit;color:#fff;cursor:pointer;background:#ffffff24;border:1px solid #ffffff47;border-radius:999px;padding:4px 14px;font-size:12.5px;font-weight:500;text-decoration:none}.Co7cmG_lightboxDownload:hover,.Co7cmG_lightboxEdit:hover{background:#ffffff42}.Co7cmG_lightboxEdit{color:#fff;background:#ffffff24;border:1px solid #ffffff47;border-radius:999px}@media (width<=720px){.Co7cmG_lightbox{padding:16px}.Co7cmG_lightboxFigure{width:calc(100vw - 32px);max-width:none}.Co7cmG_lightboxNav[data-dir=prev]{left:20px}.Co7cmG_lightboxNav[data-dir=next]{right:20px}.Co7cmG_lightboxCaptionRow,.Co7cmG_lightboxMeta{flex-direction:column;align-items:stretch}.Co7cmG_lightboxCopy,.Co7cmG_lightboxActions{align-self:flex-end}}@keyframes Co7cmG_dshImageGenSpin{to{transform:rotate(360deg)}}.Co7cmG_galleryToast{z-index:30;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-mask-1);border:1px solid var(--dsw-alias-border-l2);backdrop-filter:blur(6px);pointer-events:none;border-radius:999px;align-items:center;gap:7px;padding:6px 16px;font-size:13px;font-weight:500;animation:.16s ease-out Co7cmG_dshImageGenToastIn;display:inline-flex;position:absolute;bottom:24px;left:50%;transform:translate(-50%);box-shadow:0 8px 24px #00000038}@keyframes Co7cmG_dshImageGenToastIn{0%{opacity:0;transform:translate(-50%,6px)}to{opacity:1;transform:translate(-50%)}}.Co7cmG_conversationToast{z-index:30;border:1px solid var(--dsw-alias-border-l2);max-width:calc(100% - 32px);color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-mask-1);pointer-events:none;backdrop-filter:blur(6px);border-radius:999px;align-items:center;gap:7px;padding:6px 16px;font-size:13px;font-weight:500;animation:.16s ease-out Co7cmG_dshImageGenToastIn;display:inline-flex;position:absolute;bottom:24px;left:50%;transform:translate(-50%);box-shadow:0 8px 24px #00000038}@media (prefers-reduced-motion:reduce){.Co7cmG_download,.Co7cmG_spinner,.Co7cmG_bigSpinner{transition:none;animation-duration:1.5s}}.Co7cmG_config[data-gallery=true] .Co7cmG_configScroll{flex:none;order:1;display:flex;overflow:visible}.Co7cmG_config[data-gallery=true] .Co7cmG_galleryFilters{flex:1;order:2;min-height:0}.Co7cmG_galleryFilters{padding:18px 14px;overflow:hidden auto}.Co7cmG_galleryFilterHeading{color:var(--dsw-alias-label-tertiary);margin:0 4px 10px;font-size:12px;font-weight:600}.Co7cmG_galleryFilter{width:100%;min-height:34px;color:var(--dsw-alias-label-secondary);cursor:pointer;text-align:left;background:0 0;border:0;border-radius:9px;justify-content:space-between;align-items:center;padding:0 10px;display:flex}.Co7cmG_galleryFilter:hover,.Co7cmG_galleryFilter[data-active]{color:var(--dsw-alias-brand-primary);background:color-mix(in srgb, var(--dsw-alias-brand-primary) 10%, transparent)}.Co7cmG_galleryFilterCount{min-width:20px;color:var(--dsw-alias-label-tertiary);background:var(--dsw-alias-bg-layer-2);text-align:center;border-radius:999px;padding:1px 6px;font-size:11px}.Co7cmG_galleryFilterDivider{background:var(--dsw-alias-border-l1);height:1px;margin:18px 4px}.Co7cmG_galleryRatioList{flex-wrap:wrap;gap:6px;display:flex}.Co7cmG_galleryRatio{color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2);cursor:pointer;border:0;border-radius:999px;padding:6px 10px;font-size:12px}.Co7cmG_galleryRatio[data-active]{color:var(--dsw-alias-brand-primary);background:color-mix(in srgb, var(--dsw-alias-brand-primary) 13%, transparent)}.Co7cmG_galleryTagFilterList{flex-wrap:wrap;gap:6px;display:flex}.Co7cmG_galleryTagFilter{border:1px solid var(--dsw-alias-border-l1);min-width:0;max-width:100%;min-height:27px;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2);cursor:pointer;font:inherit;border-radius:6px;align-items:center;gap:5px;padding:0 8px;font-size:11px;display:inline-flex}.Co7cmG_galleryTagFilter span:first-child{text-overflow:ellipsis;white-space:nowrap;max-width:112px;overflow:hidden}.Co7cmG_galleryTagFilter span:last-child{color:var(--dsw-alias-label-tertiary);font-size:10px}.Co7cmG_galleryTagFilter:hover,.Co7cmG_galleryTagFilter[data-active]{color:var(--dsw-alias-brand-primary);background:color-mix(in srgb, var(--dsw-alias-brand-primary) 10%, transparent)}.Co7cmG_galleryFilterNote{color:var(--dsw-alias-label-quaternary);margin:20px 4px 0;font-size:11px;line-height:1.5}.Co7cmG_galleryWorkspace{box-sizing:border-box;flex-direction:column;width:100%;min-width:0;height:100%;min-height:0;padding:22px 24px 26px;display:flex;position:absolute;inset:0;overflow:hidden}.Co7cmG_galleryToolbar{flex:none;justify-content:space-between;align-items:center;gap:16px;min-width:0;margin-bottom:18px;display:flex}.Co7cmG_galleryHeading{color:var(--dsw-alias-label-primary);margin:0;font-size:20px;font-weight:700;display:inline}.Co7cmG_galleryCount{color:var(--dsw-alias-label-tertiary);margin-left:8px;font-size:13px}.Co7cmG_galleryToolbarActions{flex-wrap:wrap;align-items:center;gap:10px;min-width:0;display:flex}.Co7cmG_gallerySelectMode,.Co7cmG_galleryBulkButton,.Co7cmG_gallerySelectionClear{border:1px solid var(--dsw-alias-border-l1);min-height:30px;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-1);cursor:pointer;font:inherit;border-radius:7px;padding:0 10px;font-size:12px}.Co7cmG_gallerySelectMode:hover,.Co7cmG_gallerySelectMode[data-active],.Co7cmG_galleryBulkButton:hover:not(:disabled){color:var(--dsw-alias-brand-primary);border-color:color-mix(in srgb, var(--dsw-alias-brand-primary) 38%, var(--dsw-alias-border-l1));background:color-mix(in srgb, var(--dsw-alias-brand-primary) 11%, transparent)}.Co7cmG_galleryBulkButton:disabled{cursor:not-allowed;opacity:.45}.Co7cmG_gallerySelectionBar{border:1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 35%, var(--dsw-alias-border-l1));background:color-mix(in srgb, var(--dsw-alias-brand-primary) 7%, var(--dsw-alias-bg-layer-1));border-radius:9px;flex:none;align-items:center;gap:10px;min-width:0;margin:-4px 0 16px;padding:10px 12px;display:flex}.Co7cmG_gallerySelectionBar strong{color:var(--dsw-alias-brand-primary);flex:none;font-size:12px}.Co7cmG_gallerySelectionClear{margin-left:auto}.Co7cmG_gallerySelectionClear:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2)}.Co7cmG_galleryTagInput,.Co7cmG_gallerySearch{border:1px solid var(--dsw-alias-border-l1);min-width:0;height:30px;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-1);font:inherit;border-radius:7px;outline:none;padding:0 10px;font-size:12px}.Co7cmG_galleryTagInput{flex:190px}.Co7cmG_galleryTagInput:focus,.Co7cmG_gallerySearch:focus{border-color:var(--dsw-alias-brand-primary)}.Co7cmG_galleryViewToggle{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);border-radius:9px;padding:3px;display:flex}.Co7cmG_galleryViewToggle button,.Co7cmG_gallerySort,.Co7cmG_galleryClear{min-height:30px;color:var(--dsw-alias-label-secondary);cursor:pointer;font:inherit;background:0 0;border:0;border-radius:7px;padding:0 10px;font-size:12px}.Co7cmG_galleryViewToggle button[data-active],.Co7cmG_galleryViewToggle button:hover,.Co7cmG_gallerySort:hover,.Co7cmG_galleryClear:hover{color:var(--dsw-alias-brand-primary);background:color-mix(in srgb, var(--dsw-alias-brand-primary) 11%, transparent)}.Co7cmG_gallerySort{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}.Co7cmG_galleryClear{border:1px solid var(--dsw-alias-border-l1)}.Co7cmG_compareControl{flex-direction:column;gap:6px;margin:0 0 10px;display:flex}.Co7cmG_compareToggle,.Co7cmG_compareModelChoices label{color:var(--dsw-alias-label-secondary);cursor:pointer;align-items:center;gap:6px;font-size:12px;display:flex}.Co7cmG_compareToggle input,.Co7cmG_compareModelChoices input{accent-color:var(--dsw-alias-brand-primary)}.Co7cmG_compareModelChoices{flex-wrap:wrap;gap:6px;display:flex}.Co7cmG_compareModelChoices label{border:1px solid var(--dsw-alias-border-l1);border-radius:5px;padding:4px 6px;font-size:10px}.Co7cmG_comparisonBoard{z-index:4;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);border-radius:8px;flex-direction:column;display:flex;position:absolute;inset:14px;overflow:hidden;box-shadow:0 8px 24px #0000001f}.Co7cmG_comparisonBoard>header{border-bottom:1px solid var(--dsw-alias-border-l1);justify-content:space-between;align-items:center;padding:10px 12px;display:flex}.Co7cmG_comparisonBoard>header div{align-items:baseline;gap:7px;display:flex}.Co7cmG_comparisonBoard>header strong{color:var(--dsw-alias-label-primary);font-size:13px}.Co7cmG_comparisonBoard>header span{color:var(--dsw-alias-label-tertiary);font-size:11px}.Co7cmG_comparisonBoard>header button{border:1px solid var(--dsw-alias-border-l1);min-height:28px;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2);cursor:pointer;font:inherit;border-radius:5px;padding:0 9px;font-size:11px}.Co7cmG_comparisonGrid{flex:1;grid-template-rows:minmax(0,1fr);grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;min-height:0;padding:12px;display:grid;overflow:auto}.Co7cmG_comparisonGrid article{flex-direction:column;gap:7px;min-width:0;height:100%;min-height:0;display:flex}.Co7cmG_comparisonGrid article>strong{color:var(--dsw-alias-label-primary);font-size:12px}.Co7cmG_comparisonImageButton{cursor:zoom-in;background:var(--dsw-alias-bg-base);border:0;flex:1;width:100%;min-height:0;padding:0;display:flex;overflow:hidden}.Co7cmG_comparisonImageButton:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}.Co7cmG_comparisonGrid article>span{min-height:0;color:var(--dsw-alias-label-tertiary);background:var(--dsw-alias-bg-layer-2);flex:1;place-items:center;font-size:12px;display:grid}.Co7cmG_comparisonGrid img{object-fit:contain;background:var(--dsw-alias-bg-base);flex:1;width:100%;height:100%;min-height:0;max-height:none;display:block}.Co7cmG_comparisonFullscreen{z-index:1200;background:#000000eb;padding:54px 24px 24px;position:fixed;inset:0;overflow:auto}.Co7cmG_comparisonFullscreenGrid{grid-template-columns:repeat(auto-fit,minmax(300px,1fr));align-items:start;gap:18px;min-height:100%;display:grid}.Co7cmG_comparisonFullscreen figure{min-width:0;margin:0}.Co7cmG_comparisonFullscreen figcaption{color:#fff;margin-bottom:8px;font-size:13px;font-weight:600}.Co7cmG_comparisonFullscreen img{background:#111;width:100%;margin-bottom:10px;display:block}.Co7cmG_historyItem[data-comparison]{border-color:color-mix(in srgb, var(--dsw-alias-brand-primary) 55%, var(--dsw-alias-border-l1))}.Co7cmG_galleryMasonry{box-sizing:border-box;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-border-l2) transparent;flex:auto;grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-rows:max-content;align-content:start;gap:16px;width:100%;min-width:0;max-width:100%;height:0;min-height:0;padding:2px 8px 16px 2px;display:grid;overflow:hidden scroll}.Co7cmG_galleryMasonry::-webkit-scrollbar{width:8px}.Co7cmG_galleryMasonry::-webkit-scrollbar-thumb{background:var(--dsw-alias-border-l2);border-radius:999px}.Co7cmG_galleryCard{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);border-radius:14px;width:100%;margin:0;display:block;position:relative;overflow:hidden;box-shadow:0 5px 18px #18203612}.Co7cmG_galleryCard[data-selected]{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary) 26%, transparent), 0 5px 18px #18203612}.Co7cmG_gallerySelect{z-index:2;cursor:pointer;background:#00000094;border:1px solid #ffffffbf;border-radius:7px;place-items:center;width:26px;height:26px;display:grid;position:absolute;top:9px;right:9px}.Co7cmG_gallerySelect input{width:16px;height:16px;accent-color:var(--dsw-alias-brand-primary);cursor:pointer;margin:0}.Co7cmG_galleryImageButton{background:var(--dsw-alias-bg-base);cursor:zoom-in;border:0;width:100%;padding:0;display:block;position:relative}.Co7cmG_galleryImageButton[data-selecting]{cursor:pointer}.Co7cmG_galleryImage{aspect-ratio:4/3;object-fit:cover;width:100%;display:block}.Co7cmG_galleryMasonry[data-view=masonry] .Co7cmG_galleryCard:nth-child(3n+1) .Co7cmG_galleryImage{aspect-ratio:4/5}.Co7cmG_galleryMasonry[data-view=masonry] .Co7cmG_galleryCard:nth-child(3n+2) .Co7cmG_galleryImage{aspect-ratio:4/3}.Co7cmG_galleryMasonry[data-view=masonry] .Co7cmG_galleryCard:nth-child(3n) .Co7cmG_galleryImage{aspect-ratio:3/4}.Co7cmG_galleryBadge{color:#fff;backdrop-filter:blur(4px);background:#121724c2;border-radius:999px;padding:4px 9px;font-size:11px;position:absolute;top:10px;left:10px}.Co7cmG_galleryCardActions{padding:8px 12px 0;display:flex}.Co7cmG_galleryCardAction{border:1px solid var(--dsw-alias-border-l2);width:100%;min-width:0;min-height:28px;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2);cursor:pointer;font:inherit;white-space:nowrap;border-radius:7px;justify-content:center;align-items:center;gap:4px;padding:0 4px;font-size:10px;font-weight:500;display:inline-flex}.Co7cmG_galleryCardAction:hover,.Co7cmG_galleryCardAction:focus-visible{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary);outline:none}.Co7cmG_galleryCardAction:disabled{cursor:wait;opacity:.55}.Co7cmG_galleryCardFooter{align-items:center;gap:9px;min-width:0;padding:10px 12px;display:flex}.Co7cmG_galleryAvatar{color:#fff;background:var(--dsw-alias-brand-primary);border-radius:50%;flex:none;place-items:center;width:27px;height:27px;font-size:12px;font-weight:700;display:grid}.Co7cmG_galleryCardInfo{flex-direction:column;flex:1;gap:2px;min-width:0;display:flex}.Co7cmG_galleryCardInfo strong,.Co7cmG_galleryCardInfo small{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.Co7cmG_galleryCardInfo strong{color:var(--dsw-alias-label-primary);font-size:12px}.Co7cmG_galleryCardInfo small{color:var(--dsw-alias-label-tertiary);font-size:10px}.Co7cmG_galleryTags{flex-wrap:wrap;gap:4px;margin-top:4px;display:flex}.Co7cmG_galleryTags button{max-width:96px;min-height:19px;color:var(--dsw-alias-brand-primary);background:color-mix(in srgb, var(--dsw-alias-brand-primary) 10%, transparent);cursor:pointer;font:inherit;text-overflow:ellipsis;white-space:nowrap;border:0;border-radius:4px;padding:1px 6px;font-size:10px;line-height:1.35;overflow:hidden}.Co7cmG_galleryTags button:hover{background:color-mix(in srgb, var(--dsw-alias-brand-primary) 17%, transparent)}.Co7cmG_galleryTags .Co7cmG_galleryTagEdit{color:var(--dsw-alias-label-tertiary);background:0 0;flex:none}.Co7cmG_galleryTagEditor{align-items:center;gap:6px;padding:0 12px 10px 48px;display:flex}.Co7cmG_galleryTagEditor input{border:1px solid var(--dsw-alias-border-l2);min-width:0;height:27px;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2);font:inherit;border-radius:6px;outline:none;flex:1;padding:0 8px;font-size:11px}.Co7cmG_galleryTagEditor input:focus{border-color:var(--dsw-alias-brand-primary)}.Co7cmG_galleryTagEditor button{border:1px solid var(--dsw-alias-border-l2);height:27px;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-1);cursor:pointer;font:inherit;border-radius:6px;padding:0 8px;font-size:11px}.Co7cmG_galleryTagEditor button[type=submit]{color:var(--dsw-alias-brand-primary)}.Co7cmG_galleryRemove{width:24px;height:24px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:0;border-radius:50%;flex:none;padding:0;font-size:18px}.Co7cmG_galleryRemove:hover{color:var(--dsw-alias-state-error);background:var(--dsw-alias-bg-layer-2)}@media (width<=760px){.Co7cmG_ecommerceParamGrid{grid-template-columns:1fr}.Co7cmG_ecommerceStructureGrid,.Co7cmG_ecommerceAssets{grid-template-columns:repeat(2,minmax(0,1fr))}}@media (width<=420px){.Co7cmG_ecommerceWorkspace{padding-inline:2px}.Co7cmG_ecommerceStructureGrid,.Co7cmG_ecommerceAssets{grid-template-columns:1fr}}@media (width<=1100px){.Co7cmG_galleryMasonry{grid-template-columns:repeat(2,minmax(0,1fr))}}@media (width<=760px){.Co7cmG_studio{grid-template-rows:minmax(220px,36%) minmax(0,1fr);grid-template-columns:minmax(0,1fr);overflow-y:auto}.Co7cmG_history{grid-area:1/1;min-height:220px}.Co7cmG_generation{flex-direction:column;grid-area:2/1;min-height:0}.Co7cmG_config{width:auto;max-width:none;height:auto;min-height:0}.Co7cmG_config[data-gallery=true]{flex:none}.Co7cmG_canvas{min-height:560px}.Co7cmG_galleryToolbar{flex-direction:column;align-items:flex-start}.Co7cmG_galleryToolbarActions{flex-wrap:wrap;width:100%}.Co7cmG_galleryMasonry{grid-template-columns:1fr}}";
		const tagId$2 = "@dickpy/dsh-imagegen/panel.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$2) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dickpy/dsh-imagegen";
			tag.dataset.pluginCss = tagId$2;
			tag.textContent = css$2;
			document.head.appendChild(tag);
		}
		var panel_module_css_default = {
			"entryLabel": "Co7cmG_entryLabel",
			"history": "Co7cmG_history",
			"configGuideBody": "Co7cmG_configGuideBody",
			"ecommerceWorkspace": "Co7cmG_ecommerceWorkspace",
			"historyList": "Co7cmG_historyList",
			"grid": "Co7cmG_grid",
			"connectionStatus": "Co7cmG_connectionStatus",
			"ecommerceAdvancedChevron": "Co7cmG_ecommerceAdvancedChevron",
			"lightboxNav": "Co7cmG_lightboxNav",
			"historyHeaderActions": "Co7cmG_historyHeaderActions",
			"lightboxCaption": "Co7cmG_lightboxCaption",
			"sessionTabIcon": "Co7cmG_sessionTabIcon",
			"galleryWorkspace": "Co7cmG_galleryWorkspace",
			"galleryCount": "Co7cmG_galleryCount",
			"panelHeading": "Co7cmG_panelHeading",
			"comparisonGrid": "Co7cmG_comparisonGrid",
			"galleryTags": "Co7cmG_galleryTags",
			"galleryClear": "Co7cmG_galleryClear",
			"dshImageGenToastIn": "Co7cmG_dshImageGenToastIn",
			"historyMain": "Co7cmG_historyMain",
			"prompt": "Co7cmG_prompt",
			"historyActions": "Co7cmG_historyActions",
			"ecommercePrimaryAction": "Co7cmG_ecommercePrimaryAction",
			"lightboxZoomLevel": "Co7cmG_lightboxZoomLevel",
			"comparisonFullscreenGrid": "Co7cmG_comparisonFullscreenGrid",
			"galleryCardActions": "Co7cmG_galleryCardActions",
			"canvasHistoryTag": "Co7cmG_canvasHistoryTag",
			"panel": "Co7cmG_panel",
			"ecommerceGroups": "Co7cmG_ecommerceGroups",
			"ecommercePlanMini": "Co7cmG_ecommercePlanMini",
			"ecommerceResultBadge": "Co7cmG_ecommerceResultBadge",
			"optionPill": "Co7cmG_optionPill",
			"modelWrap": "Co7cmG_modelWrap",
			"topNav": "Co7cmG_topNav",
			"lightboxIndex": "Co7cmG_lightboxIndex",
			"reference": "Co7cmG_reference",
			"generateButton": "Co7cmG_generateButton",
			"modelMenuItem": "Co7cmG_modelMenuItem",
			"galleryAdd": "Co7cmG_galleryAdd",
			"compareControl": "Co7cmG_compareControl",
			"comparisonImageButton": "Co7cmG_comparisonImageButton",
			"lightbox": "Co7cmG_lightbox",
			"ecommerceTaskActions": "Co7cmG_ecommerceTaskActions",
			"ecommerceAdvancedToggle": "Co7cmG_ecommerceAdvancedToggle",
			"galleryFilterHeading": "Co7cmG_galleryFilterHeading",
			"taskTrayToggle": "Co7cmG_taskTrayToggle",
			"historyPrompt": "Co7cmG_historyPrompt",
			"chatToggle": "Co7cmG_chatToggle",
			"ecommerceAssetAdd": "Co7cmG_ecommerceAssetAdd",
			"galleryFilters": "Co7cmG_galleryFilters",
			"historyMeta": "Co7cmG_historyMeta",
			"historyFilters": "Co7cmG_historyFilters",
			"taskTrayHeader": "Co7cmG_taskTrayHeader",
			"uploadIcon": "Co7cmG_uploadIcon",
			"taskRow": "Co7cmG_taskRow",
			"lightboxClose": "Co7cmG_lightboxClose",
			"canvasStateTitle": "Co7cmG_canvasStateTitle",
			"ecommerceSlotCount": "Co7cmG_ecommerceSlotCount",
			"galleryFilterCount": "Co7cmG_galleryFilterCount",
			"galleryToolbarActions": "Co7cmG_galleryToolbarActions",
			"compareToggle": "Co7cmG_compareToggle",
			"galleryAvatar": "Co7cmG_galleryAvatar",
			"ecommerceSectionHint": "Co7cmG_ecommerceSectionHint",
			"ecommerceUploadHero": "Co7cmG_ecommerceUploadHero",
			"optionRow": "Co7cmG_optionRow",
			"galleryBadge": "Co7cmG_galleryBadge",
			"ecommerceAssets": "Co7cmG_ecommerceAssets",
			"canvasMeta": "Co7cmG_canvasMeta",
			"galleryRemove": "Co7cmG_galleryRemove",
			"historyClear": "Co7cmG_historyClear",
			"lightboxTools": "Co7cmG_lightboxTools",
			"ecommerceTaskCard": "Co7cmG_ecommerceTaskCard",
			"historyHeader": "Co7cmG_historyHeader",
			"historySearch": "Co7cmG_historySearch",
			"paramGroup": "Co7cmG_paramGroup",
			"gallerySelectionClear": "Co7cmG_gallerySelectionClear",
			"dshImageGenSpin": "Co7cmG_dshImageGenSpin",
			"ecommerceResultsEmpty": "Co7cmG_ecommerceResultsEmpty",
			"view": "Co7cmG_view",
			"panelHeader": "Co7cmG_panelHeader",
			"galleryMasonry": "Co7cmG_galleryMasonry",
			"canvasError": "Co7cmG_canvasError",
			"taskTrayCount": "Co7cmG_taskTrayCount",
			"download": "Co7cmG_download",
			"galleryRatio": "Co7cmG_galleryRatio",
			"entryIcon": "Co7cmG_entryIcon",
			"conversationToast": "Co7cmG_conversationToast",
			"comparisonFullscreen": "Co7cmG_comparisonFullscreen",
			"taskTray": "Co7cmG_taskTray",
			"gallerySelectionBar": "Co7cmG_gallerySelectionBar",
			"galleryTagEditor": "Co7cmG_galleryTagEditor",
			"hiddenFile": "Co7cmG_hiddenFile",
			"ecommerceParamGrid": "Co7cmG_ecommerceParamGrid",
			"canvasBody": "Co7cmG_canvasBody",
			"ecommerceResultsActions": "Co7cmG_ecommerceResultsActions",
			"ecommerceGroupGrid": "Co7cmG_ecommerceGroupGrid",
			"galleryTagFilterList": "Co7cmG_galleryTagFilterList",
			"galleryTagEdit": "Co7cmG_galleryTagEdit",
			"promptFooter": "Co7cmG_promptFooter",
			"modePill": "Co7cmG_modePill",
			"templatesButton": "Co7cmG_templatesButton",
			"ecommerceAdvancedBody": "Co7cmG_ecommerceAdvancedBody",
			"lightboxStage": "Co7cmG_lightboxStage",
			"historyItem": "Co7cmG_historyItem",
			"galleryHeading": "Co7cmG_galleryHeading",
			"galleryCardAction": "Co7cmG_galleryCardAction",
			"lightboxMeta": "Co7cmG_lightboxMeta",
			"galleryImage": "Co7cmG_galleryImage",
			"ecommerceActionChip": "Co7cmG_ecommerceActionChip",
			"topNavDivider": "Co7cmG_topNavDivider",
			"modelMenuList": "Co7cmG_modelMenuList",
			"updateText": "Co7cmG_updateText",
			"canvas": "Co7cmG_canvas",
			"lightboxCaptionRow": "Co7cmG_lightboxCaptionRow",
			"gallerySelect": "Co7cmG_gallerySelect",
			"ecommerceStructureGrid": "Co7cmG_ecommerceStructureGrid",
			"footer": "Co7cmG_footer",
			"updateRelease": "Co7cmG_updateRelease",
			"ecommercePlanWarn": "Co7cmG_ecommercePlanWarn",
			"galleryFilter": "Co7cmG_galleryFilter",
			"zoomHint": "Co7cmG_zoomHint",
			"lightboxImage": "Co7cmG_lightboxImage",
			"image": "Co7cmG_image",
			"entry": "Co7cmG_entry",
			"conversationAdd": "Co7cmG_conversationAdd",
			"historyEmpty": "Co7cmG_historyEmpty",
			"lightboxActions": "Co7cmG_lightboxActions",
			"ecommerceAsset": "Co7cmG_ecommerceAsset",
			"historyThumbPlaceholder": "Co7cmG_historyThumbPlaceholder",
			"ecommerceTaskState": "Co7cmG_ecommerceTaskState",
			"promptCount": "Co7cmG_promptCount",
			"canvasStateHint": "Co7cmG_canvasStateHint",
			"topNavItem": "Co7cmG_topNavItem",
			"studio": "Co7cmG_studio",
			"panelHeaderActions": "Co7cmG_panelHeaderActions",
			"uploadHint": "Co7cmG_uploadHint",
			"ecommercePlanBack": "Co7cmG_ecommercePlanBack",
			"historyNew": "Co7cmG_historyNew",
			"previewBadge": "Co7cmG_previewBadge",
			"modelLabel": "Co7cmG_modelLabel",
			"updateBanner": "Co7cmG_updateBanner",
			"galleryBulkButton": "Co7cmG_galleryBulkButton",
			"referenceImage": "Co7cmG_referenceImage",
			"configGuide": "Co7cmG_configGuide",
			"ecommercePlanList": "Co7cmG_ecommercePlanList",
			"optionGrid": "Co7cmG_optionGrid",
			"generation": "Co7cmG_generation",
			"ecommerceFooterHint": "Co7cmG_ecommerceFooterHint",
			"galleryToolbar": "Co7cmG_galleryToolbar",
			"galleryFilterNote": "Co7cmG_galleryFilterNote",
			"lightboxCopy": "Co7cmG_lightboxCopy",
			"configToggle": "Co7cmG_configToggle",
			"historyTitle": "Co7cmG_historyTitle",
			"ecommerceFooterBody": "Co7cmG_ecommerceFooterBody",
			"galleryCardInfo": "Co7cmG_galleryCardInfo",
			"galleryCardFooter": "Co7cmG_galleryCardFooter",
			"lightboxScaleFrame": "Co7cmG_lightboxScaleFrame",
			"configScroll": "Co7cmG_configScroll",
			"lightboxEdit": "Co7cmG_lightboxEdit",
			"config": "Co7cmG_config",
			"gallerySort": "Co7cmG_gallerySort",
			"gallerySearch": "Co7cmG_gallerySearch",
			"ecommerceSlotCard": "Co7cmG_ecommerceSlotCard",
			"sidebarHistoryHost": "Co7cmG_sidebarHistoryHost",
			"card": "Co7cmG_card",
			"paramLabel": "Co7cmG_paramLabel",
			"lightboxTool": "Co7cmG_lightboxTool",
			"panelTitle": "Co7cmG_panelTitle",
			"taskTrayChevron": "Co7cmG_taskTrayChevron",
			"galleryTagInput": "Co7cmG_galleryTagInput",
			"ecommerceResults": "Co7cmG_ecommerceResults",
			"uploadBox": "Co7cmG_uploadBox",
			"canvasState": "Co7cmG_canvasState",
			"lightboxFigure": "Co7cmG_lightboxFigure",
			"imageCard": "Co7cmG_imageCard",
			"referenceActions": "Co7cmG_referenceActions",
			"gallerySelectMode": "Co7cmG_gallerySelectMode",
			"spinner": "Co7cmG_spinner",
			"ecommercePlanNote": "Co7cmG_ecommercePlanNote",
			"imageCaption": "Co7cmG_imageCaption",
			"taskTrayClose": "Co7cmG_taskTrayClose",
			"sessionTabLabel": "Co7cmG_sessionTabLabel",
			"modeRow": "Co7cmG_modeRow",
			"bigSpinner": "Co7cmG_bigSpinner",
			"lightboxDownload": "Co7cmG_lightboxDownload",
			"historyInfo": "Co7cmG_historyInfo",
			"updateActions": "Co7cmG_updateActions",
			"sessionTab": "Co7cmG_sessionTab",
			"historyIconAction": "Co7cmG_historyIconAction",
			"sessionTabs": "Co7cmG_sessionTabs",
			"enhanceButton": "Co7cmG_enhanceButton",
			"configResizer": "Co7cmG_configResizer",
			"historyThumb": "Co7cmG_historyThumb",
			"ecommerceFieldLabel": "Co7cmG_ecommerceFieldLabel",
			"ecommerceRefRow": "Co7cmG_ecommerceRefRow",
			"modelSelect": "Co7cmG_modelSelect",
			"paramHint": "Co7cmG_paramHint",
			"githubLink": "Co7cmG_githubLink",
			"generateInner": "Co7cmG_generateInner",
			"galleryRatioList": "Co7cmG_galleryRatioList",
			"taskRows": "Co7cmG_taskRows",
			"galleryTagFilter": "Co7cmG_galleryTagFilter",
			"compareModelChoices": "Co7cmG_compareModelChoices",
			"galleryToast": "Co7cmG_galleryToast",
			"galleryFilterDivider": "Co7cmG_galleryFilterDivider",
			"comparisonBoard": "Co7cmG_comparisonBoard",
			"canvasEmptyIcon": "Co7cmG_canvasEmptyIcon",
			"galleryImageButton": "Co7cmG_galleryImageButton",
			"taskStatus": "Co7cmG_taskStatus",
			"ecommerceResultsHeader": "Co7cmG_ecommerceResultsHeader",
			"ecommerceGroup": "Co7cmG_ecommerceGroup",
			"galleryViewToggle": "Co7cmG_galleryViewToggle",
			"galleryCard": "Co7cmG_galleryCard",
			"modelMenu": "Co7cmG_modelMenu",
			"configHeader": "Co7cmG_configHeader",
			"taskPrompt": "Co7cmG_taskPrompt",
			"ecommerceSection": "Co7cmG_ecommerceSection",
			"ecommerceField": "Co7cmG_ecommerceField",
			"chatResizer": "Co7cmG_chatResizer",
			"connectionDot": "Co7cmG_connectionDot"
		};
		//#endregion
		//#region src/client/ImageGenPanel.tsx
		/**
		* The AI 生图 studio: a three-column layout — left, a card-grouped
		* configuration sidebar (mode tabs, prompt with counter, rounded parameter
		* selectors, model dropdown + generate button); center, the result canvas;
		* right, a persistent generation history column.
		*
		* Controls ride the system UI primitives (@deepseek-ai/dsh-client-ui-primitives,
		* a platform module) so the studio matches the dsh shell look by construction.
		*/
		/** Size options, presented as aspect ratios (auto = let the model decide).
		*  The host maps each ratio onto the model's own vocabulary: aspect_ratio for
		*  Grok Imagine, the closest pixel size for OpenAI-compatible endpoints. */
		const SIZES = [
			"auto",
			"1:1",
			"3:4",
			"4:3",
			"9:16",
			"2:3",
			"3:2",
			"16:9",
			"21:9"
		];
		/** Size option keys in the locale dictionary. */
		const SIZE_KEYS = {
			auto: "size.auto",
			"1:1": "size.square",
			"3:4": "size.portrait34",
			"4:3": "size.landscape43",
			"9:16": "size.portrait916",
			"2:3": "size.portrait23",
			"3:2": "size.landscape32",
			"16:9": "size.wide169",
			"21:9": "size.ultrawide21"
		};
		/** Quality options, shown as output-resolution tiers (auto = let the model
		*  decide). The host maps them: resolution for Grok, quality level for
		*  OpenAI-compatible endpoints (1k→low, 2k→medium, 4k→high). */
		const QUALITIES = [
			"auto",
			"1k",
			"2k",
			"4k"
		];
		/** Detail options ('' = omit the passthrough). */
		const DETAILS = [
			"",
			"standard",
			"high"
		];
		const REF_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
		const CONVERSATION_IMAGE_MAX_DIMENSION = 2e3;
		const CONVERSATION_IMAGE_JPEG_QUALITY = .9;
		const PREVIEW_SCALE_MIN = .5;
		const PREVIEW_SCALE_MAX = 3;
		const PREVIEW_SCALE_STEP = .25;
		const CONFIG_COLLAPSED_STORAGE_KEY = "dsh-imagegen-config-collapsed";
		const ECOMMERCE_DRAFT_STORAGE_KEY = "dsh-imagegen-ecommerce-draft";
		/** Reference roles an uploaded product asset can play (slot selections can
		*  also pick 'none'). */
		const ECOMMERCE_ASSET_ROLES = [
			"product",
			"packaging",
			"detail",
			"style"
		];
		const MAX_ECOMMERCE_ASSETS = 4;
		const ECOMMERCE_ROLE_PROMPT_LABELS = {
			product: "商品主体",
			packaging: "包装",
			detail: "细节/角度",
			style: "风格参考"
		};
		const PRODUCT_SET_SLOTS = [
			{
				key: "main",
				label: "主图",
				description: "干净背景，突出商品主体",
				count: 1,
				enabled: true,
				refRole: "product"
			},
			{
				key: "selling-point",
				label: "卖点图",
				description: "用画面展示商品核心卖点",
				count: 2,
				enabled: true,
				refRole: "product"
			},
			{
				key: "scene",
				label: "场景图",
				description: "真实生活或使用场景",
				count: 2,
				enabled: true,
				refRole: "product"
			},
			{
				key: "detail",
				label: "细节图",
				description: "材质、结构或工艺特写",
				count: 1,
				enabled: true,
				refRole: "detail"
			},
			{
				key: "spec",
				label: "规格图",
				description: "尺寸、容量或参数展示",
				count: 1,
				enabled: false,
				refRole: "product"
			},
			{
				key: "model",
				label: "使用图",
				description: "人物上手或穿戴效果",
				count: 1,
				enabled: false,
				refRole: "product"
			}
		];
		/** Legacy pixel sizes saved by older versions, mapped onto the current
		*  aspect-ratio vocabulary so restoring old history entries still works. */
		const LEGACY_SIZE_TO_RATIO = {
			"512x512": "1:1",
			"1024x1024": "1:1",
			"1536x1024": "3:2",
			"1024x1536": "2:3",
			"1792x1024": "16:9",
			"1024x1792": "9:16"
		};
		/** Normalize a saved size value into a current dropdown option. */
		function normalizeSize(value) {
			if (SIZES.includes(value)) return value;
			return LEGACY_SIZE_TO_RATIO[value] ?? "auto";
		}
		function clampPreviewScale(scale) {
			return Math.min(PREVIEW_SCALE_MAX, Math.max(PREVIEW_SCALE_MIN, scale));
		}
		/** Keep the image canvas preference across panel remounts without making it
		* part of the host settings document. */
		function readConfigCollapsed() {
			try {
				return window.localStorage.getItem(CONFIG_COLLAPSED_STORAGE_KEY) === "true";
			} catch {
				return false;
			}
		}
		const CHAT_COLLAPSED_STORAGE_KEY = "dsh-imagegen:chat-collapsed";
		const CONFIG_WIDTH_STORAGE_KEY = "dsh-imagegen:config-width";
		const CONFIG_WIDTH_MIN = 260;
		const CONFIG_WIDTH_MAX = 480;
		const CONFIG_WIDTH_DEFAULT = 300;
		/** The chat pane starts collapsed unless the user explicitly opened it. */
		function readChatOpen() {
			try {
				return window.localStorage.getItem(CHAT_COLLAPSED_STORAGE_KEY) === "open";
			} catch {
				return false;
			}
		}
		function readConfigWidth() {
			try {
				const raw = window.localStorage.getItem(CONFIG_WIDTH_STORAGE_KEY);
				if (raw === null) return CONFIG_WIDTH_DEFAULT;
				const value = Number(raw);
				if (Number.isFinite(value) && value > 0) return Math.min(CONFIG_WIDTH_MAX, Math.max(CONFIG_WIDTH_MIN, Math.round(value)));
			} catch {}
			return CONFIG_WIDTH_DEFAULT;
		}
		/** Read the current config from the settings scope snapshot. */
		function useConfig(scope) {
			const [value, setValue] = (0, react.useState)(scope.getSnapshot().value);
			(0, react.useEffect)(() => scope.subscribe(() => {
				setValue(scope.getSnapshot().value);
			}), [scope]);
			return value;
		}
		/** Track one redacted secret field without exposing its value to the panel. */
		function useSecretSet(scope, field) {
			const [isSet, setIsSet] = (0, react.useState)(scope.getSecretSetSnapshot(field));
			(0, react.useEffect)(() => scope.subscribeSecretSets(() => {
				setIsSet(scope.getSecretSetSnapshot(field));
			}), [field, scope]);
			return isSet;
		}
		/** Tick a seconds counter while `running`. */
		function useElapsed(running, startedAt) {
			const [elapsed, setElapsed] = (0, react.useState)(0);
			(0, react.useEffect)(() => {
				if (!running || startedAt === null) {
					setElapsed(0);
					return;
				}
				const update = () => {
					setElapsed(Math.max(1, Math.round((Date.now() - startedAt) / 1e3)));
				};
				update();
				const timer = window.setInterval(update, 1e3);
				return () => window.clearInterval(timer);
			}, [running, startedAt]);
			return elapsed;
		}
		/** Data URL for a generated image. */
		function srcOf(image) {
			return `data:${image.mime};base64,${image.b64}`;
		}
		/** Decode one durable conversation attachment into the panel's image shape. */
		async function attachmentToGenerated(ref) {
			const query = new URLSearchParams({
				attachment_id: String(ref.attachmentId),
				media_type: ref.mediaType,
				bytes: String(ref.bytes),
				width: String(ref.width),
				height: String(ref.height)
			});
			const response = await fetch(`${AGENT_IMAGE_API}?${query.toString()}`);
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const blob = await response.blob();
			const dataUrl = await new Promise((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
				reader.onerror = () => reject(/* @__PURE__ */ new Error("image read failed"));
				reader.readAsDataURL(blob);
			});
			const comma = dataUrl.indexOf(",");
			if (comma < 0) throw new Error("image decode failed");
			return {
				b64: dataUrl.slice(comma + 1),
				mime: ref.mediaType
			};
		}
		/** Convert a generated image into the browser-owned draft format. */
		function generatedImageToFile(image, index) {
			const binary = atob(image.b64);
			const bytes = new Uint8Array(binary.length);
			for (let offset = 0; offset < binary.length; offset += 1) bytes[offset] = binary.charCodeAt(offset);
			return new File([bytes], `dsh-image-${index + 1}.${extensionOf(image.mime)}`, { type: image.mime });
		}
		/** Decode a data URL into a browser File for the native composer. */
		function dataUrlToFile(dataUrl, name) {
			const match = /^data:(image\/(?:png|jpeg|webp|gif));base64,(.*)$/su.exec(dataUrl);
			if (match === null || match[1] === void 0 || match[2] === void 0) throw new Error("image processing returned an invalid data URL");
			const binary = atob(match[2]);
			const bytes = new Uint8Array(binary.length);
			for (let offset = 0; offset < binary.length; offset += 1) bytes[offset] = binary.charCodeAt(offset);
			return new File([bytes], name, { type: match[1] });
		}
		/** Read intrinsic dimensions without changing the original preview. */
		function imageDimensions(dataUrl) {
			return new Promise((resolve, reject) => {
				const image = new Image();
				image.onload = () => {
					const width = image.naturalWidth || image.width;
					const height = image.naturalHeight || image.height;
					if (width < 1 || height < 1) reject(/* @__PURE__ */ new Error("image dimensions are unavailable"));
					else resolve({
						width,
						height
					});
				};
				image.onerror = () => reject(/* @__PURE__ */ new Error("image decode failed"));
				image.src = dataUrl;
			});
		}
		/** Prepare the smaller conversation copy required by the host attachment policy. */
		async function prepareConversationImage(image, index) {
			const dataUrl = srcOf(image);
			const { width, height } = await imageDimensions(dataUrl);
			const longestSide = Math.max(width, height);
			if (longestSide <= CONVERSATION_IMAGE_MAX_DIMENSION) return {
				file: generatedImageToFile(image, index),
				dataUrl
			};
			const scale = CONVERSATION_IMAGE_MAX_DIMENSION / longestSide;
			const targetWidth = Math.max(1, Math.round(width * scale));
			const targetHeight = Math.max(1, Math.round(height * scale));
			const canvas = document.createElement("canvas");
			canvas.width = targetWidth;
			canvas.height = targetHeight;
			const context = canvas.getContext("2d");
			if (context === null) throw new Error("image resize is unavailable in this browser");
			const source = await new Promise((resolve, reject) => {
				const sourceImage = new Image();
				sourceImage.onload = () => resolve(sourceImage);
				sourceImage.onerror = () => reject(/* @__PURE__ */ new Error("image decode failed"));
				sourceImage.src = dataUrl;
			});
			context.drawImage(source, 0, 0, targetWidth, targetHeight);
			const resizedDataUrl = canvas.toDataURL("image/jpeg", CONVERSATION_IMAGE_JPEG_QUALITY);
			return {
				dataUrl: resizedDataUrl,
				file: dataUrlToFile(resizedDataUrl, `dsh-image-${index + 1}.jpg`)
			};
		}
		/** Follow the native session selection while the image panel stays mounted. */
		function useCurrentSessionId(sessions) {
			const [sessionId, setSessionId] = (0, react.useState)(() => sessions?.list.getSnapshot().current);
			(0, react.useEffect)(() => {
				if (sessions === void 0) {
					setSessionId(void 0);
					return;
				}
				const sync = () => {
					setSessionId(sessions.list.getSnapshot().current);
				};
				sync();
				return sessions.list.subscribe(sync);
			}, [sessions]);
			return sessionId;
		}
		/** Find the host mounted in the shell's left navigation region. */
		function useSidebarHistoryHost() {
			const [host, setHost] = (0, react.useState)(() => document.querySelector("[data-dsh-imagegen-history-host]"));
			(0, react.useEffect)(() => {
				const sync = () => {
					setHost(document.querySelector("[data-dsh-imagegen-history-host]"));
				};
				sync();
				const observer = new MutationObserver(sync);
				observer.observe(document.body, {
					childList: true,
					subtree: true
				});
				return () => observer.disconnect();
			}, []);
			return host;
		}
		/** Fetch persisted history image refs and decode them back to in-memory
		*  GeneratedImage[] (base64), so the canvas/preview can reuse the same
		*  rendering path as a fresh generation. */
		async function historyImagesToGenerated(refs) {
			return Promise.all(refs.map(async (ref) => {
				const response = await fetch(ref.url);
				if (!response.ok) throw new Error(`HTTP ${response.status}`);
				const blob = await response.blob();
				const dataUrl = await new Promise((resolve, reject) => {
					const reader = new FileReader();
					reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
					reader.onerror = () => reject(/* @__PURE__ */ new Error("image read failed"));
					reader.readAsDataURL(blob);
				});
				const comma = dataUrl.indexOf(",");
				return {
					b64: comma >= 0 ? dataUrl.slice(comma + 1) : "",
					mime: ref.mime,
					...ref.revisedPrompt === void 0 ? {} : { revisedPrompt: ref.revisedPrompt }
				};
			}));
		}
		/** Compact, locale-independent timestamp for history entries. */
		function formatTime(timestamp) {
			const d = new Date(timestamp);
			const pad = (n) => String(n).padStart(2, "0");
			return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
		}
		function defaultEcommerceDraft() {
			return {
				projectId: "",
				projectName: "",
				category: "通用商品",
				platform: "通用",
				language: "中文",
				customLanguage: "",
				size: "1:1",
				productName: "",
				sellingPoints: "",
				protectedFeatures: "",
				styleHint: "",
				slots: PRODUCT_SET_SLOTS.map((slot) => ({ ...slot }))
			};
		}
		/** Standard copy-language choices; custom keeps uncommon locales usable. */
		const ECOMMERCE_COPY_LANGUAGES = [
			["中文", "中文"],
			["English", "English"],
			["Русский", "Русский"],
			["日本語", "日本語"],
			["한국어", "한국어"],
			["Français", "Français"],
			["Deutsch", "Deutsch"],
			["Español", "Español"],
			["Português", "Português"],
			["custom", "自定义"]
		];
		function effectiveEcommerceLanguage(draft) {
			return draft.language === "custom" ? draft.customLanguage?.trim() ?? "" : draft.language;
		}
		function ecommercePrompt(draft, slot) {
			const points = draft.sellingPoints.trim() || "突出商品真实材质、结构和核心价值";
			const protectedFeatures = draft.protectedFeatures.trim() || "保持商品颜色、形状、Logo、包装文字和结构真实，不添加不存在的配件";
			const language = effectiveEcommerceLanguage(draft) || "中文";
			const refClause = slot.refRole !== void 0 && slot.refRole !== "none" ? `本图以上传的${ECOMMERCE_ROLE_PROMPT_LABELS[slot.refRole]}图片为参考，商品与风格必须与参考图保持一致；` : "";
			return `电商${slot.label}：为${draft.productName.trim() || "该商品"}制作${slot.description}。商品品类：${draft.category}；平台：${draft.platform}；语言：${language}。商品卖点：${points}。必须遵守：${protectedFeatures}。${refClause}整体要求：商品主体清晰、比例真实、光线自然、画面干净、适合电商发布；${draft.styleHint.trim()}`;
		}
		/** Consistency prefix for slots generated after the main image exists. */
		function withAnchorNote(prompt) {
			return "商品套图一致性约束：附件是本套商品的主图，图中商品（外形、颜色、材质、Logo、包装文字）必须与附件完全一致，不得重新发明商品。" + prompt;
		}
		function modelsOfHistoryEntry(entry) {
			return entry.comparisonModels?.length !== void 0 && entry.comparisonModels.length > 1 ? entry.comparisonModels : [entry.model];
		}
		/** Comparison runs collapse by comparisonId, product sets by projectId. */
		function historyGroupKey(entry) {
			if (entry.comparisonId !== void 0) return entry.comparisonId;
			if (entry.workflow === "ecommerce" && entry.projectId !== void 0) return `project:${entry.projectId}`;
			return entry.id;
		}
		/** Collapse the per-model history rows that belong to one comparison run. */
		function groupHistoryEntries(entries) {
			const groups = /* @__PURE__ */ new Map();
			for (const entry of entries) {
				const key = historyGroupKey(entry);
				const existing = groups.get(key);
				if (existing === void 0) groups.set(key, {
					key,
					entries: [entry],
					models: modelsOfHistoryEntry(entry)
				});
				else {
					existing.entries.push(entry);
					existing.models = [.../* @__PURE__ */ new Set([...existing.models, ...modelsOfHistoryEntry(entry)])];
				}
			}
			return [...groups.values()];
		}
		function newComparisonId() {
			const cryptoApi = globalThis.crypto;
			if (typeof cryptoApi?.randomUUID === "function") return cryptoApi.randomUUID();
			return `comparison-${Date.now()}-${Math.random().toString(36).slice(2)}`;
		}
		/** Render the studio. */
		function ImageGenPanel(props) {
			const { api, scope, sessions, conversation } = props;
			const config = useConfig(scope);
			useImageGenLanguageTick();
			const enabled = config?.enabled ?? true;
			const modelOptions = imageModelOptions(config);
			const imageModels = (config?.channels ?? []).length > 0 ? modelOptions.models : normalizeImageModels(config?.imageModels);
			const defaultChannelId = modelOptions.defaultChannelId;
			const configured = (defaultChannelId !== void 0 && (config?.channels ?? []).length > 0 ? config.channels.find((channel) => channel.id === defaultChannelId)?.apiUrl ?? "" : config?.apiUrl ?? "").trim() !== "";
			const legacyKeySet = useSecretSet(scope, "apiKey");
			const promptKeySet = useSecretSet(scope, "promptApiKey");
			const channelKeySet = (config?.channels ?? []).some((channel) => scope.getSecretSetSnapshot(`channelSecrets.${channel.id}`));
			const apiKeySet = (config?.channels ?? []).length > 0 ? channelKeySet : legacyKeySet;
			const connected = enabled && configured && apiKeySet;
			const [tab, setTab] = (0, react.useState)("text");
			const [workspace, setWorkspace] = (0, react.useState)("normal");
			const [canvasImportRequest, setCanvasImportRequest] = (0, react.useState)();
			/** Switch to a normal-generation tab, leaving any task workspace. */
			const openTab = (next) => {
				setWorkspace("normal");
				setTab(next);
			};
			const addEntryToCanvas = (source, entryId, imageIndex = 0) => {
				setCanvasImportRequest({
					source,
					entryId,
					imageIndex
				});
				setWorkspace("canvas");
			};
			const [prompt, setPrompt] = (0, react.useState)("");
			const [size, setSize] = (0, react.useState)("auto");
			const [quality, setQuality] = (0, react.useState)("auto");
			const [count, setCount] = (0, react.useState)(1);
			const [detail, setDetail] = (0, react.useState)("");
			const [model, setModel] = (0, react.useState)("");
			const [compareEnabled, setCompareEnabled] = (0, react.useState)(false);
			const [compareModels, setCompareModels] = (0, react.useState)([]);
			const [modelOpen, setModelOpen] = (0, react.useState)(false);
			const [refImage, setRefImage] = (0, react.useState)(null);
			const [images, setImages] = (0, react.useState)([]);
			const [addingToConversation, setAddingToConversation] = (0, react.useState)(null);
			const [galleryConversationAddingId, setGalleryConversationAddingId] = (0, react.useState)(null);
			const [historyConversationAddingId, setHistoryConversationAddingId] = (0, react.useState)(null);
			const [conversationMessage, setConversationMessage] = (0, react.useState)(null);
			const [error, setError] = (0, react.useState)(null);
			const [submitting, setSubmitting] = (0, react.useState)(false);
			const [enhancing, setEnhancing] = (0, react.useState)(false);
			const [configGuide, setConfigGuide] = (0, react.useState)(null);
			const [history, setHistory] = (0, react.useState)([]);
			const [viewingHistoryId, setViewingHistoryId] = (0, react.useState)(null);
			const [gallery, setGallery] = (0, react.useState)([]);
			const [galleryViewingId, setGalleryViewingId] = (0, react.useState)(null);
			const [galleryAdding, setGalleryAdding] = (0, react.useState)(false);
			const [galleryMessage, setGalleryMessage] = (0, react.useState)(null);
			const [galleryFilter, setGalleryFilter] = (0, react.useState)("all");
			const galleryUploadRef = (0, react.useRef)(null);
			const [galleryRatio, setGalleryRatio] = (0, react.useState)("all");
			const [galleryTagFilter, setGalleryTagFilter] = (0, react.useState)(null);
			const [galleryView, setGalleryView] = (0, react.useState)("masonry");
			const [gallerySort, setGallerySort] = (0, react.useState)("newest");
			const [galleryQuery, setGalleryQuery] = (0, react.useState)("");
			const [galleryTagInput, setGalleryTagInput] = (0, react.useState)("");
			const [editingGalleryTagsId, setEditingGalleryTagsId] = (0, react.useState)(null);
			const [galleryTagEditInput, setGalleryTagEditInput] = (0, react.useState)("");
			const [selectedGalleryIds, setSelectedGalleryIds] = (0, react.useState)(/* @__PURE__ */ new Set());
			const [gallerySelecting, setGallerySelecting] = (0, react.useState)(false);
			const [historyQuery, setHistoryQuery] = (0, react.useState)("");
			const [historyModelFilter, setHistoryModelFilter] = (0, react.useState)("all");
			const [historyRatioFilter, setHistoryRatioFilter] = (0, react.useState)("all");
			const [preview, setPreview] = (0, react.useState)(null);
			const [previewScale, setPreviewScale] = (0, react.useState)(1);
			const [promptCopied, setPromptCopied] = (0, react.useState)(false);
			const [update, setUpdate] = (0, react.useState)(null);
			const [updating, setUpdating] = (0, react.useState)(false);
			const [updateMessage, setUpdateMessage] = (0, react.useState)(null);
			const [updateResult, setUpdateResult] = (0, react.useState)(null);
			const [libraryOpen, setLibraryOpen] = (0, react.useState)(false);
			const [tasks, setTasks] = (0, react.useState)([]);
			const tasksRef = (0, react.useRef)([]);
			const [taskTrayOpen, setTaskTrayOpen] = (0, react.useState)(false);
			const [comparison, setComparison] = (0, react.useState)(null);
			const [comparisonFullscreen, setComparisonFullscreen] = (0, react.useState)(false);
			const [ecommerce, setEcommerce] = (0, react.useState)(() => {
				try {
					const saved = window.localStorage.getItem(ECOMMERCE_DRAFT_STORAGE_KEY);
					if (saved !== null) {
						const merged = {
							...defaultEcommerceDraft(),
							...JSON.parse(saved)
						};
						if (Array.isArray(merged.slots)) merged.slots = merged.slots.map((slot) => ({
							...slot,
							refRole: slot.refRole ?? "product"
						}));
						return merged;
					}
				} catch {}
				return defaultEcommerceDraft();
			});
			const [ecommercePreview, setEcommercePreview] = (0, react.useState)(false);
			const [ecommerceGenerating, setEcommerceGenerating] = (0, react.useState)(false);
			const [ecommerceProjectId, setEcommerceProjectId] = (0, react.useState)(null);
			const [ecommerceAssets, setEcommerceAssets] = (0, react.useState)([]);
			/** History-restored product set currently shown in the results canvas. */
			const [ecommerceRestored, setEcommerceRestored] = (0, react.useState)(null);
			/** Pending main-image anchor: the main image task is in flight; once it
			*  completes, the remaining slots are resubmitted with it as their shared
			*  reference so every image in the set shows the same product. */
			const [ecommerceAnchor, setEcommerceAnchor] = (0, react.useState)(null);
			const [ecommerceRefOpen, setEcommerceRefOpen] = (0, react.useState)(false);
			const [configCollapsed, setConfigCollapsed] = (0, react.useState)(readConfigCollapsed);
			const [chatOpen, setChatOpen] = (0, react.useState)(readChatOpen);
			const [configWidth, setConfigWidth] = (0, react.useState)(readConfigWidth);
			const configAsideRef = (0, react.useRef)(null);
			const currentSessionId = useCurrentSessionId(sessions);
			const sidebarHistoryHost = useSidebarHistoryHost();
			const modeModels = tab === "edit" ? imageModels.filter((candidate) => describeModel(candidate).supportsEdit) : imageModels;
			const fileInput = (0, react.useRef)(null);
			const previewStage = (0, react.useRef)(null);
			const activeTasks = tasks.filter((task) => task.status === "queued" || task.status === "running");
			const activeTask = activeTasks.find((task) => task.status === "running") ?? activeTasks[0];
			const generating = submitting || activeTasks.length > 0;
			const elapsed = useElapsed(generating, activeTask?.startedAt ?? activeTask?.createdAt ?? null);
			(0, react.useEffect)(() => {
				try {
					window.localStorage.setItem(ECOMMERCE_DRAFT_STORAGE_KEY, JSON.stringify(ecommerce));
				} catch {}
			}, [ecommerce]);
			(0, react.useEffect)(() => {
				try {
					window.localStorage.setItem(CONFIG_COLLAPSED_STORAGE_KEY, String(configCollapsed));
				} catch {}
			}, [configCollapsed]);
			(0, react.useEffect)(() => {
				if (chatOpen) delete document.documentElement.dataset.dshImagegenChatCollapsed;
				else document.documentElement.dataset.dshImagegenChatCollapsed = "1";
				try {
					window.localStorage.setItem(CHAT_COLLAPSED_STORAGE_KEY, chatOpen ? "open" : "collapsed");
				} catch {}
			}, [chatOpen]);
			(0, react.useEffect)(() => () => {
				delete document.documentElement.dataset.dshImagegenChatCollapsed;
			}, []);
			(0, react.useEffect)(() => {
				if (ecommerceAnchor === null) return;
				const anchor = ecommerceAnchor;
				const mains = tasks.filter((task) => anchor.mainTaskIds.includes(task.id));
				if (mains.length === 0) return;
				if (mains.every((task) => task.status === "failed" || task.status === "cancelled")) {
					setEcommerceAnchor(null);
					setError(tt("ecommerce.anchorFailed"));
					return;
				}
				const done = mains.find((task) => task.status === "completed" && task.result !== void 0 && task.result.images.length > 0);
				if (done === void 0) return;
				setEcommerceAnchor(null);
				const dataUrl = srcOf(done.result.images[0]);
				const requests = anchor.remaining.map((request) => ({
					...request,
					mode: "edit",
					image: dataUrl,
					refName: "set-main-anchor",
					prompt: withAnchorNote(request.prompt)
				}));
				Promise.all(requests.map((request) => api.taskSubmit(request))).then((submitted) => {
					setTasks((previous) => [...submitted, ...previous]);
				}).catch((caught) => {
					setError(errorMessage(caught));
				});
			}, [
				api,
				tasks,
				ecommerceAnchor
			]);
			(0, react.useEffect)(() => {
				setModel((previous) => modeModels.includes(previous) ? previous : modeModels[0] ?? "");
				setCompareModels((previous) => {
					const retained = previous.filter((candidate) => modeModels.includes(candidate));
					return retained.length > 0 ? retained : modeModels[0] === void 0 ? [] : [modeModels[0]];
				});
			}, [modeModels.join("\0")]);
			const filteredGallery = gallery.filter((entry) => {
				if (galleryFilter === "all") return true;
				if (galleryFilter === "text" || galleryFilter === "edit") return entry.mode === galleryFilter;
				return entry.model === galleryFilter;
			}).filter((entry) => galleryRatio === "all" || normalizeSize(entry.size) === galleryRatio).filter((entry) => galleryTagFilter === null || (entry.tags ?? []).includes(galleryTagFilter)).filter((entry) => galleryQuery.trim() === "" || `${entry.prompt} ${entry.model} ${(entry.tags ?? []).join(" ")}`.toLocaleLowerCase().includes(galleryQuery.trim().toLocaleLowerCase())).slice().sort((a, b) => gallerySort === "newest" ? b.createdAt - a.createdAt : a.createdAt - b.createdAt);
			const galleryTagOptions = [...new Set(gallery.flatMap((entry) => entry.tags ?? []))].sort((a, b) => a.localeCompare(b));
			const galleryModels = [.../* @__PURE__ */ new Set([...imageModels, ...gallery.map((entry) => entry.model)])];
			const filteredHistory = groupHistoryEntries(history).filter((group) => group.entries.some((entry) => {
				const query = historyQuery.trim().toLocaleLowerCase();
				const models = modelsOfHistoryEntry(entry);
				return (query === "" || `${entry.prompt} ${models.join(" ")}`.toLocaleLowerCase().includes(query)) && (historyModelFilter === "all" || models.includes(historyModelFilter)) && (historyRatioFilter === "all" || normalizeSize(entry.size) === historyRatioFilter);
			}));
			(0, react.useEffect)(() => {
				let disposed = false;
				api.historyList().then((entries) => {
					if (!disposed) setHistory(entries);
				}).catch(() => {});
				api.galleryList().then((entries) => {
					if (!disposed) setGallery(entries);
				}).catch(() => {});
				return () => {
					disposed = true;
				};
			}, [api]);
			(0, react.useEffect)(() => {
				const onChatImages = (event) => {
					const detail = event.detail;
					if (detail === void 0 || currentSessionId === void 0 || detail.sessionId !== currentSessionId) return;
					Promise.all(detail.refs.map(attachmentToGenerated)).then((next) => {
						openTab("text");
						setImages(next);
						setComparison(null);
						setViewingHistoryId(null);
						setGalleryViewingId(null);
						setError(null);
					}).catch((caught) => {
						setError(errorMessage(caught));
					});
				};
				document.addEventListener(CHAT_IMAGE_EVENT, onChatImages);
				return () => document.removeEventListener(CHAT_IMAGE_EVENT, onChatImages);
			}, [currentSessionId]);
			(0, react.useEffect)(() => {
				let disposed = false;
				const refresh = () => {
					api.taskList().then((next) => {
						if (disposed) return;
						const newlyCompleted = next.filter((task) => task.status === "completed" && task.result !== void 0 && !tasksRef.current.some((old) => old.id === task.id && old.status === "completed"));
						tasksRef.current = next;
						setTasks((previous) => {
							const completed = next.find((task) => task.status === "completed" && !previous.some((old) => old.id === task.id && old.status === "completed") && !comparison?.taskIds.includes(task.id));
							if (completed?.result !== void 0) {
								setImages(completed.result.images);
								if (completed.result.history !== void 0) setHistory(completed.result.history);
								setError(completed.result.historyError ?? null);
							}
							return next;
						});
						if (newlyCompleted.length > 0) api.historyList().then((entries) => {
							if (!disposed) setHistory(entries);
						}).catch(() => {});
					}).catch(() => {});
				};
				refresh();
				const timer = window.setInterval(refresh, 1500);
				return () => {
					disposed = true;
					window.clearInterval(timer);
				};
			}, [api, comparison]);
			const modelMenuRef = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				if (!modelOpen) return;
				const onPointer = (event) => {
					const target = event.target;
					if (target instanceof Node && modelMenuRef.current?.contains(target)) return;
					setModelOpen(false);
				};
				document.addEventListener("mousedown", onPointer);
				document.addEventListener("focusin", onPointer);
				return () => {
					document.removeEventListener("mousedown", onPointer);
					document.removeEventListener("focusin", onPointer);
				};
			}, [modelOpen]);
			(0, react.useEffect)(() => {
				let disposed = false;
				api.updateCheck().then((info) => {
					if (!disposed && info.updateAvailable) setUpdate(info);
				}).catch(() => {});
				return () => {
					disposed = true;
				};
			}, [api]);
			const applyUpdate = async () => {
				if (update === null || updating) return;
				setUpdating(true);
				setUpdateMessage(null);
				setUpdateResult(null);
				try {
					const result = await api.updateApply(update.latestVersion);
					setUpdateMessage(tt("update.success", { version: result.updatedVersion }));
					setUpdateResult("success");
				} catch {
					setUpdateMessage(tt("update.failed"));
					setUpdateResult("failed");
				} finally {
					setUpdating(false);
				}
			};
			const openSettingsGuide = (kind) => {
				setConfigGuide(kind);
				const openPluginSettings = () => {
					Array.from(document.querySelectorAll("button")).find((button) => /^(插件|Plugins)$/.test(button.textContent?.trim() ?? ""))?.click();
					window.setTimeout(() => {
						const imageGenButton = Array.from(document.querySelectorAll("button")).find((button) => /dsh-imagegen/i.test(button.textContent ?? ""));
						if (imageGenButton?.getAttribute("aria-expanded") !== "true") imageGenButton?.click();
					}, 0);
				};
				const settingsButton = Array.from(document.querySelectorAll("button")).find((button) => /^(设置|Settings)$/.test(button.textContent?.trim() ?? ""));
				if (settingsButton?.getAttribute("aria-expanded") !== "true") settingsButton?.click();
				window.setTimeout(openPluginSettings, 0);
			};
			const enhanceCurrentPrompt = async () => {
				if (prompt.trim() === "" || enhancing) return;
				const promptEndpointConfigured = (config?.promptApiUrl ?? "").trim() !== "" || configured;
				if ((config?.promptModel ?? "").trim() === "" || !promptEndpointConfigured || !promptKeySet && !apiKeySet) {
					openSettingsGuide("enhancement");
					return;
				}
				setEnhancing(true);
				setError(null);
				try {
					setPrompt(await api.enhancePrompt(prompt));
				} catch (caught) {
					setError(errorMessage(caught));
				} finally {
					setEnhancing(false);
				}
			};
			/** Read an uploaded reference image into a data URL. */
			const acceptFile = (file) => {
				if (file === void 0) return;
				if (!file.type.startsWith("image/")) {
					setError(tt("edit.uploadHint"));
					return;
				}
				if (file.size > REF_IMAGE_MAX_BYTES) {
					setError(tt("edit.uploadHint"));
					return;
				}
				const reader = new FileReader();
				reader.onload = () => {
					if (typeof reader.result === "string") setRefImage({
						dataUrl: reader.result,
						name: file.name
					});
				};
				reader.onerror = () => {
					setError(tt("edit.uploadHint"));
				};
				reader.readAsDataURL(file);
			};
			/** Read uploaded product assets into session-only data-URL chips, capped at
			*  MAX_ECOMMERCE_ASSETS. Each starts as the product-role reference. */
			const acceptEcommerceFiles = (files) => {
				if (files === void 0) return;
				const incoming = Array.from(files).filter((file) => file.type.startsWith("image/") && file.size <= REF_IMAGE_MAX_BYTES);
				if (incoming.length === 0) {
					setError(tt("edit.uploadHint"));
					return;
				}
				for (const file of incoming) {
					const reader = new FileReader();
					reader.onload = () => {
						if (typeof reader.result !== "string") return;
						const dataUrl = reader.result;
						setEcommerceAssets((previous) => {
							if (previous.length >= MAX_ECOMMERCE_ASSETS) {
								setError(tt("ecommerce.assetsFull"));
								return previous;
							}
							return [...previous, {
								id: newComparisonId(),
								dataUrl,
								name: file.name,
								role: "product"
							}];
						});
					};
					reader.onerror = () => {
						setError(tt("edit.uploadHint"));
					};
					reader.readAsDataURL(file);
				}
			};
			/** Run one generation. */
			const handleGenerate = async () => {
				if (submitting) return;
				if (!enabled) {
					openSettingsGuide("disabled");
					return;
				}
				if (!configured || !apiKeySet) {
					openSettingsGuide("generation");
					return;
				}
				const promptText = prompt.trim();
				if (promptText === "") {
					setError(tt("prompt.required"));
					return;
				}
				if (tab === "edit" && refImage === null) {
					setError(tt("edit.required"));
					return;
				}
				const request = {
					mode: tab === "edit" ? "edit" : "text",
					model: modeModels.includes(model) ? model : modeModels[0] ?? "",
					prompt: promptText,
					size,
					quality,
					n: count,
					detail,
					...defaultChannelId !== void 0 ? { channelId: defaultChannelId } : {},
					...tab === "edit" && refImage !== null ? { image: refImage.dataUrl } : {},
					...tab === "edit" && refImage !== null ? { refName: refImage.name } : {}
				};
				setError(null);
				setSubmitting(true);
				try {
					const targetModels = (compareEnabled ? compareModels : [request.model]).filter((candidate) => modeModels.includes(candidate));
					if (targetModels.length === 0) {
						setError(tt("compare.selectRequired"));
						return;
					}
					const comparisonId = targetModels.length > 1 ? newComparisonId() : void 0;
					const comparisonFields = comparisonId === void 0 ? {} : {
						comparisonId,
						comparisonModels: targetModels
					};
					const submitted = await Promise.all(targetModels.map((targetModel) => api.taskSubmit({
						...request,
						model: targetModel,
						...comparisonFields
					})));
					setTasks((previous) => [...submitted, ...previous.filter((item) => !submitted.some((task) => task.id === item.id))]);
					setComparison(comparisonId === void 0 ? null : {
						taskIds: submitted.map((task) => task.id),
						prompt: promptText,
						comparisonId
					});
				} catch (caught) {
					setError(errorMessage(caught));
				} finally {
					setSubmitting(false);
				}
			};
			const handleEcommerceGenerate = async () => {
				if (ecommerceGenerateDisabled) return;
				if (!enabled || !configured || !apiKeySet) {
					openSettingsGuide("generation");
					return;
				}
				const projectId = ecommerce.projectId || newComparisonId();
				const buildRequest = (slot, index) => {
					const refRole = slot.refRole ?? "product";
					const asset = refRole === "none" ? void 0 : ecommerceAssets.find((item) => item.role === refRole);
					return {
						mode: asset !== void 0 ? "edit" : "text",
						model: modeModels.includes(model) ? model : modeModels[0] ?? "",
						prompt: ecommercePrompt(ecommerce, slot),
						size: ecommerce.size,
						quality,
						n: 1,
						detail,
						...defaultChannelId !== void 0 ? { channelId: defaultChannelId } : {},
						...asset !== void 0 ? {
							image: asset.dataUrl,
							refName: asset.name
						} : {},
						workflow: "ecommerce",
						projectId,
						projectName: ecommerce.productName.trim(),
						slotKey: `${slot.key}-${index + 1}`,
						slotLabel: slot.label
					};
				};
				const mainSlots = ecommerceSlots.filter((slot) => slot.key === "main");
				const otherSlots = ecommerceSlots.filter((slot) => slot.key !== "main");
				const anchorChain = mainSlots.length > 0 && otherSlots.length > 0;
				const requests = (anchorChain ? mainSlots : ecommerceSlots).flatMap((slot) => Array.from({ length: slot.count }, (_, index) => buildRequest(slot, index)));
				const remaining = anchorChain ? otherSlots.flatMap((slot) => Array.from({ length: slot.count }, (_, index) => {
					const { image: _image, refName: _refName, ...rest } = buildRequest(slot, index);
					return rest;
				})) : [];
				setEcommerceGenerating(true);
				setSubmitting(true);
				setError(null);
				setEcommerceProjectId(projectId);
				setEcommerceRestored(null);
				setEcommerceAnchor(null);
				try {
					const submitted = await Promise.all(requests.map((request) => api.taskSubmit(request)));
					setTasks((previous) => [...submitted, ...previous]);
					setEcommercePreview(false);
					if (anchorChain) setEcommerceAnchor({
						projectId,
						mainTaskIds: submitted.map((task) => task.id),
						remaining
					});
				} catch (caught) {
					setError(errorMessage(caught));
				} finally {
					setSubmitting(false);
					setEcommerceGenerating(false);
				}
			};
			/** Start over with a fresh product draft (the old results stay in history). */
			const newEcommerceProduct = () => {
				setEcommerce(defaultEcommerceDraft());
				setEcommercePreview(false);
				setEcommerceProjectId(null);
				setEcommerceRestored(null);
				setEcommerceAnchor(null);
				setEcommerceAssets([]);
				setRefImage(null);
				setError(null);
			};
			/** Re-run every image of one slot with its original request. */
			const regenerateEcommerceSlot = async (label) => {
				if (ecommerceGenerating) return;
				const group = ecommerceMergedItems.filter((item) => item.label === label);
				if (group.length === 0) return;
				setEcommerceGenerating(true);
				setError(null);
				try {
					const submitted = await Promise.all(group.map((item) => api.taskSubmit({ ...item.source })));
					setTasks((previous) => [...submitted, ...previous]);
				} catch (caught) {
					setError(errorMessage(caught));
				} finally {
					setEcommerceGenerating(false);
				}
			};
			/** Open one persisted product set from history: rebuild the grouped results
			*  canvas from its entries. Reference images are not persisted, so restored
			*  edit-mode slots regenerate as text-to-image. */
			const viewEcommerceProject = async (group) => {
				const entry = group.entries[0];
				if (entry === void 0 || entry.projectId === void 0) return;
				try {
					const items = await Promise.all(group.entries.map(async (item) => ({
						id: item.id,
						label: item.slotLabel ?? "",
						slotKey: item.slotKey ?? "",
						status: "completed",
						model: item.model,
						prompt: item.prompt,
						images: await historyImagesToGenerated(item.images),
						source: {
							mode: item.mode === "edit" ? "text" : item.mode,
							model: item.model,
							prompt: item.prompt,
							size: item.size,
							quality: item.quality,
							detail: item.detail,
							n: 1,
							...item.channelId !== void 0 ? { channelId: item.channelId } : {},
							workflow: "ecommerce",
							projectId: entry.projectId,
							projectName: entry.projectName ?? "",
							slotKey: item.slotKey ?? "",
							slotLabel: item.slotLabel ?? ""
						}
					})));
					setWorkspace("ecommerce");
					setEcommerceRestored({
						projectId: entry.projectId,
						projectName: entry.projectName ?? "",
						items
					});
					setEcommerceProjectId(entry.projectId);
					setEcommercePreview(false);
					setError(null);
					setViewingHistoryId(entry.id);
					setGalleryViewingId(null);
				} catch (caught) {
					setError(errorMessage(caught));
				}
			};
			/** Download a JSON manifest describing the whole product set (prompts,
			*  slots and task outcomes) so results stay reproducible outside the panel. */
			const exportEcommerceManifest = () => {
				const manifest = {
					project: {
						id: ecommerceProjectId,
						name: ecommerce.projectName || ecommerce.productName,
						productName: ecommerce.productName,
						category: ecommerce.category,
						platform: ecommerce.platform,
						language: ecommerce.language,
						size: ecommerce.size,
						sellingPoints: ecommerce.sellingPoints,
						protectedFeatures: ecommerce.protectedFeatures,
						styleHint: ecommerce.styleHint
					},
					generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
					images: ecommerceMergedItems.map((item) => ({
						slotKey: item.slotKey,
						slotLabel: item.label,
						status: item.status,
						model: item.model,
						prompt: item.prompt,
						error: item.error
					}))
				};
				const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" });
				const url = URL.createObjectURL(blob);
				const anchor = document.createElement("a");
				anchor.href = url;
				anchor.download = `dsh-product-set-${(ecommerce.projectName || ecommerce.productName || "set").replace(/[^\w-]+/g, "-")}.json`;
				anchor.click();
				URL.revokeObjectURL(url);
			};
			const openPreview = (previewImages, index) => {
				setPreview({
					images: previewImages,
					index
				});
				setPreviewScale(1);
				setPromptCopied(false);
			};
			const closePreview = () => {
				setPreview(null);
				setPreviewScale(1);
				setPromptCopied(false);
			};
			/** Step the preview by ±1, wrapping around. */
			const stepPreview = (delta) => {
				setPreviewScale(1);
				setPromptCopied(false);
				setPreview((current) => {
					if (current === null) return null;
					const total = current.images.length;
					return {
						images: current.images,
						index: (current.index + delta + total) % total
					};
				});
			};
			(0, react.useEffect)(() => {
				if (preview === null) return;
				const onKey = (event) => {
					if (event.key === "Escape") closePreview();
					else if (event.key === "ArrowLeft") stepPreview(-1);
					else if (event.key === "ArrowRight") stepPreview(1);
					else if (event.key === "+" || event.key === "=") setPreviewScale((current) => clampPreviewScale(current + PREVIEW_SCALE_STEP));
					else if (event.key === "-") setPreviewScale((current) => clampPreviewScale(current - PREVIEW_SCALE_STEP));
					else if (event.key === "0") setPreviewScale(1);
				};
				window.addEventListener("keydown", onKey);
				return () => window.removeEventListener("keydown", onKey);
			}, [preview]);
			(0, react.useEffect)(() => {
				if (preview === null) return;
				const frame = window.requestAnimationFrame(() => {
					const stage = previewStage.current;
					if (stage === null) return;
					stage.scrollLeft = Math.max(0, (stage.scrollWidth - stage.clientWidth) / 2);
					stage.scrollTop = Math.max(0, (stage.scrollHeight - stage.clientHeight) / 2);
				});
				return () => window.cancelAnimationFrame(frame);
			}, [preview, previewScale]);
			const loadHistoryGroup = async (group) => {
				return (await Promise.all(group.entries.map((entry) => historyImagesToGenerated(entry.images)))).flat();
			};
			/** View every model result from one comparison as one canvas result set. */
			const viewHistoryGroup = async (group) => {
				const entry = group.entries[0];
				if (entry === void 0) return;
				if (entry.workflow === "ecommerce" && entry.projectId !== void 0) {
					await viewEcommerceProject(group);
					return;
				}
				openTab("text");
				try {
					setImages(await loadHistoryGroup(group));
					setComparison(null);
					setError(null);
					setViewingHistoryId(entry.id);
					setGalleryViewingId(null);
				} catch (caught) {
					setError(errorMessage(caught));
				}
			};
			/** Remove every persisted row belonging to one comparison group. */
			const deleteHistoryGroup = async (group) => {
				const ids = new Set(group.entries.map((entry) => entry.id));
				setHistory((previous) => previous.filter((entry) => !ids.has(entry.id)));
				if (viewingHistoryId !== null && ids.has(viewingHistoryId)) setViewingHistoryId(null);
				if (ecommerceRestored !== null && group.entries.some((entry) => entry.projectId === ecommerceRestored.projectId)) {
					setEcommerceRestored(null);
					setEcommerceProjectId(null);
					setEcommerceAnchor(null);
				}
				try {
					let next = history;
					for (const id of ids) next = await api.historyRemove(id);
					setHistory(next);
				} catch {}
			};
			/** Reset the workspace for a fresh image-generation run. */
			const startNewCreation = () => {
				openTab("text");
				setPrompt("");
				setRefImage(null);
				setImages([]);
				setPreview(null);
				setPreviewScale(1);
				setPromptCopied(false);
				setViewingHistoryId(null);
				setGalleryViewingId(null);
				setGallerySelecting(false);
				setSelectedGalleryIds(/* @__PURE__ */ new Set());
				setComparison(null);
				setComparisonFullscreen(false);
				setEcommerceRestored(null);
				setError(null);
				setConversationMessage(null);
				setGalleryMessage(null);
			};
			/** Remove all history entries. */
			const clearHistory = async () => {
				if (!window.confirm(tt("history.clearConfirm"))) return;
				setHistory([]);
				setViewingHistoryId(null);
				try {
					setHistory(await api.historyClear());
				} catch {}
			};
			/** Add one generated image to the gallery (host deduplicates by content).
			*  `entry` makes the action available from a history/gallery list item (its
			*  metadata + first image are saved); otherwise the current form state is
			*  used. */
			const addToGallery = async (image, entry) => {
				if (galleryAdding || workspace === "normal" && tab === "gallery") return;
				const source = entry ?? viewingEntry ?? {
					mode: tab === "edit" ? "edit" : "text",
					model,
					prompt: prompt.trim(),
					size,
					quality,
					detail,
					...refImage !== null ? { refName: refImage.name } : {}
				};
				setGalleryAdding(true);
				try {
					const result = await api.galleryAppend({
						id: "",
						createdAt: Date.now(),
						mode: source.mode,
						model: source.model,
						prompt: source.prompt,
						size: source.size,
						quality: source.quality,
						detail: source.detail,
						n: 1,
						images: [image],
						...source.refName === void 0 ? {} : { refName: source.refName }
					});
					setGallery(result.entries);
					setGalleryMessage(result.added ? tt("gallery.added") : tt("gallery.already"));
					window.setTimeout(() => {
						setGalleryMessage(null);
					}, 2200);
				} catch (caught) {
					setError(errorMessage(caught));
				} finally {
					setGalleryAdding(false);
				}
			};
			/** Save local image files into the asset library so the canvas and studio
			*  can reuse them later; entries dedupe by content host-side. */
			const uploadGalleryFiles = async (files) => {
				if (files.length === 0 || galleryAdding) return;
				setGalleryAdding(true);
				try {
					let entries;
					for (const file of files) {
						const dataUrl = await new Promise((resolve, reject) => {
							const reader = new FileReader();
							reader.onload = () => resolve(String(reader.result));
							reader.onerror = () => reject(new Error(tt("canvas.dropSub")));
							reader.readAsDataURL(file);
						});
						const separator = dataUrl.indexOf(",");
						entries = (await api.galleryAppend({
							id: "",
							createdAt: Date.now(),
							mode: "text",
							model: tt("gallery.uploadModel"),
							prompt: file.name.replace(/\.[a-z0-9]+$/i, ""),
							size: "auto",
							quality: "auto",
							detail: "",
							n: 1,
							images: [{
								b64: separator >= 0 ? dataUrl.slice(separator + 1) : dataUrl,
								mime: file.type || "image/png"
							}]
						})).entries;
					}
					if (entries !== void 0) {
						setGallery(entries);
						setGalleryMessage(tt("gallery.uploaded"));
						window.setTimeout(() => {
							setGalleryMessage(null);
						}, 2200);
					}
				} catch (caught) {
					setError(errorMessage(caught));
				} finally {
					setGalleryAdding(false);
				}
			};
			/** Put a generated image into the native conversation composer. */
			const addImageToConversation = async (image, index, actionKey = index) => {
				if (addingToConversation !== null) return;
				if (conversation === void 0 || sessions === void 0 || currentSessionId === void 0) {
					setError(tt("conversation.noSession"));
					return;
				}
				const sessionScope = sessions.scope(currentSessionId);
				if (sessionScope === void 0) {
					setError(tt("conversation.unavailable"));
					return;
				}
				setAddingToConversation(actionKey);
				let attachments = [];
				let added = false;
				try {
					const prepared = await prepareConversationImage(image, index);
					const file = prepared.file;
					attachments = conversation.createDraftImages([file]);
					const input = conversation.input.for(sessionScope);
					if (!input.addImages(attachments.map((attachment) => attachment.id))) throw new Error(tt("conversation.busy"));
					added = true;
					try {
						await api.attachConversationImage(String(currentSessionId), prepared.dataUrl, file.name);
					} catch (caught) {
						for (const attachment of attachments) input.removeImage(attachment.id);
						added = false;
						throw caught;
					}
					if (input.state.getSnapshot().draft.trim() === "" && prompt.trim() !== "") input.setDraft(prompt.trim());
					setConversationMessage(tt("conversation.added"));
					window.setTimeout(() => {
						setConversationMessage(null);
					}, 2200);
				} catch (caught) {
					if (!added) conversation.releaseDraftImages(attachments);
					setError(errorMessage(caught));
				} finally {
					setAddingToConversation(null);
				}
			};
			/** Add one history entry's first image to the gallery (fetches it from the
			*  history image route, then delegates to addToGallery). */
			const addHistoryEntryToGallery = async (entry) => {
				if (galleryAdding || entry.images.length === 0) return;
				try {
					const [image] = await historyImagesToGenerated(entry.images.slice(0, 1));
					if (image === void 0) return;
					await addToGallery(image, entry);
				} catch (caught) {
					setError(errorMessage(caught));
				}
			};
			/** Add one history entry's first image to the current chat draft. */
			const addHistoryEntryToConversation = async (entry) => {
				if (historyConversationAddingId !== null || addingToConversation !== null || galleryConversationAddingId !== null || entry.images.length === 0) return;
				setHistoryConversationAddingId(entry.id);
				try {
					const [image] = await historyImagesToGenerated(entry.images.slice(0, 1));
					if (image === void 0) return;
					await addImageToConversation(image, 0, `history:${entry.id}`);
				} catch (caught) {
					setError(errorMessage(caught));
				} finally {
					setHistoryConversationAddingId(null);
				}
			};
			/** Load a persisted gallery image and add it to the current chat draft. */
			const addGalleryEntryToConversation = async (entry) => {
				if (galleryConversationAddingId !== null || addingToConversation !== null || entry.images.length === 0) return;
				setGalleryConversationAddingId(entry.id);
				try {
					const [image] = await historyImagesToGenerated(entry.images.slice(0, 1));
					if (image === void 0) return;
					await addImageToConversation(image, 0, `gallery:${entry.id}`);
				} catch (caught) {
					setError(errorMessage(caught));
				} finally {
					setGalleryConversationAddingId(null);
				}
			};
			/** View a gallery image in the canvas. */
			const viewGalleryEntry = async (entry) => {
				try {
					const restored = await historyImagesToGenerated(entry.images);
					setImages(restored);
					setError(null);
					setViewingHistoryId(null);
					setGalleryViewingId(entry.id);
					if (restored.length > 0) openPreview(restored, 0);
				} catch (caught) {
					setError(errorMessage(caught));
				}
			};
			/** Remove one gallery entry. */
			const deleteGalleryEntry = async (id) => {
				setGallery(gallery.filter((entry) => entry.id !== id));
				if (galleryViewingId === id) setGalleryViewingId(null);
				try {
					setGallery(await api.galleryRemove(id));
				} catch {}
			};
			/** Remove every gallery entry. */
			const clearGalleryAll = async () => {
				if (!window.confirm(tt("gallery.clearConfirm"))) return;
				setGallery([]);
				setGalleryViewingId(null);
				try {
					setGallery(await api.galleryClear());
				} catch {}
			};
			const applyGalleryTags = async () => {
				const tags = galleryTagInput.split(",").map((tag) => tag.trim()).filter(Boolean);
				if (tags.length === 0 || selectedGalleryIds.size === 0) return;
				try {
					let next = gallery;
					for (const id of selectedGalleryIds) {
						const existing = next.find((entry) => entry.id === id)?.tags ?? [];
						next = await api.gallerySetTags(id, [...existing, ...tags]);
					}
					setGallery(next);
					setGalleryTagInput("");
				} catch (caught) {
					setError(errorMessage(caught));
				}
			};
			const startEditingGalleryTags = (entry) => {
				setEditingGalleryTagsId(entry.id);
				setGalleryTagEditInput((entry.tags ?? []).join(", "));
			};
			const saveGalleryTags = async (id) => {
				const tags = galleryTagEditInput.split(",").map((tag) => tag.trim()).filter(Boolean);
				try {
					setGallery(await api.gallerySetTags(id, tags));
					setEditingGalleryTagsId(null);
					setGalleryTagEditInput("");
				} catch (caught) {
					setError(errorMessage(caught));
				}
			};
			const toggleGallerySelection = (id) => {
				setSelectedGalleryIds((previous) => {
					const next = new Set(previous);
					if (next.has(id)) next.delete(id);
					else next.add(id);
					return next;
				});
			};
			const clearGallerySelection = () => {
				setSelectedGalleryIds(/* @__PURE__ */ new Set());
				setGallerySelecting(false);
			};
			const exportGalleryJson = () => {
				const entries = gallery.filter((entry) => selectedGalleryIds.has(entry.id));
				const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" });
				const url = URL.createObjectURL(blob);
				const anchor = document.createElement("a");
				anchor.href = url;
				anchor.download = `dsh-imagegen-gallery-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`;
				anchor.click();
				URL.revokeObjectURL(url);
			};
			const downloadGalleryImages = () => {
				gallery.filter((entry) => selectedGalleryIds.has(entry.id)).forEach((entry, index) => {
					const image = entry.images[0];
					if (image === void 0) return;
					const anchor = document.createElement("a");
					anchor.href = image.url;
					anchor.download = `dsh-gallery-${index + 1}.${extensionOf(image.mime)}`;
					anchor.click();
				});
			};
			const generateDisabled = submitting || modeModels.length === 0;
			const ecommerceSlots = ecommerce.slots.filter((slot) => slot.enabled && slot.count > 0);
			const ecommerceTotal = ecommerceSlots.reduce((total, slot) => total + slot.count, 0);
			const ecommerceGenerateDisabled = submitting || ecommerceGenerating || ecommerceSlots.length === 0 || ecommerce.productName.trim() === "" || ecommerce.language === "custom" && effectiveEcommerceLanguage(ecommerce) === "";
			const ecommerceFileInput = (0, react.useRef)(null);
			const ecommerceProjectTasks = ecommerceProjectId === null ? [] : tasks.filter((task) => task.request.workflow === "ecommerce" && task.request.projectId === ecommerceProjectId);
			const liveSlotKeys = new Set(ecommerceProjectTasks.map((task) => task.request.slotKey ?? task.id));
			const ecommerceMergedItems = [...ecommerceProjectTasks.map((task) => ({
				id: task.id,
				label: task.request.slotLabel ?? "",
				slotKey: task.request.slotKey ?? "",
				status: task.status,
				model: task.request.model,
				prompt: task.request.prompt,
				...task.error !== void 0 ? { error: task.error } : {},
				images: task.result?.images ?? [],
				source: task.request
			})), ...ecommerceRestored !== null && ecommerceRestored.projectId === ecommerceProjectId ? ecommerceRestored.items.filter((item) => !liveSlotKeys.has(item.slotKey)) : []];
			const ecommerceDoneCount = ecommerceMergedItems.filter((item) => item.status === "completed").length;
			const ecommerceFailedCount = ecommerceMergedItems.filter((item) => item.status === "failed" || item.status === "cancelled").length;
			const ecommerceResultGroups = [...new Set(ecommerceMergedItems.map((item) => item.label))].filter((label) => label !== "").map((label) => ({
				label,
				items: ecommerceMergedItems.filter((item) => item.label === label)
			}));
			const conversationBusy = addingToConversation !== null || galleryConversationAddingId !== null || historyConversationAddingId !== null;
			const viewingEntry = viewingHistoryId === null ? null : history.find((entry) => entry.id === viewingHistoryId) ?? null;
			const viewingGalleryEntry = galleryViewingId === null ? null : gallery.find((entry) => entry.id === galleryViewingId) ?? null;
			const previewImage = preview === null ? null : preview.images[preview.index] ?? null;
			const comparisonTasks = comparison === null ? [] : comparison.taskIds.map((id) => tasks.find((task) => task.id === id)).filter((task) => task !== void 0);
			const comparisonResults = comparisonTasks.filter((task) => task.status === "completed" && task.result !== void 0);
			const previewFrameScale = Math.max(1, previewScale);
			const previewImageScale = previewScale / previewFrameScale;
			/** Drag the config panel's right edge to resize it (persisted per browser). */
			const onConfigResizeStart = (event) => {
				if (event.button !== 0) return;
				event.preventDefault();
				const aside = configAsideRef.current;
				if (aside === null) return;
				const left = aside.getBoundingClientRect().left;
				const onMove = (move) => {
					const width = Math.round(Math.min(CONFIG_WIDTH_MAX, Math.max(CONFIG_WIDTH_MIN, move.clientX - left)));
					setConfigWidth(width);
					try {
						window.localStorage.setItem(CONFIG_WIDTH_STORAGE_KEY, String(width));
					} catch {}
				};
				const onUp = () => {
					window.removeEventListener("pointermove", onMove);
					document.documentElement.style.removeProperty("cursor");
					document.documentElement.style.removeProperty("user-select");
				};
				window.addEventListener("pointermove", onMove);
				window.addEventListener("pointerup", onUp, { once: true });
				document.documentElement.style.setProperty("cursor", "col-resize");
				document.documentElement.style.setProperty("user-select", "none");
			};
			const copyPreviewPrompt = async (text) => {
				try {
					if (navigator.clipboard?.writeText !== void 0) await navigator.clipboard.writeText(text);
					else {
						const textarea = document.createElement("textarea");
						textarea.value = text;
						textarea.style.position = "fixed";
						textarea.style.opacity = "0";
						document.body.appendChild(textarea);
						textarea.select();
						const copied = document.execCommand("copy");
						textarea.remove();
						if (!copied) throw new Error("copy failed");
					}
					setPromptCopied(true);
					window.setTimeout(() => {
						setPromptCopied(false);
					}, 1800);
				} catch {
					setPromptCopied(false);
				}
			};
			const addPreviewToEdit = () => {
				if (previewImage === null || preview === null) return;
				openTab("edit");
				setRefImage({
					dataUrl: srcOf(previewImage),
					name: `dsh-image-${preview.index + 1}.${extensionOf(previewImage.mime)}`
				});
				if (prompt.trim() === "" && previewImage.revisedPrompt !== void 0) setPrompt(previewImage.revisedPrompt);
				setError(null);
				closePreview();
			};
			const historyPanel = /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("aside", {
				className: panel_module_css_default.history,
				"data-dsh-imagegen-history": true,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
						className: panel_module_css_default.historyHeader,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: panel_module_css_default.historyTitle,
							children: tt("history.title")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: panel_module_css_default.historyHeaderActions,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: panel_module_css_default.historyNew,
									"data-history-new": "",
									"aria-label": tt("canvas.new"),
									title: tt("canvas.newHint"),
									onClick: startNewCreation,
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
										viewBox: "0 0 16 16",
										width: "15",
										height: "15",
										fill: "none",
										stroke: "currentColor",
										strokeWidth: "1.7",
										strokeLinecap: "round",
										"aria-hidden": "true",
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M8 3v10M3 8h10" })
									})
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: panel_module_css_default.historyNew,
									"data-history-open-folder": "",
									"aria-label": tt("gallery.openFolder"),
									title: tt("gallery.openFolderHint"),
									onClick: () => {
										api.openDataFolder();
									},
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
										viewBox: "0 0 16 16",
										width: "15",
										height: "15",
										fill: "none",
										stroke: "currentColor",
										strokeWidth: "1.5",
										strokeLinecap: "round",
										strokeLinejoin: "round",
										"aria-hidden": "true",
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M1.5 4.2A1.2 1.2 0 0 1 2.7 3h2.9l1.6 1.9h6.1A1.2 1.2 0 0 1 14.5 6.1v6.2a1.2 1.2 0 0 1-1.2 1.2H2.7a1.2 1.2 0 0 1-1.2-1.2z" })
									})
								}),
								history.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: panel_module_css_default.historyClear,
									"data-history-clear": "",
									onClick: () => {
										clearHistory();
									},
									children: tt("history.clear")
								}) : null
							]
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: panel_module_css_default.historyFilters,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								className: panel_module_css_default.historySearch,
								value: historyQuery,
								onChange: (event) => {
									setHistoryQuery(event.target.value);
								},
								placeholder: tt("history.search"),
								"aria-label": tt("history.search")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
								value: historyModelFilter,
								onChange: (event) => {
									setHistoryModelFilter(event.target.value);
								},
								"aria-label": tt("history.model"),
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
									value: "all",
									children: tt("history.allModels")
								}), [...new Set(history.flatMap((entry) => modelsOfHistoryEntry(entry)))].map((option) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
									value: option,
									children: option
								}, option))]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
								value: historyRatioFilter,
								onChange: (event) => {
									setHistoryRatioFilter(event.target.value);
								},
								"aria-label": tt("history.ratio"),
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
									value: "all",
									children: tt("history.allRatios")
								}), [...new Set(history.map((entry) => normalizeSize(entry.size)))].map((option) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
									value: option,
									children: option
								}, option))]
							})
						]
					}),
					filteredHistory.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: panel_module_css_default.historyEmpty,
						children: tt("history.empty")
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: panel_module_css_default.historyList,
						children: filteredHistory.map((group) => {
							const entry = group.entries[0];
							const isComparison = group.models.length > 1;
							const imageCount = group.entries.reduce((total, item) => total + item.images.length, 0);
							return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: panel_module_css_default.historyItem,
								"data-active": group.entries.some((item) => item.id === viewingHistoryId) ? "" : void 0,
								"data-comparison": isComparison ? "" : void 0,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
									type: "button",
									className: panel_module_css_default.historyMain,
									"data-dsh-imagegen-history-main": "",
									onClick: () => {
										viewHistoryGroup(group);
									},
									children: [entry.images.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
										className: panel_module_css_default.historyThumb,
										src: entry.images[0].url,
										alt: ""
									}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: panel_module_css_default.historyThumbPlaceholder }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: panel_module_css_default.historyInfo,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: panel_module_css_default.historyPrompt,
											children: entry.prompt
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											className: panel_module_css_default.historyMeta,
											children: [
												isComparison ? tt("compare.title") : entry.workflow === "ecommerce" ? `${tt("ecommerce.short")}${entry.projectName !== void 0 && entry.projectName !== "" ? ` · ${entry.projectName}` : ""}` : tt(`mode.${entry.mode === "edit" ? "edit" : "text"}`),
												" · ",
												isComparison ? group.models.join(" · ") : entry.model,
												" · ",
												formatTime(entry.createdAt),
												" · ",
												imageCount,
												" ",
												tt("history.images")
											]
										})]
									})]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: panel_module_css_default.historyActions,
									children: [
										entry.images.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: panel_module_css_default.historyIconAction,
											disabled: conversationBusy,
											title: `${tt("conversation.add")}：${tt("conversation.addHint")}`,
											"aria-label": tt("conversation.add"),
											"data-history-add-conversation": "",
											onClick: () => {
												addHistoryEntryToConversation(entry);
											},
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
												viewBox: "0 0 16 16",
												width: "14",
												height: "14",
												fill: "none",
												stroke: "currentColor",
												strokeWidth: "1.4",
												strokeLinecap: "round",
												strokeLinejoin: "round",
												"aria-hidden": "true",
												children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M4 2.5h8A1.5 1.5 0 0 1 13.5 4v5a1.5 1.5 0 0 1-1.5 1.5H8.5L5.5 13v-2.5H4A1.5 1.5 0 0 1 2.5 9V4A1.5 1.5 0 0 1 4 2.5z" })
											})
										}) : null,
										entry.images.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: panel_module_css_default.historyIconAction,
											disabled: galleryAdding,
											title: tt("gallery.add"),
											"aria-label": tt("gallery.add"),
											"data-history-add-gallery": "",
											onClick: () => {
												addHistoryEntryToGallery(entry);
											},
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
												viewBox: "0 0 16 16",
												width: "14",
												height: "14",
												fill: "none",
												stroke: "currentColor",
												strokeWidth: "1.4",
												strokeLinecap: "round",
												strokeLinejoin: "round",
												"aria-hidden": "true",
												children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
														x: "2.5",
														y: "3",
														width: "11",
														height: "10",
														rx: "1.5"
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
														cx: "5.9",
														cy: "6.1",
														r: "1"
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M13.5 10.2l-3.1-3.1L4.6 13" })
												]
											})
										}) : null,
										entry.images.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: panel_module_css_default.historyIconAction,
											title: tt("canvas.addToCanvas"),
											"aria-label": tt("canvas.addToCanvas"),
											"data-history-add-canvas": "",
											onClick: () => {
												addEntryToCanvas("history", entry.id, 0);
											},
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
												viewBox: "0 0 16 16",
												width: "14",
												height: "14",
												fill: "none",
												stroke: "currentColor",
												strokeWidth: "1.4",
												strokeLinecap: "round",
												strokeLinejoin: "round",
												"aria-hidden": "true",
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
													x: "2.5",
													y: "2.5",
													width: "11",
													height: "11",
													rx: "1.5"
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M5 8h6M8 5v6" })]
											})
										}) : null,
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: panel_module_css_default.historyIconAction,
											"data-danger": true,
											title: tt("history.delete"),
											"aria-label": tt("history.delete"),
											onClick: () => {
												deleteHistoryGroup(group);
											},
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
												viewBox: "0 0 16 16",
												width: "14",
												height: "14",
												fill: "none",
												stroke: "currentColor",
												strokeWidth: "1.4",
												strokeLinecap: "round",
												strokeLinejoin: "round",
												"aria-hidden": "true",
												children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M2.5 4.5h11" }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M6 4.5V3.2a.7.7 0 0 1 .7-.7h2.6a.7.7 0 0 1 .7.7v1.3" }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M4.3 4.5l.6 8.1a1 1 0 0 0 1 .9h4.2a1 1 0 0 0 1-.9l.6-8.1" }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M6.7 7v4M9.3 7v4" })
												]
											})
										})
									]
								})]
							}, group.key);
						})
					})
				]
			});
			const isGallery = workspace === "normal" && tab === "gallery";
			const isGeneration = workspace === "normal" && tab !== "gallery";
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: panel_module_css_default.panel,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
						className: panel_module_css_default.panelHeader,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: panel_module_css_default.panelHeading,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
									className: panel_module_css_default.panelTitle,
									children: tt("panel.title")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
									className: panel_module_css_default.githubLink,
									href: "https://github.com/dickpy/dsh-imagegen",
									target: "_blank",
									rel: "noreferrer",
									title: tt("panel.githubTip"),
									"aria-label": tt("panel.githubTip"),
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
										viewBox: "0 0 16 16",
										width: "15",
										height: "15",
										fill: "currentColor",
										"aria-hidden": "true",
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" })
									})
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("nav", {
								className: panel_module_css_default.topNav,
								role: "tablist",
								"aria-label": tt("workspace.label"),
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: panel_module_css_default.topNavItem,
										"data-active": workspace === "normal" && tab !== "gallery" ? "" : void 0,
										onClick: () => {
											if (workspace !== "normal" || tab === "gallery") openTab("text");
										},
										children: tt("workspace.normal")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: panel_module_css_default.topNavItem,
										"data-active": workspace === "normal" && tab === "gallery" ? "" : void 0,
										onClick: () => {
											openTab("gallery");
										},
										children: tt("gallery.title")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: panel_module_css_default.topNavDivider,
										"aria-hidden": "true"
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: panel_module_css_default.topNavItem,
										"data-active": workspace === "canvas" ? "" : void 0,
										onClick: () => {
											setWorkspace("canvas");
										},
										children: tt("workspace.canvas")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: panel_module_css_default.topNavItem,
										"data-active": workspace === "ecommerce" ? "" : void 0,
										onClick: () => {
											setWorkspace("ecommerce");
										},
										children: [tt("workspace.ecommerce"), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: panel_module_css_default.previewBadge,
											children: tt("ecommerce.badge")
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: panel_module_css_default.panelHeaderActions,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
									type: "button",
									className: panel_module_css_default.chatToggle,
									"data-open": chatOpen ? "true" : "false",
									"aria-pressed": chatOpen,
									title: chatOpen ? tt("chat.collapse") : tt("chat.expand"),
									onClick: () => {
										setChatOpen((open) => !open);
									},
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
										viewBox: "0 0 16 16",
										width: "13",
										height: "13",
										fill: "none",
										stroke: "currentColor",
										strokeWidth: "1.4",
										strokeLinecap: "round",
										strokeLinejoin: "round",
										"aria-hidden": "true",
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M2.5 3.5h11v7.5H6.8L3.8 13.6v-2.6H2.5z" })
									}), tt("chat.toggle")]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
									type: "button",
									className: panel_module_css_default.connectionStatus,
									"data-connected": connected ? "true" : "false",
									"aria-label": tt(connected ? "connection.connected" : "connection.disconnected"),
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: panel_module_css_default.connectionDot,
										"aria-hidden": "true"
									}), tt(connected ? "connection.connected" : "connection.disconnected")]
								})]
							})
						]
					}),
					update !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: panel_module_css_default.updateBanner,
						"data-kind": updateResult === "success" ? "ok" : "warn",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: panel_module_css_default.updateText,
							children: updateMessage ?? tt("update.available", { version: update.latestVersion })
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: panel_module_css_default.updateActions,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
								className: panel_module_css_default.updateRelease,
								href: update.releaseUrl,
								target: "_blank",
								rel: "noreferrer",
								children: tt("update.release")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "primary",
								size: "sm",
								disabled: updating || updateMessage !== null,
								onClick: () => {
									applyUpdate();
								},
								children: updating ? tt("update.installing") : tt("update.install")
							})]
						})]
					}) : null,
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: panel_module_css_default.studio,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: panel_module_css_default.generation,
							"data-workspace": workspace,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("aside", {
									ref: configAsideRef,
									className: panel_module_css_default.config,
									style: { "--dsh-imagegen-config-width": `${configWidth}px` },
									"data-collapsed": configCollapsed ? "true" : "false",
									"data-gallery": workspace === "normal" && tab === "gallery" ? "true" : void 0,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											className: panel_module_css_default.configResizer,
											title: tt("config.resizeHint"),
											onPointerDown: onConfigResizeStart
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											className: panel_module_css_default.configHeader,
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: panel_module_css_default.configToggle,
												"aria-expanded": !configCollapsed,
												"aria-label": tt(configCollapsed ? "panel.expandConfig" : "panel.collapseConfig"),
												title: tt(configCollapsed ? "panel.expandConfig" : "panel.collapseConfig"),
												onClick: () => {
													setConfigCollapsed((previous) => !previous);
												},
												children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
													viewBox: "0 0 16 16",
													width: "16",
													height: "16",
													fill: "none",
													stroke: "currentColor",
													strokeWidth: "1.6",
													strokeLinecap: "round",
													strokeLinejoin: "round",
													"aria-hidden": "true",
													children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: configCollapsed ? "M6 3l5 5-5 5" : "M10 3L5 8l5 5" })
												})
											})
										}),
										isGallery ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: panel_module_css_default.galleryFilters,
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													className: panel_module_css_default.galleryFilterHeading,
													children: tt("gallery.categories")
												}),
												[
													["all", tt("gallery.all")],
													["text", tt("mode.text")],
													["edit", tt("mode.edit")],
													...galleryModels.map((value) => [value, value])
												].map(([value, label]) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
													type: "button",
													className: panel_module_css_default.galleryFilter,
													"data-active": galleryFilter === value ? "" : void 0,
													onClick: () => {
														setGalleryFilter(value);
													},
													children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: label }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: panel_module_css_default.galleryFilterCount,
														children: gallery.filter((entry) => value === "all" || value === "text" || value === "edit" ? value === "all" ? true : entry.mode === value : entry.model === value).length
													})]
												}, value)),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: panel_module_css_default.galleryFilterDivider }),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													className: panel_module_css_default.galleryFilterHeading,
													children: tt("gallery.ratio")
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													className: panel_module_css_default.galleryRatioList,
													children: [
														"all",
														"1:1",
														"3:4",
														"4:3",
														"16:9"
													].map((ratio) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
														type: "button",
														className: panel_module_css_default.galleryRatio,
														"data-active": galleryRatio === ratio ? "" : void 0,
														onClick: () => {
															setGalleryRatio(ratio);
														},
														children: ratio === "all" ? tt("gallery.all") : ratio
													}, ratio))
												}),
												galleryTagOptions.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: panel_module_css_default.galleryFilterDivider }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
														className: panel_module_css_default.galleryFilterHeading,
														children: tt("gallery.tags")
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
														className: panel_module_css_default.galleryTagFilterList,
														children: galleryTagOptions.map((tag) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
															type: "button",
															className: panel_module_css_default.galleryTagFilter,
															"data-active": galleryTagFilter === tag ? "" : void 0,
															onClick: () => {
																setGalleryTagFilter((previous) => previous === tag ? null : tag);
															},
															children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: tag }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: gallery.filter((entry) => (entry.tags ?? []).includes(tag)).length })]
														}, tag))
													})
												] }) : null,
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													className: panel_module_css_default.galleryFilterNote,
													children: tt("gallery.filterHint")
												})
											]
										}) : null,
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: panel_module_css_default.configScroll,
											children: [
												workspace === "normal" && tab !== "gallery" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("section", {
													className: panel_module_css_default.card,
													children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
														className: panel_module_css_default.modeRow,
														role: "tablist",
														"aria-label": tt("panel.title"),
														children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
															active: tab === "text",
															onClick: () => {
																setTab("text");
															},
															className: panel_module_css_default.modePill,
															children: tt("mode.text")
														}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
															active: tab === "edit",
															onClick: () => {
																setTab("edit");
															},
															className: panel_module_css_default.modePill,
															children: tt("mode.edit")
														})]
													})
												}) : null,
												workspace === "ecommerce" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
													className: panel_module_css_default.ecommerceWorkspace,
													"data-ecommerce-workspace": "",
													children: [
														/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
															className: panel_module_css_default.ecommerceSection,
															children: [
																/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: tt("ecommerce.product") }),
																/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
																	className: panel_module_css_default.ecommerceField,
																	children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																		className: panel_module_css_default.ecommerceFieldLabel,
																		children: tt("ecommerce.productName")
																	}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
																		value: ecommerce.productName,
																		placeholder: tt("ecommerce.productName"),
																		onChange: (event) => setEcommerce((previous) => ({
																			...previous,
																			productName: event.target.value
																		}))
																	})]
																}),
																ecommerceAssets.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
																	type: "button",
																	className: panel_module_css_default.ecommerceUploadHero,
																	"data-ecommerce-upload": "",
																	onClick: () => {
																		ecommerceFileInput.current?.click();
																	},
																	onDragOver: (event) => {
																		event.preventDefault();
																	},
																	onDrop: (event) => {
																		event.preventDefault();
																		acceptEcommerceFiles(event.dataTransfer.files ?? void 0);
																	},
																	children: [
																		/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
																			viewBox: "0 0 16 16",
																			width: "15",
																			height: "15",
																			fill: "none",
																			stroke: "currentColor",
																			strokeWidth: "1.3",
																			strokeLinecap: "round",
																			strokeLinejoin: "round",
																			"aria-hidden": "true",
																			children: [
																				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M8 10V3.5" }),
																				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M5.5 5.5L8 3l2.5 2.5" }),
																				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M3 9.5V12a1.5 1.5 0 001.5 1.5h7A1.5 1.5 0 0013 12V9.5" })
																			]
																		}),
																		/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: tt("ecommerce.uploadRef") }),
																		/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: tt("edit.uploadHint") })
																	]
																}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
																	className: panel_module_css_default.ecommerceAssets,
																	children: [ecommerceAssets.map((asset) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
																		className: panel_module_css_default.ecommerceAsset,
																		"data-ecommerce-asset": "",
																		children: [
																			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
																				src: asset.dataUrl,
																				alt: asset.name
																			}),
																			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
																				value: asset.role,
																				"data-ecommerce-asset-role": "",
																				"aria-label": tt("ecommerce.refSelect"),
																				onChange: (event) => setEcommerceAssets((previous) => previous.map((item) => item.id === asset.id ? {
																					...item,
																					role: event.target.value
																				} : item)),
																				children: ECOMMERCE_ASSET_ROLES.map((role) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
																					value: role,
																					children: tt(`ecommerce.role.${role}`)
																				}, role))
																			}),
																			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
																				type: "button",
																				"aria-label": tt("edit.remove"),
																				onClick: () => {
																					setEcommerceAssets((previous) => previous.filter((item) => item.id !== asset.id));
																				},
																				children: "×"
																			})
																		]
																	}, asset.id)), ecommerceAssets.length < MAX_ECOMMERCE_ASSETS ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
																		type: "button",
																		className: panel_module_css_default.ecommerceAssetAdd,
																		"data-ecommerce-upload": "",
																		title: tt("ecommerce.uploadRef"),
																		onClick: () => {
																			ecommerceFileInput.current?.click();
																		},
																		onDragOver: (event) => {
																			event.preventDefault();
																		},
																		onDrop: (event) => {
																			event.preventDefault();
																			acceptEcommerceFiles(event.dataTransfer.files ?? void 0);
																		},
																		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																			"aria-hidden": "true",
																			children: "＋"
																		}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: tt("ecommerce.uploadShort") })]
																	}) : null]
																})
															]
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
															className: panel_module_css_default.ecommerceSection,
															children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: tt("ecommerce.params") }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
																className: panel_module_css_default.ecommerceParamGrid,
																children: [
																	/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
																		className: panel_module_css_default.ecommerceField,
																		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																			className: panel_module_css_default.ecommerceFieldLabel,
																			children: tt("ecommerce.platformLabel")
																		}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
																			value: ecommerce.platform,
																			onChange: (event) => setEcommerce((previous) => ({
																				...previous,
																				platform: event.target.value
																			})),
																			children: [
																				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", { children: "通用" }),
																				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", { children: "淘宝 / 京东" }),
																				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", { children: "Amazon" })
																			]
																		})]
																	}),
																	/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
																		className: panel_module_css_default.ecommerceField,
																		children: [
																			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																				className: panel_module_css_default.ecommerceFieldLabel,
																				children: tt("ecommerce.languageLabel")
																			}),
																			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
																				"aria-label": tt("ecommerce.languageLabel"),
																				value: ecommerce.language,
																				onChange: (event) => setEcommerce((previous) => ({
																					...previous,
																					language: event.target.value
																				})),
																				children: ECOMMERCE_COPY_LANGUAGES.map(([value, label]) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
																					value,
																					children: value === "custom" ? tt("ecommerce.customLanguageOption") : label
																				}, value))
																			}),
																			ecommerce.language === "custom" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
																				value: ecommerce.customLanguage ?? "",
																				maxLength: 40,
																				placeholder: tt("ecommerce.customLanguagePlaceholder"),
																				"aria-label": tt("ecommerce.customLanguageLabel"),
																				onChange: (event) => setEcommerce((previous) => ({
																					...previous,
																					customLanguage: event.target.value
																				}))
																			}) : null
																		]
																	}),
																	/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
																		className: panel_module_css_default.ecommerceField,
																		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																			className: panel_module_css_default.ecommerceFieldLabel,
																			children: tt("ecommerce.ratioLabel")
																		}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
																			value: ecommerce.size,
																			onChange: (event) => setEcommerce((previous) => ({
																				...previous,
																				size: event.target.value
																			})),
																			children: SIZES.filter((size) => size !== "auto").map((size) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", { children: size }, size))
																		})]
																	}),
																	/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
																		className: panel_module_css_default.ecommerceField,
																		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																			className: panel_module_css_default.ecommerceFieldLabel,
																			children: tt("ecommerce.categoryLabel")
																		}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
																			value: ecommerce.category,
																			onChange: (event) => setEcommerce((previous) => ({
																				...previous,
																				category: event.target.value
																			})),
																			children: [
																				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", { children: "通用商品" }),
																				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", { children: "食品饮料" }),
																				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", { children: "美妆个护" }),
																				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", { children: "服装配饰" }),
																				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", { children: "家居用品" }),
																				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", { children: "3C 数码" })
																			]
																		})]
																	})
																]
															})]
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
															className: panel_module_css_default.ecommerceSection,
															children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: tt("ecommerce.sellingTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
																value: ecommerce.sellingPoints,
																placeholder: tt("ecommerce.sellingPoints"),
																onChange: (event) => setEcommerce((previous) => ({
																	...previous,
																	sellingPoints: event.target.value
																}))
															})]
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
															className: panel_module_css_default.ecommerceSection,
															children: [
																/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("h3", { children: [tt("ecommerce.setStructure"), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", {
																	className: panel_module_css_default.ecommerceSectionHint,
																	children: tt("ecommerce.multiSelect")
																})] }),
																/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
																	className: panel_module_css_default.ecommerceStructureGrid,
																	children: ecommerce.slots.map((slot) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
																		type: "button",
																		className: panel_module_css_default.ecommerceSlotCard,
																		"data-active": slot.enabled ? "" : void 0,
																		title: `${slot.label}：${slot.description}`,
																		onClick: () => setEcommerce((previous) => ({
																			...previous,
																			slots: previous.slots.map((item) => item.key === slot.key ? {
																				...item,
																				enabled: !item.enabled
																			} : item)
																		})),
																		children: [slot.label, slot.enabled ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																			className: panel_module_css_default.ecommerceSlotCount,
																			title: tt("ecommerce.countHint"),
																			onClick: (event) => {
																				event.stopPropagation();
																				setEcommerce((previous) => ({
																					...previous,
																					slots: previous.slots.map((item) => item.key === slot.key ? {
																						...item,
																						count: item.count >= 4 ? 1 : item.count + 1
																					} : item)
																				}));
																			},
																			children: slot.count
																		}) : null]
																	}, slot.key))
																}),
																ecommerceSlots.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
																	type: "button",
																	className: panel_module_css_default.ecommerceAdvancedToggle,
																	"aria-expanded": ecommerceRefOpen,
																	"aria-controls": "dsh-ecommerce-reference-settings",
																	onClick: () => {
																		setEcommerceRefOpen((open) => !open);
																	},
																	children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: tt("ecommerce.refSettings") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																		className: panel_module_css_default.ecommerceAdvancedChevron,
																		"aria-hidden": "true",
																		children: ecommerceRefOpen ? "⌃" : "⌄"
																	})]
																}), ecommerceRefOpen ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
																	id: "dsh-ecommerce-reference-settings",
																	className: panel_module_css_default.ecommerceAdvancedBody,
																	children: ecommerceSlots.map((slot) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
																		className: panel_module_css_default.ecommerceRefRow,
																		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: slot.label }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
																			value: slot.refRole ?? "product",
																			"data-ecommerce-ref-select": "",
																			"aria-label": `${tt("ecommerce.refSelect")} · ${slot.label}`,
																			onChange: (event) => setEcommerce((previous) => ({
																				...previous,
																				slots: previous.slots.map((item) => item.key === slot.key ? {
																					...item,
																					refRole: event.target.value
																				} : item)
																			})),
																			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
																				value: "none",
																				children: tt("ecommerce.refNone")
																			}), ECOMMERCE_ASSET_ROLES.map((role) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
																				value: role,
																				children: tt(`ecommerce.role.${role}`)
																			}, role))]
																		})]
																	}, slot.key))
																}) : null] }) : null
															]
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
															className: panel_module_css_default.ecommerceSection,
															children: [
																/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: tt("ecommerce.generation") }),
																/* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
																	value: modeModels.includes(model) ? model : modeModels[0] ?? "",
																	"aria-label": tt("model.label"),
																	onChange: (event) => setModel(event.target.value),
																	children: modeModels.map((option) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
																		value: option,
																		children: option
																	}, option))
																}),
																/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
																	className: panel_module_css_default.optionRow,
																	children: QUALITIES.map((option) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
																		active: quality === option,
																		onClick: () => {
																			setQuality(option);
																		},
																		className: panel_module_css_default.optionPill,
																		children: tt(`quality.${option}`)
																	}, option))
																})
															]
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
															className: panel_module_css_default.ecommerceSection,
															children: [
																/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: tt("ecommerce.styleTitle") }),
																/* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
																	value: ecommerce.styleHint,
																	placeholder: tt("ecommerce.styleHint"),
																	onChange: (event) => setEcommerce((previous) => ({
																		...previous,
																		styleHint: event.target.value
																	}))
																}),
																/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																	className: panel_module_css_default.ecommerceFieldLabel,
																	children: tt("ecommerce.protectedLabel")
																}),
																/* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
																	value: ecommerce.protectedFeatures,
																	placeholder: tt("ecommerce.protectedFeatures"),
																	onChange: (event) => setEcommerce((previous) => ({
																		...previous,
																		protectedFeatures: event.target.value
																	}))
																})
															]
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
															ref: ecommerceFileInput,
															type: "file",
															multiple: true,
															accept: "image/png,image/jpeg,image/webp,image/gif",
															className: panel_module_css_default.hiddenFile,
															onChange: (event) => {
																acceptEcommerceFiles(event.target.files ?? void 0);
																event.target.value = "";
															}
														})
													]
												}) : null,
												isGeneration && tab === "edit" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
													className: panel_module_css_default.card,
													children: [refImage === null ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
														type: "button",
														className: panel_module_css_default.uploadBox,
														onClick: () => {
															fileInput.current?.click();
														},
														onDragOver: (event) => {
															event.preventDefault();
														},
														onDrop: (event) => {
															event.preventDefault();
															acceptFile(event.dataTransfer.files?.[0]);
														},
														children: [
															/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																className: panel_module_css_default.uploadIcon,
																children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
																	viewBox: "0 0 16 16",
																	width: "18",
																	height: "18",
																	fill: "none",
																	stroke: "currentColor",
																	strokeWidth: "1.3",
																	strokeLinecap: "round",
																	strokeLinejoin: "round",
																	"aria-hidden": "true",
																	children: [
																		/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M8 10.5V3" }),
																		/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M5 5.5l3-3 3 3" }),
																		/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M2.5 9v3.5h11V9" })
																	]
																})
															}),
															/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: tt("edit.upload") }),
															/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																className: panel_module_css_default.uploadHint,
																children: tt("edit.uploadHint")
															})
														]
													}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
														className: panel_module_css_default.reference,
														children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
															className: panel_module_css_default.referenceImage,
															src: refImage.dataUrl,
															alt: refImage.name
														}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
															className: panel_module_css_default.referenceActions,
															children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
																variant: "outline",
																size: "sm",
																onClick: () => {
																	fileInput.current?.click();
																},
																children: tt("edit.change")
															}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
																variant: "outline",
																size: "sm",
																onClick: () => {
																	setRefImage(null);
																},
																children: tt("edit.remove")
															})]
														})]
													}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
														ref: fileInput,
														type: "file",
														accept: "image/png,image/jpeg,image/webp,image/gif",
														className: panel_module_css_default.hiddenFile,
														onChange: (event) => {
															acceptFile(event.target.files?.[0]);
															event.target.value = "";
														}
													})]
												}) : null,
												isGeneration ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
													className: panel_module_css_default.card,
													children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
														className: panel_module_css_default.prompt,
														value: prompt,
														placeholder: tt("prompt.placeholder"),
														onChange: (event) => {
															setPrompt(event.target.value);
														}
													}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
														className: panel_module_css_default.promptFooter,
														children: [
															/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
																type: "button",
																className: panel_module_css_default.templatesButton,
																title: tt("templates.title"),
																onClick: () => {
																	setLibraryOpen(true);
																},
																children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
																	viewBox: "0 0 16 16",
																	width: "12",
																	height: "12",
																	fill: "none",
																	stroke: "currentColor",
																	strokeWidth: "1.4",
																	strokeLinecap: "round",
																	strokeLinejoin: "round",
																	"aria-hidden": "true",
																	children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M2.5 3.5h11M2.5 8h11M2.5 12.5h7" })
																}), tt("templates.open")]
															}),
															/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
																type: "button",
																className: panel_module_css_default.enhanceButton,
																disabled: prompt.trim() === "" || enhancing,
																title: tt("prompt.enhanceHint"),
																onClick: () => {
																	enhanceCurrentPrompt();
																},
																children: enhancing ? tt("prompt.enhancing") : tt("prompt.enhance")
															}),
															/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																className: panel_module_css_default.promptCount,
																children: tt("prompt.count", { count: prompt.length })
															})
														]
													})]
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
													className: panel_module_css_default.card,
													children: [
														/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
															className: panel_module_css_default.paramGroup,
															children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																className: panel_module_css_default.paramLabel,
																children: tt("params.size")
															}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
																className: panel_module_css_default.optionGrid,
																children: SIZES.map((option) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
																	active: size === option,
																	onClick: () => {
																		setSize(option);
																	},
																	className: panel_module_css_default.optionPill,
																	children: tt(SIZE_KEYS[option] ?? "size.auto")
																}, option))
															})]
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
															className: panel_module_css_default.paramGroup,
															children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																className: panel_module_css_default.paramLabel,
																children: tt("params.quality")
															}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
																className: panel_module_css_default.optionRow,
																children: QUALITIES.map((option) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
																	active: quality === option,
																	onClick: () => {
																		setQuality(option);
																	},
																	className: panel_module_css_default.optionPill,
																	children: tt(`quality.${option}`)
																}, option))
															})]
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
															className: panel_module_css_default.paramGroup,
															children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																className: panel_module_css_default.paramLabel,
																children: tt("params.count")
															}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
																className: panel_module_css_default.optionRow,
																children: [
																	1,
																	2,
																	3,
																	4
																].map((option) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
																	active: count === option,
																	onClick: () => {
																		setCount(option);
																	},
																	className: panel_module_css_default.optionPill,
																	children: tt(`count.${option === 1 ? "one" : option === 2 ? "two" : option === 3 ? "three" : "four"}`)
																}, option))
															})]
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
															className: panel_module_css_default.paramGroup,
															children: [
																/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																	className: panel_module_css_default.paramLabel,
																	children: tt("params.detail")
																}),
																/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
																	className: panel_module_css_default.optionRow,
																	children: DETAILS.map((option) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Pill, {
																		active: detail === option,
																		onClick: () => {
																			setDetail(option);
																		},
																		className: panel_module_css_default.optionPill,
																		children: tt(option === "" ? "detail.auto" : option === "standard" ? "detail.standard" : "detail.high")
																	}, option === "" ? "auto" : option))
																}),
																/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																	className: panel_module_css_default.paramHint,
																	children: tt("detail.hint")
																})
															]
														})
													]
												})] }) : null
											]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
											className: panel_module_css_default.footer,
											children: [
												workspace === "ecommerce" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													className: panel_module_css_default.ecommerceFooterBody,
													children: ecommercePreview ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
														/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
															className: panel_module_css_default.ecommercePlanMini,
															children: [
																/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: tt("ecommerce.planTitle", { count: ecommerceTotal }) }),
																/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
																	className: panel_module_css_default.ecommercePlanList,
																	children: ecommerceSlots.map((slot) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: slot.label }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: ["×", slot.count] })] }, slot.key))
																}),
																/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
																	className: panel_module_css_default.ecommercePlanNote,
																	children: tt("ecommerce.anchorNote")
																}),
																ecommerceAssets.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
																	className: panel_module_css_default.ecommercePlanWarn,
																	children: tt("ecommerce.noAssetWarn")
																}) : null
															]
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
															variant: "primary",
															size: "md",
															className: panel_module_css_default.ecommercePrimaryAction,
															disabled: ecommerceGenerateDisabled,
															onClick: () => {
																handleEcommerceGenerate();
															},
															children: ecommerceGenerating ? tt("generating") : tt("ecommerce.confirm")
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
															type: "button",
															className: panel_module_css_default.ecommercePlanBack,
															onClick: () => {
																setEcommercePreview(false);
															},
															children: tt("gallery.tagsCancel")
														})
													] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: panel_module_css_default.ecommerceFooterHint,
														children: ecommerceTotal > 0 ? tt("ecommerce.footerReady", { count: ecommerceTotal }) : tt("ecommerce.footerEmpty")
													}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
														variant: "primary",
														size: "md",
														className: panel_module_css_default.ecommercePrimaryAction,
														disabled: ecommerce.productName.trim() === "" || ecommerceTotal === 0,
														onClick: () => setEcommercePreview(true),
														children: tt("ecommerce.preview")
													})] })
												}) : null,
												isGeneration ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
													className: panel_module_css_default.modelWrap,
													children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: panel_module_css_default.modelLabel,
														children: tt("model.label")
													}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
														ref: modelMenuRef,
														className: panel_module_css_default.modelMenu,
														"data-open": modelOpen ? "true" : "false",
														children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
															type: "button",
															className: panel_module_css_default.modelSelect,
															disabled: submitting,
															"aria-haspopup": "listbox",
															"aria-expanded": modelOpen,
															onClick: () => {
																setModelOpen((open) => !open);
															},
															children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: model || tt("model.noEditModels") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
																viewBox: "0 0 16 16",
																width: "12",
																height: "12",
																fill: "none",
																stroke: "currentColor",
																strokeWidth: "1.6",
																strokeLinecap: "round",
																strokeLinejoin: "round",
																"aria-hidden": "true",
																children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M8 10.5L4 6h8z" })
															})]
														}), modelOpen ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
															className: panel_module_css_default.modelMenuList,
															role: "listbox",
															"aria-label": tt("model.label"),
															children: modeModels.map((option) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
																type: "button",
																role: "option",
																"aria-selected": model === option,
																className: panel_module_css_default.modelMenuItem,
																"data-selected": model === option ? "" : void 0,
																onClick: () => {
																	setModel(option);
																	setModelOpen(false);
																},
																children: option
															}, option))
														}) : null]
													})]
												}) : null,
												isGeneration ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
													className: panel_module_css_default.compareControl,
													children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
														className: panel_module_css_default.compareToggle,
														children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
															type: "checkbox",
															checked: compareEnabled,
															onChange: (event) => {
																setCompareEnabled(event.target.checked);
															}
														}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: tt("compare.enable") })]
													}), compareEnabled ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
														className: panel_module_css_default.compareModelChoices,
														role: "group",
														"aria-label": tt("compare.models"),
														children: modeModels.map((option) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
															type: "checkbox",
															checked: compareModels.includes(option),
															onChange: () => {
																setCompareModels((previous) => previous.includes(option) ? previous.filter((value) => value !== option) : [...previous, option]);
															}
														}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: option })] }, option))
													}) : null]
												}) : null,
												isGeneration ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
													variant: "primary",
													size: "md",
													className: panel_module_css_default.generateButton,
													disabled: generateDisabled,
													onClick: () => {
														handleGenerate();
													},
													children: generating ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
														className: panel_module_css_default.generateInner,
														children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: panel_module_css_default.spinner }), tt("generating")]
													}) : tt("generate")
												}) : null
											]
										})
									]
								}),
								workspace === "canvas" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(CanvasWorkspace, {
									api,
									imageModels,
									defaultChannelId,
									connected,
									history,
									gallery,
									tasks,
									importRequest: canvasImportRequest,
									onImportRequestHandled: () => {
										setCanvasImportRequest(void 0);
									},
									onOpenSettings: () => {
										openSettingsGuide("generation");
									}
								}) : null,
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
									className: panel_module_css_default.canvas,
									"data-gallery": isGallery ? "true" : void 0,
									children: [
										isGallery ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: panel_module_css_default.galleryWorkspace,
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
													className: panel_module_css_default.galleryToolbar,
													children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
														className: panel_module_css_default.galleryHeading,
														children: tt("gallery.all")
													}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: panel_module_css_default.galleryCount,
														children: tt("gallery.count", { count: filteredGallery.length })
													})] }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
														className: panel_module_css_default.galleryToolbarActions,
														children: [
															/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
																className: panel_module_css_default.gallerySearch,
																value: galleryQuery,
																onChange: (event) => {
																	setGalleryQuery(event.target.value);
																},
																placeholder: tt("gallery.search"),
																"aria-label": tt("gallery.search")
															}),
															/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
																type: "button",
																className: panel_module_css_default.gallerySelectMode,
																disabled: galleryAdding,
																title: tt("gallery.uploadHint"),
																onClick: () => galleryUploadRef.current?.click(),
																children: galleryAdding ? "…" : tt("gallery.upload")
															}),
															/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
																ref: galleryUploadRef,
																type: "file",
																accept: "image/png,image/jpeg,image/webp,image/gif",
																multiple: true,
																hidden: true,
																onChange: (event) => {
																	const files = [...event.target.files ?? []];
																	event.target.value = "";
																	if (files.length > 0) uploadGalleryFiles(files);
																}
															}),
															/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
																type: "button",
																className: panel_module_css_default.gallerySelectMode,
																"data-active": gallerySelecting ? "" : void 0,
																"aria-pressed": gallerySelecting,
																onClick: () => {
																	setGallerySelecting((previous) => !previous);
																},
																children: gallerySelecting ? tt("gallery.selectionDone") : tt("gallery.select")
															}),
															/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
																className: panel_module_css_default.galleryViewToggle,
																role: "group",
																"aria-label": tt("gallery.viewMode"),
																children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
																	type: "button",
																	"data-active": galleryView === "masonry" ? "" : void 0,
																	onClick: () => {
																		setGalleryView("masonry");
																	},
																	title: tt("gallery.masonry"),
																	children: [
																		/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																			"aria-hidden": "true",
																			children: "▦"
																		}),
																		" ",
																		tt("gallery.masonry")
																	]
																}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
																	type: "button",
																	"data-active": galleryView === "grid" ? "" : void 0,
																	onClick: () => {
																		setGalleryView("grid");
																	},
																	title: tt("gallery.grid"),
																	children: [
																		/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																			"aria-hidden": "true",
																			children: "▤"
																		}),
																		" ",
																		tt("gallery.grid")
																	]
																})]
															}),
															/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
																className: panel_module_css_default.gallerySort,
																value: gallerySort,
																onChange: (event) => {
																	setGallerySort(event.target.value);
																},
																"aria-label": tt("gallery.sort"),
																children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
																	value: "newest",
																	children: tt("gallery.newest")
																}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
																	value: "oldest",
																	children: tt("gallery.oldest")
																})]
															}),
															/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
																type: "button",
																className: panel_module_css_default.galleryClear,
																"data-gallery-open-folder": "",
																title: tt("gallery.openFolderHint"),
																onClick: () => {
																	api.openDataFolder();
																},
																children: tt("gallery.openFolder")
															}),
															gallery.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
																type: "button",
																className: panel_module_css_default.galleryClear,
																"data-gallery-clear": "",
																onClick: () => {
																	clearGalleryAll();
																},
																children: tt("gallery.clear")
															}) : null
														]
													})]
												}),
												selectedGalleryIds.size > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
													className: panel_module_css_default.gallerySelectionBar,
													"aria-label": tt("gallery.selected", { count: selectedGalleryIds.size }),
													children: [
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: tt("gallery.selected", { count: selectedGalleryIds.size }) }),
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
															className: panel_module_css_default.galleryTagInput,
															value: galleryTagInput,
															onChange: (event) => {
																setGalleryTagInput(event.target.value);
															},
															placeholder: tt("gallery.tagsPlaceholder"),
															"aria-label": tt("gallery.tagsPlaceholder")
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
															type: "button",
															className: panel_module_css_default.galleryBulkButton,
															disabled: galleryTagInput.trim() === "",
															onClick: () => {
																applyGalleryTags();
															},
															children: tt("gallery.tagsApply")
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
															type: "button",
															className: panel_module_css_default.galleryBulkButton,
															onClick: downloadGalleryImages,
															children: tt("gallery.downloadSelected")
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
															type: "button",
															className: panel_module_css_default.galleryBulkButton,
															onClick: exportGalleryJson,
															children: tt("gallery.exportJson")
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
															type: "button",
															className: panel_module_css_default.gallerySelectionClear,
															onClick: clearGallerySelection,
															children: tt("gallery.selectionClear")
														})
													]
												}) : null,
												filteredGallery.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													className: panel_module_css_default.historyEmpty,
													children: tt("gallery.empty")
												}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													className: panel_module_css_default.galleryMasonry,
													"data-view": galleryView,
													children: filteredGallery.map((entry) => {
														const image = entry.images[0];
														if (image === void 0) return null;
														return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("article", {
															className: panel_module_css_default.galleryCard,
															"data-selected": selectedGalleryIds.has(entry.id) ? "" : void 0,
															children: [
																/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
																	className: panel_module_css_default.gallerySelect,
																	title: tt("gallery.select"),
																	children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
																		type: "checkbox",
																		checked: selectedGalleryIds.has(entry.id),
																		onChange: () => {
																			setGallerySelecting(true);
																			toggleGallerySelection(entry.id);
																		}
																	})
																}),
																/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
																	type: "button",
																	className: panel_module_css_default.galleryImageButton,
																	"data-selecting": gallerySelecting ? "" : void 0,
																	onClick: () => {
																		if (gallerySelecting) toggleGallerySelection(entry.id);
																		else viewGalleryEntry(entry);
																	},
																	title: gallerySelecting ? tt("gallery.select") : tt("preview.open"),
																	children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
																		className: panel_module_css_default.galleryImage,
																		src: image.url,
																		alt: entry.prompt
																	}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																		className: panel_module_css_default.galleryBadge,
																		children: entry.mode === "edit" ? tt("mode.edit") : tt("mode.text")
																	})]
																}),
																/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
																	className: panel_module_css_default.galleryCardActions,
																	children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
																		type: "button",
																		className: panel_module_css_default.galleryCardAction,
																		"data-gallery-add-conversation": "",
																		disabled: conversationBusy,
																		title: tt("conversation.addHint"),
																		onClick: (event) => {
																			event.stopPropagation();
																			addGalleryEntryToConversation(entry);
																		},
																		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
																			viewBox: "0 0 16 16",
																			width: "13",
																			height: "13",
																			fill: "none",
																			stroke: "currentColor",
																			strokeWidth: "1.5",
																			strokeLinecap: "round",
																			strokeLinejoin: "round",
																			"aria-hidden": "true",
																			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M3 4.5h10v7H3z" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M5.5 2.5h5M8 6v4M6 8h4" })]
																		}), galleryConversationAddingId === entry.id || addingToConversation === `gallery:${entry.id}` ? tt("conversation.adding") : tt("conversation.add")]
																	}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
																		type: "button",
																		className: panel_module_css_default.galleryCardAction,
																		"data-gallery-add-canvas": "",
																		title: tt("canvas.addToCanvas"),
																		onClick: (event) => {
																			event.stopPropagation();
																			addEntryToCanvas("gallery", entry.id, 0);
																		},
																		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
																			viewBox: "0 0 16 16",
																			width: "13",
																			height: "13",
																			fill: "none",
																			stroke: "currentColor",
																			strokeWidth: "1.5",
																			strokeLinecap: "round",
																			strokeLinejoin: "round",
																			"aria-hidden": "true",
																			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
																				x: "2.5",
																				y: "2.5",
																				width: "11",
																				height: "11",
																				rx: "1.5"
																			}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M5 8h6M8 5v6" })]
																		}), tt("canvas.addToCanvas")]
																	})]
																}),
																/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
																	className: panel_module_css_default.galleryCardFooter,
																	children: [
																		/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																			className: panel_module_css_default.galleryAvatar,
																			children: entry.model.toLowerCase().startsWith("nanobanana") ? "N" : entry.model.toLowerCase().startsWith("seedream") ? "S" : entry.model.startsWith("grok") ? "G" : "D"
																		}),
																		/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
																			className: panel_module_css_default.galleryCardInfo,
																			children: [
																				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: entry.prompt || tt("gallery.untitled") }),
																				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("small", { children: [
																					entry.model,
																					" · ",
																					normalizeSize(entry.size),
																					" · ",
																					formatTime(entry.createdAt)
																				] }),
																				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
																					className: panel_module_css_default.galleryTags,
																					children: [(entry.tags ?? []).map((tag) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
																						type: "button",
																						onClick: () => {
																							setGalleryTagFilter(tag);
																						},
																						children: tag
																					}, tag)), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
																						type: "button",
																						className: panel_module_css_default.galleryTagEdit,
																						onClick: () => {
																							startEditingGalleryTags(entry);
																						},
																						title: tt("gallery.editTags"),
																						children: tt("gallery.tagsEditShort")
																					})]
																				})
																			]
																		}),
																		/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
																			type: "button",
																			className: panel_module_css_default.galleryRemove,
																			onClick: () => {
																				deleteGalleryEntry(entry.id);
																			},
																			title: tt("gallery.delete"),
																			children: "×"
																		})
																	]
																}),
																editingGalleryTagsId === entry.id ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("form", {
																	className: panel_module_css_default.galleryTagEditor,
																	onSubmit: (event) => {
																		event.preventDefault();
																		saveGalleryTags(entry.id);
																	},
																	children: [
																		/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
																			value: galleryTagEditInput,
																			onChange: (event) => {
																				setGalleryTagEditInput(event.target.value);
																			},
																			placeholder: tt("gallery.tagsPlaceholder"),
																			"aria-label": tt("gallery.tagsPlaceholder"),
																			autoFocus: true
																		}),
																		/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
																			type: "submit",
																			children: tt("gallery.tagsSave")
																		}),
																		/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
																			type: "button",
																			onClick: () => {
																				setEditingGalleryTagsId(null);
																				setGalleryTagEditInput("");
																			},
																			children: tt("gallery.tagsCancel")
																		})
																	]
																}) : null
															]
														}, entry.id);
													})
												})
											]
										}) : null,
										workspace === "ecommerce" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: panel_module_css_default.ecommerceResults,
											"data-ecommerce-results": "",
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
												className: panel_module_css_default.ecommerceResultsHeader,
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: tt("ecommerce.results.title") }),
													ecommerceRestored !== null && ecommerceRestored.projectId === ecommerceProjectId && ecommerceRestored.projectName !== "" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: ecommerceRestored.projectName }) : null,
													ecommerceMergedItems.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [tt("ecommerce.results.progress", {
														done: ecommerceDoneCount,
														total: ecommerceMergedItems.length
													}), ecommerceFailedCount > 0 ? ` · ${tt("ecommerce.results.failed", { count: ecommerceFailedCount })}` : ""] }) : null,
													ecommerceAnchor !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														"data-ecommerce-anchor": "",
														children: tt("ecommerce.anchorPending")
													}) : null
												] }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
													className: panel_module_css_default.ecommerceResultsActions,
													children: [ecommerceMergedItems.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
														type: "button",
														className: panel_module_css_default.galleryBulkButton,
														"data-ecommerce-export": "",
														onClick: exportEcommerceManifest,
														children: tt("ecommerce.results.export")
													}) : null, /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
														type: "button",
														className: panel_module_css_default.galleryBulkButton,
														"data-ecommerce-new": "",
														onClick: newEcommerceProduct,
														children: tt("ecommerce.results.newProduct")
													})]
												})]
											}), ecommerceMergedItems.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
												className: panel_module_css_default.ecommerceResultsEmpty,
												children: tt("ecommerce.results.empty")
											}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
												className: panel_module_css_default.ecommerceGroups,
												children: ecommerceResultGroups.map((group) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
													className: panel_module_css_default.ecommerceGroup,
													"data-ecommerce-group": group.label,
													children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", { children: [
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: group.label }),
														/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
															group.items.filter((item) => item.status === "completed").length,
															"/",
															group.items.length
														] }),
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
															type: "button",
															className: panel_module_css_default.galleryBulkButton,
															disabled: ecommerceGenerating,
															onClick: () => {
																regenerateEcommerceSlot(group.label);
															},
															children: tt("ecommerce.results.regenerate")
														})
													] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
														className: panel_module_css_default.ecommerceGroupGrid,
														children: group.items.map((item) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
															className: panel_module_css_default.ecommerceTaskCard,
															"data-status": item.status,
															children: item.status === "completed" && item.images.length > 0 ? item.images.map((image, imageIndex) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("figure", {
																className: panel_module_css_default.imageCard,
																role: "button",
																tabIndex: 0,
																title: tt("preview.open"),
																onClick: () => {
																	openPreview(item.images, imageIndex);
																},
																children: [
																	/* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
																		className: panel_module_css_default.image,
																		src: srcOf(image),
																		alt: `${group.label} ${imageIndex + 1}`
																	}),
																	/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																		className: panel_module_css_default.ecommerceResultBadge,
																		children: group.label
																	}),
																	/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
																		className: panel_module_css_default.ecommerceTaskActions,
																		onClick: (event) => event.stopPropagation(),
																		children: [
																			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
																				className: panel_module_css_default.ecommerceActionChip,
																				href: srcOf(image),
																				download: `product-${item.slotKey || item.id}-${imageIndex + 1}.${extensionOf(image.mime)}`,
																				children: tt("download")
																			}),
																			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
																				type: "button",
																				className: panel_module_css_default.ecommerceActionChip,
																				disabled: galleryAdding,
																				onClick: () => {
																					addToGallery(image);
																				},
																				children: tt("gallery.add")
																			}),
																			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
																				type: "button",
																				className: panel_module_css_default.ecommerceActionChip,
																				disabled: conversationBusy,
																				onClick: () => {
																					addImageToConversation(image, imageIndex, `${item.id}:${imageIndex}`);
																				},
																				children: addingToConversation === `${item.id}:${imageIndex}` ? tt("conversation.adding") : tt("conversation.add")
																			})
																		]
																	})
																]
															}, imageIndex)) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
																className: panel_module_css_default.ecommerceTaskState,
																children: [
																	/* @__PURE__ */ (0, react_jsx_runtime.jsx)("b", { children: group.label }),
																	tt(`tasks.${item.status}`),
																	item.error !== void 0 ? ` · ${item.error}` : ""
																]
															})
														}, item.id))
													})]
												}, group.label))
											})]
										}) : null,
										!isGallery && tasks.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
											className: panel_module_css_default.taskTray,
											"data-open": taskTrayOpen ? "true" : "false",
											"aria-label": tt("tasks.title"),
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
												className: panel_module_css_default.taskTrayHeader,
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
													type: "button",
													className: panel_module_css_default.taskTrayToggle,
													"aria-expanded": taskTrayOpen,
													onClick: () => {
														setTaskTrayOpen((open) => !open);
													},
													children: [
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: tt("tasks.title") }),
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															className: panel_module_css_default.taskTrayCount,
															children: activeTasks.length
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															className: panel_module_css_default.taskTrayChevron,
															"aria-hidden": "true",
															children: taskTrayOpen ? "⌃" : "⌄"
														})
													]
												}), taskTrayOpen ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: panel_module_css_default.taskTrayClose,
													"aria-label": tt("preview.close"),
													onClick: () => {
														setTaskTrayOpen(false);
													},
													children: "×"
												}) : null]
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
												className: panel_module_css_default.taskRows,
												children: tasks.slice(0, 5).map((task) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
													className: panel_module_css_default.taskRow,
													"data-status": task.status,
													children: [
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															className: panel_module_css_default.taskStatus,
															children: tt(`tasks.${task.status}`)
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															className: panel_module_css_default.taskPrompt,
															children: task.request.prompt
														}),
														task.status === "queued" || task.status === "running" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
															type: "button",
															onClick: () => {
																api.taskCancel(task.id);
															},
															children: tt("tasks.cancel")
														}) : null,
														task.status === "failed" || task.status === "cancelled" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
															type: "button",
															onClick: () => {
																api.taskRetry(task.id);
															},
															children: tt("tasks.retry")
														}) : null
													]
												}, task.id))
											})]
										}) : null,
										workspace === "normal" && tab !== "gallery" && comparison !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
											className: panel_module_css_default.comparisonBoard,
											"aria-label": tt("compare.title"),
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: tt("compare.title") }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
												comparisonResults.length,
												" / ",
												comparisonTasks.length,
												generating ? ` · ${tt("canvas.elapsed", { seconds: elapsed })}` : ""
											] })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												disabled: comparisonResults.length === 0,
												onClick: () => {
													setComparisonFullscreen(true);
												},
												children: tt("compare.fullscreen")
											})] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
												className: panel_module_css_default.comparisonGrid,
												children: comparisonTasks.map((task) => {
													const taskImages = task.result?.images ?? [];
													const image = taskImages[0];
													return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("article", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: task.request.model }), image !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
														type: "button",
														className: panel_module_css_default.comparisonImageButton,
														title: tt("preview.open"),
														onClick: () => {
															openPreview(taskImages, 0);
														},
														children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
															src: srcOf(image),
															alt: task.request.model
														})
													}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: tt(`tasks.${task.status}`) })] }, task.id);
												})
											})]
										}) : null,
										generating && comparison === null && isGeneration ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: panel_module_css_default.canvasState,
											"data-generation-state": activeTask?.status ?? "submitting",
											role: "status",
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: panel_module_css_default.bigSpinner }),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: panel_module_css_default.canvasStateTitle,
													children: submitting && activeTask === void 0 ? tt("canvas.submitting") : activeTask?.status === "queued" ? tt("canvas.queued") : tt("canvas.generating")
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: panel_module_css_default.canvasStateHint,
													children: activeTask?.status === "queued" ? tt("canvas.queueHint", { count: activeTasks.length }) : tt("canvas.elapsed", { seconds: elapsed })
												})
											]
										}) : null,
										!generating && error !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											className: panel_module_css_default.canvasError,
											role: "alert",
											children: tt("canvas.error", { error })
										}) : null,
										isGeneration && !generating && !error && images.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(InspirationGallery, {
											api,
											onUse: (text) => {
												setPrompt(text);
												setError(null);
											}
										}) : null,
										isGeneration && !generating && images.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: panel_module_css_default.canvasBody,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												className: panel_module_css_default.canvasMeta,
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: tt("canvas.images", { count: images.length }) }), viewingEntry !== null || viewingGalleryEntry !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: panel_module_css_default.canvasHistoryTag,
													children: viewingEntry !== null ? tt("history.viewing", { time: formatTime(viewingEntry.createdAt) }) : tt("gallery.viewing", { time: formatTime(viewingGalleryEntry.createdAt) })
												}) : null]
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
												className: panel_module_css_default.grid,
												"data-count": images.length,
												children: images.map((image, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("figure", {
													className: panel_module_css_default.imageCard,
													role: "button",
													tabIndex: 0,
													title: tt("preview.open"),
													onClick: () => {
														openPreview(images, index);
													},
													onKeyDown: (event) => {
														if (event.key === "Enter" || event.key === " ") {
															event.preventDefault();
															openPreview(images, index);
														}
													},
													children: [
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
															className: panel_module_css_default.image,
															src: srcOf(image),
															alt: image.revisedPrompt ?? `${tt("panel.title")} ${index + 1}`
														}),
														image.revisedPrompt !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("figcaption", {
															className: panel_module_css_default.imageCaption,
															title: image.revisedPrompt,
															children: tt("revisedPrompt", { prompt: image.revisedPrompt })
														}) : null,
														/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
															className: panel_module_css_default.zoomHint,
															children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
																viewBox: "0 0 16 16",
																width: "13",
																height: "13",
																fill: "none",
																stroke: "currentColor",
																strokeWidth: "1.4",
																strokeLinecap: "round",
																strokeLinejoin: "round",
																"aria-hidden": "true",
																children: [
																	/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
																		cx: "7",
																		cy: "7",
																		r: "4"
																	}),
																	/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M13 13l-3.2-3.2" }),
																	/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M7 5.4v3.2M5.4 7h3.2" })
																]
															}), tt("preview.open")]
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
															type: "button",
															className: panel_module_css_default.galleryAdd,
															title: tt("gallery.add"),
															disabled: galleryAdding,
															onClick: (event) => {
																event.stopPropagation();
																addToGallery(image);
															},
															children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
																viewBox: "0 0 16 16",
																width: "12",
																height: "12",
																fill: "none",
																stroke: "currentColor",
																strokeWidth: "1.6",
																strokeLinecap: "round",
																strokeLinejoin: "round",
																"aria-hidden": "true",
																children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
																	x: "2.5",
																	y: "3",
																	width: "11",
																	height: "10",
																	rx: "1.5"
																}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M8 5.8v4.4M5.8 8h4.4" })]
															}), tt("gallery.add")]
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
															type: "button",
															className: panel_module_css_default.conversationAdd,
															title: tt("conversation.add"),
															disabled: conversationBusy,
															onClick: (event) => {
																event.stopPropagation();
																addImageToConversation(image, index);
															},
															children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
																viewBox: "0 0 16 16",
																width: "12",
																height: "12",
																fill: "none",
																stroke: "currentColor",
																strokeWidth: "1.5",
																strokeLinecap: "round",
																strokeLinejoin: "round",
																"aria-hidden": "true",
																children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M3 4.5h10v7H3z" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M5.5 2.5h5M8 6v4M6 8h4" })]
															}), addingToConversation === index ? tt("conversation.adding") : tt("conversation.add")]
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
															className: panel_module_css_default.download,
															href: srcOf(image),
															download: `dsh-image-${index + 1}.${extensionOf(image.mime)}`,
															onClick: (event) => {
																event.stopPropagation();
															},
															children: tt("download")
														})
													]
												}, index))
											})]
										}) : null
									]
								})
							]
						})
					}),
					sidebarHistoryHost !== null && historyPanel !== null ? (0, react_dom.createPortal)(historyPanel, sidebarHistoryHost) : null,
					libraryOpen ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(TemplateLibrary, {
						api,
						onClose: () => {
							setLibraryOpen(false);
						},
						onUse: (text) => {
							openTab("text");
							setPrompt(text);
							setError(null);
							setLibraryOpen(false);
						}
					}) : null,
					configGuide !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: panel_module_css_default.configGuide,
						role: "dialog",
						"aria-modal": "true",
						"aria-label": tt(`config.${configGuide}Title`),
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: panel_module_css_default.configGuideBody,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: tt(`config.${configGuide}Title`) }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: tt(`config.${configGuide}Hint`) }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => {
										setConfigGuide(null);
									},
									children: tt("preview.close")
								})
							]
						})
					}) : null,
					comparisonFullscreen && comparison !== null ? (0, react_dom.createPortal)(/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: panel_module_css_default.comparisonFullscreen,
						role: "dialog",
						"aria-modal": "true",
						"aria-label": tt("compare.title"),
						onClick: () => {
							setComparisonFullscreen(false);
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: panel_module_css_default.lightboxClose,
							"aria-label": tt("preview.close"),
							onClick: () => {
								setComparisonFullscreen(false);
							},
							children: "×"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: panel_module_css_default.comparisonFullscreenGrid,
							onClick: (event) => {
								event.stopPropagation();
							},
							children: comparisonResults.map((task) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("figure", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("figcaption", { children: task.request.model }), task.result.images.map((image, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
								src: srcOf(image),
								alt: task.request.model
							}, index))] }, task.id))
						})]
					}), document.body) : null,
					preview !== null && previewImage !== null ? (0, react_dom.createPortal)(/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: panel_module_css_default.lightbox,
						role: "dialog",
						"aria-modal": "true",
						"aria-label": tt("preview.title"),
						onClick: closePreview,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: panel_module_css_default.lightboxClose,
								"aria-label": tt("preview.close"),
								title: tt("preview.close"),
								onClick: closePreview,
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
									viewBox: "0 0 16 16",
									width: "18",
									height: "18",
									fill: "none",
									stroke: "currentColor",
									strokeWidth: "1.6",
									strokeLinecap: "round",
									"aria-hidden": "true",
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M4 4l8 8M12 4l-8 8" })
								})
							}),
							preview.images.length > 1 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: panel_module_css_default.lightboxNav,
								"data-dir": "prev",
								"aria-label": tt("preview.prev"),
								onClick: (event) => {
									event.stopPropagation();
									stepPreview(-1);
								},
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
									viewBox: "0 0 16 16",
									width: "20",
									height: "20",
									fill: "none",
									stroke: "currentColor",
									strokeWidth: "1.8",
									strokeLinecap: "round",
									strokeLinejoin: "round",
									"aria-hidden": "true",
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M10 3l-5 5 5 5" })
								})
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: panel_module_css_default.lightboxNav,
								"data-dir": "next",
								"aria-label": tt("preview.next"),
								onClick: (event) => {
									event.stopPropagation();
									stepPreview(1);
								},
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
									viewBox: "0 0 16 16",
									width: "20",
									height: "20",
									fill: "none",
									stroke: "currentColor",
									strokeWidth: "1.8",
									strokeLinecap: "round",
									strokeLinejoin: "round",
									"aria-hidden": "true",
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M6 3l5 5-5 5" })
								})
							})] }) : null,
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("figure", {
								className: panel_module_css_default.lightboxFigure,
								onClick: (event) => {
									event.stopPropagation();
								},
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										ref: previewStage,
										className: panel_module_css_default.lightboxStage,
										onWheel: (event) => {
											event.preventDefault();
											setPreviewScale((current) => clampPreviewScale(current + (event.deltaY < 0 ? PREVIEW_SCALE_STEP : -.25)));
										},
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											className: panel_module_css_default.lightboxScaleFrame,
											style: {
												width: `${previewFrameScale * 100}%`,
												height: `${previewFrameScale * 100}%`
											},
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
												className: panel_module_css_default.lightboxImage,
												style: {
													width: `${previewImageScale * 100}%`,
													height: `${previewImageScale * 100}%`
												},
												src: srcOf(previewImage),
												alt: previewImage.revisedPrompt ?? tt("preview.title")
											})
										})
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: panel_module_css_default.lightboxTools,
										role: "group",
										"aria-label": tt("preview.zoomControls"),
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: panel_module_css_default.lightboxTool,
												"aria-label": tt("preview.zoomOut"),
												title: tt("preview.zoomOut"),
												onClick: () => {
													setPreviewScale((current) => clampPreviewScale(current - PREVIEW_SCALE_STEP));
												},
												children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
													viewBox: "0 0 16 16",
													width: "17",
													height: "17",
													fill: "none",
													stroke: "currentColor",
													strokeWidth: "1.7",
													strokeLinecap: "round",
													"aria-hidden": "true",
													children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
														cx: "7",
														cy: "7",
														r: "4.2"
													}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M4.8 7h4.4M13 13l-2.8-2.8" })]
												})
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: panel_module_css_default.lightboxZoomLevel,
												"aria-label": tt("preview.zoomReset"),
												title: tt("preview.zoomReset"),
												onClick: () => {
													setPreviewScale(1);
												},
												children: tt("preview.zoomLevel", { percent: Math.round(previewScale * 100) })
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: panel_module_css_default.lightboxTool,
												"aria-label": tt("preview.zoomIn"),
												title: tt("preview.zoomIn"),
												onClick: () => {
													setPreviewScale((current) => clampPreviewScale(current + PREVIEW_SCALE_STEP));
												},
												children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
													viewBox: "0 0 16 16",
													width: "17",
													height: "17",
													fill: "none",
													stroke: "currentColor",
													strokeWidth: "1.7",
													strokeLinecap: "round",
													"aria-hidden": "true",
													children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
														cx: "7",
														cy: "7",
														r: "4.2"
													}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M7 4.8v4.4M4.8 7h4.4M13 13l-2.8-2.8" })]
												})
											})
										]
									}),
									previewImage.revisedPrompt !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: panel_module_css_default.lightboxCaptionRow,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("figcaption", {
											className: panel_module_css_default.lightboxCaption,
											title: previewImage.revisedPrompt,
											children: tt("revisedPrompt", { prompt: previewImage.revisedPrompt })
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
											type: "button",
											className: panel_module_css_default.lightboxCopy,
											"aria-label": tt(promptCopied ? "preview.copied" : "preview.copyPrompt"),
											title: tt(promptCopied ? "preview.copied" : "preview.copyPrompt"),
											onClick: () => {
												copyPreviewPrompt(previewImage.revisedPrompt);
											},
											children: [promptCopied ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
												viewBox: "0 0 16 16",
												width: "16",
												height: "16",
												fill: "none",
												stroke: "currentColor",
												strokeWidth: "1.8",
												strokeLinecap: "round",
												strokeLinejoin: "round",
												"aria-hidden": "true",
												children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M3 8l3 3 7-7" })
											}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
												viewBox: "0 0 16 16",
												width: "16",
												height: "16",
												fill: "none",
												stroke: "currentColor",
												strokeWidth: "1.5",
												strokeLinecap: "round",
												strokeLinejoin: "round",
												"aria-hidden": "true",
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
													x: "5",
													y: "5",
													width: "7",
													height: "8",
													rx: "1"
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M3 10V3.8c0-.44.36-.8.8-.8H9" })]
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: tt(promptCopied ? "preview.copied" : "preview.copyPrompt") })]
										})]
									}) : null,
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: panel_module_css_default.lightboxMeta,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: panel_module_css_default.lightboxIndex,
											children: tt("preview.index", {
												index: preview.index + 1,
												total: preview.images.length
											})
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											className: panel_module_css_default.lightboxActions,
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: panel_module_css_default.lightboxEdit,
													disabled: conversationBusy,
													title: tt("conversation.addHint"),
													onClick: () => {
														addImageToConversation(previewImage, preview.index);
													},
													children: addingToConversation === preview.index ? tt("conversation.adding") : tt("conversation.add")
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: panel_module_css_default.lightboxEdit,
													disabled: galleryAdding,
													onClick: () => {
														addToGallery(previewImage);
													},
													children: tt("gallery.add")
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: panel_module_css_default.lightboxEdit,
													onClick: addPreviewToEdit,
													children: tt("preview.addToEdit")
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
													className: panel_module_css_default.lightboxDownload,
													href: srcOf(previewImage),
													download: `dsh-image-${preview.index + 1}.${extensionOf(previewImage.mime)}`,
													children: tt("download")
												})
											]
										})]
									})
								]
							})
						]
					}), document.body) : null,
					galleryMessage !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: panel_module_css_default.galleryToast,
						role: "status",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
							viewBox: "0 0 16 16",
							width: "14",
							height: "14",
							fill: "none",
							stroke: "currentColor",
							strokeWidth: "1.6",
							strokeLinecap: "round",
							strokeLinejoin: "round",
							"aria-hidden": "true",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
								x: "2.5",
								y: "3",
								width: "11",
								height: "10",
								rx: "1.5"
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M8 5.8v4.4M5.8 8h4.4" })]
						}), galleryMessage]
					}) : null,
					conversationMessage !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: panel_module_css_default.conversationToast,
						role: "status",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
							viewBox: "0 0 16 16",
							width: "14",
							height: "14",
							fill: "none",
							stroke: "currentColor",
							strokeWidth: "1.5",
							strokeLinecap: "round",
							strokeLinejoin: "round",
							"aria-hidden": "true",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M3 4.5h10v7H3z" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M5.5 2.5h5M8 6v4M6 8h4" })]
						}), conversationMessage]
					}) : null
				]
			});
		}
		/** File extension for a MIME type (download filenames). */
		function extensionOf(mime) {
			switch (mime.split(";")[0].trim()) {
				case "image/jpeg": return "jpg";
				case "image/webp": return "webp";
				case "image/gif": return "gif";
				default: return "png";
			}
		}
		//#endregion
		//#region src/client/mount.tsx
		const CONVERSATION_COLUMN_SELECTOR = "[data-pane=\"conversation\"], [class*=\"centerCol\"]";
		const ACTIVE_ATTR = "data-dsh-imagegen-active";
		const RESIZER_SELECTOR = "[data-dsh-imagegen-chat-resizer]";
		const CHAT_WIDTH_STORAGE_KEY = "dsh-imagegen:chat-width";
		const CHAT_MIN_WIDTH = 320;
		/** Sibling panels' activation attributes, removed when this panel opens. */
		const OTHER_ACTIVE_ATTRS = ["data-dsh-taskboard-active", "data-dsh-ssh-active"];
		/** Cross-plugin activation event; detail is the activating panel name. */
		const ACTIVATE_EVENT = "dsh-panel-activate";
		const PANEL_NAME = "imagegen";
		/** Find the center column, or undefined while the frame is not mounted. */
		function conversationColumn() {
			return document.querySelector(CONVERSATION_COLUMN_SELECTOR) ?? void 0;
		}
		function readChatWidth() {
			try {
				const raw = window.localStorage.getItem(CHAT_WIDTH_STORAGE_KEY);
				if (raw === null) return void 0;
				const value = Number(raw);
				return Number.isFinite(value) && value >= CHAT_MIN_WIDTH ? value : void 0;
			} catch {
				return;
			}
		}
		function writeChatWidth(value) {
			try {
				window.localStorage.setItem(CHAT_WIDTH_STORAGE_KEY, String(Math.round(value)));
			} catch {}
		}
		function applyChatWidth(column, clientX) {
			const bounds = column.getBoundingClientRect();
			const max = Math.max(CHAT_MIN_WIDTH, bounds.width * .7);
			const width = Math.min(max, Math.max(CHAT_MIN_WIDTH, bounds.right - clientX));
			column.style.setProperty("--dsh-imagegen-chat-width", `${Math.round(width)}px`);
			writeChatWidth(width);
		}
		/** Create the visible handle that separates the image workspace and chat. */
		function createChatResizer(column) {
			const resizer = document.createElement("div");
			resizer.dataset.dshImagegenChatResizer = "";
			resizer.className = panel_module_css_default.chatResizer;
			resizer.setAttribute("role", "separator");
			resizer.setAttribute("aria-orientation", "vertical");
			resizer.setAttribute("aria-label", "调整对话区域宽度");
			resizer.tabIndex = 0;
			const saved = readChatWidth();
			if (saved !== void 0) column.style.setProperty("--dsh-imagegen-chat-width", `${saved}px`);
			const onPointerDown = (event) => {
				if (event.button !== 0) return;
				event.preventDefault();
				resizer.setPointerCapture?.(event.pointerId);
				const onMove = (move) => {
					applyChatWidth(column, move.clientX);
				};
				const onUp = () => {
					window.removeEventListener("pointermove", onMove);
					window.removeEventListener("pointerup", onUp);
					window.removeEventListener("pointercancel", onUp);
					resizer.releasePointerCapture?.(event.pointerId);
					document.documentElement.style.removeProperty("cursor");
					document.documentElement.style.removeProperty("user-select");
				};
				window.addEventListener("pointermove", onMove);
				window.addEventListener("pointerup", onUp);
				window.addEventListener("pointercancel", onUp);
				document.documentElement.style.setProperty("cursor", "col-resize");
				document.documentElement.style.setProperty("user-select", "none");
			};
			const onKeyDown = (event) => {
				if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
				event.preventDefault();
				const bounds = column.getBoundingClientRect();
				const current = column.style.getPropertyValue("--dsh-imagegen-chat-width");
				const currentWidth = Number.parseFloat(current) || bounds.width * .36;
				const delta = event.key === "ArrowLeft" ? -24 : 24;
				applyChatWidth(column, bounds.right - currentWidth - delta);
			};
			resizer.addEventListener("pointerdown", onPointerDown);
			resizer.addEventListener("keydown", onKeyDown);
			return resizer;
		}
		/**
		* Mount the panel React tree into the center column and bind its visibility
		* to the controller's panelOpen state.
		* @param controller - the panel controller driving the view.
		* @param api - the image-generation API client the panel operates through.
		* @param scope - the settings scope (config status banner).
		* @returns disposer unmounting the tree and restoring the column.
		*/
		function mountPanel(controller, api, scope, services = {}) {
			let root;
			let container;
			let resizer;
			const ensure = () => {
				if (container !== void 0) {
					if (container.isConnected) return;
					root?.unmount();
					root = void 0;
					container.remove();
					container = void 0;
					resizer?.remove();
					resizer = void 0;
				}
				const column = conversationColumn();
				if (column === void 0) return;
				container = document.createElement("div");
				container.dataset.dshImagegenView = "";
				container.className = panel_module_css_default.view;
				column.appendChild(container);
				root = (0, react_dom_client.createRoot)(container);
				root.render(/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ImageGenPanel, {
					api,
					scope,
					...services
				}));
				resizer = column.querySelector(RESIZER_SELECTOR) ?? createChatResizer(column);
				if (resizer.parentElement !== column) column.appendChild(resizer);
			};
			const waitObserver = new MutationObserver(() => {
				ensure();
			});
			waitObserver.observe(document.body, {
				childList: true,
				subtree: true
			});
			const applyActive = () => {
				if (controller.getSnapshot().panelOpen) {
					for (const attr of OTHER_ACTIVE_ATTRS) document.documentElement.removeAttribute(attr);
					document.documentElement.setAttribute(ACTIVE_ATTR, "");
					document.dispatchEvent(new CustomEvent(ACTIVATE_EVENT, { detail: PANEL_NAME }));
				} else document.documentElement.removeAttribute(ACTIVE_ATTR);
			};
			const onOtherActivate = (event) => {
				const detail = event.detail;
				if ((detail === "ssh" || detail === "taskboard") && controller.getSnapshot().panelOpen) controller.close();
			};
			const SIDEBAR_ROW_SELECTOR = "[class*=\"sessionRow\"], [class*=\"projectRow\"], [class*=\"searchResultRow\"], [class*=\"searchResultWorkspace\"], [class*=\"newSession\"]";
			const onClickSidebarRow = (event) => {
				if (!controller.getSnapshot().panelOpen) return;
				const target = event.target;
				if (target === null) return;
				if (target.closest(SIDEBAR_ROW_SELECTOR) !== null) controller.close();
			};
			document.addEventListener("click", onClickSidebarRow, true);
			document.addEventListener(ACTIVATE_EVENT, onOtherActivate);
			const unsubscribe = controller.subscribe(applyActive);
			applyActive();
			ensure();
			return () => {
				document.removeEventListener("click", onClickSidebarRow, true);
				document.removeEventListener(ACTIVATE_EVENT, onOtherActivate);
				waitObserver.disconnect();
				unsubscribe();
				document.documentElement.removeAttribute(ACTIVE_ATTR);
				root?.unmount();
				root = void 0;
				container?.remove();
				container = void 0;
				resizer?.remove();
				resizer = void 0;
			};
		}
		//#endregion
		//#region src/client/sidebar-entry.ts
		/** Stable selector for the injected two-tab host. */
		const ENTRY_SELECTOR = "[data-dsh-imagegen-session-tabs]";
		/** Stable selector for the history surface in the shell region area. */
		const HISTORY_HOST_SELECTOR = "[data-dsh-imagegen-history-host]";
		/** Inline picture glyph kept deliberately small for the sidebar rail. */
		const IMAGE_ICON = "<svg viewBox=\"0 0 16 16\" width=\"14\" height=\"14\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"2\" y=\"2.5\" width=\"12\" height=\"11\" rx=\"1.5\"/><circle cx=\"5.6\" cy=\"5.8\" r=\"1\"/><path d=\"M2.5 12.5l3.6-3.4 2.4 2.2 3-3 2 2.4\"/></svg>";
		/** Inline plus glyph for the new-session tab. */
		const NEW_SESSION_ICON = "<svg viewBox=\"0 0 16 16\" width=\"14\" height=\"14\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" aria-hidden=\"true\"><path d=\"M8 3v10M3 8h10\"/></svg>";
		/** Find the sidebar shell root, or undefined while it is not mounted. */
		function sidebarRoot() {
			const column = document.querySelector("[data-pane=\"sidebar\"], [class*=\"sidebarCol\"]");
			if (column === null) return void 0;
			return column.querySelector("[class*=\"logoRow\"]")?.parentElement ?? column.firstElementChild;
		}
		/** The shell-owned New Session button across current and legacy shells. */
		function newSessionButton(root) {
			return root.querySelector("button[data-dsh-part=\"new-session\"], button[class*=\"newSession\"]") ?? Array.from(root.children).find((child) => child instanceof HTMLElement && child.tagName === "BUTTON");
		}
		/** Locate the shell region that normally contains workspaces and sessions. */
		function regionArea(root) {
			return root.querySelector("[class*=\"regionArea\"]") ?? void 0;
		}
		function makeTab(label, tooltip, icon, onClick) {
			const tab = document.createElement("button");
			tab.type = "button";
			tab.className = panel_module_css_default.sessionTab;
			tab.setAttribute("aria-label", label);
			tab.setAttribute("title", tooltip);
			tab.innerHTML = `<span class="${panel_module_css_default.sessionTabIcon}">${icon}</span><span class="${panel_module_css_default.sessionTabLabel}">${label}</span>`;
			tab.addEventListener("click", onClick);
			return tab;
		}
		function hideShellButton(button) {
			button.dataset.dshImagegenOriginal = "";
			button.setAttribute("aria-hidden", "true");
			button.tabIndex = -1;
			button.style.display = "none";
		}
		function restoreShellButton(button) {
			button.style.removeProperty("display");
			button.removeAttribute("aria-hidden");
			button.removeAttribute("tabindex");
			delete button.dataset.dshImagegenOriginal;
		}
		/** Mount or repair the two-tab host at the shell's New Session position. */
		function placeTabs(root, controller, newSessionLabel, newSessionTooltip, imageLabel, imageTooltip) {
			const button = newSessionButton(root);
			if (button === void 0) return void 0;
			const existing = root.querySelector(ENTRY_SELECTOR);
			if (existing !== null && existing.parentElement === button.parentElement) {
				hideShellButton(button);
				return existing;
			}
			existing?.remove();
			const tabs = document.createElement("div");
			tabs.dataset.dshImagegenSessionTabs = "";
			tabs.className = panel_module_css_default.sessionTabs;
			tabs.setAttribute("role", "tablist");
			tabs.setAttribute("aria-label", imageTooltip);
			const newSessionTab = makeTab(newSessionLabel, newSessionTooltip, NEW_SESSION_ICON, () => {
				controller.close();
				button.click();
			});
			const imageTab = makeTab(imageLabel, imageTooltip, IMAGE_ICON, () => {
				controller.open();
			});
			newSessionTab.dataset.dshImagegenTab = "new-session";
			imageTab.dataset.dshImagegenTab = "image";
			tabs.append(newSessionTab, imageTab);
			button.parentElement?.insertBefore(tabs, button);
			hideShellButton(button);
			return tabs;
		}
		/** Mount an overlay host over the workspace/session tree for image history. */
		function placeHistoryHost(root) {
			const region = regionArea(root);
			if (region === void 0) return void 0;
			const existing = region.querySelector(HISTORY_HOST_SELECTOR);
			if (existing !== null) return existing;
			const host = document.createElement("div");
			host.dataset.dshImagegenHistoryHost = "";
			host.className = panel_module_css_default.sidebarHistoryHost;
			region.append(host);
			return host;
		}
		/**
		* Mount the two tabs and self-heal after React rebuilds the sidebar. The
		* shell-owned button is restored by the disposer so unloading the plugin
		* leaves the host unchanged.
		*/
		function mountSidebarEntry(controller, newSessionLabel, newSessionTooltip, imageLabel, imageTooltip) {
			let root;
			let tabs;
			let historyHost;
			let originalButton;
			const syncActive = () => {
				if (tabs === void 0) return;
				const newTab = tabs.querySelector("[data-dsh-imagegen-tab=\"new-session\"]");
				const imageTab = tabs.querySelector("[data-dsh-imagegen-tab=\"image\"]");
				if (controller.getSnapshot().panelOpen) {
					if (newTab !== null) delete newTab.dataset.active;
					if (imageTab !== null) imageTab.dataset.active = "";
				} else {
					if (newTab !== null) newTab.dataset.active = "";
					if (imageTab !== null) delete imageTab.dataset.active;
				}
			};
			const ensure = () => {
				if (root !== void 0 && !root.isConnected) {
					root = void 0;
					tabs = void 0;
					historyHost = void 0;
					originalButton = void 0;
				}
				root ??= sidebarRoot();
				if (root === void 0) return;
				root.dataset.dshImagegenSidebarRoot = "";
				const button = newSessionButton(root);
				if (button === void 0) return;
				originalButton ??= button;
				tabs = placeTabs(root, controller, newSessionLabel, newSessionTooltip, imageLabel, imageTooltip);
				historyHost = placeHistoryHost(root);
				syncActive();
			};
			const bodyObserver = new MutationObserver(ensure);
			bodyObserver.observe(document.body, {
				childList: true,
				subtree: true
			});
			const unsubscribe = controller.subscribe(syncActive);
			ensure();
			return () => {
				bodyObserver.disconnect();
				unsubscribe();
				tabs?.remove();
				historyHost?.remove();
				if (originalButton !== void 0 && originalButton.isConnected) restoreShellButton(originalButton);
				if (root !== void 0) delete root.dataset.dshImagegenSidebarRoot;
			};
		}
		//#endregion
		//#region src/client/settings-form.ts
		/**
		* Staged form model behind the plugin settings card. A card stages what the
		* user types and writes it only when they save — the settings write is a
		* durable, revision-fenced document mutation, so staging keeps what is on
		* screen exactly what a save would store. Self-contained slice of the same
		* pattern the dsh-web-ui family cards use (this package must not depend on a
		* sibling UI package).
		*/
		/** A free-text field. An empty draft clears the field. */
		function textField(field) {
			return {
				field,
				format: (value) => typeof value === "string" ? value : "",
				parse: (text) => {
					const trimmed = text.trim();
					return trimmed === "" ? { kind: "clear" } : {
						kind: "set",
						value: trimmed
					};
				}
			};
		}
		/** A boolean field, edited through true/false draft text. */
		function booleanField(field) {
			return {
				field,
				format: (value) => typeof value === "boolean" ? String(value) : "",
				parse: (text) => {
					if (text === "true") return {
						kind: "set",
						value: true
					};
					if (text === "false") return {
						kind: "set",
						value: false
					};
				}
			};
		}
		/**
		* A secret field (role('secret') in the namespace schema). The stored value is
		* never rendered or returned by the redacted wire view, so:
		*  - an empty draft means "no change" (typing nothing must never clear an
		*    invisible stored key); the dedicated clear action stages an explicit clear;
		*  - a write's outcome is judged by the namespace's secrets sidecar through
		*    the {@link CardForm} `secretSettled` hook, never by the user layer.
		*/
		function secretField(field) {
			return {
				field,
				secret: true,
				format: () => "",
				parse: (text) => {
					const trimmed = text.trim();
					if (trimmed === "") return void 0;
					return {
						kind: "set",
						value: trimmed
					};
				}
			};
		}
		/**
		* Stages one card's edits over one settings scope and writes them on save.
		*
		* The Host is the only authority on whether a value was accepted — its
		* validators own the constraints no schema can express — so the outcome is
		* read back from the section rather than predicted here. A save that did not
		* land keeps its drafts, so the user can correct them instead of retyping.
		*/
		var CardForm = class {
			scope;
			options;
			specs;
			staged = /* @__PURE__ */ new Map();
			listeners = /* @__PURE__ */ new Set();
			saving = false;
			failed = false;
			/**
			* @param scope - the bound settings scope for this card's namespace.
			* @param specs - the fields this card edits.
			* @param options.secretSettled - for secret fields, whether the namespace
			*   currently holds a stored secret (the redacted view never round-trips the
			*   value, so a write's outcome is read from the secrets sidecar instead).
			*/
			constructor(scope, specs, options = {}) {
				this.scope = scope;
				this.options = options;
				this.specs = new Map(specs.map((spec) => [spec.field, spec]));
				scope.subscribe(() => {
					this.publish();
				});
			}
			/** Publish a projection of this form, rebuilt whenever the scope or a draft changes. */
			bind(project) {
				const store = (0, _deepseek_ai_dsh_client_store.createSnapshotStore)(project());
				this.listeners.add(() => {
					store.set(project());
				});
				return store;
			}
			/** Read the card-level state: what the Host serves, and what a save would do. */
			shell() {
				const snapshot = this.scope.getSnapshot();
				const plan = this.plan();
				return {
					available: snapshot.status !== "loading",
					exposed: snapshot.status === "ready",
					writable: snapshot.writable,
					dirty: plan.length > 0,
					invalid: plan.some((item) => item.run === void 0),
					saving: this.saving,
					failed: this.failed
				};
			}
			/** Read one field's state from the effective section and its staged draft. */
			field(field) {
				const spec = this.specOf(field);
				const staged = this.staged.get(field);
				if (staged === void 0) return {
					text: spec.format(this.sectionValue(field)),
					overridden: this.stored(field),
					invalid: false
				};
				const write = staged.clear ? { kind: "clear" } : spec.parse(staged.text);
				return {
					text: staged.text,
					overridden: write?.kind === "set",
					invalid: write === void 0 && !(spec.secret === true && staged.text.trim() === "")
				};
			}
			/** The actions the card's slot registration injects. */
			actions() {
				return {
					edit: (field, text) => {
						this.stage(field, {
							text,
							clear: false
						});
					},
					resetField: (field) => {
						this.stage(field, {
							text: this.specOf(field).format(this.baseValue(field)),
							clear: true
						});
					},
					save: () => {
						this.save();
					},
					discard: () => {
						if (this.staged.size === 0 && !this.failed) return;
						this.staged.clear();
						this.failed = false;
						this.publish();
					}
				};
			}
			/**
			* Write every staged edit, then re-seed from what the Host accepted.
			* @returns settlement after every write and the read-back.
			*/
			async save() {
				const plan = this.plan();
				const writes = plan.flatMap((item) => item.run === void 0 ? [] : [item.run]);
				if (plan.length === 0 || this.saving || writes.length !== plan.length) return;
				this.saving = true;
				this.failed = false;
				this.publish();
				let landed = true;
				for (const write of writes) landed = await write() && landed;
				if (landed) this.staged.clear();
				this.saving = false;
				this.failed = !landed;
				this.publish();
			}
			/**
			* Every staged edit a save would write. An entry whose draft is not a value
			* its field accepts carries no write: the form is still dirty, and the save
			* refuses rather than dropping the edit. A staged edit that matches the
			* effective section is not a write at all.
			*/
			plan() {
				const plan = [];
				for (const [field, staged] of this.staged) {
					const spec = this.specOf(field);
					if (staged.clear) {
						if (spec.secret === true ? this.options.secretSettled?.(field) ?? false : this.stored(field)) plan.push({
							field,
							run: () => this.clear(field)
						});
						continue;
					}
					if (staged.text === spec.format(this.sectionValue(field))) continue;
					const write = spec.parse(staged.text);
					if (write === void 0) plan.push({
						field,
						run: void 0
					});
					else if (write.kind === "clear") plan.push({
						field,
						run: () => this.clear(field)
					});
					else plan.push({
						field,
						run: () => this.store(field, write.value)
					});
				}
				return plan;
			}
			async clear(field) {
				await this.scope.unset(field);
				if (this.specOf(field).secret === true) return !(this.options.secretSettled?.(field) ?? false);
				return !this.stored(field);
			}
			async store(field, value) {
				await this.scope.set(field, value);
				if (this.specOf(field).secret === true) return this.options.secretSettled?.(field) ?? true;
				return this.userLayer()?.[field] === value;
			}
			stage(field, edit) {
				this.staged.set(field, edit);
				this.failed = false;
				this.publish();
			}
			specOf(field) {
				const spec = this.specs.get(field);
				if (spec === void 0) throw new Error(`settings card has no field ${field}`);
				return spec;
			}
			snapshotOf() {
				return this.scope.getSnapshot();
			}
			sectionValue(field) {
				return this.snapshotOf().value?.[field];
			}
			baseValue(field) {
				return this.snapshotOf().base?.[field];
			}
			userLayer() {
				return this.snapshotOf().user;
			}
			stored(field) {
				const user = this.userLayer();
				return user !== void 0 && Object.hasOwn(user, field);
			}
			publish() {
				for (const listener of [...this.listeners]) listener();
			}
		};
		//#endregion
		//#region src/client/channels-form.ts
		/**
		* Staged form model for the channel list of the settings card. Mirrors the
		* CardForm staging pattern (dirty → one save) but for a structured value, so
		* the card can edit N channels, per-channel keys, and the default-channel
		* flag, then persist everything in one revision-fenced mutate call.
		*
		* Storage rules (dictated by dsh-settings semantics):
		*  - the whole `channels` array is written wholesale via `path: ['channels']`;
		*  - every channel's API key lives at `channelSecrets.<channelId>` (a secret
		*    dict), written per-key so untouched keys are never clobbered by a save
		*    the reader could not see (keys are redacted out of the wire view);
		*  - path ops never navigate *inside* the channels array.
		*/
		/** Deep equality over JSON-compatible data (the change predicate). */
		function deepEqualJson(a, b) {
			if (a === b) return true;
			if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
			if (Array.isArray(a) || Array.isArray(b)) {
				if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
				return a.every((entry, index) => deepEqualJson(entry, b[index]));
			}
			const left = a;
			const right = b;
			const keys = Object.keys(left);
			if (keys.length !== Object.keys(right).length) return false;
			return keys.every((key) => key in right && deepEqualJson(left[key], right[key]));
		}
		/** Trim and normalize a draft channel (models never carry empty aliases). */
		function stripChannel(channel) {
			const models = channel.models.map((model) => ({
				alias: model.alias.trim(),
				id: model.id.trim() === "" ? model.alias.trim() : model.id.trim()
			})).filter((model) => model.alias !== "");
			return {
				id: channel.id,
				preset: channel.preset,
				name: channel.name.trim(),
				apiUrl: channel.apiUrl.trim(),
				models: [...new Map(models.map((model) => [model.alias, model])).values()]
			};
		}
		var ChannelsForm = class {
			scope;
			stagedChannels = null;
			stagedKeys = /* @__PURE__ */ new Map();
			stagedDefault = null;
			listeners = /* @__PURE__ */ new Set();
			saving = false;
			failed = false;
			constructor(scope) {
				this.scope = scope;
				scope.subscribe(() => {
					this.publish();
				});
				scope.subscribeSecretSets(() => {
					this.publish();
				});
			}
			/** Publish a projection of this form, rebuilt on every scope or draft change. */
			bind(project) {
				const store = (0, _deepseek_ai_dsh_client_store.createSnapshotStore)(project());
				this.listeners.add(() => {
					store.set(project());
				});
				return store;
			}
			/** Subscribe to staged and persisted channel changes. */
			subscribe(listener) {
				this.listeners.add(listener);
				return () => {
					this.listeners.delete(listener);
				};
			}
			/** The staged channel list, or the scope value when nothing is staged. */
			channelsValue() {
				const view = this.scope.getSnapshot().value;
				return this.stagedChannels ?? (Array.isArray(view?.channels) ? view.channels.map(toDraft) : []);
			}
			/** Whether a channel currently holds a stored or staged secret. */
			keyHeld(id) {
				const edit = this.stagedKeys.get(id);
				if (edit !== void 0) return edit.kind === "set" && edit.value !== "";
				return this.scope.getSecretSetSnapshot(`channelSecrets.${id}`);
			}
			defaultValue() {
				if (this.stagedDefault !== null) return this.stagedDefault;
				const view = this.scope.getSnapshot().value;
				const channels = this.channelsValue();
				if (view?.defaultChannelId !== void 0 && channels.some((channel) => channel.id === view.defaultChannelId)) return view.defaultChannelId;
				return channels[0]?.id ?? "";
			}
			dirtyValue() {
				const channels = this.channelsValue();
				const stagedChanged = this.stagedChannels !== null && !deepEqualJson(this.stagedChannels, scopeChannelsOf(this.scope));
				const scopeDefault = this.scope.getSnapshot().value?.defaultChannelId ?? channels[0]?.id ?? "";
				const defaultChanged = this.stagedDefault !== null && this.stagedDefault !== scopeDefault;
				return stagedChanged || defaultChanged || this.stagedKeys.size > 0;
			}
			/** The card-facing snapshot. */
			snapshot() {
				const channels = this.channelsValue();
				const keySet = {};
				for (const channel of channels) keySet[channel.id] = this.keyHeld(channel.id);
				return {
					channels,
					keySet,
					defaultChannelId: this.defaultValue(),
					dirty: this.dirtyValue(),
					writable: this.scope.getSnapshot().writable !== false,
					saving: this.saving,
					failed: this.failed
				};
			}
			/** The actions the card's slot registration injects. */
			actions() {
				return {
					setChannels: (channels) => {
						this.stageChannels(channels);
					},
					setChannelKey: (id, value) => {
						this.stageKey(id, value);
					},
					setDefaultChannel: (id) => {
						this.stagedDefault = id;
						this.failed = false;
						this.publish();
					},
					commit: () => this.commit(),
					discard: () => {
						if (this.stagedChannels === null && this.stagedKeys.size === 0 && this.stagedDefault === null && !this.failed) return;
						this.stagedChannels = null;
						this.stagedKeys.clear();
						this.stagedDefault = null;
						this.failed = false;
						this.publish();
					}
				};
			}
			stageChannels(channels) {
				const cleaned = channels.map(stripChannel);
				this.stagedChannels = cleaned;
				this.failed = false;
				this.publish();
			}
			stageKey(id, value) {
				if (value === void 0 || value.trim() === "") {
					if (this.keyHeld(id)) this.stagedKeys.set(id, { kind: "clear" });
				} else this.stagedKeys.set(id, {
					kind: "set",
					value: value.trim()
				});
				this.failed = false;
				this.publish();
			}
			/** Build the single batch of path ops a save performs. */
			planOps() {
				const ops = [];
				if (this.stagedChannels !== null) {
					ops.push({
						op: "set",
						path: ["channels"],
						value: this.stagedChannels
					});
					ops.push({
						op: "unset",
						path: ["apiUrl"]
					});
					ops.push({
						op: "unset",
						path: ["apiKey"]
					});
					ops.push({
						op: "unset",
						path: ["imageModels"]
					});
				}
				for (const [id, edit] of this.stagedKeys) if (edit.kind === "set") ops.push({
					op: "set",
					path: ["channelSecrets", id],
					value: edit.value
				});
				else ops.push({
					op: "unset",
					path: ["channelSecrets", id]
				});
				if (this.stagedDefault !== null) ops.push({
					op: "set",
					path: ["defaultChannelId"],
					value: this.stagedDefault
				});
				return ops;
			}
			/**
			* Write every staged edit, then re-seed from what the Host accepted.
			* @returns settlement after the write settles.
			*/
			async commit() {
				if (this.saving) return;
				const ops = this.planOps();
				if (ops.length === 0) return;
				this.saving = true;
				this.failed = false;
				this.publish();
				try {
					await this.scope.mutateOps(ops);
					this.stagedChannels = null;
					this.stagedKeys.clear();
					this.stagedDefault = null;
					this.failed = false;
				} catch {
					this.failed = true;
				} finally {
					this.saving = false;
					this.publish();
				}
			}
			publish() {
				for (const listener of [...this.listeners]) listener();
			}
		};
		/** Project a stored channel into a draft (secrets never travel in channels). */
		function toDraft(channel) {
			return {
				id: channel.id,
				preset: channel.preset,
				name: channel.name,
				apiUrl: channel.apiUrl,
				models: channel.models.map((model) => ({ ...model }))
			};
		}
		/** The scope's current channels value (a plain array), for change detection. */
		function scopeChannelsOf(scope) {
			const view = scope.getSnapshot().value;
			return Array.isArray(view?.channels) ? view.channels : [];
		}
		//#endregion
		//#region \0dsh-css:/Users/shigure/claude-home/audit/dsh-imagegen/src/client/settings-card.module.css.mjs
		const css$1 = ".ZhEXdW_card{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:12px;list-style:none;transition:border-color .16s,background .16s}.ZhEXdW_card:hover{border-color:var(--dsw-alias-label-dimmed)}.ZhEXdW_card:has(.ZhEXdW_body){background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-label-dimmed)}.ZhEXdW_header{appearance:none;width:100%;font:inherit;color:inherit;text-align:left;cursor:pointer;background:0 0;border:0;border-radius:12px;align-items:center;gap:12px;padding:14px 16px;display:flex}.ZhEXdW_header:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}.ZhEXdW_headText{flex-direction:column;flex:1;gap:4px;min-width:0;display:flex}.ZhEXdW_name{color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600;line-height:1.4}.ZhEXdW_description{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.5}.ZhEXdW_chevron,.ZhEXdW_chevronOpen{color:var(--dsw-alias-label-tertiary);flex:none;transition:transform .16s}.ZhEXdW_chevronOpen{transform:rotate(180deg)}.ZhEXdW_pending{white-space:nowrap;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);border-radius:999px;flex:none;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}.ZhEXdW_body{border-top:1px solid var(--dsw-alias-border-l2);margin:0 16px;padding-bottom:8px}.ZhEXdW_versionRow{border-bottom:1px solid var(--dsw-alias-border-l2);justify-content:space-between;align-items:center;gap:12px;padding:12px 0;display:flex}.ZhEXdW_versionLabel{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:500;line-height:1.5}.ZhEXdW_versionValue{background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);font-family:var(--dsw-font-family-mono,monospace);border-radius:999px;padding:1px 8px;font-size:12px;line-height:1.5}.ZhEXdW_field{flex-direction:column;gap:6px;padding:12px 0;display:flex}.ZhEXdW_field+.ZhEXdW_field{border-top:1px solid var(--dsw-alias-border-l2)}.ZhEXdW_head{align-items:center;gap:8px;display:flex}.ZhEXdW_label{min-width:0;color:var(--dsw-alias-label-primary);flex:1;font-size:13px;font-weight:500;line-height:1.5}.ZhEXdW_badges{align-items:center;gap:8px;display:inline-flex}.ZhEXdW_badge{white-space:nowrap;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);border-radius:999px;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}.ZhEXdW_reset{font:inherit;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;padding:0;font-size:12px;line-height:1.5}.ZhEXdW_reset:hover:not(:disabled){color:var(--dsw-alias-label-primary)}.ZhEXdW_reset:disabled{cursor:default;opacity:.5}.ZhEXdW_input,.ZhEXdW_select{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);height:34px;font:inherit;color:var(--dsw-alias-label-primary);border-radius:8px;outline:none;padding:0 12px;font-size:13px;line-height:1.5}.ZhEXdW_input:focus-visible,.ZhEXdW_select:focus-visible{border-color:var(--dsw-alias-brand-primary)}.ZhEXdW_input:disabled,.ZhEXdW_select:disabled{color:var(--dsw-alias-label-tertiary);cursor:default}.ZhEXdW_inputInvalid{border:1px solid var(--dsw-alias-label-error);background:var(--dsw-alias-bg-layer-3);height:34px;font:inherit;color:var(--dsw-alias-label-primary);border-radius:8px;outline:none;padding:0 12px;font-size:13px;line-height:1.5}.ZhEXdW_textarea,.ZhEXdW_textareaInvalid{resize:vertical;background:var(--dsw-alias-bg-layer-3);min-height:70px;font:inherit;color:var(--dsw-alias-label-primary);border-radius:8px;outline:none;padding:8px 12px;font-size:13px;line-height:1.5}.ZhEXdW_textarea{border:1px solid var(--dsw-alias-border-l2)}.ZhEXdW_textareaInvalid{border:1px solid var(--dsw-alias-label-error)}.ZhEXdW_textarea:focus-visible{border-color:var(--dsw-alias-brand-primary)}.ZhEXdW_textarea:disabled{color:var(--dsw-alias-label-tertiary);cursor:default}.ZhEXdW_hint,.ZhEXdW_invalid{margin:0;font-size:12px;line-height:1.5}.ZhEXdW_hint{color:var(--dsw-alias-label-tertiary)}.ZhEXdW_invalid{color:var(--dsw-alias-label-error)}.ZhEXdW_readOnly,.ZhEXdW_notExposed{color:var(--dsw-alias-label-tertiary);margin:12px 0 0;font-size:12px;line-height:1.5}.ZhEXdW_sectionDivider{background:var(--dsw-alias-border-l2);height:1px;margin:18px 0 14px}.ZhEXdW_sectionTitle{color:var(--dsw-alias-label-primary);margin:0;font-size:14px;line-height:1.4}.ZhEXdW_sectionHint{color:var(--dsw-alias-label-tertiary);margin:-4px 0 2px;font-size:12px;line-height:1.5}.ZhEXdW_modelSection{padding:2px 0 14px}.ZhEXdW_sectionHeader{justify-content:space-between;align-items:flex-start;gap:12px;display:flex}.ZhEXdW_sectionHeader .ZhEXdW_sectionHint{max-width:430px}.ZhEXdW_modelSummary{flex-wrap:wrap;align-items:center;gap:6px;margin-top:12px;display:flex}.ZhEXdW_modelChip{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);max-width:100%;color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family-mono,monospace);border-radius:6px;align-items:center;gap:5px;padding:3px 5px 3px 8px;font-size:12px;line-height:1.5;display:inline-flex}.ZhEXdW_modelChip>span{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.ZhEXdW_modelChip button{appearance:none;width:18px;height:18px;color:var(--dsw-alias-label-tertiary);font:inherit;cursor:pointer;background:0 0;border:0;border-radius:4px;padding:0;line-height:18px}.ZhEXdW_modelChip button:hover:not(:disabled){color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-module-platform)}.ZhEXdW_modelChip button:disabled{cursor:default;opacity:.45}.ZhEXdW_addModel{appearance:none;border:1px dashed var(--dsw-alias-border-l2);min-height:28px;color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;background:0 0;border-radius:6px;padding:0 9px;font-size:12px}.ZhEXdW_addModel:hover:not(:disabled){color:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary)}.ZhEXdW_addModel:disabled{opacity:.45;cursor:default}.ZhEXdW_manualModelRow{gap:8px;margin-top:10px;display:flex}.ZhEXdW_manualModelRow .ZhEXdW_input{flex:1;min-width:0}.ZhEXdW_disclosure{appearance:none;border:0;border-top:1px solid var(--dsw-alias-border-l2);width:100%;color:var(--dsw-alias-label-primary);font:inherit;text-align:left;cursor:pointer;background:0 0;align-items:center;gap:8px;padding:13px 0;font-size:13px;font-weight:500;display:flex}.ZhEXdW_disclosure>span:nth-child(2){color:var(--dsw-alias-label-tertiary);margin-left:auto;font-size:12px;font-weight:400}.ZhEXdW_disclosure>span:last-child{color:var(--dsw-alias-label-tertiary)}.ZhEXdW_disclosure:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}.ZhEXdW_optionalContent{padding:0 0 8px}.ZhEXdW_inlineDisclosure{appearance:none;color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;background:0 0;border:0;align-items:center;gap:6px;margin-top:12px;padding:0;font-size:12px;display:inline-flex}.ZhEXdW_inlineDisclosure:hover{color:var(--dsw-alias-label-primary)}.ZhEXdW_modelFetchRow{align-items:center;gap:8px;display:flex}.ZhEXdW_modelFetch,.ZhEXdW_modelChoices{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);min-height:32px;color:var(--dsw-alias-label-secondary);font:inherit;border-radius:7px;font-size:12px}.ZhEXdW_modelFetch{cursor:pointer;padding:0 10px}.ZhEXdW_modelFetch:hover:not(:disabled){color:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary)}.ZhEXdW_modelFetch:disabled{opacity:.5;cursor:default}.ZhEXdW_modelChoices{flex:1;min-width:0;padding:0 8px}.ZhEXdW_modelCandidateList{flex-wrap:wrap;gap:6px 10px;margin-top:10px;display:flex}.ZhEXdW_modelCandidateLabel{width:100%;color:var(--dsw-alias-label-tertiary);font-size:12px}.ZhEXdW_modelCandidate{appearance:none;min-width:0;color:var(--dsw-alias-label-secondary);cursor:pointer;background:var(--dsw-alias-bg-layer-3);font-size:12px;line-height:1.5;font:inherit;border:1px solid #0000;border-radius:5px;align-items:center;gap:5px;padding:3px 6px;display:inline-flex}.ZhEXdW_modelCandidate input{margin:0}.ZhEXdW_modelCandidate[data-selected]{border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary)}.ZhEXdW_footer{border-top:1px solid var(--dsw-alias-border-l2);justify-content:flex-end;align-items:center;gap:8px;padding:12px 0 4px;display:flex}.ZhEXdW_failed{min-width:0;color:var(--dsw-alias-label-error);flex:1;margin:0;font-size:12px;line-height:1.5}.ZhEXdW_discard,.ZhEXdW_save{appearance:none;font:inherit;cursor:pointer;border:1px solid #0000;border-radius:8px;padding:5px 14px;font-size:13px;line-height:1.5}.ZhEXdW_discard{border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);background:0 0}.ZhEXdW_discard:hover:not(:disabled){color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-dimmed)}.ZhEXdW_save{background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-layer-3)}.ZhEXdW_discard:disabled,.ZhEXdW_save:disabled{opacity:.4;cursor:default}.ZhEXdW_discard:focus-visible,.ZhEXdW_save:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}@media (prefers-reduced-motion:reduce){.ZhEXdW_card,.ZhEXdW_chevron,.ZhEXdW_chevronOpen{transition:none}}.ZhEXdW_channelSection{padding:6px 0 2px}.ZhEXdW_channelEmpty{color:var(--dsw-alias-label-tertiary);margin:10px 0 0;font-size:12px;line-height:1.5}.ZhEXdW_channelList{flex-direction:column;gap:6px;margin:10px 0 0;padding:0;list-style:none;display:flex}.ZhEXdW_channelRow{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:10px;align-items:center;gap:10px;padding:8px 10px;display:flex}.ZhEXdW_channelRow[data-action]{flex-wrap:wrap}.ZhEXdW_channelDotReady,.ZhEXdW_channelDotWarn{border-radius:50%;flex:none;width:9px;height:9px}.ZhEXdW_channelDotReady{background:var(--dsw-color-success,#2fbf71)}.ZhEXdW_channelDotWarn{background:var(--dsw-color-danger,#e5484d)}.ZhEXdW_channelMain{appearance:none;min-width:0;font:inherit;text-align:left;cursor:pointer;background:0 0;border:0;flex-direction:column;flex:1;gap:3px;padding:0;display:flex}.ZhEXdW_channelName{color:var(--dsw-alias-label-primary);text-overflow:ellipsis;white-space:nowrap;font-size:13px;font-weight:600;line-height:1.4;overflow:hidden}.ZhEXdW_channelMeta{flex-wrap:wrap;align-items:center;gap:4px 8px;display:flex}.ZhEXdW_channelHost{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:1.5;font-family:var(--dsw-font-family-mono,monospace);text-overflow:ellipsis;white-space:nowrap;max-width:180px;overflow:hidden}.ZhEXdW_channelBadge{white-space:nowrap;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);border-radius:999px;padding:0 7px;font-size:11px;font-weight:500;line-height:17px}.ZhEXdW_channelBadge[data-warn]{color:var(--dsw-alias-label-error)}.ZhEXdW_channelBadge[data-default]{background:var(--dsw-alias-bg-module-poped,var(--dsw-alias-bg-module-platform));color:var(--dsw-alias-brand-primary)}.ZhEXdW_channelAction{appearance:none;font:inherit;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:0;border-radius:6px;flex:none;padding:4px 8px;font-size:12px;line-height:1.5}.ZhEXdW_channelAction:hover:not(:disabled){color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-module-platform)}.ZhEXdW_channelAction[data-danger]{color:var(--dsw-alias-label-error)}.ZhEXdW_channelAction:disabled{opacity:.45;cursor:default}.ZhEXdW_channelDanger{appearance:none;border:1px solid var(--dsw-alias-label-error);color:var(--dsw-alias-label-error);font:inherit;cursor:pointer;background:0 0;border-radius:6px;flex:none;padding:3px 10px;font-size:12px}.ZhEXdW_channelDanger:hover:not(:disabled){background:color-mix(in srgb, var(--dsw-alias-label-error) 12%, transparent)}.ZhEXdW_channelDanger:disabled{opacity:.45;cursor:default}.ZhEXdW_deleteConfirmText{min-width:0;color:var(--dsw-alias-label-error);flex:1;font-size:12px;line-height:1.5}.ZhEXdW_channelAddRow{gap:8px;margin-top:10px;display:flex}.ZhEXdW_channelAdd{appearance:none;border:1px dashed var(--dsw-alias-border-l2);min-height:30px;color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;background:0 0;border-radius:8px;padding:0 12px;font-size:12px}.ZhEXdW_channelAdd:hover:not(:disabled){color:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary)}.ZhEXdW_channelAdd:disabled{opacity:.45;cursor:default}.ZhEXdW_spacer{flex:1}.ZhEXdW_editorBackdrop{z-index:120;background:color-mix(in srgb, var(--dsw-alias-bg-layer-1,#000) 45%, transparent);justify-content:center;align-items:flex-start;padding:9vh 16px 16px;display:flex;position:fixed;inset:0}.ZhEXdW_editorPanel{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);border-radius:14px;width:min(560px,100%);max-height:82vh;padding:16px;overflow-y:auto;box-shadow:0 18px 50px #00000059}.ZhEXdW_editorHeader{border-bottom:1px solid var(--dsw-alias-border-l2);justify-content:space-between;align-items:flex-start;gap:12px;padding-bottom:10px;display:flex}.ZhEXdW_editorClose{appearance:none;width:26px;height:26px;color:var(--dsw-alias-label-tertiary);font:inherit;cursor:pointer;background:0 0;border:0;border-radius:6px;flex:none;font-size:16px;line-height:26px}.ZhEXdW_editorClose:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-module-platform)}.ZhEXdW_editorField{flex-direction:column;gap:6px;padding:12px 0 0;display:flex}.ZhEXdW_editorDivider{background:var(--dsw-alias-border-l2);height:1px;margin:14px 0 4px}.ZhEXdW_editorSectionHeader{justify-content:space-between;align-items:center;gap:12px;padding:10px 0 4px;display:flex}.ZhEXdW_editorSectionHeader .ZhEXdW_label{flex:1}.ZhEXdW_editorTools{flex-direction:column;gap:8px;margin-top:10px;display:flex}.ZhEXdW_editorFooter{border-top:1px solid var(--dsw-alias-border-l2);align-items:center;gap:8px;padding-top:12px;display:flex}.ZhEXdW_detectOk{color:var(--dsw-color-success,var(--dsw-alias-label-secondary));margin:0;font-size:12px;line-height:1.5}.ZhEXdW_modelRows{flex-direction:column;gap:8px;margin:8px 0 0;padding:0;list-style:none;display:flex}.ZhEXdW_modelRow{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:10px;justify-content:space-between;align-items:center;gap:10px;padding:8px 10px;display:flex}.ZhEXdW_modelRowInputs{flex:1;align-items:center;gap:6px;min-width:0;display:flex}.ZhEXdW_modelRowInputs .ZhEXdW_input{flex:1;min-width:0}.ZhEXdW_modelArrow{color:var(--dsw-alias-label-tertiary);flex:none;font-size:12px}.ZhEXdW_modelRowBadges{flex:none;align-items:center;gap:6px;display:flex}.ZhEXdW_modelBadge{white-space:nowrap;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-tertiary);border-radius:999px;padding:0 7px;font-size:11px;line-height:17px}.ZhEXdW_modelBadge[data-verified]{color:var(--dsw-color-success,var(--dsw-alias-label-secondary))}.ZhEXdW_modelBadge[data-warn]{color:var(--dsw-alias-label-error)}.ZhEXdW_modelRowRemove{appearance:none;width:20px;height:20px;color:var(--dsw-alias-label-tertiary);font:inherit;cursor:pointer;background:0 0;border:0;border-radius:4px;flex:none;padding:0;line-height:20px}.ZhEXdW_modelRowRemove:hover:not(:disabled){color:var(--dsw-alias-label-error);background:var(--dsw-alias-bg-module-platform)}.ZhEXdW_modelRowRemove:disabled{opacity:.45;cursor:default}.ZhEXdW_modelCandidate>.ZhEXdW_modelBadge{flex:none}.ZhEXdW_channelControls{position:relative}.ZhEXdW_presetInline{z-index:10;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);border-radius:10px;width:min(420px,100vw - 48px);max-height:min(440px,60vh);margin:0;padding:12px;position:absolute;bottom:calc(100% + 8px);left:0;overflow-y:auto;box-shadow:0 12px 30px #0000004d}.ZhEXdW_presetInlineHeader{justify-content:space-between;align-items:flex-start;gap:12px;display:flex}.ZhEXdW_presetList{flex-direction:column;gap:8px;margin-top:12px;display:flex}.ZhEXdW_presetRow{appearance:none;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);width:100%;color:inherit;font:inherit;text-align:left;cursor:pointer;border-radius:10px;flex-direction:column;align-items:flex-start;gap:3px;padding:10px 12px;display:flex}.ZhEXdW_presetRow:hover:not(:disabled){border-color:var(--dsw-alias-brand-primary)}.ZhEXdW_presetRow[data-custom]{border-style:dashed}.ZhEXdW_presetRow:disabled{opacity:.5;cursor:default}.ZhEXdW_presetName{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:600;line-height:1.4}.ZhEXdW_presetMeta{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:1.5;font-family:var(--dsw-font-family-mono,monospace)}.ZhEXdW_presetHint{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:1.5}";
		const tagId$1 = "@dickpy/dsh-imagegen/settings-card.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dickpy/dsh-imagegen";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var settings_card_module_css_default = {
			"description": "ZhEXdW_description",
			"presetInlineHeader": "ZhEXdW_presetInlineHeader",
			"channelList": "ZhEXdW_channelList",
			"disclosure": "ZhEXdW_disclosure",
			"editorSectionHeader": "ZhEXdW_editorSectionHeader",
			"inlineDisclosure": "ZhEXdW_inlineDisclosure",
			"editorFooter": "ZhEXdW_editorFooter",
			"pending": "ZhEXdW_pending",
			"input": "ZhEXdW_input",
			"modelRows": "ZhEXdW_modelRows",
			"modelSection": "ZhEXdW_modelSection",
			"chevronOpen": "ZhEXdW_chevronOpen",
			"modelSummary": "ZhEXdW_modelSummary",
			"versionValue": "ZhEXdW_versionValue",
			"invalid": "ZhEXdW_invalid",
			"readOnly": "ZhEXdW_readOnly",
			"reset": "ZhEXdW_reset",
			"channelEmpty": "ZhEXdW_channelEmpty",
			"channelBadge": "ZhEXdW_channelBadge",
			"textareaInvalid": "ZhEXdW_textareaInvalid",
			"presetHint": "ZhEXdW_presetHint",
			"presetMeta": "ZhEXdW_presetMeta",
			"editorTools": "ZhEXdW_editorTools",
			"select": "ZhEXdW_select",
			"modelBadge": "ZhEXdW_modelBadge",
			"editorHeader": "ZhEXdW_editorHeader",
			"notExposed": "ZhEXdW_notExposed",
			"channelDotWarn": "ZhEXdW_channelDotWarn",
			"headText": "ZhEXdW_headText",
			"modelRowRemove": "ZhEXdW_modelRowRemove",
			"presetName": "ZhEXdW_presetName",
			"sectionTitle": "ZhEXdW_sectionTitle",
			"manualModelRow": "ZhEXdW_manualModelRow",
			"modelFetch": "ZhEXdW_modelFetch",
			"channelSection": "ZhEXdW_channelSection",
			"modelCandidateLabel": "ZhEXdW_modelCandidateLabel",
			"spacer": "ZhEXdW_spacer",
			"badges": "ZhEXdW_badges",
			"inputInvalid": "ZhEXdW_inputInvalid",
			"channelDanger": "ZhEXdW_channelDanger",
			"save": "ZhEXdW_save",
			"body": "ZhEXdW_body",
			"optionalContent": "ZhEXdW_optionalContent",
			"modelCandidateList": "ZhEXdW_modelCandidateList",
			"presetInline": "ZhEXdW_presetInline",
			"hint": "ZhEXdW_hint",
			"presetList": "ZhEXdW_presetList",
			"editorPanel": "ZhEXdW_editorPanel",
			"card": "ZhEXdW_card",
			"sectionHint": "ZhEXdW_sectionHint",
			"channelControls": "ZhEXdW_channelControls",
			"presetRow": "ZhEXdW_presetRow",
			"versionLabel": "ZhEXdW_versionLabel",
			"modelArrow": "ZhEXdW_modelArrow",
			"modelCandidate": "ZhEXdW_modelCandidate",
			"modelRowInputs": "ZhEXdW_modelRowInputs",
			"channelAdd": "ZhEXdW_channelAdd",
			"editorDivider": "ZhEXdW_editorDivider",
			"modelChoices": "ZhEXdW_modelChoices",
			"modelChip": "ZhEXdW_modelChip",
			"name": "ZhEXdW_name",
			"footer": "ZhEXdW_footer",
			"field": "ZhEXdW_field",
			"modelRow": "ZhEXdW_modelRow",
			"sectionHeader": "ZhEXdW_sectionHeader",
			"channelMeta": "ZhEXdW_channelMeta",
			"chevron": "ZhEXdW_chevron",
			"textarea": "ZhEXdW_textarea",
			"addModel": "ZhEXdW_addModel",
			"label": "ZhEXdW_label",
			"head": "ZhEXdW_head",
			"channelHost": "ZhEXdW_channelHost",
			"deleteConfirmText": "ZhEXdW_deleteConfirmText",
			"editorBackdrop": "ZhEXdW_editorBackdrop",
			"header": "ZhEXdW_header",
			"discard": "ZhEXdW_discard",
			"versionRow": "ZhEXdW_versionRow",
			"channelMain": "ZhEXdW_channelMain",
			"modelFetchRow": "ZhEXdW_modelFetchRow",
			"channelName": "ZhEXdW_channelName",
			"channelAddRow": "ZhEXdW_channelAddRow",
			"editorField": "ZhEXdW_editorField",
			"detectOk": "ZhEXdW_detectOk",
			"modelRowBadges": "ZhEXdW_modelRowBadges",
			"channelAction": "ZhEXdW_channelAction",
			"badge": "ZhEXdW_badge",
			"channelRow": "ZhEXdW_channelRow",
			"sectionDivider": "ZhEXdW_sectionDivider",
			"failed": "ZhEXdW_failed",
			"editorClose": "ZhEXdW_editorClose",
			"channelDotReady": "ZhEXdW_channelDotReady"
		};
		//#endregion
		//#region src/client/SettingsCard.tsx
		/**
		* The dsh-imagegen settings card: channel management (list rows with status
		* dots, an editor dialog with the model-catalog alias → upstream mapping, and
		* built-in provider presets), plus the prompt-enhancement model and the plugin
		* switches. Registers into the official `settings.plugin.item` slot (the
		* Settings → Plugins → Configurable tab), independent of the dsh-web-ui family
		* group, bound to the plugin's own bridge settings scope.
		*
		* The interaction mirrors the host's model-provider page: one row per channel
		* (status dot + edit/delete), two add buttons (built-in provider / custom),
		* and an editor holding API key, display name, API URL, and the model catalog
		* with detection.
		*/
		/** Bridges the imagegen scope onto the card's staged forms. */
		var ImageGenSettingsCardController = class {
			scope;
			form;
			channelsForm;
			/** @param scope - the bound bridge scope for the dsh-imagegen namespace. */
			constructor(scope) {
				this.scope = scope;
				this.form = new CardForm(scope, [
					booleanField("enabled"),
					booleanField("announceToAgent"),
					booleanField("allowAgentImageGeneration"),
					textField("promptApiUrl"),
					secretField("promptApiKey"),
					textField("promptModel"),
					booleanField("storageEnabled"),
					textField("storageEndpoint"),
					textField("storageRegion"),
					textField("storagePrefix"),
					textField("storageAccessKey"),
					secretField("storageSecretKey"),
					booleanField("storageSyncGallery"),
					booleanField("storageSyncHistory")
				], { secretSettled: (field) => this.scope.getSecretSetSnapshot(field) });
				this.channelsForm = new ChannelsForm(scope);
			}
			projection() {
				const shell = this.form.shell();
				return {
					...shell,
					dirty: shell.dirty || this.channelsForm.snapshot().dirty,
					channels: this.channelsForm.snapshot(),
					enabled: this.form.field("enabled"),
					announceToAgent: this.form.field("announceToAgent"),
					allowAgentImageGeneration: this.form.field("allowAgentImageGeneration"),
					promptApiUrl: this.form.field("promptApiUrl"),
					promptApiKey: this.form.field("promptApiKey"),
					promptModel: this.form.field("promptModel"),
					storageEnabled: this.form.field("storageEnabled"),
					storageEndpoint: this.form.field("storageEndpoint"),
					storageRegion: this.form.field("storageRegion"),
					storagePrefix: this.form.field("storagePrefix"),
					storageAccessKey: this.form.field("storageAccessKey"),
					storageSecretKey: this.form.field("storageSecretKey"),
					storageSyncGallery: this.form.field("storageSyncGallery"),
					storageSyncHistory: this.form.field("storageSyncHistory")
				};
			}
			/**
			* Build the face the card's slot registration injects.
			* @returns the card's snapshot and the form/channel actions.
			*/
			inject() {
				const cardStore = this.form.bind(() => this.projection());
				this.channelsForm.subscribe(() => {
					cardStore.set(this.projection());
				});
				return {
					hooks: { imageGenSettingsCard: cardStore },
					channels: this.channelsForm.actions(),
					storageTest: async () => {
						await this.form.save();
						try {
							const response = await fetch("/api/dsh-imagegen/storage/test", { method: "POST" });
							const body = await response.json();
							if (body.ok === true) return {
								ok: true,
								ms: typeof body.ms === "number" ? body.ms : void 0
							};
							return {
								ok: false,
								message: typeof body.message === "string" ? body.message : `HTTP ${response.status}`
							};
						} catch (error) {
							return {
								ok: false,
								message: error instanceof Error ? error.message : String(error)
							};
						}
					},
					...this.form.actions()
				};
			}
		};
		/**
		* Render the card.
		* @param props - locale copy, the card snapshot, and the form actions.
		* @returns the card, or nothing while the namespace is still loading.
		*/
		function ImageGenSettingsCard(props) {
			const t = tt;
			useImageGenLanguageTick();
			const state = props.useImageGenSettingsCard((snapshot) => snapshot);
			const [open, setOpen] = (0, react.useState)(false);
			const [promptModels, setPromptModels] = (0, react.useState)([]);
			const [loadingPromptModels, setLoadingPromptModels] = (0, react.useState)(false);
			const [promptModelsError, setPromptModelsError] = (0, react.useState)(null);
			const [manualPromptModelOpen, setManualPromptModelOpen] = (0, react.useState)(false);
			const [manualPromptModel, setManualPromptModel] = (0, react.useState)("");
			const [enhancementOpen, setEnhancementOpen] = (0, react.useState)(false);
			const [promptApiOpen, setPromptApiOpen] = (0, react.useState)(false);
			const [storageOpen, setStorageOpen] = (0, react.useState)(false);
			const [storageTesting, setStorageTesting] = (0, react.useState)(false);
			const [storageTestResult, setStorageTestResult] = (0, react.useState)(null);
			const [moreOpen, setMoreOpen] = (0, react.useState)(false);
			const [editingId, setEditingId] = (0, react.useState)(null);
			const [presetPickerOpen, setPresetPickerOpen] = (0, react.useState)(false);
			const [presets, setPresets] = (0, react.useState)([]);
			const [presetError, setPresetError] = (0, react.useState)(null);
			const [usage, setUsage] = (0, react.useState)(null);
			const [confirmDeleteId, setConfirmDeleteId] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				if (!state.exposed) return;
				let alive = true;
				fetch(USAGE_API, { method: "POST" }).then(async (response) => {
					const body = await response.json();
					if (alive && body.ok === true && body.usage !== void 0) setUsage(body.usage);
				}).catch(() => {});
				return () => {
					alive = false;
				};
			}, [state.exposed]);
			if (!state.available) return null;
			const title = t("settings.title");
			const blocked = !state.dirty || state.invalid || state.saving || state.channels.saving;
			const disabled = !state.writable;
			const fieldProps = {
				overriddenLabel: t("settings.overridden"),
				resetLabel: t("settings.reset"),
				invalidLabel: t("settings.invalidNumber"),
				disabled
			};
			if (!state.exposed) return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
				className: settings_card_module_css_default.card,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: settings_card_module_css_default.header,
					"aria-expanded": open,
					"aria-label": `${t(open ? "settings.collapse" : "settings.expand")}: ${title}`,
					onClick: () => {
						setOpen(!open);
					},
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: settings_card_module_css_default.headText,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: settings_card_module_css_default.name,
							children: title
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: settings_card_module_css_default.description,
							children: t("settings.description")
						})]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: open ? settings_card_module_css_default.chevronOpen : settings_card_module_css_default.chevron,
						children: "▾"
					})]
				}), open ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: settings_card_module_css_default.body,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: settings_card_module_css_default.notExposed,
						role: "status",
						children: t("settings.notExposed")
					})
				}) : null]
			});
			const channels = state.channels.channels;
			const editing = editingId === null ? void 0 : channels.find((channel) => channel.id === editingId);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
				className: settings_card_module_css_default.card,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: settings_card_module_css_default.header,
						"aria-expanded": open,
						"aria-label": `${t(open ? "settings.collapse" : "settings.expand")}: ${title}`,
						onClick: () => {
							setOpen(!open);
						},
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: settings_card_module_css_default.headText,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: settings_card_module_css_default.name,
									children: title
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: settings_card_module_css_default.description,
									children: t("settings.description")
								})]
							}),
							state.dirty ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: settings_card_module_css_default.pending,
								children: t("settings.unsaved")
							}) : null,
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: open ? settings_card_module_css_default.chevronOpen : settings_card_module_css_default.chevron,
								children: "▾"
							})
						]
					}),
					open ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: settings_card_module_css_default.body,
						children: [
							!state.writable ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: settings_card_module_css_default.readOnly,
								role: "status",
								children: t("settings.readOnly")
							}) : null,
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
								className: settings_card_module_css_default.channelSection,
								"aria-label": t("channels.title"),
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: settings_card_module_css_default.sectionHeader,
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
											className: settings_card_module_css_default.sectionTitle,
											children: t("channels.title")
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
											className: settings_card_module_css_default.sectionHint,
											children: t("channels.hint")
										})] })
									}),
									channels.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										className: settings_card_module_css_default.channelEmpty,
										children: t("channels.empty")
									}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
										className: settings_card_module_css_default.channelList,
										children: channels.map((channel) => {
											const keyHeld = state.channels.keySet[channel.id] === true;
											const ready = keyHeld && channel.models.length > 0;
											const isDefault = channel.id === state.channels.defaultChannelId;
											if (confirmDeleteId === channel.id) return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
												className: settings_card_module_css_default.channelRow,
												"data-action": true,
												children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: settings_card_module_css_default.deleteConfirmText,
														children: t("channels.deleteConfirmTitle", { name: channel.name || t("channels.untitled") })
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
														type: "button",
														className: settings_card_module_css_default.channelDanger,
														disabled,
														onClick: () => {
															props.channels.setChannels(channels.filter((candidate) => candidate.id !== channel.id));
															if (isDefault && channels.length > 1) {
																const next = channels.find((candidate) => candidate.id !== channel.id);
																if (next !== void 0) props.channels.setDefaultChannel(next.id);
															}
															setConfirmDeleteId(null);
															if (editingId === channel.id) setEditingId(null);
														},
														children: t("channels.confirm")
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
														type: "button",
														className: settings_card_module_css_default.channelAction,
														disabled,
														onClick: () => {
															setConfirmDeleteId(null);
														},
														children: t("channels.cancel")
													})
												]
											}, channel.id);
											return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
												className: settings_card_module_css_default.channelRow,
												children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: ready ? settings_card_module_css_default.channelDotReady : settings_card_module_css_default.channelDotWarn,
														"aria-hidden": "true",
														title: t(ready ? "channels.statusReady" : "channels.statusIncomplete")
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
														type: "button",
														className: settings_card_module_css_default.channelMain,
														disabled,
														onClick: () => {
															setEditingId(channel.id);
														},
														children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															className: settings_card_module_css_default.channelName,
															children: isDefault ? `★ ${channel.name || t("channels.untitled")}` : channel.name || t("channels.untitled")
														}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															className: settings_card_module_css_default.channelMeta,
															children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
																className: settings_card_module_css_default.channelBadge,
																"data-warn": !keyHeld || channel.models.length === 0 ? "" : void 0,
																children: [
																	keyHeld ? t("channels.keySet") : t("channels.keyMissing"),
																	" · ",
																	channel.models.length > 0 ? t("channels.modelCount", { n: channel.models.length }) : t("channels.noModels")
																]
															})
														})]
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
														type: "button",
														className: settings_card_module_css_default.channelAction,
														onClick: () => {
															setEditingId(channel.id);
														},
														children: t("channels.edit")
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
														type: "button",
														className: settings_card_module_css_default.channelAction,
														"data-danger": true,
														onClick: () => {
															setConfirmDeleteId(channel.id);
														},
														children: t("channels.delete")
													})
												]
											}, channel.id);
										})
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: settings_card_module_css_default.channelControls,
										children: [open && presetPickerOpen ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PresetPicker, {
											t,
											presets,
											error: presetError,
											disabled: state.writable === false,
											onLoad: () => {
												setPresetError(null);
												fetch(PRESETS_API, { method: "POST" }).then(async (response) => {
													const body = await response.json();
													if (!response.ok || body.ok !== true || body.presets === void 0) throw new Error(body.message ?? `HTTP ${response.status}`);
													setPresets(body.presets);
												}).catch((error) => {
													setPresetError(error instanceof Error ? error.message : String(error));
												});
											},
											onPick: (preset) => {
												const draft = newChannelDraft(preset);
												props.channels.setChannels([...channels, draft]);
												setPresetPickerOpen(false);
												setEditingId(draft.id);
											},
											onCustom: () => {
												const draft = newChannelDraft(void 0);
												props.channels.setChannels([...channels, draft]);
												setPresetPickerOpen(false);
												setEditingId(draft.id);
											},
											onClose: () => {
												setPresetPickerOpen(false);
											}
										}) : null, /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: settings_card_module_css_default.channelAddRow,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
												type: "button",
												className: settings_card_module_css_default.channelAdd,
												disabled,
												onClick: () => {
													setPresetError(null);
													setPresetPickerOpen(true);
												},
												children: ["+ ", t("channels.addProvider")]
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
												type: "button",
												className: settings_card_module_css_default.channelAdd,
												disabled,
												onClick: () => {
													addCustomChannel(channels, props.channels, setEditingId);
												},
												children: ["+ ", t("channels.addCustom")]
											})]
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: settings_card_module_css_default.disclosure,
								"aria-expanded": enhancementOpen,
								onClick: () => {
									setEnhancementOpen((open) => !open);
								},
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("settings.promptEnhanceTitle") }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("settings.optional") }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										"aria-hidden": "true",
										children: enhancementOpen ? "⌃" : "⌄"
									})
								]
							}),
							enhancementOpen ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
								className: settings_card_module_css_default.optionalContent,
								"aria-label": t("settings.promptEnhanceTitle"),
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										className: settings_card_module_css_default.sectionHint,
										children: t("settings.promptEnhanceHint")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: settings_card_module_css_default.sectionHeader,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
											className: settings_card_module_css_default.sectionTitle,
											children: t("settings.promptModel")
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
											className: settings_card_module_css_default.sectionHint,
											children: t("settings.promptModelDetectionHint")
										})] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: settings_card_module_css_default.modelFetch,
											disabled: disabled || loadingPromptModels,
											onClick: () => {
												setLoadingPromptModels(true);
												setPromptModelsError(null);
												fetch(PROMPT_ENHANCE_API.models, { method: "POST" }).then(async (response) => {
													const body = await response.json();
													if (!response.ok || body.ok !== true) throw new Error(body.message ?? `HTTP ${response.status}`);
													setPromptModels(body.models ?? []);
												}).catch((error) => {
													setPromptModelsError(error instanceof Error ? error.message : String(error));
												}).finally(() => {
													setLoadingPromptModels(false);
												});
											},
											children: loadingPromptModels ? t("settings.promptModelsLoading") : t("settings.promptModelsFetch")
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: settings_card_module_css_default.modelSummary,
										children: [state.promptModel.text.trim() !== "" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											className: settings_card_module_css_default.modelChip,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: state.promptModel.text }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												disabled,
												"aria-label": `${t("settings.removeModel")}: ${state.promptModel.text}`,
												onClick: () => {
													props.edit("promptModel", "");
												},
												children: "×"
											})]
										}) : null, /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: settings_card_module_css_default.addModel,
											disabled,
											onClick: () => {
												setManualPromptModelOpen((open) => !open);
												setEnhancementOpen(true);
											},
											children: manualPromptModelOpen ? t("settings.cancelAddModel") : t("settings.addModel")
										})]
									}),
									manualPromptModelOpen ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: settings_card_module_css_default.manualModelRow,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											className: settings_card_module_css_default.input,
											value: manualPromptModel,
											placeholder: t("settings.addPromptModelPlaceholder"),
											disabled,
											onChange: (event) => {
												setManualPromptModel(event.target.value);
											}
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: settings_card_module_css_default.addModel,
											disabled: disabled || manualPromptModel.trim() === "",
											onClick: () => {
												props.edit("promptModel", manualPromptModel);
												setManualPromptModel("");
											},
											children: t("settings.addModelConfirm")
										})]
									}) : null,
									promptModels.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: settings_card_module_css_default.modelCandidateList,
										role: "radiogroup",
										"aria-label": t("settings.promptModelsCandidates"),
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: settings_card_module_css_default.modelCandidateLabel,
											children: t("settings.promptModelsCandidates")
										}), promptModels.map((candidate) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											role: "radio",
											className: settings_card_module_css_default.modelCandidate,
											"aria-checked": state.promptModel.text === candidate,
											"data-selected": state.promptModel.text === candidate ? "" : void 0,
											disabled,
											onClick: () => {
												props.edit("promptModel", candidate);
											},
											children: candidate
										}, candidate))]
									}) : null,
									promptModelsError !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										className: settings_card_module_css_default.failed,
										role: "status",
										children: promptModelsError
									}) : null,
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: settings_card_module_css_default.inlineDisclosure,
										"aria-expanded": promptApiOpen,
										onClick: () => {
											setPromptApiOpen((open) => !open);
										},
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("settings.promptApiAdvanced") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											"aria-hidden": "true",
											children: promptApiOpen ? "⌃" : "⌄"
										})]
									}),
									promptApiOpen ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: settings_card_module_css_default.optionalContent,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ValueField, {
											id: "dsh-imagegen-settings-prompt-apiurl",
											label: t("settings.promptApiUrl"),
											hint: t("settings.promptApiUrlHint"),
											placeholder: "https://api.openai.com/v1",
											...fieldProps,
											...state.promptApiUrl,
											onEdit: (text) => {
												props.edit("promptApiUrl", text);
											},
											onReset: () => {
												props.resetField("promptApiUrl");
											}
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ValueField, {
											id: "dsh-imagegen-settings-prompt-apikey",
											label: t("settings.promptApiKey"),
											hint: t("settings.promptApiKeyHint"),
											placeholder: "sk-…",
											secret: true,
											...fieldProps,
											...state.promptApiKey,
											overridden: false,
											onEdit: (text) => {
												props.edit("promptApiKey", text);
											},
											onReset: () => {
												props.resetField("promptApiKey");
											}
										})]
									}) : null
								]
							}) : null,
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: settings_card_module_css_default.disclosure,
								"aria-expanded": storageOpen,
								onClick: () => {
									setStorageOpen((open) => !open);
								},
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("settings.storageTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									"aria-hidden": "true",
									children: storageOpen ? "⌃" : "⌄"
								})]
							}),
							storageOpen ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: settings_card_module_css_default.optionalContent,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(BooleanField, {
										id: "dsh-imagegen-settings-storage-enabled",
										label: t("settings.storageEnabled"),
										hint: t("settings.storageHint"),
										inheritLabel: t("settings.inherit"),
										onLabel: t("settings.on"),
										offLabel: t("settings.off"),
										...fieldProps,
										...state.storageEnabled,
										onEdit: (text) => {
											props.edit("storageEnabled", text);
										},
										onReset: () => {
											props.resetField("storageEnabled");
										}
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ValueField, {
										id: "dsh-imagegen-settings-storage-endpoint",
										label: t("settings.storageEndpoint"),
										hint: t("settings.storageEndpointHint"),
										placeholder: "https://bucket-appid.cos.ap-guangzhou.myqcloud.com",
										...fieldProps,
										...state.storageEndpoint,
										onEdit: (text) => {
											props.edit("storageEndpoint", text);
										},
										onReset: () => {
											props.resetField("storageEndpoint");
										}
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ValueField, {
										id: "dsh-imagegen-settings-storage-region",
										label: t("settings.storageRegion"),
										hint: t("settings.storageRegionHint"),
										placeholder: "ap-guangzhou",
										...fieldProps,
										...state.storageRegion,
										onEdit: (text) => {
											props.edit("storageRegion", text);
										},
										onReset: () => {
											props.resetField("storageRegion");
										}
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ValueField, {
										id: "dsh-imagegen-settings-storage-prefix",
										label: t("settings.storagePrefix"),
										hint: t("settings.storagePrefixHint"),
										placeholder: "dsh-imagegen",
										...fieldProps,
										...state.storagePrefix,
										onEdit: (text) => {
											props.edit("storagePrefix", text);
										},
										onReset: () => {
											props.resetField("storagePrefix");
										}
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ValueField, {
										id: "dsh-imagegen-settings-storage-accesskey",
										label: t("settings.storageAccessKey"),
										hint: t("settings.storageAccessKeyHint"),
										placeholder: "AKID…",
										...fieldProps,
										...state.storageAccessKey,
										onEdit: (text) => {
											props.edit("storageAccessKey", text);
										},
										onReset: () => {
											props.resetField("storageAccessKey");
										}
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ValueField, {
										id: "dsh-imagegen-settings-storage-secretkey",
										label: t("settings.storageSecretKey"),
										hint: t("settings.storageSecretKeyHint"),
										placeholder: "…",
										secret: true,
										...fieldProps,
										...state.storageSecretKey,
										overridden: false,
										onEdit: (text) => {
											props.edit("storageSecretKey", text);
										},
										onReset: () => {
											props.resetField("storageSecretKey");
										}
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(BooleanField, {
										id: "dsh-imagegen-settings-storage-gallery",
										label: t("settings.storageSyncGallery"),
										hint: t("settings.storageSyncGalleryHint"),
										inheritLabel: t("settings.inherit"),
										onLabel: t("settings.on"),
										offLabel: t("settings.off"),
										...fieldProps,
										...state.storageSyncGallery,
										onEdit: (text) => {
											props.edit("storageSyncGallery", text);
										},
										onReset: () => {
											props.resetField("storageSyncGallery");
										}
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(BooleanField, {
										id: "dsh-imagegen-settings-storage-history",
										label: t("settings.storageSyncHistory"),
										hint: t("settings.storageSyncHistoryHint"),
										inheritLabel: t("settings.inherit"),
										onLabel: t("settings.on"),
										offLabel: t("settings.off"),
										...fieldProps,
										...state.storageSyncHistory,
										onEdit: (text) => {
											props.edit("storageSyncHistory", text);
										},
										onReset: () => {
											props.resetField("storageSyncHistory");
										}
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: settings_card_module_css_default.modelSummary,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: settings_card_module_css_default.addModel,
											disabled: disabled || storageTesting,
											onClick: () => {
												setStorageTesting(true);
												setStorageTestResult(null);
												props.storageTest().then((outcome) => {
													setStorageTestResult(outcome.ok ? t("settings.storageTestOk", { ms: outcome.ms ?? 0 }) : t("settings.storageTestFailed", { error: outcome.message ?? "error" }));
												}).finally(() => {
													setStorageTesting(false);
												});
											},
											children: storageTesting ? t("settings.storageTesting") : t("settings.storageTest")
										}), storageTestResult !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
											className: settings_card_module_css_default.failed,
											role: "status",
											children: storageTestResult
										}) : null]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										className: settings_card_module_css_default.hint,
										children: t("settings.storageKeyHint")
									})
								]
							}) : null,
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: settings_card_module_css_default.disclosure,
								"aria-expanded": moreOpen,
								onClick: () => {
									setMoreOpen((open) => !open);
								},
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("settings.moreOptions") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									"aria-hidden": "true",
									children: moreOpen ? "⌃" : "⌄"
								})]
							}),
							moreOpen ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: settings_card_module_css_default.optionalContent,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(BooleanField, {
										id: "dsh-imagegen-settings-enabled",
										label: t("settings.enabled"),
										hint: t("settings.enabledHint"),
										inheritLabel: t("settings.inherit"),
										onLabel: t("settings.on"),
										offLabel: t("settings.off"),
										...fieldProps,
										...state.enabled,
										onEdit: (text) => {
											props.edit("enabled", text);
										},
										onReset: () => {
											props.resetField("enabled");
										}
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(BooleanField, {
										id: "dsh-imagegen-settings-announce",
										label: t("settings.announceToAgent"),
										hint: t("settings.announceToAgentHint"),
										inheritLabel: t("settings.inherit"),
										onLabel: t("settings.on"),
										offLabel: t("settings.off"),
										...fieldProps,
										...state.announceToAgent,
										onEdit: (text) => {
											props.edit("announceToAgent", text);
										},
										onReset: () => {
											props.resetField("announceToAgent");
										}
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(BooleanField, {
										id: "dsh-imagegen-settings-agent-generation",
										label: t("settings.allowAgentImageGeneration"),
										hint: t("settings.allowAgentImageGenerationHint"),
										inheritLabel: t("settings.inherit"),
										onLabel: t("settings.on"),
										offLabel: t("settings.off"),
										...fieldProps,
										...state.allowAgentImageGeneration,
										onEdit: (text) => {
											props.edit("enabled", text);
										},
										onReset: () => {
											props.resetField("enabled");
										}
									})
								]
							}) : null,
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: settings_card_module_css_default.footer,
								children: [
									state.failed || state.channels.failed ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										className: settings_card_module_css_default.failed,
										role: "status",
										children: t("settings.saveFailed")
									}) : null,
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: settings_card_module_css_default.discard,
										disabled: !state.dirty || state.saving || state.channels.saving,
										onClick: () => {
											props.discard();
											props.channels.discard();
										},
										children: t("settings.discard")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: settings_card_module_css_default.save,
										disabled: blocked,
										onClick: () => {
											props.channels.commit();
											props.save();
										},
										children: t(!state.saving && !state.channels.saving ? "settings.save" : "settings.saving")
									})
								]
							})
						]
					}) : null,
					open && editing !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ChannelEditor, {
						t,
						channel: editing,
						keyHeld: state.channels.keySet[editing.id] === true,
						usage,
						otherChannels: channels.filter((channel) => channel.id !== editing.id),
						isDefault: editing.id === state.channels.defaultChannelId,
						writable: state.writable,
						onPatch: (patch) => {
							replaceChannel(channels, editing.id, patch, props.channels);
						},
						onSetModels: (models) => {
							props.channels.setChannels(channels.map((channel) => channel.id === editing.id ? {
								...channel,
								models
							} : channel));
						},
						onSetKey: (value) => {
							props.channels.setChannelKey(editing.id, value);
						},
						onSetDefault: () => {
							props.channels.setDefaultChannel(editing.id);
						},
						onRemove: () => {
							props.channels.setChannels(channels.filter((channel) => channel.id !== editing.id));
							if (editing.id === state.channels.defaultChannelId && channels.length > 1) {
								const next = channels.find((channel) => channel.id !== editing.id);
								if (next !== void 0) props.channels.setDefaultChannel(next.id);
							}
							setEditingId(null);
						},
						onClose: () => {
							setEditingId(null);
						}
					}, editing.id) : null
				]
			});
		}
		/** Channel row + dialog helpers -------------------------------------------------- */
		function newChannelDraft(preset) {
			return {
				id: clientId(),
				preset: preset?.id ?? "",
				name: preset?.name ?? "",
				apiUrl: preset?.apiUrl ?? "",
				models: (preset?.models ?? []).map((model) => ({ ...model }))
			};
		}
		function addCustomChannel(channels, form, openEditor) {
			const draft = newChannelDraft(void 0);
			form.setChannels([...channels, draft]);
			openEditor(draft.id);
		}
		/** Patch one field (or models) of one staged channel. */
		function replaceChannel(channels, id, patch, form) {
			form.setChannels(channels.map((channel) => channel.id === id ? {
				...channel,
				...patch
			} : channel));
		}
		function clientId() {
			return (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : void 0) ?? `ch-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
		}
		/** Built-in provider picker, expanded inside the settings card. */
		function PresetPicker(props) {
			const { t } = props;
			const loadedRef = (0, react.useRef)(false);
			(0, react.useEffect)(() => {
				if (loadedRef.current) return;
				loadedRef.current = true;
				props.onLoad();
			}, []);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: settings_card_module_css_default.presetInline,
				"aria-label": t("channels.presetPickerTitle"),
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
					className: settings_card_module_css_default.presetInlineHeader,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
						className: settings_card_module_css_default.sectionTitle,
						children: t("channels.presetPickerTitle")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: settings_card_module_css_default.sectionHint,
						children: t("channels.presetPickerHint")
					})] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: settings_card_module_css_default.editorClose,
						"aria-label": t("preview.close"),
						onClick: props.onClose,
						children: "×"
					})]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: settings_card_module_css_default.presetList,
					children: [
						props.presets.map((preset) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: settings_card_module_css_default.presetRow,
							disabled: props.disabled,
							onClick: () => {
								props.onPick(preset);
							},
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: settings_card_module_css_default.presetName,
								children: preset.name
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: settings_card_module_css_default.presetMeta,
								children: preset.models.map((model) => model.alias).join(" · ")
							})]
						}, preset.id)),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: settings_card_module_css_default.presetRow,
							"data-custom": true,
							disabled: props.disabled,
							onClick: props.onCustom,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: settings_card_module_css_default.presetName,
								children: ["+ ", t("channels.addCustom")]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: settings_card_module_css_default.presetHint,
								children: t("channels.presetCustomHint")
							})]
						}),
						props.error !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: settings_card_module_css_default.failed,
							role: "status",
							children: t("channels.presetLoadFailed", { error: props.error })
						}) : null
					]
				})]
			});
		}
		/** Channel editor (modal): key, display name, API URL, model catalog. */
		function ChannelEditor(props) {
			const { t, channel } = props;
			const [keyDraft, setKeyDraft] = (0, react.useState)("");
			const [candidates, setCandidates] = (0, react.useState)(null);
			const [detecting, setDetecting] = (0, react.useState)(false);
			const [detectError, setDetectError] = (0, react.useState)(null);
			const [manualId, setManualId] = (0, react.useState)("");
			const [removeOpen, setRemoveOpen] = (0, react.useState)(false);
			const [copyFrom, setCopyFrom] = (0, react.useState)("");
			const generatedCount = (alias) => {
				if (props.usage === null) return 0;
				return (props.usage.byChannel[channel.id] ?? props.usage.byChannel[`name:${channel.name}`] ?? {})[alias] ?? props.usage.totals[alias] ?? 0;
			};
			const detect = () => {
				setDetecting(true);
				setDetectError(null);
				const payload = { channelId: channel.id };
				if (channel.apiUrl.trim() !== "") payload.apiUrl = channel.apiUrl.trim();
				if (keyDraft.trim() !== "") payload.apiKey = keyDraft.trim();
				fetch(IMAGE_MODEL_API.models, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify(payload)
				}).then(async (response) => {
					const body = await response.json();
					if (!response.ok || body.ok !== true) throw new Error(body.message ?? `HTTP ${response.status}`);
					setCandidates(body.models ?? []);
				}).catch((error) => {
					setDetectError(error instanceof Error ? error.message : String(error));
				}).finally(() => {
					setDetecting(false);
				});
			};
			const autoDetected = (0, react.useRef)(false);
			(0, react.useEffect)(() => {
				if (autoDetected.current) return;
				autoDetected.current = true;
				if (channel.apiUrl.trim() !== "" && (props.keyHeld || keyDraft.trim() !== "")) detect();
			}, []);
			const addManual = () => {
				const id = manualId.trim();
				if (id === "") return;
				const next = [...channel.models];
				const alias = id;
				if (!next.some((model) => model.alias === alias)) next.push({
					alias,
					id
				});
				props.onSetModels(next);
				setManualId("");
			};
			const copyFromChannel = () => {
				const source = props.otherChannels.find((chance) => chance.id === copyFrom);
				if (source === void 0) return;
				const merged = [...channel.models];
				for (const model of source.models) {
					const alias = model.alias;
					let unique = alias;
					let suffix = 2;
					while (merged.some((entry) => entry.alias === unique)) unique = `${alias} (${suffix++})`;
					merged.push({
						alias: unique,
						id: model.id
					});
				}
				props.onSetModels(merged);
				setCopyFrom("");
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: settings_card_module_css_default.editorBackdrop,
				role: "dialog",
				"aria-modal": "true",
				"aria-label": `${t("channels.editorTitle")} · ${channel.name || t("channels.untitled")}`,
				onClick: props.onClose,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: settings_card_module_css_default.editorPanel,
					onClick: (event) => {
						event.stopPropagation();
					},
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
							className: settings_card_module_css_default.editorHeader,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("h3", {
								className: settings_card_module_css_default.sectionTitle,
								children: [
									t("channels.editorTitle"),
									" · ",
									channel.name || t("channels.untitled")
								]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: settings_card_module_css_default.sectionHint,
								children: t("channels.editorSaveNote")
							})] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: settings_card_module_css_default.editorClose,
								"aria-label": t("preview.close"),
								onClick: props.onClose,
								children: "×"
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: settings_card_module_css_default.editorField,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
								className: settings_card_module_css_default.label,
								htmlFor: "dsh-imagegen-channel-name",
								children: t("channels.displayName")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								id: "dsh-imagegen-channel-name",
								className: settings_card_module_css_default.input,
								value: channel.name,
								placeholder: t("channels.untitled"),
								disabled: !props.writable,
								onChange: (event) => {
									props.onPatch({ name: event.target.value });
								}
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: settings_card_module_css_default.editorField,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
								className: settings_card_module_css_default.label,
								htmlFor: "dsh-imagegen-channel-url",
								children: t("channels.apiUrl")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								id: "dsh-imagegen-channel-url",
								className: settings_card_module_css_default.input,
								value: channel.apiUrl,
								placeholder: "https://api.example.com/v1",
								disabled: !props.writable,
								onChange: (event) => {
									props.onPatch({ apiUrl: event.target.value });
								}
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: settings_card_module_css_default.editorField,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: settings_card_module_css_default.head,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
									className: settings_card_module_css_default.label,
									htmlFor: "dsh-imagegen-channel-key",
									children: t("channels.apiKey")
								}), props.keyHeld || keyDraft !== "" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: settings_card_module_css_default.reset,
									disabled: !props.writable,
									onClick: () => {
										setKeyDraft("");
										props.onSetKey(void 0);
									},
									children: t("channels.keyClear")
								}) : null]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								id: "dsh-imagegen-channel-key",
								className: settings_card_module_css_default.input,
								type: "password",
								autoComplete: "off",
								value: keyDraft,
								placeholder: props.keyHeld ? t("channels.keyReplaceHint") : t("channels.keyMissingHint"),
								disabled: !props.writable,
								onChange: (event) => {
									const value = event.target.value;
									setKeyDraft(value);
									props.onSetKey(value === "" ? void 0 : value);
								}
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: settings_card_module_css_default.editorDivider }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: settings_card_module_css_default.editorSectionHeader,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h4", {
								className: settings_card_module_css_default.label,
								children: t("channels.modelCatalogTitle")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: settings_card_module_css_default.modelFetch,
								disabled: !props.writable || detecting,
								onClick: detect,
								children: detecting ? t("channels.detecting") : t("channels.detect")
							})]
						}),
						detectError !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: settings_card_module_css_default.failed,
							role: "status",
							children: t("channels.detectFailed", { error: detectError })
						}) : null,
						candidates !== null && detectError === null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: settings_card_module_css_default.detectOk,
							role: "status",
							children: t("channels.detectSuccess", { n: candidates.length })
						}) : null,
						channel.models.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: settings_card_module_css_default.sectionHint,
							children: t("channels.noModelsHint")
						}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
							className: settings_card_module_css_default.modelRows,
							children: channel.models.map((model, index) => {
								const entry = describeModel(model.id || model.alias);
								const generated = generatedCount(model.alias);
								return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
									className: settings_card_module_css_default.modelRow,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: settings_card_module_css_default.modelRowInputs,
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
												className: settings_card_module_css_default.input,
												value: model.alias,
												"aria-label": t("channels.modelAliasLabel"),
												disabled: !props.writable,
												onChange: (event) => {
													const next = [...channel.models];
													next[index] = {
														...model,
														alias: event.target.value
													};
													props.onSetModels(next);
												}
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: settings_card_module_css_default.modelArrow,
												children: "→"
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
												className: settings_card_module_css_default.input,
												value: model.id,
												"aria-label": t("channels.modelIdLabel"),
												disabled: !props.writable,
												onChange: (event) => {
													const next = [...channel.models];
													next[index] = {
														...model,
														id: event.target.value
													};
													props.onSetModels(next);
												}
											})
										]
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: settings_card_module_css_default.modelRowBadges,
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
												className: settings_card_module_css_default.modelBadge,
												children: [entry.labelZh, entry.known ? "" : ` · ${t("channels.unknownProtocol")}`]
											}),
											generated > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: settings_card_module_css_default.modelBadge,
												"data-verified": true,
												children: t("channels.generated", { n: generated })
											}) : null,
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: settings_card_module_css_default.modelRowRemove,
												disabled: !props.writable,
												"aria-label": `${t("channels.removeModel")}: ${model.alias}`,
												onClick: () => {
													props.onSetModels(channel.models.filter((_, i) => i !== index));
												},
												children: "×"
											})
										]
									})]
								}, `${model.alias}-${index}`);
							})
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: settings_card_module_css_default.editorTools,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: settings_card_module_css_default.manualModelRow,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									className: settings_card_module_css_default.input,
									value: manualId,
									placeholder: t("channels.manualAddPlaceholder"),
									disabled: !props.writable,
									onChange: (event) => {
										setManualId(event.target.value);
									},
									onKeyDown: (event) => {
										if (event.key === "Enter") {
											event.preventDefault();
											addManual();
										}
									}
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: settings_card_module_css_default.addModel,
									disabled: !props.writable || manualId.trim() === "",
									onClick: addManual,
									children: t("channels.addModelConfirm")
								})]
							}), props.otherChannels.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: settings_card_module_css_default.manualModelRow,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
									className: settings_card_module_css_default.modelChoices,
									value: copyFrom,
									disabled: !props.writable,
									onChange: (event) => {
										setCopyFrom(event.target.value);
									},
									"aria-label": t("channels.copyFrom"),
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: "",
										children: t("channels.copyFrom")
									}), props.otherChannels.map((other) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: other.id,
										children: other.name || t("channels.untitled")
									}, other.id))]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: settings_card_module_css_default.addModel,
									disabled: !props.writable || copyFrom === "",
									onClick: copyFromChannel,
									children: t("channels.copyApply")
								})]
							}) : null]
						}),
						candidates !== null && candidates.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: settings_card_module_css_default.modelCandidateList,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: settings_card_module_css_default.modelCandidateLabel,
								children: t("channels.candidatesTitle")
							}), candidates.map((candidate) => {
								const selected = channel.models.some((model) => model.alias === candidate);
								const entry = describeModel(candidate);
								return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
									className: settings_card_module_css_default.modelCandidate,
									"data-selected": selected ? "" : void 0,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											type: "checkbox",
											checked: selected,
											disabled: !props.writable,
											onChange: () => {
												const merged = selected ? channel.models.filter((model) => model.alias !== candidate) : [...channel.models, {
													alias: candidate,
													id: candidate
												}];
												props.onSetModels(merged);
											}
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: candidate }),
										!entry.known ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: settings_card_module_css_default.modelBadge,
											"data-warn": true,
											children: t("channels.unknownProtocol")
										}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: settings_card_module_css_default.modelBadge,
											children: entry.labelZh
										})
									]
								}, candidate);
							})]
						}) : null,
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: settings_card_module_css_default.editorDivider }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: settings_card_module_css_default.editorFooter,
							children: [
								props.isDefault ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: settings_card_module_css_default.channelBadge,
									"data-default": true,
									children: t("channels.defaultLabel")
								}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: settings_card_module_css_default.inlineDisclosure,
									disabled: !props.writable,
									onClick: props.onSetDefault,
									children: t("channels.setDefault")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: settings_card_module_css_default.spacer }),
								removeOpen ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: settings_card_module_css_default.channelDanger,
									disabled: !props.writable,
									onClick: props.onRemove,
									children: t("channels.confirm")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: settings_card_module_css_default.channelAction,
									onClick: () => {
										setRemoveOpen(false);
									},
									children: t("channels.cancel")
								})] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: settings_card_module_css_default.channelAction,
									"data-danger": true,
									onClick: () => {
										setRemoveOpen(true);
									},
									children: t("channels.deleteThisChannel")
								})
							]
						})
					]
				})
			});
		}
		/** A staged value field; `secret` renders a password control. */
		function ValueField(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: settings_card_module_css_default.field,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: settings_card_module_css_default.head,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
								className: settings_card_module_css_default.label,
								htmlFor: props.id,
								children: props.label
							}),
							props.overridden ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: settings_card_module_css_default.badges,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: settings_card_module_css_default.badge,
									children: props.overriddenLabel
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: settings_card_module_css_default.reset,
									disabled: props.disabled,
									onClick: props.onReset,
									children: props.resetLabel
								})]
							}) : null,
							props.secret === true && props.canClear === true ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: settings_card_module_css_default.reset,
								disabled: props.disabled,
								onClick: props.onClear,
								children: props.clearLabel ?? props.resetLabel
							}) : null
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
						id: props.id,
						className: props.invalid ? settings_card_module_css_default.inputInvalid : settings_card_module_css_default.input,
						type: props.secret === true ? "password" : "text",
						autoComplete: props.secret === true ? "off" : void 0,
						...props.invalid ? { "aria-invalid": true } : {},
						value: props.text,
						placeholder: props.placeholder ?? "",
						disabled: props.disabled,
						onChange: (event) => {
							props.onEdit(event.target.value);
						}
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: props.invalid ? settings_card_module_css_default.invalid : settings_card_module_css_default.hint,
						children: props.invalid ? props.invalidLabel : props.hint
					})
				]
			});
		}
		/** A staged boolean field: 继承 / 开 / 关. */
		function BooleanField(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: settings_card_module_css_default.field,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: settings_card_module_css_default.head,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
							className: settings_card_module_css_default.label,
							htmlFor: props.id,
							children: props.label
						}), props.overridden ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: settings_card_module_css_default.badges,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: settings_card_module_css_default.badge,
								children: props.overriddenLabel
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: settings_card_module_css_default.reset,
								disabled: props.disabled,
								onClick: props.onReset,
								children: props.resetLabel
							})]
						}) : null]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
						id: props.id,
						className: settings_card_module_css_default.select,
						value: props.text,
						disabled: props.disabled,
						onChange: (event) => {
							props.onEdit(event.target.value);
						},
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
								value: "",
								children: props.inheritLabel
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
								value: "true",
								children: props.onLabel
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
								value: "false",
								children: props.offLabel
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: settings_card_module_css_default.hint,
						children: props.hint
					})
				]
			});
		}
		//#endregion
		//#region \0dsh-css:/Users/shigure/claude-home/audit/dsh-imagegen/src/client/image-toolview.module.css.mjs
		const css = ".ZIIeFq_root{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);border-radius:8px;flex-direction:column;gap:7px;margin:4px 0;padding:8px 10px 10px;display:flex}.ZIIeFq_header{min-height:20px;color:var(--dsw-alias-label-secondary);align-items:center;gap:7px;font-size:12px;display:flex}.ZIIeFq_icon{color:var(--dsw-alias-brand-primary);font-size:15px;line-height:1}.ZIIeFq_status{color:var(--dsw-alias-label-tertiary);margin-left:auto;font-size:11px}.ZIIeFq_message,.ZIIeFq_loading,.ZIIeFq_error{color:var(--dsw-alias-label-tertiary);overflow-wrap:anywhere;margin:0;font-size:12px;line-height:1.5}.ZIIeFq_images{flex-wrap:wrap;gap:8px;display:flex}.ZIIeFq_imageLink{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);border-radius:6px;max-width:min(280px,100%);display:block;overflow:hidden}.ZIIeFq_imageLink:hover{border-color:var(--dsw-alias-brand-primary)}.ZIIeFq_image{object-fit:contain;width:auto;max-width:280px;height:auto;max-height:220px;display:block}.ZIIeFq_error{color:var(--dsw-alias-state-error-primary)}";
		const tagId = "@dickpy/dsh-imagegen/image-toolview.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dickpy/dsh-imagegen";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var image_toolview_module_css_default = {
			"loading": "ZIIeFq_loading",
			"root": "ZIIeFq_root",
			"header": "ZIIeFq_header",
			"icon": "ZIIeFq_icon",
			"status": "ZIIeFq_status",
			"imageLink": "ZIIeFq_imageLink",
			"image": "ZIIeFq_image",
			"message": "ZIIeFq_message",
			"error": "ZIIeFq_error",
			"images": "ZIIeFq_images"
		};
		//#endregion
		//#region src/client/image-toolview.tsx
		function isSettled(block) {
			return "kind" in block;
		}
		function imageRefsOf(block) {
			if (!isSettled(block)) return [];
			return block.content.flatMap((content) => content.type === "image" ? [content.attachment] : []);
		}
		function textOf(block) {
			if (!isSettled(block)) return "";
			return block.content.filter((content) => content.type === "text").map((content) => content.text).join("\n");
		}
		function resultInfo(block) {
			if (!isSettled(block)) return {
				status: "running",
				message: "正在生成图片…"
			};
			const text = textOf(block);
			try {
				const parsed = JSON.parse(text);
				return {
					status: typeof parsed.status === "string" ? parsed.status : block.isError ? "failed" : "completed",
					message: typeof parsed.message === "string" ? parsed.message : ""
				};
			} catch {
				return {
					status: block.isError ? "failed" : "completed",
					message: text
				};
			}
		}
		function statusLabel(status) {
			if (status === "running" || status === "queued") return "生成中";
			if (status === "failed") return "生成失败";
			if (status === "cancelled") return "已取消";
			return "图片结果";
		}
		function useAttachmentImages(sessionId, refs, load) {
			const key = (0, react.useMemo)(() => refs.map((ref) => String(ref.attachmentId)).join("|"), [refs]);
			const [images, setImages] = (0, react.useState)([]);
			const [error, setError] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				let disposed = false;
				const urls = [];
				const revoke = () => {
					for (const url of urls) URL.revokeObjectURL(url);
					urls.length = 0;
				};
				setImages([]);
				setError(null);
				if (refs.length === 0) return () => {};
				Promise.all(refs.map(async (ref) => {
					const src = await load(sessionId, ref);
					urls.push(src);
					return {
						ref,
						src
					};
				})).then((next) => {
					if (!disposed) setImages(next);
				}).catch((errorValue) => {
					revoke();
					if (!disposed) setError(errorValue instanceof Error ? errorValue.message : String(errorValue));
				});
				return () => {
					disposed = true;
					revoke();
				};
			}, [
				key,
				load,
				refs,
				sessionId
			]);
			return {
				images,
				error
			};
		}
		/** Register the inline image result view for all image-generation result tools. */
		function registerImageToolviews(ctx) {
			const load = async (_sessionId, ref) => {
				const query = new URLSearchParams({
					attachment_id: String(ref.attachmentId),
					media_type: ref.mediaType,
					bytes: String(ref.bytes),
					width: String(ref.width),
					height: String(ref.height)
				});
				const response = await fetch(`${AGENT_IMAGE_API}?${query.toString()}`);
				if (!response.ok) throw new Error(`无法读取图片附件（HTTP ${response.status}）。`);
				const blob = await response.blob();
				return URL.createObjectURL(blob);
			};
			const ImageToolView = (props) => {
				const refs = (0, react.useMemo)(() => imageRefsOf(props.block), [props.block]);
				const { status, message } = resultInfo(props.block);
				const { images, error } = useAttachmentImages(props.sessionId, refs, load);
				(0, react.useEffect)(() => {
					if (images.length === 0) return;
					document.dispatchEvent(new CustomEvent(CHAT_IMAGE_EVENT, { detail: {
						sessionId: props.sessionId,
						refs: images.map((image) => image.ref)
					} }));
				}, [images, props.sessionId]);
				return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
					className: image_toolview_module_css_default.root,
					"data-state": status,
					"data-tool": props.toolName,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
							className: image_toolview_module_css_default.header,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: image_toolview_module_css_default.icon,
									"aria-hidden": "true",
									children: "▧"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: props.toolName }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: image_toolview_module_css_default.status,
									children: statusLabel(status)
								})
							]
						}),
						message !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: image_toolview_module_css_default.message,
							children: message
						}),
						images.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: image_toolview_module_css_default.images,
							children: images.map((image) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
								className: image_toolview_module_css_default.imageLink,
								href: image.src,
								rel: "noreferrer",
								target: "_blank",
								title: "打开原图",
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
									className: image_toolview_module_css_default.image,
									src: image.src,
									alt: image.ref.name ?? "生成图片"
								})
							}, String(image.ref.attachmentId)))
						}),
						refs.length > 0 && images.length === 0 && error === null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: image_toolview_module_css_default.loading,
							children: "正在加载图片…"
						}),
						error !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: image_toolview_module_css_default.error,
							children: error
						})
					]
				});
			};
			ctx.slots.inject("tool.call.toolview", function* () {
				for (const key of [
					"generate_image",
					"edit_image",
					"get_image_generation_task"
				]) yield ctx.slots.register({
					name: "tool.call.toolview",
					key,
					inject: (sessionId) => ({ sessionId })
				}, ImageToolView);
			});
		}
		//#endregion
		//#region src/client/index.ts
		/** Locale namespace this plugin owns. */
		const NS = "dsh-imagegen";
		/** Required services (fiber inject waiting — the runtime must be up first). */
		const inject = [
			"slots",
			"locale",
			"connection",
			"sessions",
			"conversation"
		];
		/**
		* Mount the studio, its sidebar entry, and the settings card.
		* @param ctx - client root context (services: slots, locale, connection).
		*/
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "dsh-imagegen: dictionaries");
			ctx.effect(() => {
				try {
					return ctx.locale.register(NS, "ru", ru);
				} catch (error) {
					console.warn("[dsh-imagegen] ru dictionary not registered:", error);
					return () => {};
				}
			}, "dsh-imagegen: ru dictionary");
			ctx.effect(() => {
				try {
					if (ctx.locale.getLocale().locales.some((locale) => locale.id === "ru")) return () => {};
					return ctx.locale.addLanguage({
						id: "ru",
						label: "Русский",
						fallback: "en"
					});
				} catch (error) {
					console.warn("[dsh-imagegen] ru language not added to the catalog:", error);
					return () => {};
				}
			}, "dsh-imagegen: ru language pack");
			ctx.effect(() => {
				const applyLocale = () => {
					applyHostLocale(ctx.locale.getLocale().active);
				};
				applyLocale();
				return ctx.locale.subscribe(applyLocale);
			}, "dsh-imagegen: follow host locale");
			registerImageToolviews(ctx);
			const scope = bindImageGenScope(ctx.get("connection")?.isLoopback === true ? (input, init) => fetch(input, init) : () => {
				throw new Error("settings bridge is loopback-only");
			});
			ctx.effect(() => {
				const disposers = [ctx.on("connection/reset", () => {
					scope.load();
				})];
				return () => {
					for (const dispose of disposers) dispose();
				};
			}, "dsh-imagegen: settings scope invalidation");
			const settingsCard = new ImageGenSettingsCardController(scope);
			ctx.slots.inject("settings.plugin.item", () => ctx.slots.register({
				name: "settings.plugin.item",
				key: "dsh-imagegen",
				locale: NS,
				inject: () => settingsCard.inject()
			}, ImageGenSettingsCard));
			let uiDisposer;
			const mountUi = () => {
				if (uiDisposer !== void 0) return;
				const controller = new ImageGenController();
				const api = new ImageGenApi();
				const sessions = ctx.get("sessions");
				const conversation = ctx.get("conversation");
				const disposers = [];
				try {
					disposers.push(mountSidebarEntry(controller, tt("entry.newSession"), tt("entry.newSessionTooltip"), tt("entry.image"), tt("entry.tooltip")));
					disposers.push(mountPanel(controller, api, scope, {
						sessions,
						conversation
					}));
					disposers.push(ctx.locale.subscribe(() => {
						const root = document.querySelector("[data-dsh-imagegen-sidebar-root]");
						if (root === null) return;
						const labels = [[
							"new-session",
							tt("entry.newSession"),
							tt("entry.newSessionTooltip")
						], [
							"image",
							tt("entry.image"),
							tt("entry.tooltip")
						]];
						for (const [tab, label, tooltip] of labels) {
							const button = root.querySelector(`[data-dsh-imagegen-tab="${tab}"]`);
							if (button === null) continue;
							button.setAttribute("aria-label", label);
							button.setAttribute("title", tooltip);
							const labelSpan = button.querySelector("span:nth-child(2)");
							if (labelSpan !== null) labelSpan.textContent = label;
						}
						root.querySelector("[role=\"tablist\"][data-dsh-imagegen-session-tabs]")?.setAttribute("aria-label", tt("entry.tooltip"));
					}));
				} catch (error) {
					console.warn("[dsh-imagegen] mount failed:", error);
				}
				uiDisposer = () => {
					for (const dispose of disposers.splice(0)) dispose();
					uiDisposer = void 0;
				};
			};
			const syncEnabled = () => {
				const snapshot = scope.getSnapshot();
				if (snapshot.status === "ready" ? snapshot.value?.enabled ?? true : snapshot.status === "unavailable") mountUi();
				else uiDisposer?.();
			};
			scope.subscribe(syncEnabled);
			syncEnabled();
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map
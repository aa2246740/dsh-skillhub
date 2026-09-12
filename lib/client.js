window.__ModuleLoader__.load({
	id: "dsh-skillhub",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_dom = require("react-dom");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region \0css-module:SkillHubPanel.module.css.mjs
		const css = ".H9YCKq_root{box-sizing:border-box;min-width:0;color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family);--skillhub-motion-fast:.14s;--skillhub-motion-panel:.18s;--skillhub-ease-out:cubic-bezier(.2, .8, .2, 1);flex-direction:column;gap:12px;font-size:13px;line-height:20px;display:flex}.H9YCKq_root[data-surface=page]{max-width:720px;min-height:0;max-height:100%;padding:4px 0 24px;overflow:auto}.H9YCKq_root[data-surface=popover]{width:400px;max-width:calc(100vw - 24px);max-height:min(640px,100vh - 24px);overflow:hidden}.H9YCKq_root[data-surface=popover] .H9YCKq_body,.H9YCKq_root[data-surface=page] .H9YCKq_body{flex:auto;max-height:min(420px,52vh)}.H9YCKq_chipWrap{position:relative}.H9YCKq_trigger{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);height:32px;color:var(--dsw-alias-label-primary);font:inherit;cursor:pointer;transition:background-color var(--skillhub-motion-fast) ease, border-color var(--skillhub-motion-fast) ease, color var(--skillhub-motion-fast) ease, transform .1s ease;background:0 0;border-radius:18px;justify-content:center;align-items:center;gap:6px;padding:0 10px 0 8px;font-size:13px;font-weight:500;line-height:20px;display:inline-flex}.H9YCKq_trigger:hover:not(:disabled),.H9YCKq_trigger:focus-visible{background:var(--dsw-alias-interactive-bg-hover)}.H9YCKq_trigger:active:not(:disabled){transform:scale(.96)}.H9YCKq_trigger:focus-visible{outline:2px solid var(--dsw-static-deepseek-450);outline-offset:2px}.H9YCKq_trigger[data-open]{border-color:var(--dsw-alias-button-ghost-active-border);background:var(--dsw-alias-button-ghost-active-fill);color:var(--dsw-static-deepseek-450)}.H9YCKq_triggerLabel{white-space:nowrap}@container (width<=460px){.H9YCKq_triggerLabel{display:none}.H9YCKq_trigger{width:32px;padding:0}}.H9YCKq_menu{z-index:900;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-specific-menu);max-width:calc(100vw - 24px);max-height:min(640px,100vh - 24px);box-shadow:var(--dsw-shadow-lv3);color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family);transform-origin:0 100%;animation:H9YCKq_skillhub-panel-enter var(--skillhub-motion-panel) var(--skillhub-ease-out);isolation:isolate;border-radius:12px;flex-direction:column;font-size:13px;line-height:20px;display:flex;position:fixed;overflow:hidden}.H9YCKq_menu .H9YCKq_root{gap:10px;padding:14px 14px 12px}@keyframes H9YCKq_skillhub-panel-enter{0%{opacity:0;transform:translateY(5px)scale(.992)}to{opacity:1;transform:translateY(0)scale(1)}}.H9YCKq_header{flex-direction:column;gap:8px;min-width:0;display:flex}.H9YCKq_titleRow{justify-content:space-between;align-items:flex-start;gap:12px;min-width:0;display:flex}.H9YCKq_titleBlock{min-width:0}.H9YCKq_eyebrow{color:var(--dsw-static-deepseek-450);font-size:12px;font-weight:500;line-height:18px}.H9YCKq_title{color:var(--dsw-alias-label-primary);margin:2px 0 0;font-size:17px;font-weight:600;line-height:24px}.H9YCKq_lede,.H9YCKq_helper,.H9YCKq_meta,.H9YCKq_path,.H9YCKq_empty,.H9YCKq_muted{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:18px}.H9YCKq_lede{margin-top:2px}.H9YCKq_counts{color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;flex-wrap:wrap;align-items:center;font-size:12px;line-height:18px;display:flex}.H9YCKq_counts span+span:before{content:\"·\";color:var(--dsw-alias-label-dimmed);margin:0 6px}.H9YCKq_headerActions{flex-wrap:wrap;flex:none;justify-content:flex-start;gap:4px;display:flex}.H9YCKq_root[data-surface=popover] .H9YCKq_titleRow{flex-direction:column;gap:6px}.H9YCKq_root[data-surface=popover] .H9YCKq_headerActions{justify-content:flex-end;width:100%}.H9YCKq_layer{flex-direction:column;gap:6px;min-width:0;display:flex}.H9YCKq_segment{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);border-radius:18px;min-width:0;padding:2px;display:flex}.H9YCKq_scope{border:1px solid var(--dsw-alias-button-ghost-active-border);background:var(--dsw-alias-button-ghost-active-fill);color:var(--dsw-alias-label-primary);border-radius:14px;align-self:flex-start;padding:4px 10px;font-size:12px;font-weight:500;line-height:18px}.H9YCKq_segment button{min-width:0;height:28px;color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;background:0 0;border:0;border-radius:14px;flex:1 1 0;padding:0 8px;font-size:12px;font-weight:500;line-height:18px}.H9YCKq_segment button[data-active]{background:var(--dsw-alias-button-ghost-active-fill);box-shadow:inset 0 0 0 1px var(--dsw-alias-button-ghost-active-border);color:var(--dsw-alias-label-primary)}.H9YCKq_segment button:disabled{cursor:not-allowed;opacity:.45}.H9YCKq_segment button:focus-visible,.H9YCKq_switch:focus-visible,.H9YCKq_chevron:focus-visible,.H9YCKq_inherit:focus-visible{outline:2px solid var(--dsw-static-deepseek-450);outline-offset:2px}.H9YCKq_search{flex-direction:column;gap:6px;min-width:0;display:flex}.H9YCKq_field{width:100%;min-width:0}.H9YCKq_body{overscroll-behavior:contain;--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2);--dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2);flex-direction:column;flex:1;gap:10px;min-height:0;display:flex;overflow:auto}.H9YCKq_banner,.H9YCKq_error,.H9YCKq_warn{border-radius:8px;margin:0;padding:8px 10px;font-size:12px;line-height:18px}.H9YCKq_error{color:var(--dsw-alias-state-error-primary);background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 10%, transparent)}.H9YCKq_warn{color:var(--dsw-alias-state-warn-primary);background:color-mix(in srgb, var(--dsw-alias-state-warn-primary) 12%, transparent)}.H9YCKq_bannerRow{flex-direction:column;align-items:flex-start;gap:8px;display:flex}.H9YCKq_home{flex-direction:column;gap:2px;min-width:0;display:flex}.H9YCKq_home+.H9YCKq_home{border-top:1px solid var(--dsw-alias-border-l2);margin-top:10px;padding-top:10px}.H9YCKq_homeHead{justify-content:space-between;align-items:baseline;gap:8px;padding:4px 4px 6px;display:flex}.H9YCKq_homeTitle{color:var(--dsw-alias-label-secondary);margin:0;font-size:12px;font-weight:600;line-height:18px}.H9YCKq_homePath{margin:-2px 0 4px;padding:0 6px 4px 72px}.H9YCKq_path{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.H9YCKq_row{box-sizing:border-box;min-height:36px;padding:4px 6px 4px calc(6px + var(--depth,0) * 16px);border-radius:8px;grid-template-columns:18px 32px minmax(0,1fr) auto;align-items:center;gap:8px;display:grid}.H9YCKq_row:hover{background:var(--dsw-alias-interactive-bg-hover)}.H9YCKq_row[data-broken]{grid-template-columns:18px minmax(0,1fr)}.H9YCKq_leaf{grid-template-columns:18px 32px minmax(0,1fr) auto}.H9YCKq_leaf .H9YCKq_name{grid-column:3}.H9YCKq_chevron{width:24px;height:24px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:0;border-radius:6px;justify-content:center;align-items:center;padding:0;display:inline-flex}.H9YCKq_chevron[aria-expanded=true]{color:var(--dsw-alias-label-secondary)}.H9YCKq_chevron svg{transition:transform var(--skillhub-motion-fast) var(--skillhub-ease-out)}.H9YCKq_chevron[aria-expanded=true] svg{transform:rotate(90deg)}.H9YCKq_chevronGhost{width:18px;height:18px}.H9YCKq_nameBtn{min-width:0;color:inherit;font:inherit;text-align:left;cursor:pointer;background:0 0;border:0;padding:0;display:flex}.H9YCKq_nameBtn:disabled{cursor:default}.H9YCKq_nameBtn:focus-visible{outline:2px solid var(--dsw-static-deepseek-450);outline-offset:2px}.H9YCKq_name{min-width:0;color:var(--dsw-alias-label-primary);flex-wrap:wrap;align-items:baseline;gap:6px;display:flex}.H9YCKq_nameText{overflow-wrap:anywhere}.H9YCKq_badge,.H9YCKq_source,.H9YCKq_collision,.H9YCKq_brokenMark{flex:none;font-size:11px;font-weight:500;line-height:16px}.H9YCKq_badge{color:var(--dsw-alias-label-tertiary)}.H9YCKq_source{color:var(--dsw-static-deepseek-450)}.H9YCKq_collision{color:var(--dsw-alias-state-warn-primary)}.H9YCKq_brokenMark,.H9YCKq_broken{color:var(--dsw-alias-state-error-primary)}.H9YCKq_inherit{min-width:0;color:var(--dsw-static-deepseek-450);font:inherit;cursor:pointer;background:0 0;border:0;border-radius:6px;padding:2px 6px;font-size:11px;font-weight:500;line-height:16px}.H9YCKq_inherit:hover:not(:disabled){background:var(--dsw-alias-button-ghost-active-fill)}.H9YCKq_inherit:disabled{cursor:not-allowed;opacity:.45}.H9YCKq_switch{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);cursor:pointer;border-radius:999px;flex:none;width:32px;height:18px;padding:0;position:relative}.H9YCKq_switch[data-state=on]{border-color:var(--dsw-static-deepseek-450);background:var(--dsw-static-deepseek-450)}.H9YCKq_switch[data-state=mixed]{border-color:var(--dsw-static-deepseek-450);background:color-mix(in srgb, var(--dsw-static-deepseek-450) 38%, var(--dsw-alias-bg-layer-2))}.H9YCKq_switch:disabled{cursor:not-allowed;opacity:.45}.H9YCKq_thumb{background:var(--dsw-alias-label-primary-foreground,#fff);width:14px;height:14px;transition:transform var(--skillhub-motion-fast) var(--skillhub-ease-out);border-radius:50%;position:absolute;top:1px;left:1px;box-shadow:0 1px 2px #0000002e}.H9YCKq_switch[data-state=on] .H9YCKq_thumb{transform:translate(14px)}.H9YCKq_switch[data-state=mixed] .H9YCKq_thumb{transform:translate(7px)}.H9YCKq_empty{padding:8px 6px 12px}.H9YCKq_skeleton{flex-direction:column;gap:8px;padding:4px 0;display:flex}.H9YCKq_skel{background:var(--dsw-alias-bg-layer-2);border-radius:8px;height:36px}.H9YCKq_root[aria-busy=true] .H9YCKq_body{opacity:.72}.H9YCKq_tabsRow{flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px;min-width:0;padding-bottom:2px;display:flex}.H9YCKq_tabs{background:var(--dsw-alias-bg-layer-2);border-radius:8px;align-items:center;gap:2px;padding:2px;display:inline-flex}.H9YCKq_tabBtn{box-sizing:border-box;height:26px;color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;transition:background-color var(--skillhub-motion-fast) ease, color var(--skillhub-motion-fast) ease, box-shadow var(--skillhub-motion-fast) ease;background:0 0;border:none;border-radius:6px;align-items:center;gap:5px;padding:0 10px;font-size:12px;font-weight:500;line-height:18px;display:inline-flex}.H9YCKq_tabBtn:hover:not(:disabled){color:var(--dsw-alias-label-primary)}.H9YCKq_tabBtn[data-active]{background:var(--dsw-specific-menu);color:var(--dsw-alias-label-primary);font-weight:600;box-shadow:0 1px 2px #00000014}.H9YCKq_tabBadge{background:var(--dsw-alias-bg-layer-2);min-width:16px;height:16px;color:var(--dsw-alias-label-secondary);border-radius:8px;justify-content:center;align-items:center;padding:0 4px;font-size:10px;font-weight:600;line-height:16px;display:inline-flex}.H9YCKq_tabBtn[data-active] .H9YCKq_tabBadge{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-static-deepseek-450)}.H9YCKq_emptyCard{box-sizing:border-box;text-align:center;border:1px dashed var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);border-radius:10px;flex-direction:column;justify-content:center;align-items:center;margin:8px 0 12px;padding:32px 20px 24px;display:flex}.H9YCKq_emptyIcon{background:var(--dsw-alias-bg-layer-2);width:48px;height:48px;color:var(--dsw-alias-label-tertiary);border-radius:50%;justify-content:center;align-items:center;margin-bottom:12px;display:flex}.H9YCKq_emptyTitle{color:var(--dsw-alias-label-primary);margin:0 0 6px;font-size:13px;font-weight:600;line-height:20px}.H9YCKq_emptyDesc{color:var(--dsw-alias-label-secondary);max-width:320px;margin:0 0 10px;font-size:12px;line-height:18px}.H9YCKq_emptyNote{color:var(--dsw-alias-label-tertiary);background:var(--dsw-alias-bg-layer-2);border-radius:6px;max-width:320px;margin:0;padding:4px 8px;font-size:11px;line-height:16px}.H9YCKq_mcpList{flex-direction:column;gap:4px;padding:4px 0;display:flex}.H9YCKq_mcpRow{}.H9YCKq_unsupported{color:var(--dsw-alias-state-warn-primary);background:var(--dsw-alias-state-warn-secondary,#f59e0b1f);border-radius:4px;padding:1px 6px;font-size:11px;line-height:16px}@media (prefers-reduced-motion:reduce){.H9YCKq_menu{animation:none}.H9YCKq_trigger,.H9YCKq_thumb,.H9YCKq_chevron svg{transition:none}.H9YCKq_trigger:active:not(:disabled){transform:none}}";
		const tagId = "dsh-skillhub/SkillHubPanel.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-skillhub";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var SkillHubPanel_module_css_default = {
			"badge": "H9YCKq_badge",
			"banner": "H9YCKq_banner",
			"bannerRow": "H9YCKq_bannerRow",
			"body": "H9YCKq_body",
			"broken": "H9YCKq_broken",
			"brokenMark": "H9YCKq_brokenMark",
			"chevron": "H9YCKq_chevron",
			"chevronGhost": "H9YCKq_chevronGhost",
			"chipWrap": "H9YCKq_chipWrap",
			"collision": "H9YCKq_collision",
			"counts": "H9YCKq_counts",
			"empty": "H9YCKq_empty",
			"emptyCard": "H9YCKq_emptyCard",
			"emptyDesc": "H9YCKq_emptyDesc",
			"emptyIcon": "H9YCKq_emptyIcon",
			"emptyNote": "H9YCKq_emptyNote",
			"emptyTitle": "H9YCKq_emptyTitle",
			"error": "H9YCKq_error",
			"eyebrow": "H9YCKq_eyebrow",
			"field": "H9YCKq_field",
			"header": "H9YCKq_header",
			"headerActions": "H9YCKq_headerActions",
			"helper": "H9YCKq_helper",
			"home": "H9YCKq_home",
			"homeHead": "H9YCKq_homeHead",
			"homePath": "H9YCKq_homePath",
			"homeTitle": "H9YCKq_homeTitle",
			"inherit": "H9YCKq_inherit",
			"layer": "H9YCKq_layer",
			"leaf": "H9YCKq_leaf",
			"lede": "H9YCKq_lede",
			"mcpList": "H9YCKq_mcpList",
			"mcpRow": "H9YCKq_mcpRow",
			"menu": "H9YCKq_menu",
			"meta": "H9YCKq_meta",
			"muted": "H9YCKq_muted",
			"name": "H9YCKq_name",
			"nameBtn": "H9YCKq_nameBtn",
			"nameText": "H9YCKq_nameText",
			"path": "H9YCKq_path",
			"root": "H9YCKq_root",
			"row": "H9YCKq_row",
			"scope": "H9YCKq_scope",
			"search": "H9YCKq_search",
			"segment": "H9YCKq_segment",
			"skel": "H9YCKq_skel",
			"skeleton": "H9YCKq_skeleton",
			"skillhub-panel-enter": "H9YCKq_skillhub-panel-enter",
			"source": "H9YCKq_source",
			"switch": "H9YCKq_switch",
			"tabBadge": "H9YCKq_tabBadge",
			"tabBtn": "H9YCKq_tabBtn",
			"tabs": "H9YCKq_tabs",
			"tabsRow": "H9YCKq_tabsRow",
			"thumb": "H9YCKq_thumb",
			"title": "H9YCKq_title",
			"titleBlock": "H9YCKq_titleBlock",
			"titleRow": "H9YCKq_titleRow",
			"trigger": "H9YCKq_trigger",
			"triggerLabel": "H9YCKq_triggerLabel",
			"unsupported": "H9YCKq_unsupported",
			"warn": "H9YCKq_warn"
		};
		//#endregion
		//#region src/client/McpPanel.tsx
		function McpPanel(props) {
			const { t, layer, sessionId, folder, layerReady } = props;
			const [catalog, setCatalog] = (0, react.useState)();
			const [error, setError] = (0, react.useState)();
			const [busy, setBusy] = (0, react.useState)(false);
			const generation = (0, react.useRef)(0);
			const tRef = (0, react.useRef)(t);
			tRef.current = t;
			const onCountRef = (0, react.useRef)(props.onServerCountChange);
			onCountRef.current = props.onServerCountChange;
			const query = {
				layer,
				...sessionId ? { sessionId } : {},
				...folder ? { folder } : {}
			};
			const key = JSON.stringify(query);
			const request = (0, react.useCallback)(async (path, body, signal) => {
				const copy = tRef.current;
				const response = await fetch(`/skillhub/mcp/${path}`, body === void 0 ? { ...signal ? { signal } : {} } : {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify(body)
				});
				if (!response.headers.get("content-type")?.includes("application/json")) throw new Error(copy("mcp.unavailable"));
				const data = await response.json();
				if (!response.ok) throw new Error(data.error ?? `HTTP ${response.status}`);
				if (!Array.isArray(data.servers)) throw new Error(copy("mcp.unavailable"));
				return data;
			}, []);
			const applyCatalog = (data) => {
				setCatalog(data);
				onCountRef.current?.(data.servers.length);
			};
			const load = (0, react.useCallback)((clear) => {
				const current = ++generation.current;
				const controller = new AbortController();
				if (clear) setCatalog(void 0);
				setError(void 0);
				request(`catalog?${new URLSearchParams(JSON.parse(key))}`, void 0, controller.signal).then((data) => {
					if (current === generation.current) applyCatalog(data);
				}).catch((caught) => {
					if (!controller.signal.aborted && current === generation.current) setError(caught.message);
				});
				return () => {
					++generation.current;
					controller.abort();
				};
			}, [key, request]);
			(0, react.useEffect)(() => {
				return load(catalog === void 0);
			}, [key, load]);
			const update = async (server, on) => {
				const current = generation.current;
				setBusy(true);
				setError(void 0);
				try {
					const data = await request(on === void 0 ? "inherit" : "toggle", {
						...query,
						server,
						...on === void 0 ? {} : { on }
					});
					if (current === generation.current) applyCatalog(data);
				} catch (caught) {
					if (current === generation.current) setError(String(caught));
				} finally {
					if (current === generation.current) setBusy(false);
				}
			};
			const bulkUpdate = async (on) => {
				if (!catalog?.servers) return;
				const current = generation.current;
				setBusy(true);
				setError(void 0);
				try {
					let latest;
					for (const server of catalog.servers) latest = await request(on === void 0 ? "inherit" : "toggle", {
						...query,
						server: server.name,
						...on === void 0 ? {} : { on }
					});
					if (latest && current === generation.current) applyCatalog(latest);
				} catch (caught) {
					if (current === generation.current) setError(String(caught));
				} finally {
					if (current === generation.current) setBusy(false);
				}
			};
			const servers = catalog?.servers ?? [];
			const onCount = servers.filter((s) => s.gate === "on").length;
			const offCount = servers.filter((s) => s.gate === "off").length;
			const hasOverrides = layer !== "global" && servers.some((s) => s.source === layer);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: SkillHubPanel_module_css_default.mcpContainer,
				"data-ud-check": "skillhub-mcp-container",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
					className: SkillHubPanel_module_css_default.header,
					"data-ud-check": "skillhub-mcp-header",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: SkillHubPanel_module_css_default.titleRow,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: SkillHubPanel_module_css_default.titleBlock,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
								className: SkillHubPanel_module_css_default.title,
								children: t(props.surface === "page" ? "mcp.title.global" : "mcp.title.context")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: SkillHubPanel_module_css_default.lede,
								children: t(props.surface === "page" ? "mcp.lede.global" : "mcp.lede.context")
							})]
						}), servers.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: SkillHubPanel_module_css_default.headerActions,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
									variant: "ghost",
									size: "sm",
									disabled: !layerReady || busy,
									onClick: () => void bulkUpdate(false),
									children: t("allOff")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
									variant: "ghost",
									size: "sm",
									disabled: !layerReady || busy,
									onClick: () => void bulkUpdate(true),
									children: t("allOn")
								}),
								hasOverrides ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
									variant: "ghost",
									size: "sm",
									disabled: !layerReady || busy,
									onClick: () => void bulkUpdate(void 0),
									children: t("allInherit")
								}) : null
							]
						}) : null]
					}), servers.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: SkillHubPanel_module_css_default.counts,
						"aria-live": "polite",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("count.on", { n: onCount }) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("count.off", { n: offCount }) })]
					}) : null]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: SkillHubPanel_module_css_default.body,
					"data-ud-check": "skillhub-mcp-body",
					children: [
						error !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: SkillHubPanel_module_css_default.bannerRow,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: SkillHubPanel_module_css_default.error,
								role: "alert",
								children: error
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "outline",
								size: "sm",
								onClick: () => void load(false),
								children: t("error.retry")
							})]
						}) : null,
						catalog === void 0 && error === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: SkillHubPanel_module_css_default.skeleton,
							"aria-label": t("loading"),
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: SkillHubPanel_module_css_default.skel }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: SkillHubPanel_module_css_default.skel })]
						}) : null,
						catalog !== void 0 && servers.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: SkillHubPanel_module_css_default.emptyCard,
							"data-ud-check": "skillhub-mcp-empty",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: SkillHubPanel_module_css_default.emptyIcon,
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCordisPluginOutline14, { size: 28 })
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
									className: SkillHubPanel_module_css_default.emptyTitle,
									children: t("mcp.empty.title")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									className: SkillHubPanel_module_css_default.emptyDesc,
									children: t("mcp.empty.desc")
								})
							]
						}) : null,
						catalog !== void 0 && servers.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: SkillHubPanel_module_css_default.mcpList,
							children: servers.map((server) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: `${SkillHubPanel_module_css_default.row} ${SkillHubPanel_module_css_default.leaf}`,
								style: { "--depth": "0" },
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: SkillHubPanel_module_css_default.chevronGhost }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(GateSwitch, {
										gate: server.gate,
										label: t("switch.mcp", {
											name: server.name,
											state: gateWord(t, server.gate)
										}),
										disabled: !layerReady || busy || !server.supported && server.gate === "on",
										onChange: (on) => void update(server.name, on)
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: SkillHubPanel_module_css_default.name,
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: SkillHubPanel_module_css_default.nameText,
												children: server.name
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: SkillHubPanel_module_css_default.badge,
												children: t("mcp.tools", { n: server.tools })
											}),
											layer !== "global" && server.source === layer ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: SkillHubPanel_module_css_default.source,
												children: sourceLabel(t, server.source)
											}) : null,
											!server.supported ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: SkillHubPanel_module_css_default.unsupported,
												children: t("mcp.unsupported")
											}) : null
										]
									}),
									layer !== "global" && server.source === layer && server.supported ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: SkillHubPanel_module_css_default.inherit,
										disabled: busy,
										"aria-label": t("mcp.inherit.server", { name: server.name }),
										onClick: () => void update(server.name, void 0),
										children: t("inherit.action")
									}) : null
								]
							}, server.name))
						}) : null
					]
				})]
			});
		}
		//#endregion
		//#region src/client/catalog-api.ts
		const BASE = "/skillhub";
		async function readJson(response) {
			const text = await response.text();
			const trimmed = text.trimStart().toLowerCase();
			if (trimmed.startsWith("<!doctype") || trimmed.startsWith("<html")) throw new Error("The SkillHub host API is not on this Web session yet. Retry after DSH reloads the SkillHub server plugin.");
			if (!response.ok) {
				try {
					const parsed = JSON.parse(text);
					if (typeof parsed === "object" && parsed !== null && "error" in parsed) {
						const error = parsed.error;
						if (typeof error === "string" && error !== "") throw new Error(error);
					}
				} catch (caught) {
					if (caught instanceof Error && caught.message !== text) throw caught;
				}
				throw new Error(text === "" ? `HTTP ${String(response.status)}` : text);
			}
			return JSON.parse(text);
		}
		async function fetchCatalog(sessionId, folder, layer) {
			const query = new URLSearchParams();
			if (sessionId !== void 0 && sessionId !== "") query.set("sessionId", sessionId);
			if (folder !== void 0 && folder !== "") query.set("folder", folder);
			if (layer !== void 0) query.set("layer", layer);
			return await readJson(await fetch(`${BASE}/catalog?${query.toString()}`));
		}
		async function postCatalog(path, body) {
			const payload = await readJson(await fetch(`${BASE}${path}`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(body)
			}));
			if (typeof payload === "object" && payload !== null && "offered" in payload) return payload;
			if (typeof payload === "object" && payload !== null && "catalog" in payload && typeof payload.catalog === "object" && payload.catalog !== null) return payload.catalog;
			throw new Error("SkillHub returned an unexpected response");
		}
		//#endregion
		//#region src/client/SkillHubPanel.tsx
		function layerLabel(t, layer) {
			if (layer === "session") return t("layer.session");
			if (layer === "project") return t("layer.project");
			return t("layer.global");
		}
		function sourceLabel(t, source) {
			if (source === "session") return t("source.session");
			if (source === "project") return t("source.project");
			return t("source.global");
		}
		function gateWord(t, gate) {
			if (gate === "on") return t("gate.on");
			if (gate === "off") return t("gate.off");
			return t("gate.mixed");
		}
		function brokenCopy(t, reason) {
			if (reason.kind === "missing-symlink-target") return reason.target === void 0 ? t("broken.missing") : t("broken.missingNamed", { target: reason.target });
			if (reason.kind === "empty-pack") return t("broken.empty");
			if (reason.kind === "invalid-name") return t("broken.name");
			if (reason.kind === "unreadable-skill") return t("broken.unreadable");
			if (reason.kind === "invalid-frontmatter") return t("broken.frontmatter");
			return reason.kind;
		}
		function homeLabel(t, home) {
			if (home === "agent") return t("home.agent");
			return t("home.dsh");
		}
		function countSkills(nodes) {
			let on = 0;
			let off = 0;
			const visit = (list) => {
				for (const node of list) {
					if (node.kind === "broken") continue;
					if (node.kind === "root-skill") {
						if (node.gate === "on") on += 1;
						else off += 1;
						continue;
					}
					if (node.skill !== null) {
						if (node.skill.gate === "on") on += 1;
						else off += 1;
					}
					visit(node.children);
				}
			};
			visit(nodes);
			return {
				on,
				off
			};
		}
		function gateFromCounts(counts) {
			if (counts.on > 0 && counts.off > 0) return "mixed";
			return counts.on > 0 ? "on" : "off";
		}
		function collectSkillIds(nodes) {
			const ids = [];
			const visit = (list) => {
				for (const node of list) {
					if (node.kind === "broken") continue;
					if (node.kind === "root-skill") {
						ids.push(node.id);
						continue;
					}
					if (node.skill !== null) ids.push(node.skill.id);
					visit(node.children);
				}
			};
			visit(nodes);
			return ids;
		}
		function collectSkills(nodes) {
			const skills = [];
			const visit = (list) => {
				for (const node of list) {
					if (node.kind === "broken") continue;
					if (node.kind === "root-skill") {
						skills.push({
							id: node.id,
							name: node.name,
							...node.description !== void 0 ? { description: node.description } : {},
							gate: node.gate,
							source: node.source,
							collision: node.collision
						});
						continue;
					}
					if (node.skill !== null) skills.push(node.skill);
					visit(node.children);
				}
			};
			visit(nodes);
			return skills;
		}
		function skillCountLabel(t, total) {
			return t(total === 1 ? "count.skillsOne" : "count.skills", { n: total });
		}
		function folderChildren(node) {
			if (node.kind === "broken" || node.kind === "root-skill") return [];
			return node.children.filter((child) => {
				if (child.kind === "broken") return true;
				return collectSkillIds([child]).length > 0;
			});
		}
		function packPrefix(name) {
			const split = name.indexOf("-");
			if (split < 2) return void 0;
			return name.slice(0, split);
		}
		function soleSkill(node) {
			if (node.kind === "broken") return null;
			if (node.kind === "root-skill") return {
				id: node.id,
				name: node.name,
				...node.description !== void 0 ? { description: node.description } : {},
				gate: node.gate,
				source: node.source,
				collision: node.collision
			};
			if (node.skill !== null && folderChildren(node).length === 0) return node.skill;
			return null;
		}
		function clusterFlatPacks(nodes) {
			const existing = new Set(nodes.map((node) => node.name));
			const counts = /* @__PURE__ */ new Map();
			for (const node of nodes) {
				if (node.kind !== "pack" && node.kind !== "broken") continue;
				const prefix = packPrefix(node.name);
				if (prefix === void 0 || existing.has(prefix)) continue;
				counts.set(prefix, (counts.get(prefix) ?? 0) + 1);
			}
			const cluster = /* @__PURE__ */ new Set();
			for (const [prefix, count] of counts) if (count >= 3) cluster.add(prefix);
			if (cluster.size === 0) return [...nodes];
			const buckets = /* @__PURE__ */ new Map();
			const out = [];
			for (const node of nodes) {
				if (node.kind !== "pack" && node.kind !== "broken") {
					out.push(node);
					continue;
				}
				const prefix = packPrefix(node.name);
				if (prefix === void 0 || !cluster.has(prefix)) {
					out.push(node);
					continue;
				}
				const list = buckets.get(prefix);
				if (list === void 0) {
					buckets.set(prefix, [node]);
					out.push({
						kind: "cluster",
						prefix
					});
					continue;
				}
				list.push(node);
			}
			const result = [];
			for (const node of out) {
				if (node.kind !== "cluster") {
					result.push(node);
					continue;
				}
				const members = buckets.get(node.prefix);
				const first = members?.[0];
				if (members === void 0 || first === void 0) continue;
				const children = members.map((member) => {
					if (member.kind === "broken") return {
						...member,
						name: member.name.startsWith(`${node.prefix}-`) ? member.name.slice(node.prefix.length + 1) : member.name
					};
					return {
						kind: "group",
						name: member.name.startsWith(`${node.prefix}-`) ? member.name.slice(node.prefix.length + 1) : member.name,
						rel: member.name,
						home: member.home,
						path: member.path,
						gate: member.gate,
						skill: member.skill,
						children: member.children
					};
				});
				const home = first.home;
				result.push({
					kind: "pack",
					id: `${home}:${node.prefix}`,
					name: node.prefix,
					home,
					path: first.path,
					link: { kind: "directory" },
					gate: gateFromCounts(countSkills(members)),
					skill: null,
					children
				});
			}
			return result;
		}
		function textOf(node) {
			if (node.kind === "broken") return `${node.name} ${node.reason.kind}`;
			if (node.kind === "root-skill") return `${node.name} ${node.description ?? ""}`;
			const skill = node.skill;
			return `${node.name} ${skill?.name ?? ""} ${skill?.description ?? ""}`;
		}
		function nodeMatches(node, needle) {
			if (textOf(node).toLowerCase().includes(needle)) return true;
			if (node.kind === "broken" || node.kind === "root-skill") return false;
			return node.children.some((child) => nodeMatches(child, needle));
		}
		function SkillLeaf(props) {
			const skill = props.skill;
			const [copied, setCopied] = (0, react.useState)(false);
			const copyName = async () => {
				const text = `/${skill.name} `;
				try {
					await navigator.clipboard.writeText(text);
				} catch {
					const area = document.createElement("textarea");
					area.value = text;
					document.body.appendChild(area);
					area.select();
					document.execCommand("copy");
					area.remove();
				}
				setCopied(true);
				window.setTimeout(() => setCopied(false), 1500);
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: `${SkillHubPanel_module_css_default.row} ${SkillHubPanel_module_css_default.leaf}`,
				style: { "--depth": String(props.depth) },
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: SkillHubPanel_module_css_default.chevronGhost }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(GateSwitch, {
						gate: skill.gate,
						label: props.t("switch.skill", {
							name: props.label,
							state: gateWord(props.t, skill.gate)
						}),
						disabled: props.disabled,
						onChange: (on) => props.onToggle("skill", { id: skill.id }, on)
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: SkillHubPanel_module_css_default.name,
						...skill.description !== void 0 && skill.description !== "" ? { title: skill.description } : {},
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: SkillHubPanel_module_css_default.nameBtn,
								title: props.t("copy.slash", { name: skill.name }),
								"aria-label": props.t("copy.slash", { name: skill.name }),
								onClick: () => void copyName(),
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: SkillHubPanel_module_css_default.nameText,
									children: props.label
								})
							}),
							copied ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: SkillHubPanel_module_css_default.source,
								children: props.t("copy.done")
							}) : null,
							skill.collision ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: SkillHubPanel_module_css_default.collision,
								children: props.t("badge.collision")
							}) : null,
							props.layer !== "global" && skill.source === props.layer ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: SkillHubPanel_module_css_default.source,
								children: sourceLabel(props.t, skill.source)
							}) : null
						]
					}),
					props.layer !== "global" && skill.source === props.layer ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: SkillHubPanel_module_css_default.inherit,
						disabled: props.disabled,
						"aria-label": props.t("inherit.skill", { name: props.label }),
						onClick: () => props.onInherit("skill", { id: skill.id }),
						children: props.t("inherit.action")
					}) : null
				]
			});
		}
		function GateSwitch(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				className: SkillHubPanel_module_css_default.switch,
				role: "switch",
				"aria-checked": props.gate === "mixed" ? "mixed" : props.gate === "on",
				"aria-label": props.label,
				"data-state": props.gate,
				disabled: props.disabled,
				onClick: () => props.onChange(props.gate !== "on"),
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: SkillHubPanel_module_css_default.thumb })
			});
		}
		function SkillHubPanel(props) {
			const sessionId = props.sessionId;
			const t = props.t;
			const folder = props.folder ?? "";
			const [layer, setLayer] = (0, react.useState)(props.defaultLayer);
			const [catalog, setCatalog] = (0, react.useState)();
			const [error, setError] = (0, react.useState)();
			const [query, setQuery] = (0, react.useState)("");
			const [busy, setBusy] = (0, react.useState)(false);
			const [expanded, setExpanded] = (0, react.useState)({});
			const [dirty, setDirty] = (0, react.useState)(false);
			const [tab, setTab] = (0, react.useState)("skills");
			const [mcpServerCount, setMcpServerCount] = (0, react.useState)();
			const canWriteSession = sessionId !== void 0 && sessionId !== "";
			const canWriteProject = folder !== "";
			const layerReady = layer === "global" || layer === "session" && canWriteSession || layer === "project" && canWriteProject;
			const load = (0, react.useCallback)(async () => {
				try {
					setError(void 0);
					setCatalog(await fetchCatalog(sessionId, folder === "" ? void 0 : folder, layer));
				} catch (caught) {
					setError(caught instanceof Error ? caught.message : String(caught));
				}
			}, [
				sessionId,
				folder,
				layer
			]);
			(0, react.useEffect)(() => {
				load();
			}, [load]);
			const mutate = async (path, body) => {
				setBusy(true);
				try {
					setError(void 0);
					const next = await postCatalog(path, body);
					setCatalog(next);
					setDirty(true);
				} catch (caught) {
					setError(caught instanceof Error ? caught.message : String(caught));
				} finally {
					setBusy(false);
				}
			};
			const toggleBody = (extra) => {
				const body = {
					layer,
					...extra
				};
				if (sessionId !== void 0 && sessionId !== "") body["sessionId"] = sessionId;
				if (folder !== "") body["folder"] = folder;
				return body;
			};
			const toggleIds = async (ids, on) => {
				if (ids.length === 0) return;
				setBusy(true);
				try {
					setError(void 0);
					try {
						setCatalog(await postCatalog("/toggle", toggleBody({
							kind: "ids",
							ids,
							on
						})));
						setDirty(true);
						return;
					} catch {
						let next;
						for (const id of ids) next = await postCatalog("/toggle", toggleBody({
							kind: "skill",
							id,
							on
						}));
						if (next !== void 0) setCatalog(next);
						setDirty(true);
					}
				} catch (caught) {
					setError(caught instanceof Error ? caught.message : String(caught));
				} finally {
					setBusy(false);
				}
			};
			const inheritIds = async (ids) => {
				if (ids.length === 0) return;
				await mutate("/inherit", toggleBody({
					kind: "ids",
					ids
				}));
			};
			const needle = query.trim().toLowerCase();
			const counts = (0, react.useMemo)(() => {
				if (catalog === void 0) return {
					on: 0,
					off: 0
				};
				return countSkills(catalog.tree.flatMap((home) => home.children));
			}, [catalog]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: SkillHubPanel_module_css_default.root,
				"data-surface": props.surface,
				"data-skillhub-panel": "",
				"aria-busy": busy,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: SkillHubPanel_module_css_default.tabsRow,
					children: [
						props.surface === "page" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: SkillHubPanel_module_css_default.eyebrow,
							children: t("nav")
						}) : null,
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: SkillHubPanel_module_css_default.tabs,
							role: "tablist",
							"aria-label": t("tab.aria"),
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								role: "tab",
								"aria-selected": tab === "skills",
								className: SkillHubPanel_module_css_default.tabBtn,
								"data-active": tab === "skills" ? "" : void 0,
								onClick: () => setTab("skills"),
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSkillOutline16, { size: 14 }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("tab.skills") }),
									counts.on + counts.off > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: SkillHubPanel_module_css_default.tabBadge,
										children: counts.on + counts.off
									}) : null
								]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								role: "tab",
								"aria-selected": tab === "mcp",
								className: SkillHubPanel_module_css_default.tabBtn,
								"data-active": tab === "mcp" ? "" : void 0,
								onClick: () => setTab("mcp"),
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCordisPluginOutline14, { size: 14 }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("tab.mcp") }),
									mcpServerCount !== void 0 && mcpServerCount > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: SkillHubPanel_module_css_default.tabBadge,
										children: mcpServerCount
									}) : null
								]
							})]
						}),
						props.layers.length > 1 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: SkillHubPanel_module_css_default.segment,
							role: "radiogroup",
							"aria-label": t("layer.aria"),
							children: props.layers.map((name) => {
								return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									role: "radio",
									"aria-checked": layer === name,
									"data-active": layer === name ? "" : void 0,
									disabled: name === "session" && !canWriteSession || name === "project" && !canWriteProject,
									...name === "session" && !canWriteSession ? { title: t("session.needsChat") } : name === "project" && !canWriteProject ? { title: t("project.needsWorkspace") } : {},
									onClick: () => setLayer(name),
									children: layerLabel(t, name)
								}, name);
							})
						}) : null
					]
				}), tab === "mcp" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(McpPanel, {
					surface: props.surface,
					layer,
					sessionId,
					folder,
					canWriteSession,
					canWriteProject,
					layerReady,
					onServerCountChange: setMcpServerCount,
					t
				}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
						className: SkillHubPanel_module_css_default.header,
						"data-ud-check": "skillhub-header",
						"data-ud-role": "nav",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: SkillHubPanel_module_css_default.titleRow,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: SkillHubPanel_module_css_default.titleBlock,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
									className: SkillHubPanel_module_css_default.title,
									children: t(props.surface === "page" ? "title.global" : "title.context")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									className: SkillHubPanel_module_css_default.lede,
									children: t(props.surface === "page" ? "lede.global" : "lede.context")
								})]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: SkillHubPanel_module_css_default.headerActions,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										variant: "ghost",
										size: "sm",
										disabled: !layerReady || busy || catalog === void 0,
										onClick: () => void mutate("/toggle", toggleBody({
											kind: "all",
											on: false
										})),
										children: t("allOff")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										variant: "ghost",
										size: "sm",
										disabled: !layerReady || busy || catalog === void 0,
										onClick: () => void mutate("/toggle", toggleBody({
											kind: "all",
											on: true
										})),
										children: t("allOn")
									}),
									layer !== "global" && catalog !== void 0 && collectSkills(catalog.tree.flatMap((h) => h.children)).some((s) => s.source === layer) ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										variant: "ghost",
										size: "sm",
										disabled: !layerReady || busy || catalog === void 0,
										onClick: () => void mutate("/inherit", toggleBody({ kind: "all" })),
										children: t("allInherit")
									}) : null
								]
							})]
						}), catalog !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: SkillHubPanel_module_css_default.counts,
							"aria-live": "polite",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("count.on", { n: counts.on }) }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("count.off", { n: counts.off }) }),
								catalog.collisions.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("count.collisions", { n: catalog.collisions.length }) }) : null
							]
						}) : null]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
						className: SkillHubPanel_module_css_default.search,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: SkillHubPanel_module_css_default.helper,
							children: t("search")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Input, {
							className: SkillHubPanel_module_css_default.field ?? "",
							icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSearchOutline16, { size: 16 }),
							value: query,
							placeholder: t("search.placeholder"),
							onChange: (event) => setQuery(event.currentTarget.value)
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: SkillHubPanel_module_css_default.body,
						"data-ud-check": "skillhub-tree",
						"data-ud-role": "panel",
						children: [
							dirty && catalog !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: SkillHubPanel_module_css_default.bannerRow,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									className: SkillHubPanel_module_css_default.warn,
									role: "status",
									children: t("refresh.hint")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
									variant: "outline",
									size: "sm",
									onClick: () => window.location.reload(),
									children: t("refresh.action")
								})]
							}) : null,
							error !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: SkillHubPanel_module_css_default.bannerRow,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									className: SkillHubPanel_module_css_default.error,
									role: "alert",
									children: t("error.load", { error })
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
									variant: "outline",
									size: "sm",
									onClick: () => void load(),
									children: t("error.retry")
								})]
							}) : null,
							catalog !== void 0 && catalog.collisions.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
								className: SkillHubPanel_module_css_default.warn,
								role: "status",
								children: [
									t("collision.warn"),
									" ",
									catalog.collisions.map((row) => row.name).join(", ")
								]
							}) : null,
							catalog?.legacySessionSnapshot === true ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: SkillHubPanel_module_css_default.warn,
								role: "status",
								children: t("legacy.snapshot")
							}) : null,
							catalog === void 0 && error === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: SkillHubPanel_module_css_default.skeleton,
								"aria-label": t("loading"),
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: SkillHubPanel_module_css_default.skel }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: SkillHubPanel_module_css_default.skel }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: SkillHubPanel_module_css_default.skel })
								]
							}) : null,
							catalog !== void 0 && counts.on + counts.off === 0 && needle === "" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: SkillHubPanel_module_css_default.emptyCard,
								"data-ud-check": "skillhub-skills-empty",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: SkillHubPanel_module_css_default.emptyIcon,
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSkillOutline16, { size: 28 })
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h4", {
										className: SkillHubPanel_module_css_default.emptyTitle,
										children: t("skills.empty.title")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										className: SkillHubPanel_module_css_default.emptyDesc,
										children: t("skills.empty.desc")
									})
								]
							}) : null,
							catalog !== void 0 && (counts.on + counts.off > 0 || needle !== "") ? catalog.tree.map((home) => {
								const clustered = clusterFlatPacks(home.children);
								const children = needle === "" ? clustered : clustered.filter((node) => nodeMatches(node, needle));
								const populatedHomes = catalog.tree.filter((row) => row.children.length > 0).length;
								const hideHomeChrome = props.surface === "popover" && populatedHomes <= 1;
								const homeKey = `home:${home.home}`;
								const homeOpen = hideHomeChrome || needle !== "" || (expanded[homeKey] ?? true);
								const homeCounts = countSkills(home.children);
								const homeIds = collectSkillIds(home.children);
								const homeHasOverride = layer !== "global" && collectSkills(home.children).some((skill) => skill.source === layer);
								const homeTotal = homeCounts.on + homeCounts.off;
								const label = homeLabel(t, home.home);
								const tree = children.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									className: SkillHubPanel_module_css_default.empty,
									children: needle === "" ? t("empty.home") : t("empty.search")
								}) : children.map((node) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(TreeNode, {
									node,
									packHome: home.home,
									packName: node.kind === "pack" ? node.name : "",
									depth: hideHomeChrome ? 0 : 1,
									needle,
									expanded,
									setExpanded,
									disabled: !layerReady || busy,
									layer,
									t,
									onToggle: (kind, payload, on) => {
										if (kind === "group") {
											const ids = Array.isArray(payload["ids"]) ? payload["ids"].filter((id) => typeof id === "string") : collectSkillIds([node]);
											toggleIds(ids, on);
											return;
										}
										mutate("/toggle", toggleBody({
											kind,
											on,
											...payload
										}));
									},
									onInherit: (kind, payload) => {
										if (kind === "group") {
											const ids = Array.isArray(payload["ids"]) ? payload["ids"].filter((id) => typeof id === "string") : collectSkillIds([node]);
											inheritIds(ids);
											return;
										}
										mutate("/inherit", toggleBody({
											kind,
											...payload
										}));
									}
								}, node.kind === "pack" ? node.path : node.kind === "root-skill" ? node.id : node.path));
								if (hideHomeChrome) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("section", {
									className: SkillHubPanel_module_css_default.home,
									"aria-label": label,
									children: tree
								}, home.home);
								return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
									className: SkillHubPanel_module_css_default.home,
									"aria-label": label,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: SkillHubPanel_module_css_default.row,
										style: { "--depth": "0" },
										"data-folder": "",
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: SkillHubPanel_module_css_default.chevron,
												"aria-expanded": homeOpen,
												"aria-label": t(homeOpen ? "collapse" : "expand", { name: label }),
												onClick: () => setExpanded((current) => ({
													...current,
													[homeKey]: !(current[homeKey] ?? true)
												})),
												children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronRightOutline14, { size: 14 })
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)(GateSwitch, {
												gate: gateFromCounts(homeCounts),
												label: t("switch.folder", {
													name: label,
													state: gateWord(t, gateFromCounts(homeCounts))
												}),
												disabled: !layerReady || busy || homeIds.length === 0,
												onChange: (on) => void toggleIds(homeIds, on)
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: SkillHubPanel_module_css_default.nameBtn,
												title: home.path,
												onClick: () => setExpanded((current) => ({
													...current,
													[homeKey]: !(current[homeKey] ?? true)
												})),
												children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
													className: SkillHubPanel_module_css_default.name,
													children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: SkillHubPanel_module_css_default.nameText,
														children: label
													}), homeTotal > 1 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: SkillHubPanel_module_css_default.badge,
														children: skillCountLabel(t, homeTotal)
													}) : null]
												})
											}),
											homeHasOverride ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: SkillHubPanel_module_css_default.inherit,
												disabled: !layerReady || busy,
												"aria-label": t("inherit.folder", { name: label }),
												onClick: () => void inheritIds(homeIds),
												children: t("inherit.action")
											}) : null
										]
									}), homeOpen ? tree : null]
								}, home.home);
							}) : null
						]
					})
				] })]
			});
		}
		function TreeNode(props) {
			const { node } = props;
			const style = { "--depth": String(props.depth) };
			if (node.kind === "broken") return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: SkillHubPanel_module_css_default.row,
				"data-broken": "",
				style,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: SkillHubPanel_module_css_default.chevronGhost }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: SkillHubPanel_module_css_default.name,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconWarningOutline16, { size: 14 }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: SkillHubPanel_module_css_default.nameText,
							children: node.name
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: SkillHubPanel_module_css_default.brokenMark,
							children: brokenCopy(props.t, node.reason)
						})
					]
				})]
			});
			if (node.kind === "root-skill") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SkillLeaf, {
				depth: props.depth,
				skill: {
					id: node.id,
					name: node.name,
					...node.description !== void 0 ? { description: node.description } : {},
					gate: node.gate,
					source: node.source,
					collision: node.collision
				},
				label: node.name,
				disabled: props.disabled,
				layer: props.layer,
				t: props.t,
				onToggle: props.onToggle,
				onInherit: props.onInherit
			});
			const leaf = soleSkill(node);
			if (leaf !== null) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SkillLeaf, {
				depth: props.depth,
				skill: leaf,
				label: node.name,
				disabled: props.disabled,
				layer: props.layer,
				t: props.t,
				onToggle: props.onToggle,
				onInherit: props.onInherit
			});
			const packName = node.kind === "pack" ? node.name : props.packName;
			const packHome = node.kind === "pack" ? node.home : props.packHome;
			const rel = node.kind === "group" ? node.rel : node.name;
			const key = node.kind === "pack" ? node.path : `${packHome}:${rel}`;
			const children = folderChildren(node);
			const nested = children.length > 0;
			const expandable = nested;
			const counts = countSkills([node]);
			const total = counts.on + counts.off;
			const ids = collectSkillIds([node]);
			const hasOverride = props.layer !== "global" && collectSkills([node]).some((skill) => skill.source === props.layer);
			const defaultOpen = false;
			const open = props.needle !== "" || (props.expanded[key] ?? defaultOpen);
			const visibleChildren = props.needle === "" ? children : children.filter((child) => nodeMatches(child, props.needle));
			const toggleOpen = () => {
				if (!expandable) return;
				props.setExpanded((current) => ({
					...current,
					[key]: !(current[key] ?? defaultOpen)
				}));
			};
			const showOwnSkill = open && node.skill !== null && nested;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: SkillHubPanel_module_css_default.row,
				style,
				"data-folder": expandable ? "" : void 0,
				children: [
					expandable ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: SkillHubPanel_module_css_default.chevron,
						"aria-expanded": open,
						"aria-label": props.t(open ? "collapse" : "expand", { name: node.name }),
						onClick: toggleOpen,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronRightOutline14, { size: 14 })
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: SkillHubPanel_module_css_default.chevronGhost }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(GateSwitch, {
						gate: node.gate,
						label: props.t("switch.folder", {
							name: node.name,
							state: gateWord(props.t, node.gate)
						}),
						disabled: props.disabled || ids.length === 0,
						onChange: (on) => props.onToggle("group", {
							packHome,
							packName,
							rel,
							ids
						}, on)
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: SkillHubPanel_module_css_default.nameBtn,
						onClick: toggleOpen,
						disabled: !expandable,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: SkillHubPanel_module_css_default.name,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: SkillHubPanel_module_css_default.nameText,
								children: node.name
							}), total > 1 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: SkillHubPanel_module_css_default.badge,
								children: skillCountLabel(props.t, total)
							}) : null]
						})
					}),
					hasOverride ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: SkillHubPanel_module_css_default.inherit,
						disabled: props.disabled,
						"aria-label": props.t("inherit.folder", { name: node.name }),
						onClick: () => props.onInherit("group", {
							packHome,
							packName,
							rel,
							ids
						}),
						children: props.t("inherit.action")
					}) : null
				]
			}), open ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [showOwnSkill && node.skill !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SkillLeaf, {
				depth: props.depth + 1,
				skill: node.skill,
				label: node.skill.name,
				disabled: props.disabled,
				layer: props.layer,
				t: props.t,
				onToggle: props.onToggle,
				onInherit: props.onInherit
			}) : null, visibleChildren.map((child) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(TreeNode, {
				node: child,
				packHome,
				packName,
				depth: props.depth + 1,
				needle: props.needle,
				expanded: props.expanded,
				setExpanded: props.setExpanded,
				disabled: props.disabled,
				layer: props.layer,
				t: props.t,
				onToggle: props.onToggle,
				onInherit: props.onInherit
			}, child.kind === "broken" ? child.path : child.rel))] }) : null] });
		}
		//#endregion
		//#region src/client/locales.ts
		/** SkillHub copy. zh is the key-set source of truth. */
		const zh = {
			"nav": "skill&mcp",
			"chip": "技能",
			"chip.aria": "技能",
			"tab.skills": "技能",
			"tab.mcp": "MCP",
			"tab.aria": "分类切换",
			"title.global": "全局技能",
			"title.context": "技能设置",
			"lede.global": "管理所有项目的技能默认状态。",
			"lede.context": "点击技能名复制命令，修改开关后刷新页面生效。",
			"mcp.title": "MCP",
			"mcp.title.global": "全局 MCP",
			"mcp.title.context": "MCP 设置",
			"mcp.lede.global": "控制 MCP 工具显隐，关闭后不占用模型上下文。",
			"mcp.lede.context": "控制当前对话中可调用的 MCP 工具。",
			"mcp.help": "按服务控制后续对话中的工具显隐，后台进程常驻。",
			"mcp.help.session": "",
			"mcp.help.project": "",
			"mcp.help.global": "",
			"allOff": "全部关闭",
			"allOn": "全部开启",
			"allInherit": "恢复默认",
			"count.on": "{n} 开启",
			"count.off": "{n} 关闭",
			"count.collisions": "{n} 个重名",
			"count.skills": "{n} 个技能",
			"count.skillsOne": "{n} 个技能",
			"mcp.tools": "{n} 个工具",
			"layer.aria": "作用范围",
			"layer.session": "本对话",
			"layer.project": "本项目",
			"layer.global": "全局",
			"help.session": "",
			"help.project": "",
			"help.global": "",
			"session.needsChat": "请先打开一个对话",
			"project.needsWorkspace": "请先打开一个工作区",
			"source.global": "默认",
			"source.project": "已自定",
			"source.session": "已自定",
			"inherit.action": "恢复",
			"inherit.skill": "恢复 {name} 为默认设置",
			"inherit.folder": "恢复 {name} 文件夹为默认设置",
			"mcp.inherit": "恢复",
			"mcp.inherit.server": "恢复 {name} 为默认设置",
			"copy.slash": "点击复制 /{name}",
			"copy.done": "已复制",
			"refresh.hint": "设置已变更，刷新后生效",
			"refresh.action": "刷新页面",
			"skills.empty.title": "暂无已安装技能",
			"skills.empty.desc": "将技能放入 ~/.agents/skills 即可在此启用。",
			"skills.empty.search": "未找到匹配的技能",
			"mcp.empty": "暂无已连接的 MCP 服务。",
			"mcp.empty.title": "暂无 MCP 服务",
			"mcp.empty.desc": "在环境中配置并启动外部 MCP 后，可在此随时开关工具。",
			"mcp.empty.note": "",
			"legacy.snapshot": "当前为快照模式，点击“恢复默认”可跟随最新设置。",
			"search": "搜索技能",
			"search.placeholder": "搜索技能...",
			"error.load": "加载失败：{error}",
			"error.retry": "重试",
			"collision.warn": "存在同名技能：",
			"loading": "正在加载...",
			"home.agent": "Agent 目录",
			"home.dsh": "DSH 目录",
			"empty.home": "暂无技能",
			"empty.search": "未找到匹配技能",
			"expand": "展开 {name}",
			"collapse": "收起 {name}",
			"switch.folder": "文件夹 {name}，{state}",
			"switch.skill": "技能 {name}，{state}",
			"switch.mcp": "MCP 服务 {name}，{state}",
			"mcp.unsupported": "不支持动态隐藏",
			"mcp.unavailable": "服务暂未就绪，请稍后重试",
			"badge.link": "链接",
			"badge.collision": "重名",
			"broken.missing": "链接失效",
			"broken.missingNamed": "链接目标不存在：{target}",
			"broken.empty": "目录中未包含 SKILL.md",
			"broken.name": "技能名无效",
			"broken.unreadable": "无法读取文件",
			"broken.frontmatter": "配置格式错误",
			"gate.on": "开",
			"gate.off": "关",
			"gate.mixed": "部分"
		};
		const en = {
			"nav": "skill&mcp",
			"chip": "Skills",
			"chip.aria": "Skills",
			"tab.skills": "Skills",
			"tab.mcp": "MCP",
			"tab.aria": "Category switcher",
			"title.global": "Global Skills",
			"title.context": "Skill Settings",
			"lede.global": "Default skill state across all projects.",
			"lede.context": "Click skill name to copy command. Reload to apply changes.",
			"mcp.title": "MCP",
			"mcp.title.global": "Global MCP",
			"mcp.title.context": "MCP Settings",
			"mcp.lede.global": "Control tool visibility. Hidden tools will not consume context.",
			"mcp.lede.context": "Manage MCP tools active in this conversation.",
			"mcp.help": "Control tool visibility for subsequent turns; process remains running.",
			"mcp.help.session": "",
			"mcp.help.project": "",
			"mcp.help.global": "",
			"allOff": "All Off",
			"allOn": "All On",
			"allInherit": "Reset All",
			"count.on": "{n} on",
			"count.off": "{n} off",
			"count.collisions": "{n} collisions",
			"count.skills": "{n} skills",
			"count.skillsOne": "{n} skill",
			"mcp.tools": "{n} tools",
			"layer.aria": "Scope",
			"layer.session": "This Chat",
			"layer.project": "This Project",
			"layer.global": "Global",
			"help.session": "",
			"help.project": "",
			"help.global": "",
			"session.needsChat": "Open a chat first",
			"project.needsWorkspace": "Open a workspace first",
			"source.global": "Default",
			"source.project": "Customized",
			"source.session": "Customized",
			"inherit.action": "Reset",
			"inherit.skill": "Reset {name} to default",
			"inherit.folder": "Reset {name} folder to default",
			"mcp.inherit": "Reset",
			"mcp.inherit.server": "Reset {name} to default",
			"copy.slash": "Click to copy /{name}",
			"copy.done": "Copied",
			"refresh.hint": "Settings updated. Reload to apply",
			"refresh.action": "Reload",
			"skills.empty.title": "No Skills Installed",
			"skills.empty.desc": "Place skill directories in ~/.agents/skills to manage them here.",
			"skills.empty.search": "No matching skills found",
			"mcp.empty": "No MCP services currently connected.",
			"mcp.empty.title": "No MCP Services",
			"mcp.empty.desc": "Connect MCP servers in your environment to manage tools here.",
			"mcp.empty.note": "",
			"legacy.snapshot": "Snapshot mode. Click Reset All to track latest settings.",
			"search": "Search skills",
			"search.placeholder": "Search skills...",
			"error.load": "Load failed: {error}",
			"error.retry": "Retry",
			"collision.warn": "Conflicting skill names:",
			"loading": "Loading...",
			"home.agent": "Agent Directory",
			"home.dsh": "DSH Directory",
			"empty.home": "No skills",
			"empty.search": "No matching skills",
			"expand": "Expand {name}",
			"collapse": "Collapse {name}",
			"switch.folder": "Folder {name}, {state}",
			"switch.skill": "Skill {name}, {state}",
			"switch.mcp": "MCP service {name}, {state}",
			"mcp.unsupported": "Dynamic hide unsupported",
			"mcp.unavailable": "Service unavailable, please retry",
			"badge.link": "link",
			"badge.collision": "conflict",
			"broken.missing": "Broken link",
			"broken.missingNamed": "Missing target: {target}",
			"broken.empty": "Missing SKILL.md",
			"broken.name": "Invalid name",
			"broken.unreadable": "Unreadable file",
			"broken.frontmatter": "Invalid config",
			"gate.on": "on",
			"gate.off": "off",
			"gate.mixed": "mixed"
		};
		//#endregion
		//#region src/client/index.tsx
		const name = "dsh-skillhub-client";
		const inject = ["slots", "locale"];
		const NS = "skillhub";
		const PANEL_GAP = 8;
		const PANEL_MARGIN = 12;
		const UNPLACED = {
			visibility: "hidden",
			left: 0,
			top: 0
		};
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "dsh-skillhub: dictionaries");
			const t = ctx.locale.bind(NS);
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "dsh-skillhub",
				order: 80,
				label: () => t("nav"),
				locale: NS
			}, SkillHubSettings));
			ctx.slots.inject("conversation.input.left", () => ctx.slots.register({
				name: "conversation.input.left",
				id: "dsh-skillhub",
				order: 40,
				label: () => t("chip"),
				locale: NS
			}, SkillHubChip));
		}
		function SkillHubSettings(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SkillHubPanel, {
				defaultLayer: "global",
				layers: ["global"],
				surface: "page",
				t: props.t
			});
		}
		function SkillHubChip(props) {
			const sessionId = props.sessionId;
			const folder = props.useSessions((list) => list.byId?.[sessionId]?.cwd ?? "");
			const [open, setOpen] = (0, react.useState)(false);
			const rootRef = (0, react.useRef)(null);
			const triggerRef = (0, react.useRef)(null);
			const panelRef = (0, react.useRef)(null);
			const panelPosition = (0, _deepseek_ai_dsh_client_ui_primitives.useAnchoredPosition)({
				open,
				anchorRef: triggerRef,
				panelRef,
				gap: PANEL_GAP,
				margin: PANEL_MARGIN
			});
			(0, react.useEffect)(() => {
				if (!open) return;
				const closeOutside = (event) => {
					if (!(event.target instanceof Node)) return;
					if (rootRef.current?.contains(event.target) === true) return;
					if (panelRef.current?.contains(event.target) === true) return;
					if (event.target instanceof Element) {
						if (event.target.closest("[role=\"menu\"], [role=\"dialog\"], [role=\"listbox\"]") !== null) return;
					}
					setOpen(false);
				};
				const closeOnEscape = (event) => {
					if (event.key !== "Escape") return;
					event.preventDefault();
					setOpen(false);
					triggerRef.current?.focus();
				};
				document.addEventListener("pointerdown", closeOutside);
				document.addEventListener("keydown", closeOnEscape);
				return () => {
					document.removeEventListener("pointerdown", closeOutside);
					document.removeEventListener("keydown", closeOnEscape);
				};
			}, [open]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: SkillHubPanel_module_css_default.chipWrap,
				ref: rootRef,
				"data-skillhub-chip": "",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					ref: triggerRef,
					type: "button",
					className: SkillHubPanel_module_css_default.trigger,
					"data-open": open ? "" : void 0,
					"aria-expanded": open,
					"aria-label": props.t("chip.aria"),
					title: props.t("chip.aria"),
					onClick: () => setOpen((value) => !value),
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSkillOutline16, { size: 16 }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: SkillHubPanel_module_css_default.triggerLabel,
						children: props.t("chip")
					})]
				}), open ? (0, react_dom.createPortal)(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					ref: panelRef,
					className: SkillHubPanel_module_css_default.menu,
					style: panelPosition ?? UNPLACED,
					role: "dialog",
					"aria-modal": "false",
					"aria-label": props.t("chip.aria"),
					"data-ud-check": "skillhub-chip-panel",
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SkillHubPanel, {
						sessionId,
						defaultLayer: "session",
						layers: ["session", "project"],
						surface: "popover",
						t: props.t,
						...folder !== "" ? { folder } : {}
					})
				}), document.body) : null]
			});
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		exports.name = name;
		return module.exports;
	}
});

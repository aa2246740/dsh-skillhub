import { homedir } from "node:os";
import { basename, dirname, join, posix, relative, resolve, sep } from "node:path";
import z from "@deepseek-ai/schemastery";
import { createHash, randomUUID } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync, realpathSync, renameSync, symlinkSync, writeFileSync } from "node:fs";
import { scopeOf } from "@deepseek-ai/dsh-scope";
//#region lib/types/propagation.js
/** Legacy documents retain their current values until the next relevant write. */
function readPropagationMetadata(raw, path) {
	const object = raw;
	const valid = (n) => Number.isSafeInteger(n) && n >= 0;
	if (object.defaultRevision !== void 0 && !valid(object.defaultRevision)) throw new Error(`Invalid SkillHub visibility document revision: ${path}`);
	const revisions = Object.create(null);
	if (object.gateRevisions !== void 0) {
		if (typeof object.gateRevisions !== "object" || object.gateRevisions === null || Array.isArray(object.gateRevisions)) throw new Error(`Invalid SkillHub visibility document revisions: ${path}`);
		for (const [id, revision] of Object.entries(object.gateRevisions)) {
			if (!valid(revision)) throw new Error(`Invalid SkillHub visibility document revision: ${path}`);
			revisions[id] = revision;
		}
	}
	return {
		...object.defaultRevision !== void 0 ? { defaultRevision: object.defaultRevision } : {},
		...object.gateRevisions !== void 0 ? { gateRevisions: revisions } : {}
	};
}
/** Synchronous Host mutations share a durable clock, including across hot reloads. */
function nextPropagationRevision(storeDir) {
	mkdirSync(storeDir, { recursive: true });
	const path = join(storeDir, "propagation-clock.json");
	const previous = existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : 0;
	if (!Number.isSafeInteger(previous) || previous < 0) throw new Error("Invalid SkillHub visibility document propagation clock");
	const revision = Math.max(Date.now(), previous + 1);
	if (!Number.isSafeInteger(revision)) throw new Error("SkillHub propagation clock exhausted");
	const temp = `${path}.${randomUUID()}.tmp`;
	writeFileSync(temp, `${revision}\n`, { mode: 384 });
	renameSync(temp, path);
	return revision;
}
/**
* Newer ancestor operations replace older local values, without copying or
* enumerating sessions. A later local operation changes only that scope.
* Only the queried project's chain participates; siblings can never win.
*/
function propagatedGate(id, layers) {
	let gate = "on";
	let source = "global";
	let latest = -1;
	for (const [layer, doc] of layers) {
		if (doc === void 0) continue;
		const explicit = id !== void 0 && Object.hasOwn(doc.gates, id);
		const value = explicit ? doc.gates[id] : doc.default;
		if (value === void 0 || value === "inherit") continue;
		const revision = explicit ? doc.gateRevisions?.[id] ?? 0 : doc.defaultRevision ?? 0;
		if (revision >= latest) {
			gate = value;
			source = layer;
			latest = revision;
		}
	}
	return {
		gate,
		source
	};
}
//#endregion
//#region lib/types/mcp.js
/**
* Attribute one global tool name to its owning MCP server.
*
* Public MCP names are NOT reliably parseable: serverName permits underscores
* (including double underscores), raw tool names may contain separators, and
* long names are truncated with an appended identity hash. The only safe
* attribution is against the authoritative live server set (read from the
* registry's mcp-client fibers, serverName only — never credentials).
*
* A name is attributed only on unique delimiter-bounded prefix match. Nested
* servers (for example `a` and `a__b` both live) make `mcp__a__b__c`
* genuinely ambiguous, so it is attributed to neither: hiding must never
* remove the wrong server's tool. Unmatched names (stale, truncated-hash, or
* scope-local registrations) are likewise never denied.
*/
function attributeMcpTool(name, servers) {
	if (!name.startsWith("mcp__")) return void 0;
	let match;
	let ambiguous = false;
	for (const server of servers) {
		if (server === "" || name.length <= 6 + server.length) continue;
		if (!name.startsWith(`mcp__${server}__`)) continue;
		if (match !== void 0) {
			ambiguous = true;
			break;
		}
		match = server;
	}
	if (ambiguous || match === void 0) return void 0;
	return match;
}
function serversFromToolNames(names, servers) {
	const counts = /* @__PURE__ */ new Map();
	for (const server of servers) counts.set(server, 0);
	for (const name of names) {
		const owner = attributeMcpTool(name, servers);
		if (owner === void 0) continue;
		counts.set(owner, (counts.get(owner) ?? 0) + 1);
	}
	return counts;
}
function computeDenyList(toolNames, hidden, servers) {
	if (hidden.size === 0) return [];
	const deny = [];
	for (const name of toolNames) {
		const owner = attributeMcpTool(name, servers);
		if (owner !== void 0 && hidden.has(owner)) deny.push(name);
	}
	return deny;
}
function emptyDocument$1(layer) {
	return {
		version: 2,
		default: layer === "global" ? "on" : "inherit",
		gates: {}
	};
}
function parsedGates(value, layer, path) {
	if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error(`Invalid SkillHub MCP visibility document: ${path}`);
	const gates = Object.create(null);
	for (const [server, gate] of Object.entries(value)) {
		if (gate !== "on" && gate !== "off" && !(layer !== "global" && gate === "inherit")) throw new Error(`Invalid SkillHub MCP visibility document: ${path}`);
		gates[server] = gate;
	}
	return gates;
}
function readDoc$1(path, layer) {
	if (!existsSync(path)) return emptyDocument$1(layer);
	let raw;
	try {
		raw = JSON.parse(readFileSync(path, "utf8"));
	} catch {
		throw new Error(`Invalid SkillHub MCP visibility document: ${path}`);
	}
	if (typeof raw !== "object" || raw === null || Array.isArray(raw)) throw new Error(`Invalid SkillHub MCP visibility document: ${path}`);
	const object = raw;
	const gates = parsedGates(object.gates, layer, path);
	if (object.version !== 2) throw new Error(`Unsupported SkillHub MCP visibility document version: ${path}`);
	const defaultGate = object.default;
	if (defaultGate !== "on" && defaultGate !== "off" && !(layer !== "global" && defaultGate === "inherit")) throw new Error(`Invalid SkillHub MCP visibility document: ${path}`);
	return {
		version: 2,
		default: defaultGate,
		gates,
		...readPropagationMetadata(object, path)
	};
}
function writeDoc$1(path, doc) {
	mkdirSync(join(path, ".."), { recursive: true });
	const temp = `${path}.${randomUUID()}.tmp`;
	writeFileSync(temp, `${JSON.stringify({
		version: 2,
		default: doc.default,
		gates: doc.gates,
		...readPropagationMetadata(doc, path)
	}, null, 2)}\n`, { mode: 384 });
	renameSync(temp, path);
}
function folderKey$1(folder) {
	return createHash("sha256").update(folder).digest("hex").slice(0, 24);
}
function normalizeFolder(folder) {
	return resolve(folder);
}
function optionalFolder$1(folder) {
	if (folder === void 0 || folder.trim() === "") return void 0;
	return normalizeFolder(folder);
}
function assertSessionId$1(sessionId) {
	if (sessionId.trim() === "" || sessionId === "." || sessionId === ".." || sessionId.includes("/") || sessionId.includes("\\") || sessionId.includes("\0")) throw new Error("invalid sessionId for Session visibility");
}
function assertServer(server) {
	if (!/^[A-Za-z0-9_-]{1,32}$/.test(server)) throw new Error("invalid MCP server name");
}
function resolvedLayer$1(query) {
	if (query.layer !== void 0) return query.layer;
	if (query.sessionId !== void 0) return "session";
	if (query.folder !== void 0) return "project";
	return "global";
}
var McpHub = class {
	paths;
	constructor(paths) {
		this.paths = paths;
		mkdirSync(this.paths.storeDir, { recursive: true });
	}
	globalPath() {
		return join(this.paths.storeDir, "mcp-global.json");
	}
	projectPath(folder) {
		return join(this.paths.storeDir, "mcp-projects", `${folderKey$1(normalizeFolder(folder))}.json`);
	}
	sessionPath(sessionId) {
		assertSessionId$1(sessionId);
		return join(this.paths.storeDir, "mcp-sessions", `${sessionId}.json`);
	}
	documentPath(layer, sessionId, folder) {
		if (![
			"global",
			"project",
			"session"
		].includes(layer)) throw new Error("invalid MCP layer");
		if (layer === "global") return this.globalPath();
		if (layer === "project") {
			if (folder === void 0 || folder === "") throw new Error("folder required for Project visibility");
			return this.projectPath(folder);
		}
		if (sessionId === void 0 || sessionId === "") throw new Error("sessionId required for Session visibility");
		return this.sessionPath(sessionId);
	}
	effectiveGate(server, sessionId, folder) {
		const normalizedFolder = optionalFolder$1(folder);
		const global = readDoc$1(this.globalPath(), "global");
		const project = normalizedFolder === void 0 ? void 0 : readDoc$1(this.projectPath(normalizedFolder), "project");
		const session = sessionId === void 0 || sessionId === "" ? void 0 : readDoc$1(this.sessionPath(sessionId), "session");
		return propagatedGate(server, [
			["global", global],
			["project", project],
			["session", session]
		]);
	}
	hiddenServers(sessionId, folder, servers) {
		const hidden = /* @__PURE__ */ new Set();
		if (servers === void 0) return hidden;
		for (const server of servers) if (this.effectiveGate(server, sessionId, folder).gate === "off") hidden.add(server);
		return hidden;
	}
	/**
	* Resolve one server through the complete inheritance chain, whichever layer
	* is being edited. The panel's display and the runtime's enforce/guard path
	* must read the same value: a Project or Chat override has to change what the
	* panel shows, because it already changes what the model may call. A layer
	* that is not part of the query simply restricts nothing: reading `global`
	* reports the global default alone (no folder was chosen, so no Project row
	* can apply), `project` composes Global→Project, and `session` composes
	* Global→Project→Chat.
	* @param name - MCP server name.
	* @param layer - the layer being edited or observed.
	* @param sessionId - chat whose Chat document participates (session layer only).
	* @param folder - normalized workspace folder whose Project document participates.
	* @returns the effective gate plus the layer that decided it.
	*/
	gateState(name, layer, sessionId, folder) {
		const global = readDoc$1(this.globalPath(), "global");
		const project = layer === "global" || folder === void 0 ? void 0 : readDoc$1(this.projectPath(folder), "project");
		const session = layer !== "session" || sessionId === void 0 ? void 0 : readDoc$1(this.sessionPath(sessionId), "session");
		return propagatedGate(name, [
			["global", global],
			["project", project],
			["session", session]
		]);
	}
	catalog(query = {}, toolNames = [], servers = []) {
		const layer = resolvedLayer$1(query);
		const folder = optionalFolder$1(query.folder);
		if (layer === "project" && folder === void 0) throw new Error("folder required for Project visibility");
		if (layer === "session" && query.sessionId === void 0) throw new Error("sessionId required for Session visibility");
		return {
			servers: [...serversFromToolNames(toolNames, servers).entries()].map(([name, tools]) => {
				const state = this.gateState(name, layer, query.sessionId, folder);
				return {
					name,
					tools,
					gate: state.gate,
					source: state.source
				};
			}).sort((left, right) => left.name < right.name ? -1 : left.name > right.name ? 1 : 0),
			layer
		};
	}
	toggle(request) {
		assertServer(request.server);
		const folder = optionalFolder$1(request.folder);
		const path = this.documentPath(request.layer, request.sessionId, folder);
		const current = readDoc$1(path, request.layer);
		const revision = nextPropagationRevision(this.paths.storeDir);
		writeDoc$1(path, {
			...current,
			gates: {
				...current.gates,
				[request.server]: request.on ? "on" : "off"
			},
			gateRevisions: {
				...current.gateRevisions,
				[request.server]: revision
			}
		});
	}
	inherit(request) {
		assertServer(request.server);
		const folder = optionalFolder$1(request.folder);
		const path = this.documentPath(request.layer, request.sessionId, folder);
		const current = readDoc$1(path, request.layer);
		const gates = { ...current.gates };
		if (request.layer === "global" || current.default === "inherit") delete gates[request.server];
		else gates[request.server] = "inherit";
		writeDoc$1(path, {
			...current,
			gates
		});
	}
};
//#endregion
//#region lib/types/mcp-runtime.js
/** Uses public Cordis fiber configuration; only serverName leaves this function. */
function liveMcpServers(ctx) {
	const names = /* @__PURE__ */ new Set();
	for (const runtime of ctx.registry.values()) {
		if (runtime.name !== "mcp-client") continue;
		for (const fiber of runtime.fibers) {
			if (fiber.uid === null) continue;
			const name = fiber.config?.serverName;
			if (typeof name === "string" && /^[A-Za-z0-9_-]{1,32}$/.test(name)) names.add(name);
		}
	}
	return [...names].sort();
}
function installMcpVisibility(ctx, hub, discover = () => liveMcpServers(ctx)) {
	const tools = ctx.get("tools");
	if (!tools) throw new Error("SkillHub MCP requires tools service");
	const agents = /* @__PURE__ */ new Map();
	let refreshing = false;
	let disposed = false;
	const names = () => tools.schemas().map((t) => t.name);
	const identity = (agent) => ({
		sessionId: agent.session?.id ?? agent.session?.header?.id ?? agent.id,
		folder: agent.session?.header?.cwd
	});
	const problematic = (server, servers) => {
		if (servers.some((other) => other !== server && (server.startsWith(`${other}__`) || other.startsWith(`${server}__`)))) return true;
		for (const agent of agents.keys()) try {
			for (const tool of agent.ctx.get("tools").schemas(agent)) if (tool.name.startsWith(`mcp__${server}__`) && tools.get(tool.name) !== tools.get(tool.name, agent)) return true;
		} catch {
			return true;
		}
		return false;
	};
	const refresh = () => {
		if (refreshing || disposed) return;
		refreshing = true;
		try {
			const servers = discover();
			const all = names();
			for (const [agent, state] of agents) {
				const id = identity(agent);
				const denied = computeDenyList(all, hub.hiddenServers(id.sessionId, id.folder, servers), servers).sort();
				const signature = JSON.stringify(denied);
				if (signature === state.signature) continue;
				const scoped = agent.ctx.get("tools");
				const next = denied.length ? scoped.restrict({ deny: denied }) : () => {};
				const previous = state.lift;
				state.lift = next;
				state.signature = signature;
				previous();
			}
		} finally {
			refreshing = false;
		}
	};
	const attach = (agent) => {
		if (disposed || !agent?.ctx || agents.has(agent)) return;
		const scoped = agent.ctx.get("tools");
		if (!scoped) return;
		const state = {
			lift: () => {},
			guard: () => {},
			signature: "[]",
			dispose: () => {}
		};
		agents.set(agent, state);
		state.guard = scoped.guard((exec) => {
			const owner = attributeMcpTool(exec.name, discover());
			const id = identity(agent);
			return owner && hub.effectiveGate(owner, id.sessionId, id.folder).gate === "off" ? "This MCP service is hidden by SkillHub for this session." : void 0;
		});
		state.dispose = agent.ctx.effect(() => () => {
			agents.delete(agent);
			state.lift();
			state.guard();
		}, "skillhub MCP agent cleanup");
		refresh();
	};
	const on = ctx.on.bind(ctx);
	const offChange = on("tools/change", refresh);
	const offCreated = on("agent/created", ({ agent }) => attach(agent));
	const registry = ctx.get("agents");
	for (const agent of registry?.list() ?? []) attach(agent);
	ctx.effect(() => () => {
		disposed = true;
		offChange();
		offCreated();
		for (const state of agents.values()) {
			state.dispose();
			state.lift();
			state.guard();
		}
		agents.clear();
	}, "skillhub MCP visibility");
	return {
		attach,
		refresh,
		catalog(query = {}) {
			const servers = discover();
			const result = hub.catalog(query, names(), servers);
			return {
				...result,
				servers: result.servers.map((server) => ({
					...server,
					supported: !problematic(server.name, servers)
				}))
			};
		},
		mutate(query, server, onValue) {
			const servers = discover();
			if (!servers.includes(server)) throw new Error("MCP service is no longer registered; refresh the list");
			if (onValue === false && problematic(server, servers)) throw new Error("Cannot fully hide this service: ambiguous namespace or scope-local tools");
			const request = {
				...query,
				layer: query.layer ?? "global",
				server
			};
			if (onValue === void 0) hub.inherit(request);
			else hub.toggle({
				...request,
				on: onValue
			});
			refresh();
			return this.catalog(query);
		}
	};
}
//#endregion
//#region lib/types/catalog.js
const IGNORE = /* @__PURE__ */ new Set([
	".git",
	"node_modules",
	".system"
]);
const HOST_SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function isHostSkillName(name) {
	return HOST_SKILL_NAME.test(name);
}
function skillId(home, relPath) {
	return `${home}:${relPath.split(sep).join("/")}`;
}
function packId(home, name) {
	return `${home}:${name}`;
}
function posixRel(from, to) {
	return relative(from, to).split(sep).join("/");
}
function parseFrontmatter(text) {
	if (!text.startsWith("---")) return void 0;
	const end = text.indexOf("\n---", 3);
	if (end < 0) return void 0;
	const raw = text.slice(3, end).replace(/^\r?\n/, "");
	const body = text.slice(end + 4).replace(/^\r?\n/, "");
	const fields = {};
	for (const line of raw.split(/\r?\n/)) {
		const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
		if (match === null || match[1] === void 0 || match[2] === void 0) continue;
		let value = match[2].trim();
		if (value.startsWith("\"") && value.endsWith("\"") || value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
		fields[match[1]] = value;
	}
	return {
		fields,
		body
	};
}
function parseSkillFile(path) {
	let text;
	try {
		text = readFileSync(path, "utf8");
	} catch (error) {
		return { error: {
			kind: "unreadable-skill",
			message: String(error)
		} };
	}
	const parsed = parseFrontmatter(text);
	if (parsed === void 0) return { error: {
		kind: "invalid-frontmatter",
		message: "missing yaml frontmatter"
	} };
	const name = parsed.fields["name"] ?? "";
	const description = parsed.fields["description"] ?? "";
	if (name === "" || description === "") return { error: {
		kind: "invalid-frontmatter",
		message: "name and description are required"
	} };
	if (!isHostSkillName(name)) return { error: {
		kind: "invalid-name",
		raw: name
	} };
	const disableModel = parsed.fields["disable-model-invocation"];
	const userInvocableField = parsed.fields["user-invocable"];
	return {
		name,
		description,
		...parsed.fields["whenToUse"] !== void 0 ? { whenToUse: parsed.fields["whenToUse"] } : {},
		modelInvocable: disableModel !== "true",
		userInvocable: userInvocableField !== "false",
		content: parsed.body
	};
}
function listEntries(dir) {
	try {
		return readdirSync(dir);
	} catch {
		return [];
	}
}
/** Absolute recursion bound for the directory walk; symlink cycles bail earlier. */
const MAX_WALK_DEPTH = 12;
/** Canonical path for cycle detection, tolerating realpath failures. */
function dirRealpath(path) {
	try {
		return realpathSync(path);
	} catch {
		return path;
	}
}
/** Best-effort target label for a symlink-cycle broken reason. */
function cycleTarget(path) {
	try {
		return realpathSync(path);
	} catch {}
	try {
		return readlinkSync(path);
	} catch {}
	return path;
}
function propagatedSkill(id, input) {
	return propagatedGate(id, [
		["global", input.global],
		["project", input.project],
		["session", input.session]
	]);
}
function gateStateOf(id, input, composed) {
	if (composed !== void 0) return {
		gate: (input.global?.gates[id] ?? input.global?.default ?? "on") === "on" ? "on" : "off",
		source: composed.decided.get(id) ?? composed.defaultSource
	};
	return propagatedSkill(id, input);
}
function combineGates(gates) {
	if (gates.length === 0) return "off";
	const hasOn = gates.some((gate) => gate === "on");
	const hasOff = gates.some((gate) => gate === "off");
	if (hasOn && hasOff) return "mixed";
	return hasOn ? "on" : "off";
}
function collectGates(node) {
	const own = node.kind === "broken" ? [] : node.skill === null ? [] : [node.skill.gate];
	const nested = node.kind === "broken" ? [] : node.children.flatMap(collectGates);
	return [...own, ...nested];
}
function walkGroup(home, homeRoot, dir, leaves, broken, ancestors, depth) {
	const rel = posixRel(homeRoot, dir);
	const chain = [...ancestors, dirRealpath(dir)];
	const skillPath = join(dir, "SKILL.md");
	let skill = null;
	if (existsSync(skillPath) && lstatSync(skillPath).isFile()) {
		const parsed = parseSkillFile(skillPath);
		if ("error" in parsed) broken.push({
			home,
			path: skillPath,
			reason: parsed.error
		});
		else {
			const id = skillId(home, posix.join(rel, "SKILL.md"));
			leaves.push({
				id,
				home,
				relPath: posix.join(rel, "SKILL.md"),
				path: skillPath,
				directory: dir,
				parsed
			});
			skill = {
				kind: "skill",
				id,
				name: parsed.name,
				description: parsed.description,
				home,
				path: skillPath,
				gate: "on",
				source: "global",
				collision: false
			};
		}
	}
	const children = [];
	for (const name of listEntries(dir).sort()) {
		if (IGNORE.has(name) || name === "SKILL.md") continue;
		const child = join(dir, name);
		let stat;
		try {
			stat = lstatSync(child);
		} catch (error) {
			broken.push({
				home,
				path: child,
				reason: {
					kind: "unreadable-skill",
					message: String(error)
				}
			});
			children.push({
				kind: "broken",
				home,
				name,
				path: child,
				reason: {
					kind: "unreadable-skill",
					message: String(error)
				}
			});
			continue;
		}
		if (stat.isDirectory() || stat.isSymbolicLink()) {
			if (stat.isSymbolicLink() && !existsSync(child)) {
				let target = "";
				try {
					target = readlinkSync(child);
				} catch {
					target = child;
				}
				const reason = {
					kind: "missing-symlink-target",
					target
				};
				broken.push({
					home,
					path: child,
					reason
				});
				children.push({
					kind: "broken",
					home,
					name,
					path: child,
					reason
				});
				continue;
			}
			if (!lstatSync(child).isDirectory() && !existsSync(join(child, "SKILL.md"))) continue;
			if (chain.includes(dirRealpath(child)) || depth >= MAX_WALK_DEPTH) {
				const reason = {
					kind: "symlink-cycle",
					target: cycleTarget(child)
				};
				broken.push({
					home,
					path: child,
					reason
				});
				children.push({
					kind: "broken",
					home,
					name,
					path: child,
					reason
				});
				continue;
			}
			children.push(walkGroup(home, homeRoot, child, leaves, broken, chain, depth + 1));
		}
	}
	const node = {
		kind: "group",
		home,
		name: basename(dir),
		rel,
		path: dir,
		gate: "off",
		skill,
		children
	};
	return {
		...node,
		gate: combineGates(collectGates(node))
	};
}
function walkHome(home, homeRoot, leaves, broken) {
	if (!existsSync(homeRoot)) return [];
	const ancestors = [dirRealpath(homeRoot)];
	const children = [];
	for (const name of listEntries(homeRoot).sort()) {
		if (IGNORE.has(name)) continue;
		const path = join(homeRoot, name);
		let stat;
		try {
			stat = lstatSync(path);
		} catch (error) {
			const reason = {
				kind: "unreadable-skill",
				message: String(error)
			};
			broken.push({
				home,
				path,
				reason
			});
			children.push({
				kind: "broken",
				home,
				name,
				path,
				reason
			});
			continue;
		}
		if (stat.isFile() && name.endsWith(".md")) {
			const parsed = parseSkillFile(path);
			if ("error" in parsed) {
				broken.push({
					home,
					path,
					reason: parsed.error
				});
				children.push({
					kind: "broken",
					home,
					name,
					path,
					reason: parsed.error
				});
				continue;
			}
			const id = skillId(home, name);
			leaves.push({
				id,
				home,
				relPath: name,
				path,
				directory: homeRoot,
				parsed
			});
			children.push({
				kind: "root-skill",
				id,
				name: parsed.name,
				description: parsed.description,
				home,
				path,
				gate: "on",
				source: "global",
				collision: false
			});
			continue;
		}
		if (stat.isDirectory() || stat.isSymbolicLink()) {
			if (stat.isSymbolicLink() && !existsSync(path)) {
				let target = "";
				try {
					target = readlinkSync(path);
				} catch {
					target = path;
				}
				const reason = {
					kind: "missing-symlink-target",
					target
				};
				broken.push({
					home,
					path,
					reason
				});
				children.push({
					kind: "broken",
					home,
					name,
					path,
					reason
				});
				continue;
			}
			let link = { kind: "directory" };
			if (stat.isSymbolicLink()) {
				let target = path;
				try {
					target = readlinkSync(path);
				} catch {}
				link = {
					kind: "symlink",
					target
				};
			}
			const walked = walkGroup(home, homeRoot, path, leaves, broken, ancestors, 1);
			if (walked.kind === "broken") {
				children.push(walked);
				continue;
			}
			const pruned = pruneGroup(walked);
			if (pruned === null) {
				const skillPath = join(path, "SKILL.md");
				const parseFail = broken.find((entry) => entry.path === skillPath);
				const reason = parseFail?.reason ?? { kind: "empty-pack" };
				if (parseFail === void 0) broken.push({
					home,
					path,
					reason
				});
				children.push({
					kind: "broken",
					home,
					name,
					path,
					reason
				});
				continue;
			}
			const pack = {
				kind: "pack",
				id: packId(home, name),
				home,
				name,
				path,
				link,
				gate: pruned.gate,
				skill: pruned.skill,
				children: pruned.children
			};
			children.push(pack);
		}
	}
	return regroupByOrigin(children, homeRoot);
}
function applyGatesToTree(nodes, collisions, input, composed) {
	return nodes.map((node) => applyGatesToNode(node, collisions, input, composed));
}
function applyGatesToNode(node, collisions, input, composed) {
	if (node.kind === "broken") return node;
	if (node.kind === "root-skill") {
		const state = gateStateOf(node.id, input, composed);
		return {
			...node,
			...state,
			collision: collisions.has(node.id)
		};
	}
	const skill = node.skill === null ? null : {
		...node.skill,
		...gateStateOf(node.skill.id, input, composed),
		collision: collisions.has(node.skill.id)
	};
	const children = node.children.map((child) => {
		if (child.kind === "broken") return child;
		const next = applyGatesToNode({
			...child,
			kind: "pack",
			id: packId(child.home, child.name),
			link: { kind: "directory" }
		}, collisions, input, composed);
		if (next.kind !== "pack") return child;
		return {
			kind: "group",
			home: next.home,
			name: next.name,
			rel: child.kind === "group" ? child.rel : posixRel(dirname(node.path), next.path),
			path: next.path,
			gate: next.gate,
			skill: next.skill,
			children: next.children
		};
	});
	const pack = {
		...node,
		skill,
		children,
		gate: "off"
	};
	return {
		...pack,
		gate: combineGates(collectGates(pack))
	};
}
/**
* Compose Global→Project→Chat into one document so a read at any layer reports
* the gate the runtime enforces, while still naming the layer that decided each
* value. Layer documents keep returning `LayerGate` values because the writer
* still needs honest 'inherit' bookkeeping; a composed document loses it, which
* is exactly the point: after folding, every id maps to the layer that won it.
* @param input - the layers a query loaded.
* @returns the composed document plus a decision map from skill id to layer.
*/
function composeChain(input) {
	const fallback = propagatedSkill(void 0, input);
	const ids = new Set([
		input.global,
		input.project,
		input.session
	].flatMap((doc) => Object.keys(doc?.gates ?? {})));
	const gates = Object.create(null);
	const decided = /* @__PURE__ */ new Map();
	for (const id of ids) {
		const state = propagatedSkill(id, input);
		gates[id] = state.gate;
		decided.set(id, state.source);
	}
	return {
		document: {
			version: 2,
			default: fallback.gate,
			gates
		},
		decided,
		defaultSource: fallback.source
	};
}
function resolveCatalog(input) {
	const composed = input.composeChain === true ? composeChain(input) : void 0;
	const source = composed === void 0 ? input : {
		...input,
		global: composed.document
	};
	const leaves = [];
	const broken = [];
	const agentChildren = walkHome("agent", source.agentHome, leaves, broken);
	const dshChildren = walkHome("dsh", source.dshHome, leaves, broken);
	const byName = /* @__PURE__ */ new Map();
	for (const leaf of leaves) {
		const list = byName.get(leaf.parsed.name) ?? [];
		list.push(leaf.id);
		byName.set(leaf.parsed.name, list);
	}
	const collisions = [];
	const collisionIds = /* @__PURE__ */ new Set();
	for (const [name, skills] of byName) {
		if (skills.length < 2) continue;
		collisions.push({
			name,
			skills
		});
		for (const id of skills) collisionIds.add(id);
	}
	const tree = [{
		kind: "home",
		home: "agent",
		path: source.agentHome,
		children: applyGatesToTree(agentChildren, collisionIds, source, composed)
	}, {
		kind: "home",
		home: "dsh",
		path: source.dshHome,
		children: applyGatesToTree(dshChildren, collisionIds, source, composed)
	}];
	const inventory = [];
	for (const leaf of leaves) {
		if (!isHostSkillName(leaf.parsed.name)) continue;
		const state = gateStateOf(leaf.id, source, composed);
		const gate = state.gate;
		const invocable = gate === "on";
		inventory.push({
			id: leaf.id,
			name: leaf.parsed.name,
			description: leaf.parsed.description,
			...leaf.parsed.whenToUse !== void 0 ? { whenToUse: leaf.parsed.whenToUse } : {},
			home: leaf.home,
			path: leaf.path,
			directory: leaf.directory,
			invocation: {
				modelInvocable: invocable && leaf.parsed.modelInvocable,
				userInvocable: invocable && leaf.parsed.userInvocable
			},
			content: leaf.parsed.content,
			gate,
			source: state.source
		});
	}
	return {
		offered: inventory.filter((skill) => skill.gate === "on"),
		inventory,
		tree,
		collisions,
		broken
	};
}
function resolvedPath(path) {
	try {
		if (!existsSync(path)) return void 0;
		return realpathSync(path);
	} catch {
		return;
	}
}
function originLayout(packPath, homeRoot) {
	const real = resolvedPath(packPath);
	if (real === void 0) return void 0;
	const parts = real.split(sep).filter((part) => part !== "");
	const skillsAt = parts.lastIndexOf("skills");
	if (skillsAt <= 0 || skillsAt >= parts.length - 1) return void 0;
	const skillsPath = `${sep}${parts.slice(0, skillsAt + 1).join(sep)}`;
	const homeReal = resolvedPath(homeRoot);
	if (homeReal !== void 0 && skillsPath === homeReal) return void 0;
	const originName = parts[skillsAt - 1];
	if (originName === void 0 || originName.startsWith(".")) return void 0;
	const originPath = `${sep}${parts.slice(0, skillsAt).join(sep)}`;
	const segments = parts.slice(skillsAt + 1);
	if (segments.length === 0) return void 0;
	return {
		originName,
		originPath,
		segments
	};
}
function packAsGroup(pack, rel, name) {
	return {
		kind: "group",
		home: pack.home,
		name,
		rel,
		path: pack.path,
		gate: pack.gate,
		skill: pack.skill,
		children: pack.children
	};
}
function insertOriginSkill(origin, segments, pack) {
	let parent = origin;
	let prefix = "";
	for (let i = 0; i < segments.length; i += 1) {
		const name = segments[i];
		if (name === void 0) return;
		const rel = prefix === "" ? name : `${prefix}/${name}`;
		if (i === segments.length - 1) {
			parent.children.push(packAsGroup(pack, rel, name));
			return;
		}
		let group = parent.children.find((child) => child.kind === "group" && child.rel === rel);
		if (group === void 0) {
			group = {
				kind: "group",
				home: pack.home,
				name,
				rel,
				path: join(parent.path, name),
				gate: "off",
				skill: null,
				children: []
			};
			parent.children.push(group);
		}
		parent = {
			children: group.children,
			path: group.path
		};
		prefix = rel;
	}
}
function compareByName(a, b) {
	return a.name.localeCompare(b.name);
}
function finalizeFolderChild(node) {
	if (node.kind === "broken") return node;
	const children = node.children.map(finalizeFolderChild).sort(compareByName);
	const next = {
		...node,
		children,
		gate: "off"
	};
	return {
		...next,
		gate: combineGates(collectGates(next))
	};
}
function regroupByOrigin(nodes, homeRoot) {
	const leftover = [];
	const origins = /* @__PURE__ */ new Map();
	for (const node of nodes) {
		if (node.kind !== "pack") {
			leftover.push(node);
			continue;
		}
		const layout = originLayout(node.path, homeRoot);
		if (layout === void 0) {
			leftover.push(node);
			continue;
		}
		const key = `${node.home}:${layout.originPath}`;
		let origin = origins.get(key);
		if (origin === void 0) {
			origin = {
				originName: layout.originName,
				originPath: layout.originPath,
				home: node.home,
				children: []
			};
			origins.set(key, origin);
		}
		insertOriginSkill({
			children: origin.children,
			path: origin.originPath
		}, layout.segments, node);
	}
	const originPacks = [];
	for (const origin of origins.values()) {
		const children = origin.children.map(finalizeFolderChild).sort(compareByName);
		const pack = {
			kind: "pack",
			id: packId(origin.home, origin.originName),
			home: origin.home,
			name: origin.originName,
			path: origin.originPath,
			link: { kind: "directory" },
			gate: "off",
			skill: null,
			children
		};
		originPacks.push({
			...pack,
			gate: combineGates(collectGates(pack))
		});
	}
	return [...originPacks, ...leftover].sort(compareByName);
}
function pruneGroup(node) {
	const children = [];
	for (const child of node.children) {
		if (child.kind === "broken") {
			children.push(child);
			continue;
		}
		const next = pruneGroup(child);
		if (next !== null) children.push(next);
	}
	if (node.skill === null && children.length === 0) return null;
	const pruned = {
		...node,
		children,
		gate: "off"
	};
	return {
		...pruned,
		gate: combineGates(collectGates(pruned))
	};
}
function findGroupByRel(node, rel) {
	if (node.kind === "pack" && rel === node.name) return node;
	if (node.kind === "group" && node.rel === rel) return node;
	for (const child of node.children) {
		if (child.kind !== "group") continue;
		const found = findGroupByRel(child, rel);
		if (found !== void 0) return found;
	}
}
function descendantSkillIds(node) {
	const ids = [];
	if (node.skill !== null) ids.push(node.skill.id);
	for (const child of node.children) if (child.kind === "group") ids.push(...descendantSkillIds(child));
	return ids;
}
function collectSkillGates(tree) {
	const rows = [];
	const walk = (nodes) => {
		for (const node of nodes) {
			if (node.kind === "root-skill") {
				rows.push({
					id: node.id,
					gate: node.gate
				});
				continue;
			}
			if (node.kind === "broken") continue;
			if (node.skill !== null) rows.push({
				id: node.skill.id,
				gate: node.skill.gate
			});
			walk(node.children);
		}
	};
	for (const home of tree) walk(home.children);
	return rows;
}
//#endregion
//#region lib/types/hub.js
function emptyDocument(layer) {
	return {
		version: 2,
		default: layer === "global" ? "on" : "inherit",
		gates: {}
	};
}
function readDoc(path, layer) {
	if (!existsSync(path)) return emptyDocument(layer);
	let raw;
	try {
		raw = JSON.parse(readFileSync(path, "utf8"));
	} catch {
		throw new Error(`Invalid SkillHub visibility document: ${path}`);
	}
	if (typeof raw !== "object" || raw === null || Array.isArray(raw)) throw new Error(`Invalid SkillHub visibility document: ${path}`);
	const object = raw;
	if (typeof object.gates !== "object" || object.gates === null || Array.isArray(object.gates)) throw new Error(`Invalid SkillHub visibility document: ${path}`);
	const gates = Object.create(null);
	for (const [id, gate] of Object.entries(object.gates)) {
		if (gate !== "on" && gate !== "off" && !(layer !== "global" && gate === "inherit")) throw new Error(`Invalid SkillHub visibility document: ${path}`);
		gates[id] = gate;
	}
	if (object.version === void 0) return {
		version: 2,
		default: layer === "project" ? "inherit" : "on",
		gates,
		...layer === "session" ? { legacySnapshot: true } : {}
	};
	if (object.version !== 2) throw new Error(`Unsupported SkillHub visibility document version: ${path}`);
	const defaultGate = object.default;
	if (defaultGate !== "on" && defaultGate !== "off" && !(layer !== "global" && defaultGate === "inherit")) throw new Error(`Invalid SkillHub visibility document: ${path}`);
	if (object.legacySnapshot !== void 0 && typeof object.legacySnapshot !== "boolean") throw new Error(`Invalid SkillHub visibility document: ${path}`);
	return {
		version: 2,
		default: defaultGate,
		gates,
		...readPropagationMetadata(object, path),
		...object.legacySnapshot === true ? { legacySnapshot: true } : {}
	};
}
function writeDoc(path, doc) {
	mkdirSync(dirname(path), { recursive: true });
	const temp = `${path}.${randomUUID()}.tmp`;
	writeFileSync(temp, `${JSON.stringify(doc, null, 2)}\n`, { mode: 384 });
	renameSync(temp, path);
}
function folderKey(folder) {
	return createHash("sha256").update(resolve(folder)).digest("hex").slice(0, 24);
}
function optionalFolder(folder) {
	return folder === void 0 || folder.trim() === "" ? void 0 : resolve(folder);
}
function assertSessionId(id) {
	if (id.trim() === "" || id === "." || id === ".." || id.includes("/") || id.includes("\\") || id.includes("\0")) throw new Error("invalid sessionId for Session visibility");
}
function resolvedLayer(query) {
	return query.layer ?? (query.sessionId !== void 0 ? "session" : query.folder !== void 0 ? "project" : "global");
}
function targetIds(catalog, target) {
	if (target.kind === "skill") return [target.id];
	if (target.kind === "ids") return [...target.ids];
	if (target.kind === "all") return collectSkillGates(catalog.tree).map((row) => row.id);
	if (target.kind === "home") return collectSkillGates(catalog.tree.filter((node) => node.home === target.home)).map((row) => row.id);
	const pack = catalog.tree.find((node) => node.home === target.packHome)?.children.find((node) => node.kind === "pack" && node.name === target.packName);
	if (pack === void 0) return [];
	const group = findGroupByRel(pack, target.rel);
	return group === void 0 ? [] : descendantSkillIds(group);
}
var SkillHub = class {
	paths;
	constructor(paths) {
		this.paths = paths;
		for (const path of [
			paths.agentHome,
			paths.dshHome,
			paths.storeDir
		]) mkdirSync(path, { recursive: true });
	}
	globalPath() {
		return join(this.paths.storeDir, "global.json");
	}
	projectPath(folder) {
		return join(this.paths.storeDir, "projects", `${folderKey(folder)}.json`);
	}
	sessionPath(id) {
		assertSessionId(id);
		return join(this.paths.storeDir, "sessions", `${id}.json`);
	}
	documentPath(layer, sessionId, folder) {
		if (layer === "global") return this.globalPath();
		if (layer === "project") {
			if (folder === void 0 || folder === "") throw new Error("folder required for Project visibility");
			return this.projectPath(folder);
		}
		if (layer !== "session") throw new Error("invalid layer");
		if (sessionId === void 0 || sessionId === "") throw new Error("sessionId required for Session visibility");
		return this.sessionPath(sessionId);
	}
	/** UI and provider use the same scoped, latest-operation resolution. */
	catalog(query = {}) {
		const layer = resolvedLayer(query);
		const folder = optionalFolder(query.folder);
		this.documentPath(layer, query.sessionId, folder);
		const global = readDoc(this.globalPath(), "global");
		const project = layer === "global" || folder === void 0 ? void 0 : readDoc(this.projectPath(folder), "project");
		const session = layer !== "session" || query.sessionId === void 0 ? void 0 : readDoc(this.sessionPath(query.sessionId), "session");
		return {
			...resolveCatalog({
				agentHome: this.paths.agentHome,
				dshHome: this.paths.dshHome,
				global,
				...project !== void 0 ? { project } : {},
				...session !== void 0 ? { session } : {}
			}),
			layer,
			...query.resolved ? { resolved: true } : {},
			...session?.legacySnapshot ? { legacySessionSnapshot: true } : {}
		};
	}
	layerCatalog(layer, folder, sessionId) {
		return this.catalog({
			layer,
			...layer === "session" && sessionId !== void 0 ? { sessionId } : {},
			...layer === "project" && folder !== void 0 ? { folder } : {}
		});
	}
	displayedCatalog(layer, folder, sessionId) {
		return this.catalog({
			layer,
			resolved: true,
			...folder !== void 0 ? { folder } : {},
			...sessionId !== void 0 ? { sessionId } : {}
		});
	}
	toggle(query) {
		const folder = optionalFolder(query.folder);
		const path = this.documentPath(query.layer, query.sessionId, folder);
		const catalog = this.catalog({
			layer: query.layer,
			...query.sessionId !== void 0 ? { sessionId: query.sessionId } : {},
			...folder !== void 0 ? { folder } : {}
		});
		const current = readDoc(path, query.layer);
		const revision = nextPropagationRevision(this.paths.storeDir);
		if (query.target.kind === "all") writeDoc(path, {
			version: 2,
			default: query.target.on ? "on" : "off",
			defaultRevision: revision,
			gates: {},
			gateRevisions: {}
		});
		else {
			const gates = { ...current.gates };
			const gateRevisions = { ...current.gateRevisions };
			for (const id of targetIds(catalog, query.target)) {
				gates[id] = query.target.on ? "on" : "off";
				gateRevisions[id] = revision;
			}
			writeDoc(path, {
				...current,
				gates,
				gateRevisions
			});
		}
		return this.displayedCatalog(query.layer, folder, query.sessionId);
	}
	/** Compatibility for older clients only; no restore controls in the current UI. */
	inherit(query) {
		const folder = optionalFolder(query.folder);
		const path = this.documentPath(query.layer, query.sessionId, folder);
		const catalog = this.catalog({
			layer: query.layer,
			...query.sessionId !== void 0 ? { sessionId: query.sessionId } : {},
			...folder !== void 0 ? { folder } : {}
		});
		const current = readDoc(path, query.layer);
		if (query.target.kind === "all") writeDoc(path, query.layer === "global" ? {
			...current,
			gates: {},
			gateRevisions: {}
		} : emptyDocument(query.layer));
		else {
			const gates = { ...current.gates };
			const gateRevisions = { ...current.gateRevisions };
			for (const id of targetIds(catalog, query.target)) {
				if (query.layer === "global" || current.default === "inherit") delete gates[id];
				else gates[id] = "inherit";
				delete gateRevisions[id];
			}
			writeDoc(path, {
				...current,
				gates,
				gateRevisions
			});
		}
		return this.layerCatalog(query.layer, folder, query.sessionId);
	}
	resetSession(sessionId, folder) {
		return this.inherit({
			layer: "session",
			sessionId,
			...folder !== void 0 ? { folder } : {},
			target: { kind: "all" }
		});
	}
	resetProject(folder) {
		return this.inherit({
			layer: "project",
			folder,
			target: { kind: "all" }
		});
	}
	install(sourceDir, home) {
		let real;
		try {
			real = realpathSync(sourceDir);
		} catch {
			throw new Error(`Pack source directory does not exist: ${sourceDir}`);
		}
		if (!lstatSync(real).isDirectory()) throw new Error(`Pack source is not a directory: ${sourceDir}`);
		const destHome = home === "agent" ? this.paths.agentHome : this.paths.dshHome;
		mkdirSync(destHome, { recursive: true });
		const name = basename(sourceDir);
		const dest = join(destHome, name);
		if (existsSync(dest)) throw new Error(`Pack "${name}" already exists in ${home} home`);
		symlinkSync(sourceDir, dest);
		return this.catalog({});
	}
};
//#endregion
//#region lib/types/http.js
function clientCatalog(catalog) {
	return {
		offered: catalog.offered.map((skill) => ({
			id: skill.id,
			name: skill.name,
			home: skill.home
		})),
		tree: catalog.tree,
		collisions: catalog.collisions,
		broken: catalog.broken,
		layer: catalog.layer,
		resolved: catalog.resolved === true,
		legacySessionSnapshot: catalog.legacySessionSnapshot === true
	};
}
function send(res, status, body) {
	const text = JSON.stringify(body);
	res.writeHead(status, {
		"content-type": "application/json; charset=utf-8",
		"cache-control": "no-store"
	});
	res.end(text);
}
const MAX_BODY_BYTES = 1048576;
async function readJson(req) {
	const chunks = [];
	let bytes = 0;
	for await (const chunk of req) {
		bytes += chunk.length;
		if (bytes > MAX_BODY_BYTES) throw new Error("invalid JSON: request body exceeds 1 MiB");
		chunks.push(chunk);
	}
	if (chunks.length === 0) return {};
	let parsed;
	try {
		parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
	} catch {
		throw new Error("invalid JSON body");
	}
	if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
	return parsed;
}
function isLayerName(value) {
	return value === "global" || value === "project" || value === "session";
}
/**
* Read one catalog request. Every surface that displays a gate must see the
* same value the model runs with, so the whole Panel chain is resolved through
* Global→Project→Chat; a raw layer-only read is opt-in for callers that
* explicitly want the layer document itself.
*/
function query(url) {
	const sessionId = url.searchParams.get("sessionId") ?? void 0;
	const folder = url.searchParams.get("folder") ?? void 0;
	const layer = url.searchParams.get("layer");
	return {
		...sessionId !== void 0 && sessionId !== "" ? { sessionId } : {},
		...folder !== void 0 && folder !== "" ? { folder } : {},
		...isLayerName(layer) ? { layer } : {},
		resolved: url.searchParams.get("raw") !== "1"
	};
}
function isSkillIdList(value) {
	return Array.isArray(value) && value.every((id) => typeof id === "string" && id !== "");
}
function visibilityTarget(body) {
	const kind = body["kind"];
	if (kind === "all") return { kind: "all" };
	if (kind === "skill" && typeof body["id"] === "string") return {
		kind: "skill",
		id: body["id"]
	};
	if (kind === "ids" && isSkillIdList(body["ids"])) return {
		kind: "ids",
		ids: body["ids"]
	};
	if (kind === "home" && (body["home"] === "agent" || body["home"] === "dsh")) return {
		kind: "home",
		home: body["home"]
	};
	if (kind === "group" && (body["packHome"] === "agent" || body["packHome"] === "dsh") && typeof body["packName"] === "string" && typeof body["rel"] === "string") return {
		kind: "group",
		packHome: body["packHome"],
		packName: body["packName"],
		rel: body["rel"]
	};
	throw new Error("invalid visibility target");
}
function toggleTarget(body) {
	if (typeof body["on"] !== "boolean") throw new Error("on must be boolean");
	return {
		...visibilityTarget(body),
		on: body["on"]
	};
}
function handleSkillHubHttp(hub, invalidate, requestRejection, mcp) {
	return async (req, res) => {
		try {
			const host = req.headers.host ?? "127.0.0.1";
			const url = new URL(req.url ?? "/", `http://${host}`);
			const path = url.pathname.slice(9) || "/";
			if (requestRejection === void 0) {
				send(res, 503, { error: "Host authentication unavailable" });
				return;
			}
			const rejection = requestRejection(req);
			if (rejection !== void 0) {
				send(res, rejection, { error: rejection === 401 ? "unauthorized" : "forbidden" });
				return;
			}
			if (req.method === "GET" && path === "/mcp/catalog") {
				if (!mcp) {
					send(res, 503, { error: "MCP visibility unavailable" });
					return;
				}
				send(res, 200, mcp.catalog(query(url)));
				return;
			}
			if (req.method === "GET" && (path === "/catalog" || path === "/")) {
				send(res, 200, clientCatalog(hub.catalog(query(url))));
				return;
			}
			if (req.method !== "POST") {
				send(res, 405, { error: "method not allowed" });
				return;
			}
			const body = await readJson(req);
			if (path === "/mcp/toggle" || path === "/mcp/inherit") {
				if (!mcp) throw new Error("MCP visibility unavailable");
				const layer = body["layer"];
				if (layer !== "global" && layer !== "project" && layer !== "session") throw new Error("invalid MCP layer");
				if (typeof body["server"] !== "string") throw new Error("server required");
				if (path === "/mcp/toggle" && typeof body["on"] !== "boolean") throw new Error("on must be boolean");
				for (const key of ["folder", "sessionId"]) if (body[key] !== void 0 && typeof body[key] !== "string") throw new Error(`invalid ${key}`);
				const q = {
					layer,
					...typeof body["folder"] === "string" ? { folder: body["folder"] } : {},
					...typeof body["sessionId"] === "string" ? { sessionId: body["sessionId"] } : {}
				};
				send(res, 200, mcp.mutate(q, body["server"], path === "/mcp/toggle" ? body["on"] : void 0));
				return;
			}
			if (path === "/toggle") {
				const layer = body["layer"];
				if (layer !== "global" && layer !== "project" && layer !== "session") {
					send(res, 400, { error: "invalid layer" });
					return;
				}
				const toggle = {
					layer,
					target: toggleTarget(body)
				};
				if (typeof body["sessionId"] === "string") toggle.sessionId = body["sessionId"];
				if (typeof body["folder"] === "string") toggle.folder = body["folder"];
				hub.toggle(toggle);
				invalidate();
				send(res, 200, clientCatalog(hub.displayedCatalog(layer, toggle.folder, toggle.sessionId)));
				return;
			}
			if (path === "/inherit") {
				const layer = body["layer"];
				if (layer !== "global" && layer !== "project" && layer !== "session") {
					send(res, 400, { error: "invalid layer" });
					return;
				}
				const request = {
					layer,
					target: visibilityTarget(body)
				};
				if (typeof body["sessionId"] === "string") request.sessionId = body["sessionId"];
				if (typeof body["folder"] === "string") request.folder = body["folder"];
				hub.inherit(request);
				invalidate();
				send(res, 200, clientCatalog(hub.displayedCatalog(layer, request.folder, request.sessionId)));
				return;
			}
			if (path === "/reset") {
				if (typeof body["sessionId"] !== "string") {
					send(res, 400, { error: "sessionId required" });
					return;
				}
				const folder = typeof body["folder"] === "string" ? body["folder"] : void 0;
				hub.resetSession(body["sessionId"], folder);
				invalidate();
				send(res, 200, clientCatalog(hub.displayedCatalog("session", folder, body["sessionId"])));
				return;
			}
			if (path === "/install") {
				if (typeof body["sourceDir"] !== "string" || body["home"] !== "agent" && body["home"] !== "dsh") {
					send(res, 400, { error: "sourceDir and home required" });
					return;
				}
				const catalog = hub.install(body["sourceDir"], body["home"]);
				invalidate();
				send(res, 200, clientCatalog(catalog));
				return;
			}
			send(res, 404, { error: "not found" });
		} catch (error) {
			const message = String(error);
			send(res, !/visibility document/i.test(message) && /required|invalid|must be|no longer registered|Cannot fully hide/i.test(message) ? 400 : 500, { error: message });
		}
	};
}
//#endregion
//#region lib/types/provider.js
const PROVIDER = "skillhub";
const USER_DSH_RANK = 350;
const USER_AGENTS_RANK = 351;
/**
* Read a session id out of a value that may be an id, a plain `{ session }`
* key, or a Cordis Context (whose own property dereference is guarded and may
* throw). Return the first readable shape.
* @param holder - candidate scope key.
* @returns the session id, when one is readable.
*/
function sessionIdOfKey(holder) {
	if (typeof holder !== "object" || holder === null) return void 0;
	const agent = holder;
	try {
		if (typeof agent.session?.id === "string") return agent.session.id;
		if (typeof agent.session?.header?.id === "string") return agent.session.header.id;
		const raw = agent.session;
		if (typeof raw === "string") return raw;
	} catch {
		return;
	}
}
/**
* Resolve the chat whose visibility layer applies to a lookup.
*
* The registry passes its viewing scope through as an opaque {@link ScopeKey}.
* For an agent read that is the agent's own Context — the session id lives on
* the scope tag the registry wrote into it, NOT as a `scope.session` property.
* Reading only the property shape silently resolved no session, so a Chat-layer
* override never reached the provider and the model kept seeing the Project or
* Global value the user had just overridden in the conversation panel.
*
* The plain-object shape is still accepted for direct callers that hand over an
* `{ session: { id } }` value, and for the per-agent registration below, which
* knows its own session id and can pass it in as a string.
* @param scope - the lookup scope: an agent Context, a scope key, or an id.
* @returns the session id, or undefined when the read is not chat-scoped.
*/
function sessionIdFromScope(scope) {
	if (typeof scope === "string") return scope === "" ? void 0 : scope;
	if (typeof scope !== "object" || scope === null) return void 0;
	try {
		const fromTag = sessionIdOfKey(scopeOf(scope));
		if (fromTag !== void 0) return fromTag;
	} catch {}
	return sessionIdOfKey(scope);
}
function toCandidate(skill) {
	const source = skill.home === "dsh" ? "user-dsh" : "user-agents";
	const rank = skill.home === "dsh" ? USER_DSH_RANK : USER_AGENTS_RANK;
	return {
		name: skill.name,
		description: skill.description,
		...skill.whenToUse !== void 0 ? { whenToUse: skill.whenToUse } : {},
		invocation: skill.invocation,
		source,
		provider: PROVIDER,
		rank,
		locator: {
			path: skill.path,
			directory: skill.directory
		},
		path: skill.path,
		resourceBase: {
			kind: "directory",
			path: skill.directory
		}
	};
}
function providerSkillsFromCatalog(catalog) {
	const byName = /* @__PURE__ */ new Map();
	for (const skill of catalog.inventory) {
		const list = byName.get(skill.name) ?? [];
		list.push(skill);
		byName.set(skill.name, list);
	}
	const selected = [];
	for (const group of byName.values()) {
		const on = group.filter((skill) => skill.gate === "on");
		const pool = on.length > 0 ? on : group;
		pool.sort((left, right) => Number(left.home !== "dsh") - Number(right.home !== "dsh"));
		const pick = pool[0];
		if (pick === void 0) continue;
		selected.push(pick);
	}
	return selected;
}
/**
* Build the provider the registry reads.
*
* `boundSessionId` exists because one provider instance serves every scope in
* the layer it was registered in: the global registration cannot tell which
* chat is asking, while the per-agent registration made on `agent/created`
* knows exactly one agent. Passing that chat in here makes the Chat layer apply
* even when a caller forwards no usable scope, which is what previously let a
* chat-level override be ignored by the model's catalog.
* @param hub - visibility store backing the provider.
* @param boundSessionId - chat this provider belongs to, when it is agent-scoped.
*/
function createSkillHubProvider(hub, boundSessionId) {
	return {
		name: PROVIDER,
		async list(options) {
			try {
				const sessionId = sessionIdFromScope(options.scope) ?? boundSessionId;
				const query = {};
				if (sessionId !== void 0) query.sessionId = sessionId;
				if (options.cwd !== void 0) query.folder = resolve(options.cwd);
				return providerSkillsFromCatalog(hub.catalog(query)).map(toCandidate);
			} catch (error) {
				console.error("[dsh-skillhub] list failed", error);
				return [];
			}
		},
		async get(candidate) {
			const locator = candidate.locator;
			if (typeof locator.path !== "string") return void 0;
			let content;
			try {
				content = readFileSync(locator.path, "utf8");
			} catch {
				return;
			}
			const split = content.startsWith("---") ? content.indexOf("\n---", 3) : -1;
			const body = split >= 0 ? content.slice(split + 4).replace(/^\r?\n/, "") : content;
			return {
				name: candidate.name,
				description: candidate.description,
				...candidate.whenToUse !== void 0 ? { whenToUse: candidate.whenToUse } : {},
				invocation: candidate.invocation,
				source: candidate.source,
				provider: PROVIDER,
				resourceBase: {
					kind: "directory",
					path: locator.directory ?? dirname(locator.path)
				},
				path: locator.path,
				content: body
			};
		}
	};
}
//#endregion
//#region lib/types/dsh-skillhub.js
const name = "dsh-skillhub";
const inject = [
	"skills",
	"webServer",
	"connection",
	"tools",
	"agents"
];
const Config = z.object({ enabled: z.boolean().default(true).volatile() });
function env(name) {
	return globalThis.process?.env?.[name];
}
function defaultAgentHome() {
	return join(env("DSH_AGENTS_HOME") ?? join(homedir(), ".agents"), "skills");
}
function defaultDshHome() {
	return join(env("DSH_HOME") ?? join(homedir(), ".dsh"), "skills");
}
function defaultStoreDir() {
	return join(env("DSH_HOME") ?? join(homedir(), ".dsh"), "skillhub");
}
function apply(ctx, config) {
	console.log("[my-plugins/dsh-skillhub] loaded");
	ctx.inject(["settings"], (settingsCtx) => {
		settingsCtx.effect(() => settingsCtx.settings.configure({ auto: true }, ctx.fiber));
	});
	if (config.enabled.get() === false) {
		console.log("[my-plugins/dsh-skillhub] disabled; provider, http, and hooks skipped");
		return;
	}
	const hub = new SkillHub({
		agentHome: defaultAgentHome(),
		dshHome: defaultDshHome(),
		storeDir: defaultStoreDir()
	});
	let control;
	ctx.skills.registerProvider((next) => {
		control = next;
		return createSkillHubProvider(hub);
	});
	const mcp = installMcpVisibility(ctx, new McpHub({ storeDir: defaultStoreDir() }));
	const invalidate = () => {
		control?.invalidate();
	};
	const connection = ctx.get("connection");
	const handler = handleSkillHubHttp(hub, invalidate, (request) => connection === void 0 ? 401 : connection.requestRejection(request), mcp);
	ctx.effect(() => ctx.webServer.register({
		kind: "prefix",
		path: "/skillhub",
		handler: (req, res) => {
			handler(req, res);
		}
	}), "dsh-skillhub http");
	const attached = /* @__PURE__ */ new WeakSet();
	const attach = (payload) => {
		const agent = payload?.agent;
		if (agent === void 0 || attached.has(agent)) return;
		attached.add(agent);
		attachAgentProvider(ctx, hub, payload);
	};
	ctx.effect(() => {
		return ctx.on.bind(ctx)("agent/created", attach);
	}, "dsh-skillhub agent provider");
	const agents = ctx.get("agents");
	for (const agent of agents?.list() ?? []) attach({ agent });
	console.log("[my-plugins/dsh-skillhub] http /skillhub");
}
/** Chat identity of one created agent, for the provider registered under it. */
function sessionIdOfAgent(agent) {
	if (typeof agent.session?.id === "string") return agent.session.id;
	if (typeof agent.session?.header?.id === "string") return agent.session.header.id;
	return typeof agent.id === "string" && agent.id !== "" ? agent.id : void 0;
}
function attachAgentProvider(owner, hub, payload) {
	if (typeof payload !== "object" || payload === null) return;
	const agent = payload.agent;
	if (agent === void 0) return;
	const agentCtx = agent.ctx;
	if (agentCtx === void 0) return;
	try {
		const skills = agentCtx.get("skills");
		if (skills === void 0 || typeof skills.registerProvider !== "function") return;
		const sessionId = sessionIdOfAgent(agent);
		owner.effect(() => agentCtx.effect(() => skills.registerProvider(() => {
			const current = createSkillHubProvider(hub, sessionId);
			const name = "skillhub-propagation";
			return {
				...current,
				name,
				async list(options) {
					const result = await current.list(options);
					if (!Array.isArray(result)) return result;
					return result.map((candidate) => ({
						...candidate,
						provider: name,
						rank: (candidate.rank ?? 350) - 2
					}));
				}
			};
		}), "dsh-skillhub scoped propagation"), "dsh-skillhub agent provider");
	} catch (error) {
		console.error("[dsh-skillhub] agent provider failed", error);
	}
}
//#endregion
export { Config, apply, attachAgentProvider, inject, name };

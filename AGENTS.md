<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

<!-- calavera-agent-bootstrap:start -->

# Calavera Agent Guidance

- Use Calavera when the user wants to inspect, compose, preview, apply, or update project tooling.
- Prefer the Calavera MCP server over hand-authoring `calavera.config.json`.
- If the Calavera MCP tools are not available, help the user register the MCP server from `.agents/calavera/mcp.md` or fall back to the Calavera Web UI.
- Inspect existing project tooling before composing a recipe and raise likely config conflicts early.
- If likely conflicts exist, pause before applying changes. List each conflict as a hard stop or a migration decision the user can approve, and use `dry_run_apply` to show concrete impact when adoption still looks possible.
- Start with `list_profiles`, `list_integrations`, and `list_ai_artifacts`; use `describe_integration` when the user asks for more information or an option needs explanation.
- Compose recipes with `compose_recipe`, validate them with `validate_recipe`, and explain the selected integrations with `explain_recipe`.
- Always present `dry_run_apply` output to the user before changing files.
- Call `apply_recipe` only after the user explicitly approves the dry-run result.
- Use AskUserTool or the agent client's equivalent when available for profile choices, conflict decisions, and apply approval.

MCP setup notes live in `.agents/calavera/mcp.md`.

<!-- calavera-agent-bootstrap:end -->

## Accessibility

For icon-only buttons, put the accessible name in a `<span className="visually-hidden">` inside the button instead of `aria-label`. Visible text in the DOM is more reliably exposed to assistive technologies and translation tools than attribute-only labels.

## CSS

Use logical properties and values (`inline-size`, `padding-block`, `inset-inline-start`, `text-align: start`, `svb`, etc.) instead of physical ones. Stylelint enforces this via `stylelint-plugin-logical-css`. Viewport breakpoints may still use `@media (width …)` because that is the established media feature for the layout viewport.

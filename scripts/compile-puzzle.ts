#!/usr/bin/env bun
import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { compileDraft, decompilePuzzle, parseSource, serializeSource } from "../src/authoring";

function printUsage() {
  console.log(`Usage:
  bun run compile-puzzle <input.wbw> [--out public/puzzles/YYYY-MM-DD.json]
  bun run compile-puzzle --from-json public/puzzles/YYYY-MM-DD.json [--out draft.wbw]

Compiles a .wbw draft into playable puzzle JSON, or decompiles JSON into .wbw source.`);
}

const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
  printUsage();
  process.exit(args.length === 0 ? 1 : 0);
}

const fromJson = args.includes("--from-json");
const outIndex = args.indexOf("--out");
const outPath = outIndex === -1 ? null : args[outIndex + 1];
const inputPath = resolve(
  args.find(
    (arg, index) => index !== outIndex && index !== outIndex + 1 && !arg.startsWith("--"),
  ) ?? "",
);

if (!inputPath) {
  printUsage();
  process.exit(1);
}

if (fromJson) {
  const puzzle = JSON.parse(await readFile(inputPath, "utf8"));
  const draft = decompilePuzzle(puzzle);
  const source = serializeSource(draft);
  const destination = outPath ?? inputPath.replace(/\.json$/i, ".wbw");

  await writeFile(destination, source, "utf8");
  console.log(`Wrote ${destination}`);
} else {
  const source = await readFile(inputPath, "utf8");
  const draft = parseSource(source);
  const result = compileDraft(draft);

  if (result.warnings.length > 0) {
    console.warn(result.warnings.join("\n"));
  }

  if (result.errors.length > 0) {
    console.error(result.errors.join("\n"));
    process.exit(1);
  }

  const destination =
    outPath ?? join(process.cwd(), "public", "puzzles", `${draft.id || "puzzle"}.json`);

  await writeFile(destination, `${JSON.stringify(result.puzzle, null, 2)}\n`, "utf8");
  console.log(`Wrote ${destination}`);
}

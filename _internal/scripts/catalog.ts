// Reads catalog.json, checks it against the example folders and renders the catalogue in README.md.
// Runs on Node 22.18 or later without a build step, since Node strips the types itself. Needs
// `npm install` in the repository root for Prettier.
//
// Usage: node _internal/scripts/catalog.ts <slugs|check|readme>
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as prettier from "prettier";

type Example = {
  slug: string;
  title: string;
  description: string;
  category: string;
  languages: string[];
  frameworks: string[];
  features: string[];
  requires: string[];
  status: "ready" | "planned";
};

const ROOT = join(import.meta.dirname, "..", "..");
const README = join(ROOT, "README.md");
const START = "<!-- catalog:start -->";
const END = "<!-- catalog:end -->";

const CATEGORIES: Record<string, string> = {
  basics: "Basics",
  web: "Web",
  languages: "Languages",
  frameworks: "Frameworks",
  infra: "Infra",
  workflows: "Workflows",
  showcase: "TUI showcase",
  remote: "Remote boxes",
};

const REQUIRED_FIELDS: (keyof Example)[] = [
  "slug",
  "title",
  "description",
  "category",
  "languages",
  "frameworks",
  "features",
  "requires",
  "status",
];

function loadCatalog(): Example[] {
  const raw = JSON.parse(readFileSync(join(ROOT, "catalog.json"), "utf8"));
  return raw.examples as Example[];
}

/** Top-level folders that hold an example: everything except dot folders, _internal and dependencies. */
function exampleFolders(): string[] {
  return readdirSync(ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith(".") && !name.startsWith("_") && name !== "node_modules");
}

function exists(slug: string): boolean {
  return existsSync(join(ROOT, slug, "README.md"));
}

function problems(examples: Example[]): string[] {
  const found: string[] = [];
  const slugs = new Set<string>();

  for (const example of examples) {
    const missing = REQUIRED_FIELDS.filter((field) => example[field] === undefined);
    if (missing.length) found.push(`${example.slug ?? "?"}: missing ${missing.join(", ")}`);
    if (slugs.has(example.slug)) found.push(`${example.slug}: listed twice`);
    slugs.add(example.slug);
    if (!(example.category in CATEGORIES)) {
      found.push(`${example.slug}: unknown category ${example.category}`);
    }
    if (example.status === "ready" && !exists(example.slug)) {
      found.push(`${example.slug}: status is ready but the folder has no README.md`);
    }
  }

  for (const folder of exampleFolders()) {
    if (!slugs.has(folder)) found.push(`${folder}: folder is not in catalog.json`);
  }
  return found;
}

function renderTable(examples: Example[]): string {
  const rows = examples.map((example) => {
    const name = exists(example.slug) ? `[${example.slug}](${example.slug})` : example.slug;
    const needs = example.requires.join(", ") || "-";
    return `| ${name} | ${example.description} | ${needs} | ${example.status} |`;
  });
  return [
    "| Example | What it teaches | Needs | Status |",
    "| --- | --- | --- | --- |",
    ...rows,
  ].join("\n");
}

function renderCatalog(examples: Example[]): string {
  const sections = Object.entries(CATEGORIES)
    .map(([category, heading]) => {
      const inCategory = examples.filter((example) => example.category === category);
      return inCategory.length ? `### ${heading}\n\n${renderTable(inCategory)}` : "";
    })
    .filter(Boolean);
  return `${START}\n\n${sections.join("\n\n")}\n\n${END}`;
}

/**
 * README.md with the catalogue block replaced by the rendered one, formatted by Prettier so that
 * ./format.sh leaves it unchanged and `check` can compare it byte for byte.
 */
async function renderedReadme(examples: Example[]): Promise<string> {
  const readme = readFileSync(README, "utf8");
  const start = readme.indexOf(START);
  const end = readme.indexOf(END);
  if (start < 0 || end < start) throw new Error(`README.md has no ${START} ... ${END} block`);
  const text = readme.slice(0, start) + renderCatalog(examples) + readme.slice(end + END.length);
  const options = await prettier.resolveConfig(README);
  return prettier.format(text, { ...options, filepath: README });
}

async function main(command: string | undefined): Promise<number> {
  const examples = loadCatalog();

  switch (command) {
    case "slugs":
      for (const example of examples) if (exists(example.slug)) console.log(example.slug);
      return 0;

    case "check": {
      const found = problems(examples);
      if ((await renderedReadme(examples)) !== readFileSync(README, "utf8")) {
        found.push("README.md: the catalogue is out of date; run ./format.sh");
      }
      for (const problem of found) console.error(problem);
      return found.length ? 1 : 0;
    }

    case "readme":
      writeFileSync(README, await renderedReadme(examples));
      return 0;

    default:
      console.error("usage: node _internal/scripts/catalog.ts <slugs|check|readme>");
      return 2;
  }
}

process.exitCode = await main(process.argv[2]);

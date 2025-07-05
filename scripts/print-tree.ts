#!/usr/bin/env bun

import { readdir, stat } from "fs/promises";
import { join, relative } from "path";

interface TreeOptions {
  maxDepth?: number;
  excludePatterns?: string[];
  includeHidden?: boolean;
}

const DEFAULT_EXCLUDE_PATTERNS = [
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  ".turbo",
  ".cache",
  "coverage",
  ".env*",
  "*.log",
  "python3.13",
];

async function printTree(
  dir: string,
  options: TreeOptions = {},
  prefix = "",
  depth = 0
): Promise<void> {
  const {
    maxDepth = 5,
    excludePatterns = DEFAULT_EXCLUDE_PATTERNS,
    includeHidden = false,
  } = options;

  if (depth > maxDepth) {
    console.log(`${prefix}└── ... (max depth reached)`);
    return;
  }

  try {
    const entries = await readdir(dir);
    const filtered = entries.filter((entry) => {
      if (!includeHidden && entry.startsWith(".")) return false;
      return !excludePatterns.some((pattern) => {
        if (pattern.includes("*")) {
          const regex = new RegExp(pattern.replace("*", ".*"));
          return regex.test(entry);
        }
        return entry === pattern;
      });
    });

    const sorted = filtered.sort((a, b) => {
      // Directories first, then alphabetically
      return a.toLowerCase().localeCompare(b.toLowerCase());
    });

    for (let i = 0; i < sorted.length; i++) {
      const entry = sorted[i];
      const entryPath = join(dir, entry);
      const isLast = i === sorted.length - 1;
      const connector = isLast ? "└── " : "├── ";
      const extension = isLast ? "    " : "│   ";

      try {
        const stats = await stat(entryPath);

        if (stats.isDirectory()) {
          console.log(`${prefix}${connector}${entry}/`);
          await printTree(entryPath, options, prefix + extension, depth + 1);
        } else {
          const size = formatFileSize(stats.size);
          console.log(`${prefix}${connector}${entry} (${size})`);
        }
      } catch (error) {
        console.log(`${prefix}${connector}${entry} (inaccessible)`);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)}${sizes[i]}`;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const targetDir = args[0] || process.cwd();

  console.log("# File Tree\n");
  console.log(`Root: ${targetDir}\n`);
  console.log("```");
  console.log(`${relative(process.cwd(), targetDir) || "."}/`);

  await printTree(targetDir, {
    maxDepth: 100,
    excludePatterns: [
      ...DEFAULT_EXCLUDE_PATTERNS,
      "*.map",
      "*.d.ts",
      ".DS_Store",
      "Thumbs.db",
      ".vscode",
      ".idea",
      "__pycache__",
      "*.pyc",
      ".pytest_cache",
      ".mypy_cache",
      ".ruff_cache",
      "*.egg-info",
      "venv",
      ".venv",
    ],
  });

  console.log("```\n");
  console.log(
    "Note: Common build artifacts and cache directories are excluded."
  );
  console.log("File sizes are shown in parentheses.");
}

main().catch(console.error);

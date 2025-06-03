#!/usr/bin/env tsx

import fs from "node:fs";
import path from "node:path";

function copyEnv(): void {
	const rootDir = process.cwd();
	let rootEnvPath = path.join(rootDir, ".env");

	// Check if root .env exists, fallback to .env.local
	if (!fs.existsSync(rootEnvPath)) {
		const rootEnvLocalPath = path.join(rootDir, ".env.local");
		if (fs.existsSync(rootEnvLocalPath)) {
			rootEnvPath = rootEnvLocalPath;
			console.log("📄 Using .env.local as source file");
		} else {
			console.log(
				"⚠️  Neither .env nor .env.local found in root. Skipping copy operation.",
			);
			return;
		}
	} else {
		console.log("📄 Using .env as source file");
	}

	const targetDirs: string[] = ["apps", "packages"];
	let copyCount = 0;

	for (const dirName of targetDirs) {
		const dirPath = path.join(rootDir, dirName);

		if (!fs.existsSync(dirPath)) {
			console.log(`📁 ${dirName}/ directory not found, skipping...`);
			continue;
		}

		// Get all subdirectories
		const subdirs: string[] = fs
			.readdirSync(dirPath, { withFileTypes: true })
			.filter((dirent) => dirent.isDirectory())
			.map((dirent) => dirent.name);

		for (const subdir of subdirs) {
			const projectPath = path.join(dirPath, subdir);
			const targetEnvPath = path.join(projectPath, ".env");

			try {
				// Check if .env already exists
				if (fs.existsSync(targetEnvPath)) {
					console.log(
						`⚠️  Found existing .env file at ${path.relative(rootDir, targetEnvPath)} - skipping to avoid overwrite`,
					);
					continue;
				}

				// Copy the file
				fs.copyFileSync(rootEnvPath, targetEnvPath);
				console.log(`✅ Copied file: ${path.relative(rootDir, targetEnvPath)}`);
				copyCount++;
			} catch (error: unknown) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				console.error(
					`❌ Failed to copy file to ${path.relative(rootDir, projectPath)}: ${errorMessage}`,
				);
			}
		}
	}

	console.log(`\n🎉 Copied ${copyCount} file(s) successfully!`);
}

// Run the script
copyEnv();

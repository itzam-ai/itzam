#!/usr/bin/env tsx

import fs from "node:fs";
import path from "node:path";

function clearEnvFiles(): void {
	const rootDir = process.cwd();
	const targetDirs: string[] = ["apps", "packages"];
	let deleteCount = 0;

	console.log("🧹 Clearing .env files from project directories...\n");

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

			try {
				// Get all files in the project directory
				const files = fs.readdirSync(projectPath);

				// Find all .env files (including .env.local, .env.development, etc.)
				const envFiles = files.filter(
					(file) => file === ".env" || file.startsWith(".env."),
				);

				if (envFiles.length === 0) {
					console.log(
						`⚪ ${path.relative(rootDir, projectPath)} - No .env files found`,
					);
					continue;
				}

				// Delete each .env file
				for (const envFile of envFiles) {
					const envFilePath = path.join(projectPath, envFile);

					try {
						fs.unlinkSync(envFilePath);
						console.log(`🗑️  Deleted: ${path.relative(rootDir, envFilePath)}`);
						deleteCount++;
					} catch (error: unknown) {
						const errorMessage =
							error instanceof Error ? error.message : String(error);
						console.error(
							`❌ Failed to delete ${path.relative(rootDir, envFilePath)}: ${errorMessage}`,
						);
					}
				}
			} catch (error: unknown) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				console.error(
					`❌ Failed to read directory ${path.relative(rootDir, projectPath)}: ${errorMessage}`,
				);
			}
		}
	}

	if (deleteCount === 0) {
		console.log("\n✨ No .env files found to delete");
	} else {
		console.log(`\n🎉 Successfully deleted ${deleteCount} .env file(s)!`);
	}
}

// CLI interface with confirmation
async function main() {
	const args = process.argv.slice(2);
	const force = args.includes("--force") || args.includes("-f");
	const yes = args.includes("--yes") || args.includes("-y");

	if (!force && !yes) {
		console.log(
			"⚠️  This will delete ALL .env files (including .env.local, .env.development, etc.) from:",
		);
		console.log("   • ./apps/*/");
		console.log("   • ./packages/*/");
		console.log(
			"\n💡 Use --yes to skip this confirmation or --force to proceed automatically\n",
		);

		// Simple confirmation without external dependencies
		process.stdout.write("Are you sure? (y/N): ");

		const response = await new Promise<string>((resolve) => {
			process.stdin.once("data", (data) => {
				resolve(data.toString().trim().toLowerCase());
			});
		});

		if (response !== "y" && response !== "yes") {
			console.log("❌ Operation cancelled");
			process.exit(0);
		}
	}

	clearEnvFiles();
	process.exit(0);
}

// Run if called directly
if (require.main === module) {
	main();
}

export { clearEnvFiles };

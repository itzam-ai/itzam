import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function overwriteTsSDKEntry() {
  const sdkPackageJsonPath = path.join('sdk', 'package.json');
  const packageJson = JSON.parse(
    await fs.readFile(sdkPackageJsonPath, 'utf-8'),
  );

  // Update the entrypoints
  packageJson.main = './dist/index.js';
  packageJson.types = './dist/index.d.ts';

  // Write back the updated package.json
  await fs.writeFile(sdkPackageJsonPath, JSON.stringify(packageJson, null, 2));
}

async function addES2018ToTSConfig() {
  const tsConfigPath = path.join('sdk', 'tsconfig.json');
  const tsConfig = JSON.parse(await fs.readFile(tsConfigPath, 'utf-8'));
  tsConfig.compilerOptions.target = 'ES2018';
  tsConfig.compilerOptions.lib = ['ES2018', 'es6', 'dom'];
  await fs.writeFile(tsConfigPath, JSON.stringify(tsConfig, null, 2));
}

async function generateSDK() {
  try {
    // Rename existing codegen folder if it exists
    const oldCodegenPath = path.join('sdk', 'codegen');
    const backupPath = path.join('sdk', 'old-codegen');

    if (
      await fs
        .access(oldCodegenPath)
        .then(() => true)
        .catch(() => false)
    ) {
      await fs.rename(oldCodegenPath, backupPath);
    }

    // Generate SDK using openapi-generator-cli
    console.log('Generating SDK...');
    await execAsync(
      'npx @openapitools/openapi-generator-cli generate --openapitools ./openapitools.json',
    );

    // If generation succeeded, remove the backup
    await fs.rm(backupPath, { recursive: true, force: true });

    // Update SDK package.json entrypoints
    console.log('Updating SDK package.json...');
    await overwriteTsSDKEntry();

    // Add ES2018 to tsconfig.json
    console.log('Adding ES2018 to tsconfig.json...');
    await addES2018ToTSConfig();

    // Copy openapi.json to docs
    console.log('Copying OpenAPI spec to docs...');
    const docsDir = path.join('docs', 'api-reference');
    await fs.mkdir(docsDir, { recursive: true });
    await fs.copyFile('openapi.json', path.join(docsDir, 'openapi.json'));

    console.log('SDK generation completed successfully!');
  } catch (error) {
    console.error('Error generating SDK:', error);
    process.exit(1);
  }
}

generateSDK();

import { exec } from 'child_process';
import fs from 'fs/promises';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function fetchOpenAPISpec() {
  console.log('Fetching OpenAPI specification...');
  const { stdout: curlOutput } = await execAsync(
    'curl http://localhost:3000/api/v1/doc',
  );

  // Write the spec to openapi.json
  await fs.writeFile('openapi.json', curlOutput);

  console.log('OpenAPI specification fetched and saved to openapi.json');

  // Format with biome
  await execAsync('npx biome format openapi.json --write');
}

fetchOpenAPISpec();

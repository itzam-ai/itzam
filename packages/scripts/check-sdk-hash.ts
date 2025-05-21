import crypto from 'crypto';
import fs from 'fs/promises';

export async function checkSDKHash(): Promise<boolean> {
  try {
    // Read the current OpenAPI spec
    const currentSpec = await fs.readFile('openapi.json', 'utf-8');

    // Calculate SHA256 hash of current spec
    const currentHash = crypto
      .createHash('sha256')
      .update(currentSpec)
      .digest('hex');

    console.log('Current OpenAPI spec hash:', currentHash);

    // Create cache directory if it doesn't exist
    await fs.mkdir('.openapi-cache', { recursive: true });

    const hashPath = '.openapi-cache/spec-hash.txt';

    try {
      // Try to read previous hash
      const previousHash = await fs.readFile(hashPath, 'utf-8');
      console.log('Previous OpenAPI spec hash:', previousHash);

      // Compare hashes
      if (currentHash === previousHash) {
        console.log('OpenAPI spec has not changed. Skipping SDK generation.');
        return false;
      }

      console.log('OpenAPI spec has changed. Proceeding with SDK generation.');
    } catch {
      // No previous hash found
      console.log('No previous hash found. Proceeding with SDK generation.');
    }

    // Save current hash
    await fs.writeFile(hashPath, currentHash);
    return true;
  } catch (error) {
    console.error('Error checking SDK hash:', error);
    throw error;
  }
}

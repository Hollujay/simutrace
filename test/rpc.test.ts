import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('no transaction-submission path', () => {
  const srcDir = path.resolve(__dirname, '..', 'src');

  function findFiles(dir: string): string[] {
    const files: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        files.push(...findFiles(fullPath));
      } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
    return files;
  }

  const files = findFiles(srcDir);

  for (const file of files) {
    const relativePath = path.relative(srcDir, file);
    it(`${relativePath} does not import or call sendTransaction`, () => {
      const content = fs.readFileSync(file, 'utf-8');

      expect(content).not.toMatch(/sendTransaction/);

      expect(content).not.toMatch(/submitTransaction/);

      expect(content).not.toMatch(/Server\.submit/);
    });
  }

  it('simulateCall is the only TransactionBuilder user', () => {
    const filesWithTxBuilder = files.filter((file) => {
      const content = fs.readFileSync(file, 'utf-8');
      return content.includes('TransactionBuilder');
    });
    const relativePaths = filesWithTxBuilder.map((f) => path.relative(srcDir, f));
    expect(relativePaths).toEqual(['lib/simulateCall.ts']);
  });
});

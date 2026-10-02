// Generate portable ESM from the existing, tested API. No credentials are read.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('../backend/node_modules/typescript');
const source = path.resolve(__dirname, '../backend/src');
const output = path.resolve(__dirname, '../supabase/functions/_shared/backend');
const packages = {
  express: 'npm:express@4.21.2', cors: 'npm:cors@2.8.5', dotenv: 'npm:dotenv@16.4.7',
  multer: 'npm:multer@1.4.5-lts.1', nodemailer: 'npm:nodemailer@10.0.13',
  marked: 'npm:marked@18.0.14', 'sanitize-html': 'npm:sanitize-html@2.17.7',
  zod: 'npm:zod@3.24.2', '@supabase/supabase-js': 'npm:@supabase/supabase-js@2.117.2',
};
function visit(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) { visit(file); continue; }
    if (!entry.name.endsWith('.ts')) continue;
    let code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022, esModuleInterop: true },
    }).outputText;
    code = code.replace(/(from\s+|import\s*)['"]([^'"]+)['"]/g, (match, prefix, specifier) => {
      let replacement = packages[specifier] || specifier;
      if (specifier.startsWith('.')) {
        const resolved = path.resolve(path.dirname(file), specifier);
        replacement = fs.existsSync(resolved) && fs.statSync(resolved).isDirectory() ? `${specifier}/index.js` : `${specifier}.js`;
      }
      if (['path', 'fs', 'crypto'].includes(specifier)) replacement = `node:${specifier}`;
      return `${prefix}'${replacement}'`;
    });
    code = code.replace(/import\(['"]([^'"]+)['"]\)/g, (match, specifier) => packages[specifier] ? `import('${packages[specifier]}')` : match);
    const target = path.join(output, path.relative(source, file)).replace(/\.ts$/, '.js');
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, `import process from 'node:process';\n${code}`);
  }
}
visit(source);
console.log('Supabase Edge API generated from backend/src.');

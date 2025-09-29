import fs from 'fs';
import path from 'path';
import * as babel from '@babel/parser';
import traverse from '@babel/traverse';

const root = path.join(process.cwd(), 'src');
const outDir = path.join(process.cwd(), 'tmp');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const results = [];

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const fp = path.join(dir, name);
    const stat = fs.statSync(fp);
    if (stat.isDirectory()) walk(fp);
    else if (/\.(tsx|jsx|ts|js)$/.test(name)) analyze(fp);
  }
}

function analyze(file) {
  const code = fs.readFileSync(file, 'utf8');
  let ast;
  try {
    ast = babel.parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    });
  } catch (err) {
    return;
  }

  traverse(ast, {
    JSXText(pathNode) {
      const text = pathNode.node.value.trim();
      if (text && /[A-Za-zÀ-ÿ0-9]/.test(text) && text.length > 1) {
        results.push({ file, text, loc: pathNode.node.loc });
      }
    },
    StringLiteral(pathNode) {
      const parent = pathNode.parent;
      if (parent && parent.type && parent.type.includes && parent.type.includes('JSX')) {
        const text = pathNode.node.value.trim();
        if (text && /[A-Za-zÀ-ÿ0-9]/.test(text) && text.length > 1) {
          results.push({ file, text, loc: pathNode.node.loc });
        }
      }
    },
  });
}

walk(root);
fs.writeFileSync(path.join(outDir, 'strings-report.json'), JSON.stringify(results, null, 2));
console.log('report written to tmp/strings-report.json');

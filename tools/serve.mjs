import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const root = join(process.cwd(), 'www');
const port = Number(process.env.PORT || 4173);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4'
};

function safePath(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  const normalized = normalize(clean).replace(/^([.][.][\/\\])+/, '');
  return join(root, normalized === '/' ? 'index.html' : normalized);
}

const server = createServer((req, res) => {
  let file = safePath(req.url || '/');

  if (!existsSync(file) || (existsSync(file) && statSync(file).isDirectory())) {
    file = join(root, 'index.html');
  }

  const ext = extname(file);
  res.setHeader('Content-Type', types[ext] || 'application/octet-stream');
  createReadStream(file)
    .on('error', () => {
      res.writeHead(500);
      res.end('Server error');
    })
    .pipe(res);
});

server.listen(port, () => {
  console.log(`VitalFly dev server: http://localhost:${port}`);
});

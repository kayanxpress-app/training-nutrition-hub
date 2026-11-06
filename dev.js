// سيرفر محلي بسيط للتجربة: npm run dev ثم افتح http://localhost:3000
const http = require("http"), fs = require("fs"), path = require("path");
const T = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".json": "application/json", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml" };
const port = process.env.PORT || 3000;
http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  const f = path.join(__dirname, path.normalize(p));
  if (!f.startsWith(__dirname)) { r.writeHead(403); return r.end(); }
  fs.readFile(f, (e, d) => {
    if (e) { r.writeHead(404); return r.end("Not found"); }
    r.writeHead(200, { "Content-Type": T[path.extname(f)] || "application/octet-stream" });
    r.end(d);
  });
}).listen(port, () => console.log("جاهز على: http://localhost:" + port));

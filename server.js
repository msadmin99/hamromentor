// Custom server so cPanel's Passenger (Setup Node.js App) can run this
// Next.js app directly — Passenger expects a plain Node.js entry file that
// listens on the PORT it assigns, which `next start` alone doesn't provide
// in that environment.
const { createServer } = require('http');
const next = require('next');

const port = process.env.PORT || 3000;
const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res);
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on port ${port}`);
  });
});

const http = require('http');
const path = require('path');
const fs = require('fs');
const GherkinEngine = require('./gherkin_engine');

const PORT = parseInt(process.env.PORT, 10) || 7075;
const startTime = Date.now();

const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  const pathname = reqUrl.pathname;

  if (pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'UP', service: 'GherkinFlow-BDD', uptimeSeconds: Math.floor((Date.now() - startTime) / 1000) }));
  }

  if (req.method === 'POST' && pathname === '/api/execute') {
    const engine = new GherkinEngine();
    engine.defineStep(/^I am logged in as "([^"]+)"$/, (w, u) => { w.user = u; });
    engine.defineStep(/^I visit the profile page$/, (w) => { w.visited = true; });
    engine.defineStep(/^I should see "([^"]+)"$/, (w, text) => { if (!w.visited) throw new Error('Not visited'); });

    const feature = `Feature: User Profile
      Scenario: View profile
        Given I am logged in as "alice"
        When I visit the profile page
        Then I should see "Welcome Alice"
    `;
    const ast = engine.parse(feature);
    const result = engine.execute(ast);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(result));
  }

  let filePath = path.join(__dirname, '..', 'public', pathname === '/' ? 'index.html' : pathname);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return fs.createReadStream(filePath).pipe(res);
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(PORT, () => {
  console.log('GherkinFlow-BDD running on port ' + PORT);
});

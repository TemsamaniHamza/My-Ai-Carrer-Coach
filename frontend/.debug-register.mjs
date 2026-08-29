import { chromium } from 'playwright';

const OUT = '/tmp/claude-1000/-home-htemsama-Desktop-My-Ai-Carrer-Coach/1d9ada72-5d57-421a-94a3-91753a2e1e2c/scratchpad';
const SITE = 'https://my-ai-carrer-coach-five.vercel.app';
const email = `prodtest+${Date.now()}@example.com`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
page.on('console', (msg) => console.log(`[console.${msg.type()}]`, msg.text()));
page.on('pageerror', (err) => console.log('[pageerror]', err.message));
page.on('response', (res) => {
  if (res.url().includes('/auth/') || !res.ok()) {
    console.log(`[response] ${res.status()} ${res.url()}`);
  }
});
page.on('requestfailed', (req) => console.log('[requestfailed]', req.url(), req.failure()?.errorText));

await page.goto(`${SITE}/register`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('text=Create your account');
await page.fill('#name', 'Prod Test');
await page.fill('#email', email);
await page.fill('#password', 'password123');
await page.click('button[type=submit]');
await page.waitForTimeout(6000);

const errorText = await page.locator('[class*="destructive"]').first().textContent().catch(() => null);
console.log('VISIBLE ERROR TEXT:', errorText);
console.log('CURRENT URL:', page.url());
await page.screenshot({ path: `${OUT}/debug-register.png` });

await browser.close();

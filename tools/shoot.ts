/* Headless Chrome screenshot helper.
 *
 *   bun run shot                       whole page, top of document
 *   bun run shot -- '#results'         clipped to a selector
 *   bun run shot -- '#road' --motion   keep animations
 *   bun run shot -- '#composer' --hover '.tgc__send'   force a :hover state
 *
 * Flags: --url --width --height --out --wait --motion --full --hover
 */

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const argv = process.argv.slice(2);
const VALUED = ["url", "width", "height", "out", "wait", "hover"];
const flag = (name: string, fallback?: string) => {
    const i = argv.indexOf(`--${name}`);
    return i === -1 ? fallback : argv[i + 1];
};
const has = (name: string) => argv.includes(`--${name}`);

const positional: string[] = [];
for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
        if (VALUED.includes(argv[i].slice(2))) i++;
        continue;
    }
    positional.push(argv[i]);
}
const selector = positional[0];
const url = flag("url", "http://localhost:4600")!;
const width = Number(flag("width", "1440"));
const height = Number(flag("height", "1000"));
const out = flag("out", "shot.png")!;
// Increase --wait if a delayed CSS entrance is still transparent.
const wait = Number(flag("wait", "400"));
// Reduced motion settles GSAP and Lenis for layout captures.
const reduceMotion = !has("motion");
// Headless Chrome needs a forced pseudo-state for :hover rules.
const hoverSel = flag("hover");

const port = 9222 + Math.floor(Math.random() * 700);
const profile = `/tmp/shoot-${port}`;

const chrome = Bun.spawn(
    [
        CHROME,
        "--headless=new",
        `--remote-debugging-port=${port}`,
        `--user-data-dir=${profile}`,
        `--window-size=${width},${height}`,
        ...(reduceMotion ? ["--force-prefers-reduced-motion"] : []),
        "--hide-scrollbars",
        "--no-first-run",
    ],
    { stdout: "ignore", stderr: "ignore" },
);

// The browser target has no Page domain; attach to a page target.
const wsUrl = await (async () => {
    for (let i = 0; i < 100; i++) {
        try {
            const targets = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()) as Array<{
                type: string;
                webSocketDebuggerUrl?: string;
            }>;
            const page = targets.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
            if (page) return page.webSocketDebuggerUrl!;
        } catch {}
        await Bun.sleep(100);
    }
    throw new Error("Chrome exposed no page target in 10s");
})();

const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
});

let nextId = 1;
const pending = new Map<number, { res: (v: any) => void; rej: (e: any) => void }>();
const events = new Map<string, () => void>();
ws.onmessage = (m) => {
    const msg = JSON.parse(String(m.data));
    if (msg.id && pending.has(msg.id)) {
        const p = pending.get(msg.id)!;
        pending.delete(msg.id);
        msg.error ? p.rej(new Error(msg.error.message)) : p.res(msg.result);
    } else if (msg.method && events.has(msg.method)) {
        events.get(msg.method)!();
        events.delete(msg.method);
    }
};
const send = (method: string, params: object = {}) =>
    new Promise<any>((res, rej) => {
        const id = nextId++;
        pending.set(id, { res, rej });
        ws.send(JSON.stringify({ id, method, params }));
    });
const once = (method: string) => new Promise<void>((res) => events.set(method, res));

const evaluate = async (expression: string) =>
    (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result?.value;

await send("Page.enable");
// Device emulation bypasses Chrome's 500px minimum window width.
await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 0,
    mobile: width < 640,
});
const loaded = once("Page.loadEventFired");
await send("Page.navigate", { url });
await loaded;

// IntersectionObserver may not run before a reduced-motion capture.
await evaluate(`
  document.querySelectorAll('.reveal').forEach(e => e.classList.add('in'));
  document.fonts.ready.then(() => true);
`);
await Bun.sleep(wait);

if (hoverSel) {
    await send("DOM.enable");
    await send("CSS.enable");
    // CDP querySelector requires a node from DOM.getDocument.
    const { root } = await send("DOM.getDocument", { depth: -1 });
    const { nodeId } = await send("DOM.querySelector", { nodeId: root.nodeId, selector: hoverSel });
    if (!nodeId) {
        console.error(`no element matches ${hoverSel}`);
        chrome.kill();
        process.exit(1);
    }
    await send("CSS.forcePseudoState", { nodeId, forcedPseudoClasses: ["hover"] });
    // Wait past the longest hover transition.
    await Bun.sleep(600);
}

let clip: object | undefined;
if (selector) {
    const rect = await evaluate(`
      (() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height };
      })()
    `);
    if (!rect) {
        console.error(`no element matches ${selector}`);
        chrome.kill();
        process.exit(1);
    }
    clip = { ...rect, scale: 2 };
} else if (has("full")) {
    const doc = await evaluate(
        `({ x: 0, y: 0, width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight })`,
    );
    clip = { ...doc, scale: 1 };
} else {
    // Clip to innerHeight; the requested window height includes browser chrome.
    clip = { ...(await evaluate(`({ x: 0, y: 0, width: innerWidth, height: innerHeight })`)), scale: 2 };
}

const { data } = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
    clip,
});

await Bun.write(out, Buffer.from(data, "base64"));
ws.close();
chrome.kill();
await Bun.$`rm -rf ${profile}`.quiet();

const { width: w, height: h } = clip as { width: number; height: number };
console.log(`${out}  ${Math.round(w)}x${Math.round(h)}  ${selector ?? (has("full") ? "full page" : "viewport")}`);

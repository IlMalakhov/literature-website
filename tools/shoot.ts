/* Pixel proof that actually works here.
 *
 * The Browser-pane preview wedges its compositor after any reload or scroll —
 * captures come back solid black and no amount of resizing brings them back.
 * This drives a throwaway headless Chrome over raw CDP instead, so it is
 * unaffected. No dependencies: Bun ships both the WebSocket and the spawner.
 *
 *   bun run shot                       whole page, top of document
 *   bun run shot -- '#results'         clipped to a selector
 *   bun run shot -- '#road' --motion   keep animations (see --motion below)
 *   bun run shot -- '#composer' --hover '.tgc__send'   force a :hover state
 *
 * Flags: --url --width --height --out --wait --motion --full --hover
 *
 * Mid-page elements need NO scrolling: with captureBeyondViewport the clip is
 * in DOCUMENT coordinates, so we just read the element's rect + scrollY. Do not
 * reintroduce scroll or margin hacks to bring a target into view — pulling an
 * element upward slides it over its neighbours and invents overlap bugs.
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
/* Entrance animations are keyframed with delays (the hero foot waits 0.7s) and
   are NOT disabled by reduced motion, so a capture too early catches the
   opacity:0 `from` state. Bump --wait when a delayed element shoots up blank. */
const wait = Number(flag("wait", "400"));
/* Reduced motion settles layout instantly by skipping Lenis/GSAP entrances.
   Right for layout proof, wrong for animation proof — pass --motion for that.
   Caveat for --motion: elements on a GPU-composited layer (anything with a
   running transform animation, e.g. the spinning badge) can capture dark or
   stale. Confirm those against computed style before believing the pixels. */
const reduceMotion = !has("motion");
/* A headless capture has no pointer, so :hover never matches on its own. This
   forces it on one element via CSS.forcePseudoState — style resolution only, no
   fake mouse events. Descendant rules resolve too, so `--hover '.ticket'` also
   applies `.ticket:hover .ticket__stub svg`. */
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

/* /json/version hands back the BROWSER target, which has no Page domain.
   Attach to a page target instead. */
const wsUrl = await (async () => {
    for (let i = 0; i < 100; i++) {
        try {
            const targets = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()) as Array<{
                type: string;
                webSocketDebuggerUrl?: string;
            }>;
            const page = targets.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
            if (page) return page.webSocketDebuggerUrl!;
        } catch {
            /* socket not up yet */
        }
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
/* --window-size alone is not enough: Chrome refuses to go narrower than 500px,
   so phone widths silently came out as 500 and the mobile media queries were
   tested at the wrong size. Emulation overrides the viewport exactly, and it
   also removes the ~87px of chrome that made --height differ from innerHeight. */
await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 0,
    mobile: width < 640,
});
const loaded = once("Page.loadEventFired");
await send("Page.navigate", { url });
await loaded;

/* Entrances are opacity:0 until IntersectionObserver adds .in; under reduced
   motion that observer may never run, so force the settled state. */
await evaluate(`
  document.querySelectorAll('.reveal').forEach(e => e.classList.add('in'));
  document.fonts.ready.then(() => true);
`);
await Bun.sleep(wait);

if (hoverSel) {
    await send("DOM.enable");
    await send("CSS.enable");
    /* querySelector needs a node the client has been handed, so pull the tree first */
    const { root } = await send("DOM.getDocument", { depth: -1 });
    const { nodeId } = await send("DOM.querySelector", { nodeId: root.nodeId, selector: hoverSel });
    /* a miss is nodeId 0, not an error reply */
    if (!nodeId) {
        console.error(`no element matches ${hoverSel}`);
        chrome.kill();
        process.exit(1);
    }
    await send("CSS.forcePseudoState", { nodeId, forcedPseudoClasses: ["hover"] });
    /* hover transitions here run 0.2–0.25s; let the end state settle before the
       shutter, or the capture catches a half-faded colour */
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
    /* --width/--height size the WINDOW, which is ~87px taller than the viewport
       it ends up with. Clip to the real viewport instead, or a "one screenful"
       shot quietly includes a strip of whatever comes after the fold. */
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

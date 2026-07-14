import { readdir } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dir, "..");
const sourceDir = path.join(root, "images", "nobg");
const outputDir = path.join(root, "public", "works");
const widths = [480, 768] as const;
const concurrency = 4;

const encoder = Bun.which("cwebp");
if (!encoder) {
  throw new Error("cwebp is required to generate responsive work images");
}

const sources = (await readdir(sourceDir))
  .filter((file) => file.endsWith(".png"))
  .sort();

const jobs = sources.flatMap((file) => {
  const slug = path.basename(file, ".png");
  return widths.map((width) => ({
    input: path.join(sourceDir, file),
    output: path.join(outputDir, `${slug}-${width}.webp`),
    width,
  }));
});

let nextJob = 0;
await Promise.all(
  Array.from({ length: Math.min(concurrency, jobs.length) }, async () => {
    while (nextJob < jobs.length) {
      const job = jobs[nextJob++];
      const process = Bun.spawn(
        [
          encoder,
          "-quiet",
          "-q", "82",
          "-m", "4",
          "-mt",
          "-resize", String(job.width), String(job.width),
          job.input,
          "-o", job.output,
        ],
        { stdout: "ignore", stderr: "inherit" },
      );
      const exitCode = await process.exited;
      if (exitCode !== 0) {
        throw new Error(`cwebp failed for ${path.basename(job.output)}`);
      }
    }
  }),
);

console.log(`Generated ${jobs.length} responsive work images.`);



const result = await Bun.build({
  entrypoints: [
    "src/index.ts"
  ],
  outdir: "./dist",
  minify: true,
})

if (!result.success) {
  console.error(result.logs)
  process.exit(1)
}

await Bun.write("dist/index.html", Bun.file("src/index.html"))
await Bun.write("dist/service-worker.js", Bun.file("src/service-worker.js"))

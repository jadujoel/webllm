export async function build() {
  const result = await Bun.build({
    entrypoints: [
      "src/index.html"
    ],
    outdir: "./dist",
    minify: true,
    sourcemap: "linked",
    splitting: true,
  })

  if (!result.success) {
    console.error(result.logs)
    process.exit(1)
  }

  await Bun.write("dist/service-worker.js", Bun.file("src/service-worker.js"))

  console.log("Build complete")
}

if (import.meta.main) {
  await build()
}

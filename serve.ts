
const server = Bun.serve({
  async fetch(request, server) {
    if (request.method !== "GET") {
      return new Response("Method not allowed", { status: 405 })
    }
    let pathname = new URL(request.url).pathname
    if (pathname === "/") {
      pathname = "/index.html"
      await Bun.$`bun build.ts`
    }
    if (pathname === "/favicon.ico") {
      return new Response("", { status: 404 })
    }
    return new Response(Bun.file(`dist${pathname}`))
  },
})

console.log(server.url.href)

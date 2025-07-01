export async function register() {
  // Temporarily disabled to fix module instantiation issues
  // if (process.env.NEXT_RUNTIME === "nodejs") {
  //   const { init } = await import("@hyperdx/node-opentelemetry");
  //   init();
  // }
}

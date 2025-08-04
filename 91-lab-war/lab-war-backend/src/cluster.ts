import { serve } from "bun";
import cluster from "node:cluster";
import { app, websocket } from ".";

const cpus = navigator.hardwareConcurrency;

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);

  // Start N workers for the number of CPUs
  for (let i = 0; i < cpus; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker) => {
    console.log(`Worker ${worker.process.pid} exited`);
  });
} else {
  serve({
    port: +(process.env.PORT || 3000),
    fetch: app.fetch,
    websocket,
  });

  console.log(`Worker ${process.pid} started`);
}

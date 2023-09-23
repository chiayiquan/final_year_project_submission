import http from "http";
import env from "./env";
import app from "./app";

const { PORT } = env;
const server = http.createServer(app);

server.listen(PORT, function () {
  console.log(`Go to http://localhost:${PORT}`);
});

export default app;

import { createInterface } from "node:readline";
const send = (value) => process.stdout.write(JSON.stringify(value) + "\n");
createInterface({ input: process.stdin }).on("line", (line) => {
  const message = JSON.parse(line);
  if (message.method === "initialize") send({ id: message.id, result: {} });
  if (message.method === "test/fragment") {
    const value =
      JSON.stringify({
        id: message.id,
        result: { message: "Écriture française" },
      }) + "\n";
    process.stdout.write(value.slice(0, 10));
    setTimeout(() => process.stdout.write(value.slice(10)), 5);
  }
  if (message.method === "test/tool") {
    send({
      id: "tool-call",
      method: "item/tool/call",
      params: {
        threadId: "thread-test",
        turnId: "turn-test",
        callId: "call",
        tool: "read_page",
        namespace: null,
        arguments: { pageId: "page-test" },
      },
    });
    send({ id: message.id, result: {} });
  }
  if (message.id === "tool-call")
    send({ method: "test/result", params: message.result });
  if (message.method === "test/forbidden") {
    send({
      id: "forbidden-call",
      method: "item/commandExecution/requestApproval",
      params: { command: "echo unauthorized" },
    });
    send({ id: message.id, result: {} });
  }
  if (message.id === "forbidden-call")
    send({ method: "test/rejected", params: { rejected: !!message.error } });
  if (message.method === "test/crash") process.exit(1);
  // test/timeout intentionally has no response.
});

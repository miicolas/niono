export class StreamProbe {
  private reader: ReadableStreamDefaultReader<Uint8Array>;
  private buffer = "";
  constructor(response: Response) {
    if (
      !response.ok ||
      !response.headers.get("content-type")?.includes("text/event-stream")
    )
      throw new Error(`Flux indisponible : ${response.status}`);
    this.reader = response.body!.getReader();
  }
  async until(event: string, table?: string) {
    const decoder = new TextDecoder();
    while (true) {
      const boundary = this.buffer.indexOf("\n\n");
      if (boundary >= 0) {
        const frame = this.buffer.slice(0, boundary);
        this.buffer = this.buffer.slice(boundary + 2);
        if (frame.startsWith(`event: ${event}\n`)) {
          const data = JSON.parse(frame.split("\ndata: ")[1]!);
          if (!table || data.table === table) return data;
        }
      } else {
        const next = await this.reader.read();
        if (next.done) throw new Error(`Flux fermé avant ${event}`);
        this.buffer += decoder.decode(next.value, { stream: true });
      }
    }
  }
  close() {
    return this.reader.cancel();
  }
}

import type { DynamicToolCallParams } from "../protocol/v2/DynamicToolCallParams";
import type { ToolRequestUserInputParams } from "../protocol/v2/ToolRequestUserInputParams";
import type { ToolRequestUserInputResponse } from "../protocol/v2/ToolRequestUserInputResponse";
import type { ToolHandler } from "./shared";
export type InputHandler = (
  params: ToolRequestUserInputParams,
) => Promise<ToolRequestUserInputResponse>;
export async function handleServerRequest(
  message: {
    id: string | number;
    method: string;
    params?: Record<string, unknown>;
  },
  tools: Map<string, ToolHandler>,
  inputs: Map<string, InputHandler>,
  send: (value: unknown) => void,
) {
  try {
    if (message.method === "item/tool/requestUserInput") {
      const params = message.params as unknown as ToolRequestUserInputParams;
      const handler = inputs.get(params.threadId);
      if (!handler)
        throw new Error("Questionnaire indisponible pour cette conversation.");
      send({ id: message.id, result: await handler(params) });
      return;
    }
    if (message.method !== "item/tool/call") {
      send({
        id: message.id,
        error: {
          code: -32601,
          message: "Cette capacité n’est pas disponible dans DigiPM.",
        },
      });
      return;
    }
    const params = message.params as unknown as DynamicToolCallParams;
    const handler = tools.get(params.threadId);
    if (!handler || params.namespace) throw new Error("Outil indisponible.");
    const result = await handler(params);
    send({
      id: message.id,
      result:
        result &&
        typeof result === "object" &&
        "contentItems" in result &&
        "success" in result
          ? result
          : {
              success: true,
              contentItems: [
                { type: "inputText", text: JSON.stringify(result) },
              ],
            },
    });
  } catch (error) {
    if (message.method === "item/tool/requestUserInput") {
      send({
        id: message.id,
        error: {
          code: -32000,
          message:
            error instanceof Error
              ? error.message
              : "Questionnaire indisponible.",
        },
      });
      return;
    }
    send({
      id: message.id,
      result: {
        success: false,
        contentItems: [
          {
            type: "inputText",
            text: error instanceof Error ? error.message : "Action refusée.",
          },
        ],
      },
    });
  }
}

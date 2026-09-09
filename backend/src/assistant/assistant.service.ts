import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import type { Content, GenerateContentResponse } from '@google/genai';
import { AssistantTools } from './assistant.tools';
import { ChatRequestDto } from './dto/chat.dto';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';

// How many tool round trips one question may take before we stop.
const MAX_TOOL_ROUNDS = 5;

const SYSTEM_PROMPT = `You are the assistant inside Weekly Report Hub, an internal
tool where team members file weekly work reports and managers review them.

You are talking to a MANAGER. Answer questions about their team's reports.

Rules:
- Always ground answers in data you fetched with the tools. Never invent a name,
  a number, or a blocker. If the tools return nothing, say so plainly.
- Prefer specifics over generalities: name the person, the week, the hours.
- Reports have versions; the tools already return the current version only.
- Be concise. A manager asking "who is behind?" wants two sentences and the
  names, not an essay. Use short markdown lists when listing people or items.
- Today's date is {TODAY}. A reporting week runs Monday to Sunday, and weeks are
  identified by their Monday.`;

// The AI assistant, backed by Gemini with function calling.
@Injectable()
export class AssistantService {
  private readonly logger = new Logger(AssistantService.name);
  private readonly client: GoogleGenAI | null;
  private readonly model: string;

  constructor(
    private readonly config: ConfigService,
    private readonly tools: AssistantTools,
  ) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    // Absent key is not a boot failure: the rest of the app must run without it.
    this.client = apiKey ? new GoogleGenAI({ apiKey }) : null;
    this.model = this.config.get<string>('GEMINI_MODEL', 'gemini-2.5-flash');
  }

  get isConfigured(): boolean {
    return this.client !== null;
  }

  async chat(dto: ChatRequestDto, manager: AuthenticatedUser) {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'The assistant is not configured. Set GEMINI_API_KEY in the backend environment.',
      );
    }

    const contents: Content[] = [
      ...(dto.history ?? []).map((message) => ({
        role: message.role,
        parts: [{ text: message.text }],
      })),
      { role: 'user', parts: [{ text: dto.message }] },
    ];

    const toolsUsed: string[] = [];

    for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
      const response: GenerateContentResponse =
        await this.client.models.generateContent({
          model: this.model,
          contents,
          config: {
            systemInstruction: SYSTEM_PROMPT.replace(
              '{TODAY}',
              new Date().toISOString().slice(0, 10),
            ),
            tools: [{ functionDeclarations: this.tools.declarations }],
            temperature: 0.2,
          },
        });

      const calls = response.functionCalls ?? [];

      if (calls.length === 0) {
        return {
          answer: response.text ?? 'I could not produce an answer for that.',
          toolsUsed,
          model: this.model,
        };
      }

      // Keep the model's own turn in the transcript.
      contents.push({
        role: 'model',
        parts: calls.map((call) => ({ functionCall: call })),
      });

      const results = await Promise.all(
        calls.map(async (call) => {
          const name = call.name ?? 'unknown';
          toolsUsed.push(name);

          try {
            const result = await this.tools.run(name, call.args ?? {});
            return { name, response: { result } };
          } catch (error) {
            // A failing tool must not kill the conversation.
            this.logger.warn(
              `Tool ${name} failed for manager ${manager.id}: ${String(error)}`,
            );
            return {
              name,
              response: {
                error: error instanceof Error ? error.message : 'failed',
              },
            };
          }
        }),
      );

      contents.push({
        role: 'user',
        parts: results.map((result) => ({
          functionResponse: { name: result.name, response: result.response },
        })),
      });
    }

    return {
      answer:
        'I looked that up several times without settling on an answer. Try asking ' +
        'something narrower - a single week, or one person.',
      toolsUsed,
      model: this.model,
    };
  }
}

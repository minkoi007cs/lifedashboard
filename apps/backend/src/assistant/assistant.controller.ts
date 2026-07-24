import { Body, Controller, Logger, Post, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { AuthenticatedUser } from '../auth/types/auth-user';
import { AssistantService } from './assistant.service';
import { ChatRequestDto } from './dto/chat.dto';

@ApiTags('assistant')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('assistant')
export class AssistantController {
  private readonly logger = new Logger(AssistantController.name);

  constructor(private readonly assistantService: AssistantService) {}

  // ── Existing JSON endpoint — unchanged ──────────────────────────────────────
  // Frontend currently uses this. Do NOT remove or rename.
  @Post('chat')
  chat(@Body() body: ChatRequestDto, @GetUser() user: AuthenticatedUser) {
    // userId is always sourced from the validated JWT — never from the request body.
    return this.assistantService.chat(body, user.userId);
  }

  // ── Streaming SSE endpoint (additive) ───────────────────────────────────────
  //
  // Same ChatRequest body as POST /chat. Response is text/event-stream.
  // Each event is a newline-delimited JSON line:  data: {JSON}\n\n
  //
  // Event types (see StreamEvent in @life-dashboard/shared):
  //   delta  — text chunk; append to the in-progress reply bubble
  //   action — tool action surfaced (pending_confirmation | done | failed)
  //   error  — non-fatal error; always followed by a 'done' event
  //   done   — terminal; contains full reply + all actions for reconciliation
  //
  // @Res() bypasses NestJS response serialization so we can write raw SSE.
  // The global ValidationPipe still runs on @Body() — ChatRequestDto is validated.
  // JwtAuthGuard still runs — unauthenticated requests are rejected before this method.
  //
  // Note: Vercel serverless may buffer the response body before flushing to the client.
  // For true real-time streaming, deploy to a self-hosted or Vercel Edge environment.
  @ApiOperation({
    summary: 'Chat with AI assistant — streaming SSE',
    description:
      'Same ChatRequest body as POST /chat. Returns text/event-stream. ' +
      'Events: `delta` (text chunk), `action` (tool result), `done` (full reply + actions), `error`. ' +
      'See StreamEvent in @life-dashboard/shared for the full TypeScript type.',
  })
  @Post('chat/stream')
  async chatStream(
    @Body() body: ChatRequestDto,
    @GetUser() user: AuthenticatedUser,
    @Res() res: Response,
  ): Promise<void> {
    // SSE headers must be set before the first write.
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    // Ask nginx / Vercel edge proxies not to buffer the stream.
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const writeEvent = (event: unknown): void => {
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    };

    try {
      // Iterate the async generator. Every path in chatStream() ends with 'done'.
      for await (const event of this.assistantService.chatStream(body, user.userId)) {
        writeEvent(event);
        if (event.type === 'done') break; // generator is exhausted; stop early to release resources
      }
    } catch (err: unknown) {
      // Unhandled generator throw (shouldn't happen — chatStream() yields errors, not throws).
      const msg = err instanceof Error ? err.message : 'Internal server error';
      this.logger.error(`chatStream unhandled error: ${msg}`);
      writeEvent({ type: 'error', message: msg });
      writeEvent({ type: 'done', reply: '', actions: [] });
    } finally {
      if (!res.writableEnded) {
        res.end();
      }
    }
  }
}

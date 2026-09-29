import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AiService, ChatMessage } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('status')
  getStatus() {
    return {
      success: true,
      configured: this.aiService.isAiConfigured(),
      provider: 'Google Gemini',
    };
  }

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  async chat(
    @Body() body: { message: string; history?: ChatMessage[]; context?: any },
  ) {
    const { message, history, context } = body;
    if (!message || message.trim() === '') {
      return {
        success: false,
        message: 'Le message ne peut pas être vide.',
      };
    }

    const reply = await this.aiService.generateChatResponse(
      message,
      history || [],
      context,
    );

    return {
      success: true,
      reply,
      isLive: this.aiService.isAiConfigured(),
    };
  }

  @Post('summarize-contract')
  @HttpCode(HttpStatus.OK)
  async summarizeContract(@Body() body: { contract: any }) {
    if (!body.contract) {
      return {
        success: false,
        message: 'Données de contrat manquantes.',
      };
    }

    const summary = await this.aiService.summarizeContract(body.contract);
    return {
      success: true,
      summary,
    };
  }
}

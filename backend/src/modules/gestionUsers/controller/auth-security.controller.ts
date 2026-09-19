import { Controller, Post, Body, Get, UseGuards, Req, Put } from '@nestjs/common';
import { PasswordResetService } from '../service/password-reset.service';
import { TwoFactorService } from '../service/two-factor.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UserAuthGuard } from '../guards/user-auth.guard';
import { UserAuthInterceptor } from '../interceptors/user-auth.interceptor';
import { UseInterceptors } from '@nestjs/common';

@Controller('auth/security')
export class AuthSecurityController {
  constructor(
    private readonly passwordResetService: PasswordResetService,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  // === MOT DE PASSE OUBLIÉ ===

  @Post('forgot-password')
  async forgotPassword(@Body() body: { email?: string; phone?: string }) {
    try {
      const identifier = body.email || body.phone;
      if (!identifier) {
        return {
          success: false,
          message: 'Email ou numéro de téléphone requis'
        };
      }
      
      const result = await this.passwordResetService.generateResetCode(identifier);
      return {
        success: result.success,
        message: result.message,
        code: result.code // Pour les tests
      };
    } catch (error) {
      console.error('Erreur forgot-password:', error);
      return {
        success: false,
        message: 'Erreur interne du serveur'
      };
    }
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { email?: string; phone?: string; code: string; newPassword: string }) {
    try {
      const identifier = body.email || body.phone;
      if (!identifier) {
        return {
          success: false,
          message: 'Email ou numéro de téléphone requis'
        };
      }
      
      const result = await this.passwordResetService.resetPassword(
        identifier, 
        body.code, 
        body.newPassword
      );
      return result;
    } catch (error) {
      console.error('Erreur reset-password:', error);
      return {
        success: false,
        message: 'Erreur interne du serveur'
      };
    }
  }

  // === DOUBLE AUTHENTIFICATION ===

  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @UseInterceptors(UserAuthInterceptor)
  async enable2FA(@Req() req: any) {
    try {
      const userId = req.user?.id;
      const result = await this.twoFactorService.enable2FA(userId);
      return result;
    } catch (error) {
      console.error('Erreur enable-2fa:', error);
      return {
        success: false,
        message: 'Erreur interne du serveur'
      };
    }
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @UseInterceptors(UserAuthInterceptor)
  async disable2FA(@Req() req: any) {
    try {
      const userId = req.user?.id;
      const result = await this.twoFactorService.disable2FA(userId);
      return result;
    } catch (error) {
      console.error('Erreur disable-2fa:', error);
      return {
        success: false,
        message: 'Erreur interne du serveur'
      };
    }
  }

  @Post('2fa/send-code')
  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @UseInterceptors(UserAuthInterceptor)
  async send2FACode(@Req() req: any) {
    try {
      const userId = req.user?.id;
      const result = await this.twoFactorService.send2FACode(userId);
      return result;
    } catch (error) {
      console.error('Erreur send-2fa-code:', error);
      return {
        success: false,
        message: 'Erreur interne du serveur'
      };
    }
  }

  @Post('2fa/verify-code')
  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @UseInterceptors(UserAuthInterceptor)
  async verify2FACode(@Req() req: any, @Body() body: { code: string }) {
    try {
      const userId = req.user?.id;
      const result = await this.twoFactorService.verify2FACode(userId, body.code);
      return result;
    } catch (error) {
      console.error('Erreur verify-2fa-code:', error);
      return {
        success: false,
        message: 'Erreur interne du serveur'
      };
    }
  }

  @Get('2fa/status')
  @UseGuards(JwtAuthGuard, UserAuthGuard)
  @UseInterceptors(UserAuthInterceptor)
  async get2FAStatus(@Req() req: any) {
    try {
      const userId = req.user?.id;
      const isEnabled = await this.twoFactorService.is2FAEnabled(userId);
      return {
        success: true,
        twoFactorEnabled: isEnabled
      };
    } catch (error) {
      console.error('Erreur get-2fa-status:', error);
      return {
        success: false,
        message: 'Erreur interne du serveur'
      };
    }
  }
}

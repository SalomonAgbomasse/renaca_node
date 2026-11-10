import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './modules/gestionUsers/entity/user.entity';
import { UserSession } from './modules/gestionUsers/entity/user-session.entity';
import { AuthExtendedService } from './modules/gestionUsers/service/auth-extended.service';
import { PasswordResetService } from './modules/gestionUsers/service/password-reset.service';
import { TwoFactorService } from './modules/gestionUsers/service/two-factor.service';
import { EmailService } from './services/email.service';
import { SmsService } from './services/sms.service';
import { AuthLoginController } from './modules/gestionUsers/controller/auth-login.controller';


describe('OWASP Security Verification - RENACA Backend', () => {
  let authLoginController: AuthLoginController;
  let authExtendedService: AuthExtendedService;
  let passwordResetService: PasswordResetService;

  const mockUser: Partial<User> = {
    id: 1,
    email: 'agent@renaca.org',
    phone: '22997000000',
    password: '$2b$10$hashedpasswordstringsample',
    salt: 'randomsalt1234',
    status: 'ACTIVE',
    twoFactorEnabled: false,
    idAgency: 1,
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockSessionRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthLoginController],
      providers: [
        AuthExtendedService,
        PasswordResetService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(UserSession),
          useValue: mockSessionRepository,
        },
        {
          provide: TwoFactorService,
          useValue: {},
        },
        {
          provide: EmailService,
          useValue: {
            sendPasswordResetCode: jest.fn().mockResolvedValue({ success: true }),
          },
        },
        {
          provide: SmsService,
          useValue: {
            sendOTPCode: jest.fn().mockResolvedValue({ success: true }),
          },
        },

      ],
    }).compile();

    authLoginController = module.get<AuthLoginController>(AuthLoginController);
    authExtendedService = module.get<AuthExtendedService>(AuthExtendedService);
    passwordResetService = module.get<PasswordResetService>(PasswordResetService);
  });

  describe('1. Elimination des endpoints de debug et fuite OTP (OWASP API8 / CWE-200)', () => {
    it('ne doit pas exposer debug-otp, debug-user, debug-phone dans AuthLoginController', () => {
      expect((authLoginController as any).debugOTP).toBeUndefined();
      expect((authLoginController as any).debugUser).toBeUndefined();
      expect((authLoginController as any).debugPhone).toBeUndefined();
      expect((authLoginController as any).testStatus).toBeUndefined();
    });
  });

  describe('2. Anti-énumération des utilisateurs (OWASP API2)', () => {
    it('doit renvoyer une réponse uniforme lors de la demande de réinitialisation même pour un compte inexistant', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await passwordResetService.generateResetCode('unknown@renaca.org');
      expect(result.success).toBe(true);
      expect(result.message).toContain('Si cet identifiant correspond à un compte actif');
      expect((result as any).code).toBeUndefined();
    });

    it('ne doit JAMAIS renvoyer le code OTP/Reset en clair dans le payload', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      const result = await passwordResetService.generateResetCode('agent@renaca.org');
      expect((result as any).code).toBeUndefined();
    });

    it('doit renvoyer une réponse 2FA opaque sans dévoiler si le compte existe', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      const res = await authExtendedService.check2FAStatus('nonexistent@renaca.org');
      expect(res.success).toBe(true);
      expect(res.twoFactorEnabled).toBe(false);
    });
  });

  describe('3. Validation stricte du code de réinitialisation', () => {
    it('doit échouer proprement avec un message uniforme si le code est invalide', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        ...mockUser,
        smsToken: '999999',
        smsTokenExpires: new Date(Date.now() + 600000),
      });

      const res = await passwordResetService.resetPassword('agent@renaca.org', '000000', 'NewPass123!');
      expect(res.success).toBe(false);
      expect(res.message).toBe('Identifiant ou code de réinitialisation invalide.');
    });
  });
});

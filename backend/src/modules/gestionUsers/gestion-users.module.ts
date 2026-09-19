import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { Role } from './entity/role.entity';
import { UserActivity } from './entity/user-activity.entity';
import { UserSession } from './entity/user-session.entity';
import { AuditLog } from './entity/audit-log.entity';
import { EmailNotification } from './entity/email-notification.entity';
import { SystemSetting } from './entity/system-setting.entity';
import { Group } from './entity/group.entity';
import { Agency } from '../gestionContracts/entity/agency.entity';
import { Contract } from '../gestionContracts/entity/contract.entity';
import { Cotation } from '../gestionContracts/entity/cotation.entity';
import { NatureCredit } from '../gestionContracts/entity/nature-credit.entity';
import { UserController } from './controller/user.controller';
import { RoleController } from './controller/role.controller';
import { GroupController } from './controller/group.controller';
import { AuthController } from './controller/auth.controller';
import { UserManagementController } from './controller/user-management.controller';
import { SessionCleanupController } from './controller/session-cleanup.controller';
import { AuditLogController } from './controller/audit-log.controller';
import { EmailNotificationController } from './controller/email-notification.controller';
import { SystemSettingController } from './controller/system-setting.controller';
import { UserService } from './service/user.service';
import { RoleService } from './service/role.service';
import { GroupService } from './service/group.service';
import { AuthService } from './service/auth.service';
import { UserStatusService } from './service/user-status.service';
import { SessionCleanupService } from './service/session-cleanup.service';
import { AuditLogService } from '../../services/audit-log.service';
import { EmailNotificationService } from './service/email-notification.service';
import { SystemSettingService } from './service/system-setting.service';
import { UserAuthGuard } from './guards/user-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserAuthInterceptor } from './interceptors/user-auth.interceptor';
import { ResponseTransformInterceptor } from './interceptors/response-transform.interceptor';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';
import { EmailService } from '../../services/email.service';
import { SmsService } from '../../services/sms.service';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthLoginController } from './controller/auth-login.controller';
import { AuthSecurityController } from './controller/auth-security.controller';
import { AuthExtendedService } from './service/auth-extended.service';
import { PasswordResetService } from './service/password-reset.service';
import { TwoFactorService } from './service/two-factor.service';
import { PdfService } from '../../services/pdf.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Group, UserActivity, UserSession, AuditLog, Agency, EmailNotification, Contract, Cotation, SystemSetting, NatureCredit]),
  ],
  controllers: [UserController, RoleController, GroupController, AuthController, UserManagementController, SessionCleanupController, AuditLogController, EmailNotificationController, SystemSettingController, AuthLoginController, AuthSecurityController],
  providers: [
    UserService, 
    RoleService, 
    GroupService,
    AuthService, 
    UserStatusService,
    SessionCleanupService,
    AuditLogService,
    EmailNotificationService,
    SystemSettingService,
    UserAuthGuard,
    JwtAuthGuard,
    UserAuthInterceptor,
    ResponseTransformInterceptor,
    EmailService,
    SmsService,
    AuthExtendedService,
    PasswordResetService,
    TwoFactorService,
    PdfService,
    // Activer l'interceptor d'audit globalement
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
  exports: [TypeOrmModule, UserService, RoleService, GroupService, AuthService, JwtAuthGuard, AuditLogService, EmailNotificationService, SystemSettingService],
})
export class GestionUsersModule {}

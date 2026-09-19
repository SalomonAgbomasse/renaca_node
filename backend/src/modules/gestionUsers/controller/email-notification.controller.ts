import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards, UseInterceptors, NotFoundException, BadRequestException } from '@nestjs/common';
import { EmailNotificationService } from '../service/email-notification.service';
import { UserService } from '../service/user.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ResponseTransformInterceptor } from '../interceptors/response-transform.interceptor';
import { EmailNotification } from '../entity/email-notification.entity';

@Controller('email-notifications')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ResponseTransformInterceptor)
export class EmailNotificationController {
  constructor(
    private readonly emailNotificationService: EmailNotificationService,
    private readonly userService: UserService,
  ) {}

  @Get()
  async findAll(): Promise<{ message: string; notifications: EmailNotification[] }> {
    const notifications = await this.emailNotificationService.findAll();
    return {
      message: `Liste des ${notifications.length} adresses email de notification récupérée avec succès`,
      notifications
    };
  }

  @Get('active')
  async findActive(): Promise<{ message: string; emails: string[] }> {
    const emails = await this.emailNotificationService.getActiveEmails('daily_report');
    return {
      message: `${emails.length} adresse(s) email active(s) pour le rapport quotidien`,
      emails
    };
  }

  @Get('daily-report/list')
  async findDailyReportNotifications(): Promise<{ message: string; notifications: EmailNotification[] }> {
    const notifications = await this.emailNotificationService.findAllByType('daily_report', true);
    // Pour chaque notification, essayer de trouver l'utilisateur correspondant par email
    const notificationsWithUsers = await Promise.all(
      notifications.map(async (notification) => {
        try {
          const user = await this.userService.findByEmail(notification.email);
          return {
            ...notification,
            user: user ? {
              id: user.id,
              firstname: user.firstname,
              lastname: user.lastname,
              email: user.email,
              phone: user.phone,
            } : null
          };
        } catch (error) {
          return {
            ...notification,
            user: null
          };
        }
      })
    );
    return {
      message: `Liste des ${notificationsWithUsers.length} notifications quotidiennes récupérée avec succès`,
      notifications: notificationsWithUsers
    };
  }

  @Get('users/available')
  async findAvailableUsers(): Promise<{ message: string; users: any[] }> {
    // Adapter pour la pagination de fnda_node (on demande une grande limite pour tout récupérer)
    const result = await this.userService.findAll(undefined, undefined, 1, 10000);
    const allUsers = result.users || [];
    
    // Filtrer uniquement les utilisateurs avec une adresse email
    const usersWithEmail = allUsers
      .filter(user => user.email && user.email.trim() !== '')
      .map(user => ({
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        phone: user.phone,
        role: user.role ? {
          id: user.role.id,
          libelle: user.role.libelle,
          desc: user.role.desc
        } : null,
        agency: user.agency ? {
          id: user.agency.id,
          name: user.agency.name
        } : null
      }));
    return {
      message: `${usersWithEmail.length} utilisateur(s) disponible(s) avec adresse email`,
      users: usersWithEmail
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<{ message: string; notification: EmailNotification }> {
    const notification = await this.emailNotificationService.findOne(id);
    if (!notification) {
      throw new NotFoundException('Adresse email de notification non trouvée');
    }
    return {
      message: 'Adresse email de notification récupérée avec succès',
      notification
    };
  }

  @Post()
  async create(@Body() emailNotificationData: Partial<EmailNotification>): Promise<{ message: string; notification: EmailNotification }> {
    if (!emailNotificationData.email) {
      throw new BadRequestException('L\'adresse email est requise');
    }

    try {
      const notification = await this.emailNotificationService.create(emailNotificationData);
      return {
        message: 'Adresse email de notification créée avec succès',
        notification
      };
    } catch (error: any) {
      throw new BadRequestException(error.message || 'Erreur lors de la création de l\'adresse email');
    }
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() emailNotificationData: Partial<EmailNotification>
  ): Promise<{ message: string; notification: EmailNotification }> {
    try {
      const notification = await this.emailNotificationService.update(id, emailNotificationData);
      if (!notification) {
        throw new NotFoundException('Adresse email de notification non trouvée');
      }
      return {
        message: 'Adresse email de notification mise à jour avec succès',
        notification
      };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Erreur lors de la mise à jour de l\'adresse email');
    }
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    const notification = await this.emailNotificationService.findOne(id);
    if (!notification) {
      throw new NotFoundException('Adresse email de notification non trouvée');
    }

    await this.emailNotificationService.remove(id);
    return {
      message: 'Adresse email de notification supprimée avec succès'
    };
  }

  @Put(':id/toggle')
  async toggleActive(@Param('id', ParseIntPipe) id: number): Promise<{ message: string; notification: EmailNotification }> {
    const notification = await this.emailNotificationService.toggleActive(id);
    if (!notification) {
      throw new NotFoundException('Adresse email de notification non trouvée');
    }
    return {
      message: `Adresse email ${notification.isActive ? 'activée' : 'désactivée'} avec succès`,
      notification
    };
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailNotification } from '../entity/email-notification.entity';

@Injectable()
export class EmailNotificationService {
  constructor(
    @InjectRepository(EmailNotification)
    private readonly emailNotificationRepository: Repository<EmailNotification>,
  ) {}

  async findAll(): Promise<EmailNotification[]> {
    return await this.emailNotificationRepository.find({
      where: { isActive: true },
      order: { email: 'ASC' }
    });
  }

  async findAllByType(notificationType: string = 'daily_report', includeInactive: boolean = true): Promise<EmailNotification[]> {
    const whereCondition: any = { notificationType };
    if (!includeInactive) {
      whereCondition.isActive = true;
    }
    return await this.emailNotificationRepository.find({
      where: whereCondition,
      order: { email: 'ASC' }
    });
  }

  async getActiveEmails(notificationType: string = 'daily_report'): Promise<string[]> {
    const notifications = await this.findAllByType(notificationType, false);
    return notifications.map(n => n.email).filter(email => this.isValidEmail(email));
  }

  async findOne(id: number): Promise<EmailNotification | null> {
    return await this.emailNotificationRepository.findOne({
      where: { id }
    });
  }

  async findByEmail(email: string): Promise<EmailNotification | null> {
    return await this.emailNotificationRepository.findOne({
      where: { email }
    });
  }

  async create(emailNotificationData: Partial<EmailNotification>): Promise<EmailNotification> {
    // Vérifier si l'email existe déjà
    const existing = await this.findByEmail(emailNotificationData.email || '');
    if (existing && !existing.deletedAt) {
      throw new Error(`L'adresse email ${emailNotificationData.email} existe déjà`);
    }

    if (existing && existing.deletedAt) {
      // Restaurer l'enregistrement supprimé
      existing.deletedAt = undefined;
      existing.isActive = emailNotificationData.isActive !== undefined ? emailNotificationData.isActive : true;
      existing.name = emailNotificationData.name || existing.name;
      existing.notificationType = emailNotificationData.notificationType || existing.notificationType;
      existing.description = emailNotificationData.description || existing.description;
      return await this.emailNotificationRepository.save(existing);
    }

    const newNotification = this.emailNotificationRepository.create({
      email: emailNotificationData.email!,
      name: emailNotificationData.name || null,
      isActive: emailNotificationData.isActive !== undefined ? emailNotificationData.isActive : true,
      notificationType: emailNotificationData.notificationType || 'daily_report',
      description: emailNotificationData.description || null,
    } as EmailNotification);

    return await this.emailNotificationRepository.save(newNotification);
  }

  async update(id: number, emailNotificationData: Partial<EmailNotification>): Promise<EmailNotification | null> {
    const existing = await this.findOne(id);
    if (!existing) {
      return null;
    }

    // Vérifier si l'email change et s'il existe déjà
    if (emailNotificationData.email && emailNotificationData.email !== existing.email) {
      const emailExists = await this.findByEmail(emailNotificationData.email);
      if (emailExists && emailExists.id !== id && !emailExists.deletedAt) {
        throw new Error(`L'adresse email ${emailNotificationData.email} existe déjà`);
      }
    }

    Object.assign(existing, emailNotificationData);
    return await this.emailNotificationRepository.save(existing);
  }

  async remove(id: number): Promise<void> {
    await this.emailNotificationRepository.softDelete(id);
  }

  async toggleActive(id: number): Promise<EmailNotification | null> {
    const notification = await this.findOne(id);
    if (!notification) {
      return null;
    }

    notification.isActive = !notification.isActive;
    return await this.emailNotificationRepository.save(notification);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

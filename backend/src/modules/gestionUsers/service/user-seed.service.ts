import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entity/user.entity';
import { Role } from '../entity/role.entity';
import { Agency } from '../../gestionContracts/entity/agency.entity';
import { Subscriber } from '../../gestionContracts/entity/subscriber.entity';
import { SystemSetting } from '../entity/system-setting.entity';
import { Group } from '../entity/group.entity';
import { NatureCredit } from '../../gestionContracts/entity/nature-credit.entity';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';

@Injectable()
export class UserSeedService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Agency)
    private agencyRepository: Repository<Agency>,
    @InjectRepository(Subscriber)
    private subscriberRepository: Repository<Subscriber>,
    @InjectRepository(SystemSetting)
    private settingRepository: Repository<SystemSetting>,
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(NatureCredit)
    private natureCreditRepository: Repository<NatureCredit>,
  ) {}

  async onModuleInit() {
    // Ordre important : d'abord les rôles et agences, puis les utilisateurs
    await this.seedRoles();
    await this.seedSubscribers();
    await this.seedAgencies();
    await this.seedUsers();
    await this.seedSettings();
    await this.seedDefaultGroup();
  }

  private async seedSettings() {
    try {
      console.log('🌱 Seed: Vérification et mise à jour des paramètres système...');
      
      const defaultSettings = [
        {
          key: 'SEND_WELCOME_EMAIL',
          value: 'false',
          description: 'Activer l\'envoi automatique d\'email de bienvenue aux nouveaux utilisateurs'
        },
        {
          key: 'ENABLE_SMS_2FA',
          value: 'true',
          description: 'Activer la double authentification par SMS globalement sur la plateforme'
        }
      ];

      for (const item of defaultSettings) {
        const exists = await this.settingRepository.findOne({ where: { key: item.key } });
        if (!exists) {
          console.log(`➕ Ajout du paramètre système par défaut : ${item.key} = ${item.value}`);
          const setting = this.settingRepository.create(item);
          await this.settingRepository.save(setting);
        }
      }
      
      console.log('✅ Seed: Paramètres système vérifiés avec succès.');
    } catch (error) {
      console.error('❌ Seed: Erreur lors de l\'initialisation des paramètres système:', error);
    }
  }

  private async seedDefaultGroup() {
    try {
      console.log('🌱 Seed: Vérification du groupe par défaut AMORT...');
      let amortNature = await this.natureCreditRepository.findOne({
        where: [{ code: 'AMORT' }, { code: 'AMORTISSABLE' }]
      });

      if (!amortNature) {
        amortNature = await this.natureCreditRepository.save(
          this.natureCreditRepository.create({
            libelle: 'AMORTISSABLE',
            code: 'AMORT',
            description: 'Crédit amortissable standard',
            isActive: true
          })
        );
      }

      let defaultGroup = await this.groupRepository.findOne({
        where: { code: 'G_AMORT' },
        relations: ['natureCredits']
      });

      if (!defaultGroup) {
        console.log('🌱 Création du groupe par défaut "Groupe Amortissable"...');
        defaultGroup = this.groupRepository.create({
          libelle: 'Groupe Amortissable (Par Défaut)',
          code: 'G_AMORT',
          description: 'Groupe par défaut accordant l\'accès aux crédits Amortissables (AMORT)',
          isActive: true,
          natureCredits: amortNature ? [amortNature] : []
        });
        await this.groupRepository.save(defaultGroup);
        console.log('✅ Groupe par défaut "Groupe Amortissable" créé avec succès.');
      } else if (amortNature && (!defaultGroup.natureCredits || !defaultGroup.natureCredits.some(n => n.id === amortNature!.id))) {
        defaultGroup.natureCredits = [...(defaultGroup.natureCredits || []), amortNature];
        await this.groupRepository.save(defaultGroup);
      }
    } catch (error) {
      console.error('❌ Erreur lors du seed du groupe par défaut:', error);
    }
  }

  private async seedRoles() {
    try {
      console.log('🌱 Seed: Vérification et mise à jour des rôles...');
      
      const defaultRoles = [
        {
          id: 1,
          libelle: 'ADMIN',
          desc: 'Administrateur système'
        },
        {
          id: 2,
          libelle: 'MANAGER',
          desc: 'Gestionnaire'
        },
        {
          id: 4,
          libelle: 'USER',
          desc: 'Utilisateur standard'
        },
        {
          id: 5,
          libelle: 'SUPER ADMIN',
          desc: 'Super administrateur'
        },
        {
          id: 6,
          libelle: 'AGENCY MANAGER',
          desc: 'Gestionnaire d\'agence'
        }
      ];

      const allowedIds = defaultRoles.map(r => r.id);

      // 1. Mettre à jour ou insérer les nouveaux rôles
      for (const roleData of defaultRoles) {
        const existingRole = await this.roleRepository.findOne({
          where: { id: roleData.id }
        });

        if (!existingRole) {
          console.log(`🌱 Création du rôle: ${roleData.libelle} (ID: ${roleData.id})`);
          await this.roleRepository.save(roleData);
        } else {
          // Mettre à jour le rôle existant pour s'assurer qu'il a les bonnes infos
          existingRole.libelle = roleData.libelle;
          existingRole.desc = roleData.desc;
          await this.roleRepository.save(existingRole);
        }
      }

      // 2. Nettoyer les anciens rôles obsolètes
      const allDbRoles = await this.roleRepository.find();
      for (const dbRole of allDbRoles) {
        if (!allowedIds.includes(dbRole.id)) {
          console.log(`🗑️ Rôle obsolète détecté: ${dbRole.libelle} (ID: ${dbRole.id})`);
          
          // Réassigner les utilisateurs de ce rôle obsolète vers USER (ID: 4)
          const affectedUsers = await this.userRepository.find({ where: { idRole: dbRole.id } });
          if (affectedUsers.length > 0) {
            console.log(`🔄 Réassignation de ${affectedUsers.length} utilisateur(s) vers le rôle USER (ID: 4)`);
            for (const user of affectedUsers) {
              user.idRole = 4;
              await this.userRepository.save(user);
            }
          }
          
          // Supprimer le rôle obsolète
          await this.roleRepository.delete(dbRole.id);
          console.log(`✅ Rôle ${dbRole.libelle} (ID: ${dbRole.id}) supprimé.`);
        }
      }

      console.log('✅ Seed: Alignement des rôles terminé');
    } catch (error) {
      console.error('❌ Erreur lors du seed des rôles:', error);
    }
  }

  private async seedUsers() {
    try {
      console.log('🌱 Seed: Vérification des utilisateurs...');
      
      const usersToSeed = [
        {
          idRole: 1, // ADMIN
          idAgency: 1, // Agence Centrale - Cotonou
          lastname: 'ASSOUMA',
          firstname: 'Ajmal',
          email: 'ajmalassouma2@gmail.com',
          phone: '0162363507',
          password: 'password',
          status: 'ACTIVE',
          isVerified: true,
          twoFactorEnabled: false,
          loginAttempts: 0,
          version: 0
        },
      ];

      for (const userData of usersToSeed) {
        // Vérifier si l'utilisateur existe déjà
        const existingUser = await this.userRepository.findOne({
          where: { email: userData.email }
        });

        if (!existingUser) {
          console.log(`🌱 Création de l'utilisateur: ${userData.firstname} ${userData.lastname}`);
          
          // Générer un salt unique
          const salt = crypto.randomBytes(16).toString('hex');
          
          // Hacher le mot de passe avec le salt
          const hashedPassword = await bcrypt.hash(userData.password + salt, 10);
          
          const userToCreate = {
            ...userData,
            password: hashedPassword,
            salt: salt
          };

          const user = this.userRepository.create(userToCreate);
          const savedUser = await this.userRepository.save(user);
          
          console.log(`✅ Utilisateur "${userData.firstname} ${userData.lastname}" créé avec l'ID ${savedUser.id}`);
          console.log(`📧 Email: ${userData.email}`);
          console.log(`🔑 Mot de passe: ${userData.password}`);
          console.log(`👤 Rôle: ${userData.idRole === 1 ? 'ADMIN' : userData.idRole === 2 ? 'MANAGER' : 'AUTRE'}`);
          
          // Envoyer l'email de bienvenue (Désactivé pour le seeding)
          // await this.sendWelcomeEmail(userData, savedUser.id);
        } else {
          console.log(`ℹ️ Utilisateur "${userData.firstname} ${userData.lastname}" existe déjà`);
        }
      }

      console.log('✅ Seed: Vérification des utilisateurs terminée');
    } catch (error) {
      console.error('❌ Erreur lors du seed des utilisateurs:', error);
    }
  }

  private async seedSubscribers() {
    try {
      console.log('🌱 Seed: Vérification des abonnés...');
      
      const defaultSubscribers = [
        {
          id: 1,
          name: 'RENACA-BENIN',
          email: 'renaca@yahoo.fr',
          phone: '+229 01 21 60 33 05',
          phone2: '',
          address: 'Commune de Bohicon, 1er arrondissement, quartier Agbanwémè, lot 118',
          fax: ''
        }
      ];

      // Supprimer l'abonné BIIC (ID 2) s'il existe
      try {
        const biicSubscriber = await this.subscriberRepository.findOne({ where: { id: 2 } });
        if (biicSubscriber) {
          console.log(`🗑️ Suppression de l'abonné obsolète: ${biicSubscriber.name}`);
          await this.subscriberRepository.delete(2);
        }
      } catch (e) {
        console.error('⚠️ Impossible de supprimer l\'abonné BIIC:', e.message);
      }

      for (const subscriberData of defaultSubscribers) {
        const existingSubscriber = await this.subscriberRepository.findOne({
          where: { id: subscriberData.id }
        });

        if (!existingSubscriber) {
          console.log(`🌱 Création de l'abonné: ${subscriberData.name}`);
          
          await this.subscriberRepository
            .createQueryBuilder()
            .insert()
            .into(Subscriber)
            .values(subscriberData)
            .orIgnore()
            .execute();
            
          console.log(`✅ Abonné "${subscriberData.name}" créé avec l'ID ${subscriberData.id}`);
        } else {
          console.log(`ℹ️ Abonné "${subscriberData.name}" (ID: ${subscriberData.id}) existe déjà`);
        }
      }

      console.log('✅ Seed: Vérification des abonnés terminée');
    } catch (error) {
      console.error('❌ Erreur lors du seed des abonnés:', error);
    }
  }

  private async seedAgencies() {
    try {
      console.log('🌱 Seed: Vérification des agences...');
      
      const defaultAgencies = [
        {
          id: 1,
          idSubscriber: 1,
          createdBy: 1,
          name: 'L\'AFRICAINE VIE',
          address: '01 BP 2040 Cotonou-Bénin',
          email: 'africainevie@lafricaineviebenin.com',
          phone: '21 30 39 93',
          fax: '21334218'
        },
        {
          id: 2,
          idSubscriber: 1,
          createdBy: 1,
          name: 'BOHICON',
          address: 'BOHICON',
          email: 'africainevie@lafricaineviebenin.com',
          phone: '94 02 47 31',
          fax: '21334218'
        },
        {
          id: 3,
          idSubscriber: 1,
          createdBy: 1,
          name: 'PARAKOU',
          address: 'PARAKOU',
          email: 'africainevie@lafricaineviebenin.com',
          phone: '66 00 13 28',
          fax: '21334218'
        }
      ];

      for (const agencyData of defaultAgencies) {
        const existingAgency = await this.agencyRepository.findOne({
          where: { id: agencyData.id }
        });

        if (!existingAgency) {
          console.log(`🌱 Création de l'agence: ${agencyData.name}`);
          
          await this.agencyRepository
            .createQueryBuilder()
            .insert()
            .into(Agency)
            .values(agencyData)
            .orIgnore()
            .execute();
            
          console.log(`✅ Agence "${agencyData.name}" créée avec l'ID ${agencyData.id}`);
        } else {
          console.log(`ℹ️ Agence "${agencyData.name}" (ID: ${agencyData.id}) existe déjà`);
        }
      }

      console.log('✅ Seed: Vérification des agences terminée');
    } catch (error) {
      console.error('❌ Erreur lors du seed des agences:', error);
    }
  }

  private async sendWelcomeEmail(userData: any, userId: number) {
    try {
      console.log(`📧 Envoi de l'email de bienvenue à ${userData.email}...`);

      // Configuration du transporteur email
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true' || process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || process.env.EMAIL_USER || 'notificationsaavie@gmail.com',
          pass: process.env.SMTP_PASS || process.env.EMAIL_PASS
        }
      });

      // Récupérer les informations de l'agence et du rôle
      const agency = await this.agencyRepository.findOne({ where: { id: userData.idAgency } });
      const role = await this.roleRepository.findOne({ where: { id: userData.idRole } });

      // Contenu de l'email
      const emailContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Bienvenue sur SUD CAPITAL</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              background-color: #f5f7fa;
            }
            .email-wrapper { 
              background-color: #f5f7fa; 
              padding: 20px; 
              min-height: 100vh;
            }
            .container { 
              max-width: 650px; 
              margin: 0 auto; 
              background-color: #ffffff;
              border-radius: 12px;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header { 
              background: linear-gradient(135deg, #33b04a 0%, #2c3e50 100%); 
              color: white; 
              padding: 30px 25px; 
              text-align: center; 
              position: relative;
            }
            .header::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>') repeat;
              opacity: 0.3;
            }
            .logo { 
              font-size: 28px; 
              font-weight: 700; 
              margin-bottom: 15px; 
              position: relative;
              z-index: 1;
            }
            .header h1 { 
              font-size: 24px; 
              font-weight: 600; 
              margin-bottom: 10px;
              position: relative;
              z-index: 1;
            }
            .header p {
              font-size: 16px;
              opacity: 0.9;
              position: relative;
              z-index: 1;
            }
            .content { 
              padding: 30px 25px; 
              background-color: #ffffff;
            }
            .welcome-text {
              font-size: 16px;
              margin-bottom: 20px;
              color: #2c3e50;
            }
            .credentials { 
              background: linear-gradient(135deg, #e8f5e8 0%, #f0f8ff 100%);
              padding: 20px; 
              border-left: 5px solid #33b04a; 
              margin: 20px 0; 
              border-radius: 8px;
              box-shadow: 0 4px 15px rgba(51, 176, 74, 0.1);
            }
            .credentials h3 {
              color: #2c3e50;
              margin-bottom: 15px;
              font-size: 16px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .cred-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 12px 0;
              border-bottom: 1px solid rgba(51, 176, 74, 0.1);
            }
            .cred-item:last-child {
              border-bottom: none;
            }
            .cred-label {
              font-weight: 600;
              color: #2c3e50;
              min-width: 120px;
            }
            .cred-value {
              color: #33b04a;
              font-weight: 500;
              word-break: break-all;
            }
            .instructions { 
              background: linear-gradient(135deg, #fff8e1 0%, #fffbf0 100%);
              padding: 20px; 
              border-left: 5px solid #ffc107; 
              margin: 20px 0; 
              border-radius: 8px;
              box-shadow: 0 4px 15px rgba(255, 193, 7, 0.1);
            }
            .instructions h3 {
              color: #2c3e50;
              margin-bottom: 15px;
              font-size: 16px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .instructions ol, .instructions ul {
              padding-left: 20px;
            }
            .instructions li {
              margin-bottom: 12px;
              line-height: 1.5;
            }
            .button { 
              display: inline-block; 
              padding: 15px 30px; 
              background: linear-gradient(135deg, #33b04a 0%, #2c3e50 100%);
              color: white; 
              text-decoration: none; 
              border-radius: 8px; 
              font-weight: 600;
              transition: all 0.3s ease;
              box-shadow: 0 4px 15px rgba(51, 176, 74, 0.3);
            }
            .button:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 20px rgba(51, 176, 74, 0.4);
            }
            .footer { 
              text-align: center; 
              padding: 30px; 
              background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
              color: #ecf0f1;
            }
            .footer p {
              margin-bottom: 10px;
              font-size: 14px;
            }
            .highlight { 
              color: #33b04a; 
              font-weight: 700; 
            }
            .signature {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 2px solid #ecf0f1;
              font-style: italic;
            }
            .icon {
              font-size: 20px;
            }
            @media (max-width: 600px) {
              .email-wrapper { padding: 10px; }
              .container { border-radius: 8px; }
              .header, .content { padding: 20px; }
              .cred-item { flex-direction: column; align-items: flex-start; gap: 5px; }
              .button { display: block; text-align: center; }
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="container">
              
              <div class="content">
                <div class="welcome-text">
                  <p>Bonjour <strong>${userData.firstname} ${userData.lastname}</strong>,</p>
                  <p>Votre compte utilisateur a été créé avec succès sur la plateforme <span class="highlight">SUD CAPITAL</span>.</p>
                </div>
                
                <div class="credentials">
                  <h3><span class="icon">🔐</span> Vos identifiants de connexion</h3>
                  <div class="cred-item">
                    <span class="cred-label">Email :</span>
                    <span class="cred-value">${userData.email}</span>
                  </div>
                  <div class="cred-item">
                    <span class="cred-label">Mot de passe :</span>
                    <span class="cred-value">${userData.password}</span>
                  </div>
                  <div class="cred-item">
                    <span class="cred-label">Rôle :</span>
                    <span class="cred-value">${role?.libelle || 'Non défini'}</span>
                  </div>
                  <div class="cred-item">
                    <span class="cred-label">Agence :</span>
                    <span class="cred-value">${agency?.name || 'Non définie'}</span>
                  </div>
                </div>
                
                <div class="instructions">
                  <h3><span class="icon">📋</span> Instructions de connexion</h3>
                  <ol>
                    <li>Accédez à l'application via : <a href="${process.env.FRONTEND_URL || 'https://fnda.aaviedigital.bj'}" class="button">Se connecter à PADME S.A</a></li>
                    <li>Utilisez vos identifiants ci-dessus pour vous connecter</li>
                    <li>Lors de votre première connexion, vous serez invité à changer votre mot de passe</li>
                  </ol>
                </div>
                
                <div class="instructions">
                  <h3><span class="icon">🔧</span> Gestion de votre compte</h3>
                  <ul>
                    <li><strong>Changer le mot de passe :</strong> Connectez-vous et allez dans "Mon Profil" → "Changer le mot de passe"</li>
                    <li><strong>Modifier l'agence :</strong> Contactez l'administrateur système</li>
                    <li><strong>Modifier le rôle :</strong> Contactez l'administrateur système</li>
                  </ul>
                </div>
                
                <div class="signature">
                  <p>Si vous avez des questions ou besoin d'assistance, n'hésitez pas à contacter l'équipe technique.</p>
                  <p>Cordialement,<br><strong>L'équipe <span class="highlight">SUD CAPITAL</span></strong></p>
                </div>
              </div>
              
              <div class="footer">
                <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
                <p>© 2024 SUD CAPITAL - Système de gestion des cotations et contrats d'assurance</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      // Options de l'email
      const mailOptions = {
        from: process.env.EMAIL_USER || 'notificationsaavie@gmail.com',
        to: userData.email,
        cc: [
          'sagbomasse@lafricaineviebenin.com', // Copie à Salomon
          'salomonagbomasse25@gmail.com', // Copie à Salomon
        ],
        subject: '🎉 Bienvenue sur SUD CAPITAL - Vos identifiants de connexion',
        html: emailContent
      };

      // Envoyer l'email
      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Email de bienvenue envoyé à ${userData.email}. Message ID: ${info.messageId}`);
      
    } catch (error) {
      console.error(`❌ Erreur lors de l'envoi de l'email à ${userData.email}:`, error);
    }
  }

}

/**
 * Configuration centralisée pour les emails
 * Utilise les variables d'environnement définies dans .env
 */

// Log pour déboguer le chargement des variables
console.log('🔍 Email Config - Variables d\'environnement SMTP:');
console.log(`  SMTP_HOST: ${process.env.SMTP_HOST || 'NON DÉFINI'}`);
console.log(`  SMTP_PORT: ${process.env.SMTP_PORT || 'NON DÉFINI'}`);
console.log(`  SMTP_USER: ${process.env.SMTP_USER || 'NON DÉFINI'}`);
console.log(`  SMTP_PASS: ${process.env.SMTP_PASS ? 'DÉFINI (' + process.env.SMTP_PASS.length + ' caractères)' : 'NON DÉFINI'}`);

export const emailConfig = {
  // Configuration SMTP
  smtp: {
    host: process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true' || process.env.EMAIL_SECURE === 'true', // true pour 465, false pour autres ports
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL_USER || 'notificationsaavie@gmail.com',
      pass: process.env.SMTP_PASS || process.env.EMAIL_PASS || 'omrg rmuc hpuz vhkx', // Mot de passe d'application
    },
    tls: {
      rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false',
    },
  },

  // Informations de l'expéditeur
  from: {
    name: process.env.EMAIL_FROM_NAME || "L'Africaine Vie Bénin SA",
    address: process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER || process.env.EMAIL_USER || 'notificationsaavie@gmail.com',
  },

  // Informations de l'application
  app: {
    name: process.env.APP_NAME || 'RENACA Simulateur',
    url: process.env.FRONTEND_URL || 'https://renaca.acs.v1.aaviedigital.bj',
    companyName: process.env.COMPANY_NAME || "L'Africaine Vie Bénin SA",
    companyEmail: process.env.COMPANY_EMAIL || 'africainevie@lafricaineviebenin.com',
    companyPhone: process.env.COMPANY_PHONE || '(00229) 21 30 39 93',
    companyAddress: process.env.COMPANY_ADDRESS || 'Lot 19 Pate d\'Oie. 01PB 2040',
    companyWebsite: process.env.COMPANY_WEBSITE || 'www.lafricaineviebenin.com',
  },

  // Emails de notification (CC)
  notificationEmails: process.env.EMAIL_NOTIFICATION_CC 
    ? process.env.EMAIL_NOTIFICATION_CC.split(',').map(email => email.trim())
    : [
        'sagbomasse@lafricaineviebenin.com',
        'salomonagbomasse25@gmail.com',
      ],

  // Durée d'expiration des codes (en minutes)
  codeExpirationMinutes: parseInt(process.env.EMAIL_CODE_EXPIRATION_MINUTES || '10', 10),
};

export default emailConfig;

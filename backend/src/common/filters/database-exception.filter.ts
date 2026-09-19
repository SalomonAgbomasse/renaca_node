import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { Response } from 'express';

/**
 * Filtre global qui intercepte toutes les erreurs de base de données TypeORM
 * (QueryFailedError) et les transforme en réponses HTTP lisibles en français.
 *
 * Codes d'erreur MySQL gérés :
 *  - 1062 (ER_DUP_ENTRY)           : Doublon de valeur unique
 *  - 1451 (ER_ROW_IS_REFERENCED_2) : Suppression impossible (clé étrangère référencée)
 *  - 1452 (ER_NO_REFERENCED_ROW_2) : Référence inexistante (clé étrangère manquante)
 */
@Catch(QueryFailedError)
export class DatabaseExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DatabaseExceptionFilter.name);

  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const driverError = (exception as any).driverError;
    const errno: number = driverError?.errno;
    const sqlMessage: string = driverError?.sqlMessage || exception.message || '';

    this.logger.error(`[DB Error ${errno}] ${sqlMessage}`);

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Une erreur interne est survenue. Veuillez réessayer ou contacter l'administrateur.";

    switch (errno) {
      // ── Doublon de valeur unique ──────────────────────────────────────────
      case 1062: {
        status = HttpStatus.BAD_REQUEST;

        // Extraire la valeur en double et le nom de la clé depuis le message SQL
        // Format : Duplicate entry 'valeur' for key 'nom_table.NOM_INDEX'
        const dupMatch = sqlMessage.match(/Duplicate entry '(.+?)' for key '(.+?)'/);
        const dupValue = dupMatch?.[1] ?? '';
        const dupKey   = (dupMatch?.[2] ?? '').toLowerCase();

        // ── Entité Utilisateur ──
        if (dupKey.includes('email') || dupKey.includes('97672ac88f789774dd47f7c8be')) {
          message = `L'adresse email '${dupValue}' est déjà utilisée. Veuillez en choisir une autre.`;
        } else if (dupKey.includes('phone')) {
          message = `Le numéro de téléphone '${dupValue}' est déjà utilisé. Veuillez en choisir un autre.`;
        // ── Entité Session utilisateur ──
        } else if (dupKey.includes('sessionid') || dupKey.includes('session')) {
          message = `Un conflit de session a été détecté. Veuillez vous reconnecter.`;
        // ── Entité Contrat ──
        } else if (dupKey.includes('police')) {
          message = `Le numéro de police '${dupValue}' existe déjà dans le système.`;
        } else if (dupKey.includes('reference') || dupKey.includes('ref')) {
          message = `La référence '${dupValue}' existe déjà dans le système.`;
        } else if (dupKey.includes('keycont') || dupKey.includes('key_cont')) {
          message = `La clé de contrat '${dupValue}' existe déjà dans le système.`;
        // ── Entité Produit ──
        } else if (dupKey.includes('title') || dupKey.includes('titre')) {
          message = `Un produit portant le nom '${dupValue}' existe déjà.`;
        // ── Entité Souscripteur ──
        } else if (dupKey.includes('subscriber') || dupKey.includes('name') || dupKey.includes('nom')) {
          message = `Le nom '${dupValue}' existe déjà dans le système.`;
        // ── Entité Paramètre système ──
        } else if (dupKey.includes('key') || dupKey.includes('setting')) {
          message = `La clé de paramètre '${dupValue}' existe déjà dans la configuration.`;
        // ── Entité Notification email ──
        } else if (dupKey.includes('notification') || dupKey.includes('email_notif')) {
          message = `L'adresse de notification '${dupValue}' est déjà enregistrée.`;
        // ── Nature de crédit ──
        } else if (dupKey.includes('nature') || dupKey.includes('credit')) {
          message = `La nature de crédit '${dupValue}' existe déjà.`;
        // ── Seuil d'alerte ──
        } else if (dupKey.includes('code') || dupKey.includes('alert')) {
          message = `Le code '${dupValue}' existe déjà dans le système.`;
        // ── Fallback générique ──
        } else if (dupValue) {
          message = `La valeur '${dupValue}' existe déjà dans le système. Veuillez utiliser une valeur différente.`;
        } else {
          message = "Cette entrée existe déjà dans le système. Veuillez vérifier les informations saisies.";
        }
        break;
      }

      // ── Suppression impossible : l'entité est référencée ailleurs ─────────
      case 1451: {
        status = HttpStatus.CONFLICT;
        message =
          "Impossible de supprimer cet élément car il est lié à d'autres données dans le système. " +
          "Veuillez d'abord supprimer ou dissocier les éléments liés.";
        break;
      }

      // ── Clé étrangère introuvable ─────────────────────────────────────────
      case 1452: {
        status = HttpStatus.BAD_REQUEST;
        message =
          "La ressource associée demandée n'existe pas. " +
          "Veuillez vérifier les identifiants fournis (rôle, agence, etc.).";
        break;
      }

      // ── Erreur SQL générique non couverte ─────────────────────────────────
      default: {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = "Une erreur de base de données est survenue. Veuillez réessayer ou contacter l'administrateur.";
        break;
      }
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: this.getHttpStatusLabel(status),
      timestamp: new Date().toISOString(),
    });
  }

  private getHttpStatusLabel(status: number): string {
    switch (status) {
      case 400: return 'Bad Request';
      case 409: return 'Conflict';
      case 500: return 'Internal Server Error';
      default:  return 'Error';
    }
  }
}

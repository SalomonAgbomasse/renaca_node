import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface TransformedResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<T, TransformedResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<TransformedResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    return next.handle().pipe(
      map(data => {
        // Déterminer le code de statut
        let code = response.statusCode || 200;
        
        // Déterminer le message - priorité aux messages personnalisés des contrôleurs
        let message = 'Opération réussie';
        
        // Si la réponse contient déjà un message personnalisé, l'utiliser en priorité
        if (data && typeof data === 'object' && data.message) {
          message = data.message;
          
          // Si c'est un objet avec message, extraire les données réelles
          // Mais préserver le token s'il existe
          if (data.user || data.users || data.role || data.roles || data.group || data.groups || data.sessions || data.activities || data.permissions || data.success !== undefined || data.token || data.jwtToken) {
            // C'est un objet avec message + données, on garde le message mais on extrait les données
            const { message: msg, ...actualData } = data;
            message = msg;
            data = { message: msg, ...actualData };
          }
        } else {
          // Messages par défaut seulement si aucun message personnalisé n'est fourni
          switch (request.method) {
            case 'GET':
              if (Array.isArray(data)) {
                message = `Données récupérées avec succès (${data.length} élément${data.length > 1 ? 's' : ''})`;
              } else {
                message = 'Données récupérées avec succès';
              }
              break;
            case 'POST':
              message = 'Données créées avec succès';
              code = 201;
              break;
            case 'PUT':
              message = 'Données mises à jour avec succès';
              break;
            case 'DELETE':
              message = 'Données supprimées avec succès';
              break;
          }
        }
        
        return {
          code,
          message,
          data,
          timestamp: new Date().toISOString()
        };
      })
    );
  }
}

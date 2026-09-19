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

    // Ne pas transformer les réponses PDF (routes contenant /pdf)
    if (request.url && request.url.includes('/pdf')) {
      return next.handle() as any;
    }

    // Ne pas transformer les réponses PDF (Buffer) ou les réponses déjà envoyées
    return next.handle().pipe(
      map(data => {
        // Si la réponse est un Buffer (PDF, fichier, etc.), la retourner telle quelle
        if (Buffer.isBuffer(data)) {
          return data as any;
        }
        
        // Si la réponse a déjà été envoyée (res.send() appelé), ne pas transformer
        if (response.headersSent) {
          return data as any;
        }
        
        // Si data est undefined (cas où res.send() est utilisé directement), ne pas transformer
        if (data === undefined || data === null) {
          return data as any;
        }
        let message = 'Opération réussie';
        let code = response.statusCode || 200;

        // Prioritize custom messages from controllers
        if (data && typeof data === 'object' && data.message) {
          message = data.message;
          // Extract actual data if the controller returned an object with message + data
          // Préserver pagination si elle existe
          if (data.contract || data.contracts || data.customer || data.customers || 
              data.agency || data.agencies || data.product || data.products ||
              data.cotation || data.cotations || data.subscriber || data.subscribers ||
              data.typeCustomer || data.typeCustomers || data.contractState || 
              data.contractStates || data.success !== undefined || data.pagination ||
              data.summary || data.productionStates) {
            const { message: msg, ...actualData } = data;
            message = msg;
            data = { message: msg, ...actualData }; // Préserver le message dans data
          }
        } else {
          // Default messages if no custom message is provided
          switch (request.method) {
            case 'GET':
              message = Array.isArray(data) ? `Données récupérées avec succès (${data.length} élément${data.length > 1 ? 's' : ''})` : 'Données récupérées avec succès';
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

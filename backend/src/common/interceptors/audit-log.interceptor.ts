import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { AuditLogService } from '../../services/audit-log.service';
import { SecureLogger } from '../../utils/secure-logger';

/**
 * Interceptor pour enregistrer automatiquement tous les logs d'audit
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    // Ignorer seulement les routes vraiment non critiques (optimisation performance)
    const ignoredPaths = [
      '/api/csrf-token',
      '/api/health',
      '/api/status',
    ];

    const shouldIgnore = ignoredPaths.some(path => 
      request.url.startsWith(path) || request.originalUrl?.startsWith(path)
    );

    if (shouldIgnore) {
      return next.handle();
    }

    const action = this.determineAction(request);
    
    if (process.env.NODE_ENV !== 'production') {
      SecureLogger.debug('🔍 AuditLogInterceptor: Route interceptée', {
        method: request.method,
        url: request.url,
        action,
      });
    }

    return next.handle().pipe(
      tap((resData) => {
        // Associer l'utilisateur authentifié s'il est retourné par l'appel de connexion
        if (resData && typeof resData === 'object') {
          const user = resData.user || resData.data?.user;
          if (user && !request['user']) {
            request['user'] = user;
          }
        }

        this.auditLogService.log(
          request,
          response,
          action,
          undefined,
          startTime
        );
      }),
      catchError((error) => {
        this.auditLogService.log(
          request,
          response,
          action,
          error.message,
          startTime,
          error
        );
        throw error;
      })
    );
  }

  /**
   * Détermine l'action basée sur la méthode HTTP et la route
   */
  private determineAction(request: Request): string {
    const method = request.method;
    const url = request.originalUrl || request.url;

    // Actions spécifiques par route
    if (url.includes('/auth/login')) return 'LOGIN';
    if (url.includes('/auth/logout')) return 'LOGOUT';
    if (url.includes('/auth/register')) return 'REGISTER';
    if (url.includes('/contracts') && method === 'POST') return 'CREATE_CONTRACT';
    if (url.includes('/contracts') && method === 'PUT') return 'UPDATE_CONTRACT';
    if (url.includes('/contracts') && method === 'DELETE') return 'DELETE_CONTRACT';
    if (url.includes('/users') && method === 'POST') return 'CREATE_USER';
    if (url.includes('/users') && method === 'PUT') return 'UPDATE_USER';
    if (url.includes('/users') && method === 'DELETE') return 'DELETE_USER';
    if (url.includes('/customers') && method === 'POST') return 'CREATE_CUSTOMER';
    if (url.includes('/customers') && method === 'PUT') return 'UPDATE_CUSTOMER';
    if (url.includes('/customers') && method === 'DELETE') return 'DELETE_CUSTOMER';
    if (url.includes('/cotations') && method === 'POST') return 'CREATE_COTATION';
    if (url.includes('/cotations') && method === 'PUT') return 'UPDATE_COTATION';
    if (url.includes('/import')) return 'IMPORT_DATA';
    if (url.includes('/export')) return 'EXPORT_DATA';
    if (url.includes('/pdf')) return 'GENERATE_PDF';
    if (url.includes('/excel')) return 'GENERATE_EXCEL';

    // Actions génériques par méthode HTTP
    switch (method) {
      case 'GET':
        return 'READ';
      case 'POST':
        return 'CREATE';
      case 'PUT':
      case 'PATCH':
        return 'UPDATE';
      case 'DELETE':
        return 'DELETE';
      default:
        return method;
    }
  }
}

import { Injectable, NestInterceptor, ExecutionContext, CallHandler, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';

@Injectable()
export class AuthInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();
    
    // L'utilisateur est déjà injecté par JwtAuthGuard dans request.user
    // Pas besoin de refaire la logique JWT ici, juste s'assurer que l'utilisateur existe
    if (!request['user']) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }

    console.log('🔑 AuthInterceptor - Utilisateur injecté:', request['user']);

    return next.handle();
  }
}

// Décorateur pour appliquer l'authentification
export const RequireAuth = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    // Marquer la méthode comme nécessitant une authentification
    Reflect.defineMetadata('requireAuth', true, descriptor.value);
    return descriptor;
  };
};

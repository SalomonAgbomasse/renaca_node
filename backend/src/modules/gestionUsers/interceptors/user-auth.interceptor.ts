import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import type { Request } from 'express';

@Injectable()
export class UserAuthInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Vérifier si l'utilisateur est déjà authentifié par le guard JWT
    if (request['user']) {
      console.log('🔐 UserAuthInterceptor: Utilisateur déjà authentifié par JWT:', request['user']);
      
      // Enrichir l'utilisateur avec des informations supplémentaires si nécessaire
      // (par exemple, récupérer des détails depuis la base de données)
      // Pour l'instant, on laisse l'utilisateur tel qu'il est
      
      return next.handle();
    }
    
    // Si aucun utilisateur n'est authentifié, on ne fait rien
    // (le guard JWT se chargera de l'authentification)
    console.log('🔐 UserAuthInterceptor: Aucun utilisateur authentifié, laissant le guard JWT gérer l\'authentification');
    
    return next.handle();
  }
}

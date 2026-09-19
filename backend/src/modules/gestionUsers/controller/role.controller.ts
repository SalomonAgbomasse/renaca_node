import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query, UseGuards, UseInterceptors, NotFoundException } from '@nestjs/common';
import { RoleService } from '../service/role.service';
import { Role } from '../entity/role.entity';
import { CreateRoleDto, UpdateRoleDto } from '../dto';
import { UserAuthGuard, RequireUserPermissions, UserPermission } from '../guards/user-auth.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UserAuthInterceptor } from '../interceptors/user-auth.interceptor';
import { ResponseTransformInterceptor } from '../interceptors/response-transform.interceptor';

@Controller('roles')
@UseGuards(JwtAuthGuard, UserAuthGuard)
@UseInterceptors(UserAuthInterceptor, ResponseTransformInterceptor)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @RequireUserPermissions(UserPermission.READ_ROLES)
  async findAll(): Promise<{ message: string; roles: Role[] }> {
    const roles = await this.roleService.findAll();
    return {
      message: `Liste des ${roles.length} rôles récupérée avec succès`,
      roles
    };
  }

  @Get('permissions/available')
  async getAvailablePermissions(): Promise<{ message: string; permissions: string[] }> {
    const permissions = [
      'contract:read',
      'contract:create',
      'contract:update',
      'contract:delete',
      'contract:free-update',
      'users:read',
      'users:create',
      'users:update',
      'users:delete',
      'roles:read',
      'roles:manage',
      'agency:manage',
      'customer:manage',
      'bi:read'
    ];
    return {
      message: 'Liste des permissions disponibles récupérée avec succès',
      permissions
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<{ message: string; role: Role }> {
    const role = await this.roleService.findOne(id);
    if (!role) {
      throw new NotFoundException('Rôle non trouvé');
    }
    return {
      message: `Rôle "${role.libelle}" récupéré avec succès`,
      role
    };
  }

  @Get('search/title')
  async findByTitle(@Query('title') title: string): Promise<{ message: string; role: Role | null }> {
    const role = await this.roleService.findByLibelle(title);
    if (!role) {
      return {
        message: `Aucun rôle trouvé avec le titre "${title}"`,
        role: null
      };
    }
    return {
      message: `Rôle "${role.libelle}" trouvé avec succès`,
      role
    };
  }

  @Post()
  @RequireUserPermissions(UserPermission.MANAGE_ROLES)
  async create(@Body() roleData: CreateRoleDto): Promise<{ message: string; role: Role }> {
    const role = await this.roleService.create(roleData);
    return {
      message: `Rôle "${role.libelle}" créé avec succès`,
      role
    };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() roleData: UpdateRoleDto,
  ): Promise<{ message: string; role: Role }> {
    const role = await this.roleService.update(id, roleData);
    if (!role) {
      throw new NotFoundException('Rôle non trouvé');
    }
    return {
      message: `Rôle "${role.libelle}" mis à jour avec succès`,
      role
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string; roleId: number }> {
    const role = await this.roleService.findOne(id);
    if (!role) {
      throw new NotFoundException('Rôle non trouvé');
    }
    
    await this.roleService.remove(id);
    return {
      message: `Rôle "${role.libelle}" supprimé avec succès`,
      roleId: id
    };
  }

  // Obtenir les utilisateurs d'un rôle spécifique
  @Get(':id/users')
  async getUsersByRole(@Param('id', ParseIntPipe) id: number): Promise<{ message: string; users: any[] }> {
    const role = await this.roleService.findOne(id);
    if (!role) {
      throw new NotFoundException('Rôle non trouvé');
    }

    // Ici vous pourriez appeler un service pour récupérer les utilisateurs du rôle
    // Pour l'instant, on retourne des données simulées
    const users = [
      {
        id: 1,
        firstname: 'Jean',
        lastname: 'Dupont',
        email: 'jean.dupont@test.com',
        status: 'ACTIVE'
      }
    ];

    return {
      message: `Utilisateurs du rôle "${role.libelle}" récupérés avec succès`,
      users
    };
  }

  // Obtenir les permissions d'un rôle
  @Get(':id/permissions')
  async getRolePermissions(@Param('id', ParseIntPipe) id: number): Promise<{ message: string; permissions: string[] }> {
    const role = await this.roleService.findOne(id);
    if (!role) {
      throw new NotFoundException('Rôle non trouvé');
    }

    // Ici vous pourriez appeler un service pour récupérer les permissions du rôle
    // Pour l'instant, on retourne des données simulées basées sur le type de rôle
    let permissions: string[] = [];
    
    switch (role.libelle) {
      case 'ADMIN':
        permissions = ['READ_USERS', 'CREATE_USER', 'UPDATE_USER', 'DELETE_USER', 'READ_ROLES', 'MANAGE_ROLES'];
        break;
      case 'MANAGER':
        permissions = ['READ_USERS', 'CREATE_USER', 'UPDATE_USER', 'READ_ROLES'];
        break;
      case 'AGENT':
        permissions = ['READ_USERS', 'READ_ROLES'];
        break;
      case 'USER':
        permissions = ['READ_USERS', 'READ_ROLES'];
        break;
      default:
        permissions = ['READ_USERS'];
    }

    return {
      message: `Permissions du rôle "${role.libelle}" récupérées avec succès`,
      permissions
    };
  }

  // Obtenir les statistiques des rôles
  @Get('statistics/overview')
  async getRoleStatistics(): Promise<{ message: string; statistics: any }> {
    const roles = await this.roleService.findAll();
    
    // Ici vous pourriez appeler des services pour récupérer des statistiques réelles
    // Pour l'instant, on retourne des données simulées
    const statistics = {
      totalRoles: roles.length,
      rolesByType: {
        'Administrateur': 1,
        'Manager': 2,
        'Utilisateur': 5
      },
      mostUsedRole: 'Utilisateur',
      leastUsedRole: 'Administrateur'
    };

    return {
      message: 'Statistiques des rôles récupérées avec succès',
      statistics
    };
  }
}

import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query, UseGuards, UseInterceptors, NotFoundException, Req, Res, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { UserService } from '../service/user.service';
import { User } from '../entity/user.entity';
import { CreateUserDto, UpdateUserDto } from '../dto';
import { UserAuthGuard, RequireUserPermissions, UserPermission } from '../guards/user-auth.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UserAuthInterceptor } from '../interceptors/user-auth.interceptor';
import { ResponseTransformInterceptor } from '../interceptors/response-transform.interceptor';
import { PdfService } from '../../../services/pdf.service';

@Controller('users')
@UseGuards(JwtAuthGuard, UserAuthGuard)
@UseInterceptors(UserAuthInterceptor, ResponseTransformInterceptor)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly pdfService: PdfService
  ) {}

  // Fonction utilitaire pour filtrer les champs sensibles
  private filterSensitiveFields(user: User): any {
    const { password, salt, smsToken, smsTokenExpires, twoFactorSecret, ...safeUser } = user;
    return safeUser;
  }

  private filterSensitiveFieldsArray(users: User[]): any[] {
    return users.map(user => this.filterSensitiveFields(user));
  }

  @Get()
  @RequireUserPermissions(UserPermission.READ_USERS)
  // Liste des utilisateurs
  async findAll(
    @Req() request: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string
  ): Promise<{ 
    message: string; 
    users: any[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const user = request['user'];
    if (!user) {
      throw new NotFoundException('Utilisateur non authentifié');
    }

    // Paramètres de pagination avec valeurs par défaut
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    console.log('🔍 UserController.findAll - Utilisateur connecté:', {
      id: user.id,
      idRole: user.idRole,
      idAgency: user.idAgency,
      email: user.email,
      page: pageNum,
      limit: limitNum,
      search
    });

    // Récupérer les utilisateurs selon le rôle et l'agence avec pagination
    const result = await this.userService.findAll(user.idRole, user.idAgency, pageNum, limitNum, search);
    
    console.log(`📋 Utilisateurs récupérés: ${result.users.length} sur ${result.total} (page ${result.page}/${result.totalPages})`);
    
    return {
      message: 'Liste des utilisateurs récupérée avec succès',
      users: this.filterSensitiveFieldsArray(result.users),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      }
    };
  }  @Get('export/pdf')
  @RequireUserPermissions(UserPermission.READ_USERS)
  async exportToPdf(
    @Req() request: Request,
    @Res() res: Response,
    @Query('search') search?: string
  ): Promise<void> {
    const user = request['user'];
    if (!user) {
      res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Utilisateur non authentifié' });
      return;
    }

    try {
      // Fetch users using a high limit to get all of them matching the search/agency/role
      const result = await this.userService.findAll(user.idRole, user.idAgency, 1, 1000, search);
      const safeUsers = this.filterSensitiveFieldsArray(result.users);

      const testData = {
        users: safeUsers,
        generatedAt: new Date().toLocaleDateString('fr-FR'),
        generatedTime: new Date().toLocaleTimeString('fr-FR'),
        generatedBy: `${user.firstname} ${user.lastname}`
      };

      // Generate the PDF from EJS template 'users-export'
      const pdfBuffer = await this.pdfService.generatePdfFromTemplate('users-export', testData);

      // Configure headers for PDF download
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="liste_utilisateurs.pdf"',
        'Content-Length': pdfBuffer.length.toString(),
      });

      res.send(pdfBuffer);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF des utilisateurs:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Erreur lors de la génération du PDF des utilisateurs',
        error: error.message
      });
    }
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeRole') includeRole?: string,
    @Query('includeAgency') includeAgency?: string,
    @Query('includePermissions') includePermissions?: string
  ): Promise<{ message: string; user: any }> {
    const user = await this.userService.findOne(id, {
      includeRole: includeRole === 'true',
      includeAgency: includeAgency === 'true',
      includePermissions: includePermissions === 'true'
    });
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    
    return {
      message: 'Utilisateur récupéré avec succès',
      user: this.filterSensitiveFields(user)
    };
  }

  @Get('search/email')
  async findByEmail(@Query('email') email: string): Promise<{ message: string; user: User }> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Aucun utilisateur trouvé avec cet email');
    }
    return {
      message: 'Utilisateur trouvé par email',
      user
    };
  }

  @Get('role/:idRole')
  async findByRole(@Param('idRole', ParseIntPipe) idRole: number): Promise<{ message: string; users: User[] }> {
    const users = await this.userService.findByRole(idRole);
    return {
      message: `Utilisateurs du rôle ${idRole} récupérés avec succès`,
      users
    };
  }

  @Get('agency/:idAgency')
  async findByAgency(@Param('idAgency', ParseIntPipe) idAgency: number): Promise<{ message: string; users: User[] }> {
    const users = await this.userService.findByAgency(idAgency);
    return {
      message: `Utilisateurs de l'agence ${idAgency} récupérés avec succès`,
      users
    };
  }

  @Post()
  @RequireUserPermissions(UserPermission.CREATE_USER)
  async create(@Body() userData: CreateUserDto): Promise<{ message: string; user: User }> {
    const user = await this.userService.create(userData);
    return {
      message: 'Utilisateur créé avec succès',
      user
    };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() userData: UpdateUserDto,
  ): Promise<{ message: string; user: User }> {
    const user = await this.userService.update(id, userData);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    return {
      message: 'Utilisateur mis à jour avec succès',
      user
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    await this.userService.remove(id);
    return {
      message: 'Utilisateur supprimé avec succès'
    };
  }

  // Routes personnalisées
  @Get('quelqueschoses')
  async getQuelquesChoses(): Promise<{ message: string }> {
    return { message: 'Route personnalisée /api/users/quelqueschoses' };
  }

  @Get('statistics')
  async getUserStatistics(): Promise<{ totalUsers: number; activeUsers: number; newUsersThisMonth: number }> {
    return { 
      totalUsers: 150,
      activeUsers: 120,
      newUsersThisMonth: 25
    };
  }

  @Get('profile/:id/avatar')
  async getUserAvatar(@Param('id', ParseIntPipe) id: number): Promise<{ userId: number; avatarUrl: string }> {
    return { userId: id, avatarUrl: `/avatars/user-${id}.jpg` };
  }

  @Post('bulk-create')
  async createMultipleUsers(@Body() usersData: CreateUserDto[]): Promise<{ message: string; users: User[] }> {
    // Logique pour créer plusieurs utilisateurs
    const users = await this.userService.createMultiple(usersData);
    return {
      message: `${users.length} utilisateurs créés avec succès`,
      users
    };
  }

  @Put('status/bulk')
  async updateMultipleStatus(@Body() updates: { ids: number[], status: string }): Promise<{ message: string; count: number }> {
    // Logique pour mettre à jour le statut de plusieurs utilisateurs
    const formattedUpdates = updates.ids.map(id => ({ id, status: updates.status }));
    await this.userService.updateMultipleStatus(formattedUpdates);
    return { message: `Statut de ${updates.ids.length} utilisateurs mis à jour avec succès`, count: updates.ids.length };
  }
}

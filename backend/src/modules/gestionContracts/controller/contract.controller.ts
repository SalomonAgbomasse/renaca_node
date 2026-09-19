import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query, UseGuards, UseInterceptors, Req, NotFoundException, UnauthorizedException, ForbiddenException, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ContractService } from '../service/contract.service';
import { CotationService } from '../service/cotation.service';
import { ContractStateService } from '../service/contract-state.service';
import { ContractHistoryService } from '../service/contract-history.service';
import { Contract } from '../entity/contract.entity';
import { ContractState } from '../entity/contract-state.entity';
import { CreateContractDto, CreateCustomerDto, UpdateContractDto } from '../dto';
import { ContractAuthGuard, RequirePermissions, ContractPermission } from '../guards/contract-auth.guard';
import { AuthInterceptor } from '../interceptors/auth.interceptor';
import { ResponseTransformInterceptor } from '../interceptors/response-transform.interceptor';
import { AuditService } from '../service/audit.service';
import { JwtAuthGuard } from '../../gestionUsers/guards/jwt-auth.guard';
import { PdfService } from '../../../services/pdf.service';
import { ExcelService } from '../../../services/excel.service';
import { Res, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ContractType } from '../enums/contract-type.enum';

@Controller('contracts')
@UseGuards(JwtAuthGuard, ContractAuthGuard)
@UseInterceptors(AuthInterceptor, ResponseTransformInterceptor)
export class ContractController {
  constructor(
    private readonly contractService: ContractService,
    private readonly cotationService: CotationService,
    private readonly contractStateService: ContractStateService,
    private readonly auditService: AuditService,
    private readonly pdfService: PdfService,
    private readonly excelService: ExcelService,
    private readonly contractHistoryService: ContractHistoryService
  ) {
    console.log('🏗️ ContractController instancié');
  }

  private isUserAdminOrManager(user: any): boolean {
    if (!user) return false;
    if (user.idRole === 1 || user.idRole === 2 || user.idRole === 5) return true;
    const userRole = (user.role?.libelle || user.role || '').toString().toUpperCase();
    return ['ADMIN', 'MANAGER', 'SUPERADMIN', 'SUPER ADMIN', 'SUPER_ADMIN'].includes(userRole);
  }

    /**
     * Conversion d'une cotation PADME en contrat
     * Payload attendu : { idCotation, nom, prenoms, typeClient, etablissement }
     */
    @Post('from-cotation')
    @RequirePermissions(ContractPermission.CREATE)
    async convertFromCotation(@Body() body: any, @Req() request: Request): Promise<{ success: boolean; message: string; contract?: Contract }> {
      try {
        const user = request['user'];
        if (!user) {
          throw new UnauthorizedException('Utilisateur non authentifié');
        }
        const { idCotation, nom, prenoms, typeClient, etablissement } = body;
        if (!idCotation) {
          return { success: false, message: 'ID cotation manquant' };
        }
        // Récupérer la cotation
        const cotation = await this.cotationService.findOne(idCotation);
        if (!cotation) {
          return { success: false, message: 'Cotation introuvable' };
        }
        // Vérifier si déjà convertie (contrat existant avec même référence)
        const existingContract = await this.contractService.findByReference(cotation.reference);
        if (existingContract && existingContract.length > 0) {
          return { success: false, message: 'Cette cotation a déjà été convertie en contrat.' };
        }
        // Créer le contrat à partir de la cotation
        const contract = await this.contractService.convertCotationToContract(cotation, {
          nom,
          prenoms,
          typeClient,
          etablissement,
          idUser: user.id,
          idAgency: user.idAgency
        });
        return { success: true, message: 'Contrat créé avec succès', contract };
      } catch (error) {
        console.error('❌ Erreur dans convertFromCotation:', error);
        return { success: false, message: error.message || 'Erreur lors de la conversion de la cotation en contrat' };
      }
    }

  @Post()
  @RequirePermissions(ContractPermission.CREATE)
  async create(@Body() body: any, @Req() request: Request): Promise<{ success: boolean; message: string; contract?: Contract }> {
    try {
      console.log('📥 Données reçues pour création de contrat:', JSON.stringify(body, null, 2));
      
      // Extraire contractData et clientData du body
      const { clientData, ...contractData } = body;
      
      console.log('📋 contractData extrait:', JSON.stringify(contractData, null, 2));
      console.log('👤 clientData extrait:', JSON.stringify(clientData, null, 2));
      
      // L'utilisateur est déjà injecté par AuthInterceptor
      const user = request['user'];
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }
      if(!contractData.idNatureCredit) {
        return {
          success: false,
          message: 'Veuillez choisir une nature de crédit'
        };
      }
      if(!contractData.capital) {
        return {
          success: false,
          message: 'Le capital est obligatoire'
        };
      }
      if(!contractData.duration) {
        return {
          success: false,
          message: 'La durée est obligatoire'
        };
      }
      
      if(!clientData?.birthdate) {
        return {
          success: false,
          message: 'La date de naissance est obligatoire'
        };
      }

      // numCustomer n'est pas obligatoire pour la création (peut être généré automatiquement)
      // On vérifie seulement s'il est fourni
      
      // Ajouter automatiquement les champs d'audit et l'utilisateur
      const auditFields = this.auditService.prepareCreateWithUser(request, user.id);
      const enrichedData = { 
        ...contractData, 
        ...auditFields,
        idUser: user.id,
        idAgency: user.idAgency,
        idProduct: 1,
        idContractState: 1,
        contractType: ContractType.STANDARD // Étiqueter comme contrat standard
      };

      clientData.idUser = user.id;
      
      const contract = await this.contractService.create({ ...enrichedData, clientData });
      
      if (!contract) {
        return {
          success: false,
          message: 'Erreur lors de la création du contrat'
        };
      }
      
      return {
        success: true,
        message: `Contrat "${contract.reference}" créé avec succès`,
        contract
      };
    } catch (error) {
      console.error('❌ Erreur dans ContractController.create:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la création du contrat'
      };
    }
  }

  // Création spécifique PADME (utilise primePADME et differe/idPeriodicite)
  @Post('padme')
  @RequirePermissions(ContractPermission.CREATE)
  async createPadme(@Body() contractData: any, @Body('clientData') clientData: any, @Req() request: Request): Promise<{ success: boolean; message: string; contract?: Contract; primeData?: any }> {
    try {
      const user = (request as any).user;
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      // Vérifications minimales
      if (!contractData.capital) return { success: false, message: 'Le capital est obligatoire' };
      if (!contractData.duration) return { success: false, message: 'La durée est obligatoire' };
      if (!clientData?.birthdate) return { success: false, message: 'La date de naissance est obligatoire' };

      // Enrichissement base
      contractData.idUser = user.id;
      contractData.idAgency = user.idAgency;
      contractData.idProduct = 1;
      contractData.idContractState = 1;
      contractData.differe = contractData.differe || 0;
      contractData.idPeriodicite = contractData.idPeriodicite || 1;
      contractData.dateEff = contractData.dateEff || new Date().toISOString();
      contractData.idNatureCredit = 1; // Amortissable par défaut
      if (contractData.creditType) {
        if (contractData.creditType === 'CP') {
          contractData.idNatureCredit = 2;
        } else if (contractData.creditType === 'OBA') {
          contractData.idNatureCredit = 3;
        }
      }

      // Appel service
      const contract = await this.contractService.createPadmeContract({ ...contractData, clientData });

      return {
        success: true,
        message: `Contrat PADME "${contract.reference}" créé avec succès`,
        contract,
        primeData: {
          pd: contract.pd,
          pc: contract.pc,
          surp: contract.surp,
          acc: contract.acc,
          fm: contract.fm,
          puttc: contract.puttc
        }
      };
    } catch (error) {
      return { success: false, message: error.message || 'Erreur création contrat PADME' };
    }
  }

  
  @Post('hors-convention')
  @RequirePermissions(ContractPermission.CREATE)
  async createHorsConvention(@Body() contractData: CreateContractDto, @Req() request: Request): Promise<{ success: boolean; message: string; contract?: Contract }> {
    try {
      // L'utilisateur est déjà injecté par AuthInterceptor
      const user = request['user'];
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }
      
      // Ajouter automatiquement les champs d'audit et l'utilisateur
      const auditFields = this.auditService.prepareCreateWithUser(request, user.id);
      const enrichedData = { 
        ...contractData, 
        ...auditFields,
        idUser: user.id,
        idAgency: user.idAgency,
        idProduct: 1,
        idContractState: 1,
        contractType: ContractType.HORS_CONVENTION // Étiqueter comme contrat hors convention
      };

      // Pour les contrats hors convention, on n'a besoin que de l'ID du client
      // Pas besoin de clientData complet
      const contract = await this.contractService.createHorsConvention(enrichedData);
      
      if (!contract) {
        return {
          success: false,
          message: 'Erreur lors de la création du contrat'
        };
      }
      
      return {
        success: true,
        message: `Contrat "${contract.reference}" créé avec succès`,
        contract
      };
    } catch (error) {
      console.error('❌ Erreur dans ContractController.create:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la création du contrat'
      };
    }
  }

  @Post('hors-convention-with-customer')
  @RequirePermissions(ContractPermission.CREATE)
  async createHorsConventionWithCustomer(
    @Body() body: any, 
    @Req() request: Request
  ): Promise<{ success: boolean; message: string; contract?: Contract; customer?: any }> {
    try {
      // L'utilisateur est déjà injecté par AuthInterceptor
      const user = request['user'];
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      // Extraire les données du contrat et du client
      const { clientData, ...contractData } = body;

      // Vérifications minimales
      if (!contractData.capital) {
        return { success: false, message: 'Le capital est obligatoire' };
      }
      if (!contractData.duration) {
        return { success: false, message: 'La durée est obligatoire' };
      }
      if (!clientData) {
        return { success: false, message: 'Les données du client sont obligatoires' };
      }

      // Ajouter automatiquement les champs d'audit et l'utilisateur
      const auditFields = this.auditService.prepareCreateWithUser(request, user.id);
      const enrichedData = { 
        ...contractData, 
        ...auditFields,
        idUser: user.id,
        idAgency: user.idAgency,
        idProduct: 1,
        idContractState: 1,
        contractType: ContractType.HORS_CONVENTION,
        clientData: clientData
      };

      // Créer le contrat hors convention avec création du client si nécessaire
      const contract = await this.contractService.createHorsConventionWithCustomer(enrichedData);
      
      if (!contract) {
        return {
          success: false,
          message: 'Erreur lors de la création du contrat'
        };
      }

      // Récupérer le client créé ou existant via le service de contrat qui a accès au customerService
      // Note: Le customer est déjà chargé dans la relation du contrat
      const customer = contract.customer || null;
      
      return {
        success: true,
        message: `Client et contrat "${contract.reference}" créés avec succès`,
        contract,
        customer
      };
    } catch (error) {
      console.error('❌ Erreur dans ContractController.createHorsConventionWithCustomer:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la création du client et du contrat'
      };
    }
  }

  @Post('import')
  @RequirePermissions(ContractPermission.CREATE)
  async importContracts(
    @Body() importData: { contracts: Array<CreateContractDto & { clientData?: CreateCustomerDto }> },
    @Req() request: Request
  ): Promise<{ 
    success: boolean; 
    message: string; 
    results?: Array<{
      index: number;
      success: boolean;
      contract?: Contract;
      error?: string;
    }>;
    summary?: {
      total: number;
      success: number;
      failed: number;
    };
  }> {
    console.log('🚀 ===== DÉBUT IMPORT CONTRATS =====');
    console.log('🔍 ImportData:', importData);
    console.log('📥 Requête reçue:', {
      timestamp: new Date().toISOString(),
      bodyKeys: Object.keys(importData),
      contractsCount: importData?.contracts?.length || 0
    });
    
    try {
      // L'utilisateur est déjà injecté par AuthInterceptor
      const user = request['user'];
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      if (!importData.contracts || !Array.isArray(importData.contracts) || importData.contracts.length === 0) {
        return {
          success: false,
          message: 'Aucun contrat à importer'
        };
      }

      console.log(`📥 Import de ${importData.contracts.length} contrats pour l'utilisateur ${user.id}`);
      console.log('📋 Données reçues dans le contrôleur:', {
        totalContracts: importData.contracts.length,
        user: { id: user.id, idAgency: user.idAgency },
        firstContract: importData.contracts[0]
      });

      // Préparer les données d'audit
      const auditFields = this.auditService.prepareCreateWithUser(request, user.id);
      console.log('🔧 Champs d\'audit préparés:', auditFields);
      
      // Enrichir chaque contrat avec les champs d'audit
      const enrichedContracts = importData.contracts.map(contractData => ({
        ...contractData,
        ...auditFields
      }));
      console.log('🔧 Contrats enrichis:', {
        total: enrichedContracts.length,
        firstEnriched: enrichedContracts[0]
      });

      // Appeler le service d'import
      console.log('🚀 Appel du service d\'import...');
      const result = await this.contractService.importContracts(
        enrichedContracts,
        user.id,
        user.idAgency
      );
      console.log('✅ Résultat du service d\'import:', result);

      const finalResponse = {
        success: result.success,
        message: result.message,
        results: result.results,
        summary: result.summary
      };
      
      console.log('📤 Réponse finale envoyée au frontend:', finalResponse);
      console.log('✅ ===== FIN IMPORT CONTRATS =====');
      return finalResponse;

    } catch (error) {
      console.error('❌ Erreur dans ContractController.importContracts:', error);
      console.error('❌ ===== FIN IMPORT CONTRATS (ERREUR) =====');
      return {
        success: false,
        message: error.message || 'Erreur lors de l\'import des contrats'
      };
    }
  }

  @Get()
  @RequirePermissions(ContractPermission.READ)
  async findAll(
    @Req() request: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('lastname') lastname?: string,
    @Query('firstname') firstname?: string,
    @Query('phone') phone?: string,
    @Query('email') email?: string,
    @Query('typeCustomer') typeCustomer?: string,
    @Query('police') police?: string,
    @Query('reference') reference?: string,
    @Query('capital') capital?: string,
    @Query('duration') duration?: string,
    @Query('natureCredit') natureCredit?: string,
    @Query('dateEff') dateEff?: string,
    @Query('dateEch1') dateEch1?: string,
    @Query('dateEch') dateEch?: string,
    @Query('gestionnaireFirstname') gestionnaireFirstname?: string,
    @Query('gestionnaireLastname') gestionnaireLastname?: string,
    @Query('etablissement') etablissement?: string,
    @Query('my') my?: string
  ): Promise<{ 
    message: string; 
    contracts: Contract[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    // Récupérer l'utilisateur connecté depuis la requête
    const user = request['user'];
    if (!user) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }

    // Paramètres de pagination avec valeurs par défaut
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    // Construire l'objet de filtres
    const filters: any = {};
    if (search) filters.search = search;
    if (lastname) filters.lastname = lastname;
    if (firstname) filters.firstname = firstname;
    if (phone) filters.phone = phone;
    if (email) filters.email = email;
    if (typeCustomer) filters.typeCustomer = typeCustomer;
    if (police) filters.police = police;
    if (reference) filters.reference = reference;
    if (capital) filters.capital = capital;
    if (duration) filters.duration = duration;
    if (natureCredit) filters.natureCredit = natureCredit;
    if (dateEff) filters.dateEff = dateEff;
    if (dateEch1) filters.dateEch1 = dateEch1;
    if (dateEch) filters.dateEch = dateEch;
    if (gestionnaireFirstname) filters.gestionnaireFirstname = gestionnaireFirstname;
    if (gestionnaireLastname) filters.gestionnaireLastname = gestionnaireLastname;
    if (etablissement) filters.etablissement = etablissement;
    if (my === '1' || my === 'true') filters.idUser = user.id;

    console.log('🔍 Utilisateur connecté:', {
      id: user.id,
      role: user.role,
      idRole: user.idRole,
      idAgency: user.idAgency,
      email: user.email,
      page: pageNum,
      limit: limitNum,
      filters
    });

    // Récupérer les contrats selon le rôle de l'utilisateur avec pagination et filtres
    const result = await this.contractService.findAllByUserRole(
      user.id, 
      user.idRole, 
      user.idAgency,
      pageNum,
      limitNum,
      Object.keys(filters).length > 0 ? filters : undefined
    );
    
    console.log(`📋 Contrats récupérés: ${result.contracts.length} sur ${result.total} (page ${result.page}/${result.totalPages})`);
    
    return {
      message: `Liste des ${result.contracts.length} contrats récupérée avec succès`,
      contracts: result.contracts,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      }
    };
  }

  @Get('hors-convention')
  @RequirePermissions(ContractPermission.READ)
  async findHorsConvention(
    @Req() request: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('lastname') lastname?: string,
    @Query('firstname') firstname?: string,
    @Query('phone') phone?: string,
    @Query('email') email?: string,
    @Query('typeCustomer') typeCustomer?: string,
    @Query('police') police?: string,
    @Query('reference') reference?: string,
    @Query('capital') capital?: string,
    @Query('duration') duration?: string,
    @Query('natureCredit') natureCredit?: string,
    @Query('dateEff') dateEff?: string,
    @Query('dateEch1') dateEch1?: string,
    @Query('dateEch') dateEch?: string,
    @Query('gestionnaireFirstname') gestionnaireFirstname?: string,
    @Query('gestionnaireLastname') gestionnaireLastname?: string,
    @Query('etablissement') etablissement?: string
  ): Promise<{ 
    message: string; 
    contracts: Contract[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    // Récupérer l'utilisateur connecté depuis la requête
    const user = request['user'];
    if (!user) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }

    // Paramètres de pagination avec valeurs par défaut
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    // Construire l'objet de filtres
    const filters: any = {};
    if (search) filters.search = search;
    if (lastname) filters.lastname = lastname;
    if (firstname) filters.firstname = firstname;
    if (phone) filters.phone = phone;
    if (email) filters.email = email;
    if (typeCustomer) filters.typeCustomer = typeCustomer;
    if (police) filters.police = police;
    if (reference) filters.reference = reference;
    if (capital) filters.capital = capital;
    if (duration) filters.duration = duration;
    if (natureCredit) filters.natureCredit = natureCredit;
    if (dateEff) filters.dateEff = dateEff;
    if (dateEch1) filters.dateEch1 = dateEch1;
    if (dateEch) filters.dateEch = dateEch;
    if (gestionnaireFirstname) filters.gestionnaireFirstname = gestionnaireFirstname;
    if (gestionnaireLastname) filters.gestionnaireLastname = gestionnaireLastname;
    if (etablissement) filters.etablissement = etablissement;

    console.log('🔍 Récupération des contrats hors convention:', {
      id: user.id,
      role: user.role,
      idRole: user.idRole,
      idAgency: user.idAgency,
      email: user.email,
      page: pageNum,
      limit: limitNum,
      filters
    });

    // Récupérer les contrats hors convention selon le rôle et l'agence avec pagination et filtres
    const result = await this.contractService.findAllHorsConvention(
      user.idRole, 
      user.idAgency,
      pageNum,
      limitNum,
      Object.keys(filters).length > 0 ? filters : undefined
    );
    
    console.log(`📋 Contrats hors convention récupérés: ${result.contracts.length} sur ${result.total} (page ${result.page}/${result.totalPages})`);
    
    return {
      message: `Liste des ${result.contracts.length} contrats hors convention récupérée avec succès`,
      contracts: result.contracts,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      }
    };
  }

  @Get('echus')
  @RequirePermissions(ContractPermission.READ)
  async findEchus(
    @Req() request: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('lastname') lastname?: string,
    @Query('firstname') firstname?: string,
    @Query('phone') phone?: string,
    @Query('email') email?: string,
    @Query('typeCustomer') typeCustomer?: string,
    @Query('police') police?: string,
    @Query('reference') reference?: string,
    @Query('capital') capital?: string,
    @Query('duration') duration?: string,
    @Query('natureCredit') natureCredit?: string,
    @Query('dateEff') dateEff?: string,
    @Query('dateEch1') dateEch1?: string,
    @Query('dateEch') dateEch?: string,
    @Query('gestionnaireFirstname') gestionnaireFirstname?: string,
    @Query('gestionnaireLastname') gestionnaireLastname?: string,
    @Query('etablissement') etablissement?: string
  ): Promise<{ 
    message: string; 
    contracts: Contract[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    // Récupérer l'utilisateur connecté depuis la requête
    const user = request['user'];
    if (!user) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }

    // Paramètres de pagination avec valeurs par défaut
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    // Construire l'objet de filtres
    const filters: any = {};
    if (search) filters.search = search;
    if (lastname) filters.lastname = lastname;
    if (firstname) filters.firstname = firstname;
    if (phone) filters.phone = phone;
    if (email) filters.email = email;
    if (typeCustomer) filters.typeCustomer = typeCustomer;
    if (police) filters.police = police;
    if (reference) filters.reference = reference;
    if (capital) filters.capital = capital;
    if (duration) filters.duration = duration;
    if (natureCredit) filters.natureCredit = natureCredit;
    if (dateEff) filters.dateEff = dateEff;
    if (dateEch1) filters.dateEch1 = dateEch1;
    if (dateEch) filters.dateEch = dateEch;
    if (gestionnaireFirstname) filters.gestionnaireFirstname = gestionnaireFirstname;
    if (gestionnaireLastname) filters.gestionnaireLastname = gestionnaireLastname;
    if (etablissement) filters.etablissement = etablissement;

    console.log('🔍 Récupération des contrats échus:', {
      id: user.id,
      role: user.role,
      idRole: user.idRole,
      idAgency: user.idAgency,
      email: user.email,
      page: pageNum,
      limit: limitNum,
      filters
    });

    // Récupérer les contrats échus selon le rôle et l'agence avec pagination et filtres
    const result = await this.contractService.findAllEchus(
      user.idRole, 
      user.idAgency,
      pageNum,
      limitNum,
      Object.keys(filters).length > 0 ? filters : undefined
    );
    
    console.log(`📋 Contrats échus récupérés: ${result.contracts.length} sur ${result.total} (page ${result.page}/${result.totalPages})`);
    
    return {
      message: `Liste des ${result.contracts.length} contrats échus récupérée avec succès`,
      contracts: result.contracts,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      }
    };
  }

  @Get('states')
  @RequirePermissions(ContractPermission.READ)
  async getContractStates(): Promise<{ message: string; contractStates: ContractState[] }> {
    try {
      const contractStates = await this.contractStateService.findAll();
      return {
        message: `Liste des ${contractStates.length} états de contrats récupérée avec succès`,
        contractStates
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des états de contrats:', error);
      throw error;
    }
  }

  @Get(':id')
  @RequirePermissions(ContractPermission.READ)
  async findOne(
    @Param('id') id: string,
    @Req() request: any
  ): Promise<{ message: string; contract: Contract }> {
    const contract = await this.contractService.findOneWithRelations(id);
    if (!contract) {
      throw new NotFoundException('Contrat non trouvé');
    }
    const user = request.user || request['user'];
    if (!user) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    if (!this.isUserAdminOrManager(user) && contract.idAgency !== user.idAgency) {
      throw new ForbiddenException('Vous n\'êtes pas autorisé à consulter ce contrat');
    }
    return {
      message: `Contrat "${contract.reference}" récupéré avec succès`,
      contract
    };
  }

  @Get('customer/:idCustomer')
  @RequirePermissions(ContractPermission.READ)
  async findByCustomer(
    @Param('idCustomer', ParseIntPipe) idCustomer: number,
    @Req() request: any
  ): Promise<{ message: string; contracts: Contract[] }> {
    const user = request.user || request['user'];
    if (!user) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    const contracts = await this.contractService.findByCustomer(idCustomer);
    const filteredContracts = this.isUserAdminOrManager(user)
      ? contracts 
      : contracts.filter(c => c.idAgency === user.idAgency);
    return {
      message: `${filteredContracts.length} contrat(s) trouvé(s) pour le client ${idCustomer}`,
      contracts: filteredContracts
    };
  }

  @Get('user/:idUser')
  @RequirePermissions(ContractPermission.READ)
  async findByUser(
    @Param('idUser', ParseIntPipe) idUser: number,
    @Req() request: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('includeCustomer') includeCustomer?: string,
    @Query('includeAgency') includeAgency?: string,
    @Query('includeProduct') includeProduct?: string
  ): Promise<{ message: string; contracts: Contract[]; total: number; page: number; limit: number; totalPages: number }> {
    const user = request.user || request['user'];
    if (!user) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    if (!this.isUserAdminOrManager(user) && idUser !== user.id) {
      throw new ForbiddenException('Vous n\'êtes pas autorisé à consulter les contrats de cet utilisateur');
    }
    const result = await this.contractService.findByUserWithPagination(idUser, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      includeCustomer: includeCustomer === 'true',
      includeAgency: includeAgency === 'true',
      includeProduct: includeProduct === 'true'
    });
    return {
      message: `${result.contracts.length} contrat(s) trouvé(s) pour l'utilisateur ${idUser}`,
      contracts: result.contracts,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    };
  }

  @Get('agency/:idAgency')
  @RequirePermissions(ContractPermission.READ)
  async findByAgency(
    @Param('idAgency', ParseIntPipe) idAgency: number,
    @Req() request: any
  ): Promise<{ message: string; contracts: Contract[] }> {
    const user = request.user || request['user'];
    if (!user) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    if (!this.isUserAdminOrManager(user) && idAgency !== user.idAgency) {
      throw new ForbiddenException('Vous n\'êtes pas autorisé à consulter les contrats de cette agence');
    }
    const contracts = await this.contractService.findByAgency(idAgency);
    return {
      message: `${contracts.length} contrat(s) trouvé(s) pour l'agence ${idAgency}`,
      contracts
    };
  }

  @Get('search/reference')
  @RequirePermissions(ContractPermission.READ)
  async findByReference(
    @Query('reference') reference: string,
    @Req() request: any
  ): Promise<{ message: string; contracts: Contract[] }> {
    const user = request.user || request['user'];
    if (!user) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    const contracts = await this.contractService.findByReference(reference);
    const filteredContracts = this.isUserAdminOrManager(user)
      ? contracts 
      : contracts.filter(c => c.idAgency === user.idAgency);
    return {
      message: `${filteredContracts.length} contrat(s) trouvé(s) pour la référence "${reference}"`,
      contracts: filteredContracts
    };
  }



  @Put('admin/:id')
  @RequirePermissions(ContractPermission.UPDATE)
  async adminUpdate(
    @Param('id') id: string,
    @Body() contractData: any,
    @Req() request: any,
  ): Promise<{ message: string; contract: Contract }> {
    const user = request.user || request['user'];
    if (!user) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    if (user.idRole !== 1 && user.idRole !== 5) {
      throw new ForbiddenException('Seuls les administrateurs peuvent effectuer cette action');
    }
    const ipAddress = this.getClientIp(request);
    const userAgent = request.headers['user-agent'] || undefined;
    const currentUserId = user.id || user.userId || user.sub || user.idUser;

    // Utilise adminUpdate() qui bypass les validations métier CP/OBA
    const contract = await this.contractService.adminUpdate(id, contractData, ipAddress, userAgent, currentUserId);
    if (!contract) {
      throw new NotFoundException('Contrat non trouvé');
    }
    return {
      message: `Contrat (Admin) "${contract.reference}" mis à jour avec succès`,
      contract
    };
  }


  @Put(':id')
  @RequirePermissions(ContractPermission.UPDATE)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() contractData: UpdateContractDto & { clientData?: any },
    @Req() request: any,
  ): Promise<{ message: string; contract: Contract }> {
    const user = request.user || request['user'];
    if (!user) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    const contractObj = await this.contractService.findOne(id);
    if (!contractObj) {
      throw new NotFoundException('Contrat non trouvé');
    }
    if (user.idRole !== 1 && contractObj.idAgency !== user.idAgency) {
      throw new ForbiddenException('Vous n\'êtes pas autorisé à modifier ce contrat');
    }

    const ipAddress = this.getClientIp(request);
    const userAgent = request.headers['user-agent'] || undefined;
    const currentUserId = user.id || user.userId || user.sub || user.idUser;

    const contract = await this.contractService.update(id, contractData, ipAddress, userAgent, currentUserId);
    if (!contract) {
      throw new NotFoundException('Contrat non trouvé');
    }
    return {
      message: `Contrat "${contract.reference}" mis à jour avec succès`,
      contract
    };
  }

  /**
   * Obtenir l'adresse IP réelle du client
   */
  private getClientIp(request: any): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
      const ip = ips.trim();
      if (ip && ip !== '::1') {
        return ip;
      }
    }

    const remoteAddress = request.socket.remoteAddress;
    if (remoteAddress && remoteAddress !== '::1' && remoteAddress !== '127.0.0.1') {
      return remoteAddress;
    }

    // Si c'est localhost IPv6, convertir en IPv4 ou utiliser l'IP réseau locale
    if (remoteAddress === '::1') {
      const localIp = this.getLocalNetworkIp();
      return localIp ? `${localIp} (localhost)` : '127.0.0.1 (localhost)';
    }

    return remoteAddress || '127.0.0.1 (localhost)';
  }

  /**
   * Obtenir l'IP réseau locale de la machine
   */
  private getLocalNetworkIp(): string | null {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        // Ignorer les interfaces internes et non-IPv4
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
    
    return null;
  }

  @Put(':id/state')
  @RequirePermissions(ContractPermission.UPDATE)
  async updateContractState(
    @Param('id', ParseIntPipe) id: number,
    @Body('idContractState', ParseIntPipe) idContractState: number,
    @Req() request: any,
  ): Promise<{ message: string; contract: Contract }> {
    const user = request.user || request['user'];
    if (!user) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    const contractObj = await this.contractService.findOne(id);
    if (!contractObj) {
      throw new NotFoundException('Contrat non trouvé');
    }
    if (user.idRole !== 1 && contractObj.idAgency !== user.idAgency) {
      throw new ForbiddenException('Vous n\'êtes pas autorisé à modifier ce contrat');
    }

    const contract = await this.contractService.updateContractState(id, idContractState);
    if (!contract) {
      throw new NotFoundException('Contrat non trouvé');
    }
    return {
      message: `État du contrat "${contract.reference}" mis à jour avec succès`,
      contract
    };
  }

  @Delete(':id')
  @RequirePermissions(ContractPermission.DELETE)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: any,
  ): Promise<{ message: string; contractId: number }> {
    const user = request.user || request['user'];
    if (!user) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    const contract = await this.contractService.findOne(id);
    if (!contract) {
      throw new NotFoundException('Contrat non trouvé');
    }
    if (user.idRole !== 1 && contract.idAgency !== user.idAgency) {
      throw new ForbiddenException('Vous n\'êtes pas autorisé à supprimer ce contrat');
    }
    
    await this.contractService.remove(id);
    return {
      message: `Contrat "${contract.reference}" supprimé avec succès`,
      contractId: id
    };
  }

  // Routes personnalisées
  @Get('dashboard/summary')
  @RequirePermissions(ContractPermission.READ)
  async getDashboardSummary(): Promise<{ message: string; summary: any }> {
    const summary = {
      totalContracts: 1250,
      activeContracts: 980,
      expiredContracts: 45,
      revenueThisMonth: 45000
    };
    
    return {
      message: 'Résumé du tableau de bord récupéré avec succès',
      summary
    };
  }

  // Obtenir les contrats par statut
  @Get('status/:status')
  @RequirePermissions(ContractPermission.READ)
  async getContractsByStatus(@Param('status') status: string): Promise<{ message: string; contracts: Contract[] }> {
    // Ici vous pourriez appeler un service pour récupérer les contrats par statut
    const contracts = await this.contractService.findAll(); // Placeholder
    const filteredContracts = contracts.filter(contract => contract.contractState?.libelle === status);
    
    return {
      message: `${filteredContracts.length} contrat(s) avec le statut "${status}"`,
      contracts: filteredContracts
    };
  }

  // Obtenir les contrats expirant bientôt
  @Get('expiring-soon')
  @RequirePermissions(ContractPermission.READ)
  async getContractsExpiringSoon(): Promise<{ message: string; contracts: Contract[] }> {
    // Ici vous pourriez appeler un service pour récupérer les contrats expirant bientôt
    const contracts = await this.contractService.findAll(); // Placeholder
    const expiringSoon = contracts.filter(contract => {
      const expiryDate = new Date(contract.dateEch);
      const now = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    });
    
    return {
      message: `${expiringSoon.length} contrat(s) expirant dans les 30 prochains jours`,
      contracts: expiringSoon
    };
  }

  // Obtenir les statistiques détaillées des contrats
  @Get('statistics/detailed')
  @RequirePermissions(ContractPermission.READ)
  async getDetailedStatistics(): Promise<{ message: string; statistics: any }> {
    const contracts = await this.contractService.findAll();
    
    const statistics = {
      totalContracts: contracts.length,
      byStatus: {
        active: contracts.filter(c => c.isActive === true).length,
        pending: contracts.filter(c => c.contractState?.libelle === 'PENDING').length,
        expired: contracts.filter(c => c.contractState?.libelle === 'EXPIRED').length,
        cancelled: contracts.filter(c => c.contractState?.libelle === 'CANCELLED').length
      },
      byMonth: {
        thisMonth: contracts.filter(c => {
          const contractDate = new Date(c.createdAt);
          const now = new Date();
          return contractDate.getMonth() === now.getMonth() && 
                 contractDate.getFullYear() === now.getFullYear();
        }).length,
        lastMonth: contracts.filter(c => {
          const contractDate = new Date(c.createdAt);
          const now = new Date();
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          return contractDate.getMonth() === lastMonth.getMonth() && 
                 contractDate.getFullYear() === lastMonth.getFullYear();
        }).length
      }
    };
    
    return {
      message: 'Statistiques détaillées des contrats récupérées avec succès',
      statistics
    };
  }

  // Endpoint pour générer un PDF de contrat
  @Get(':id/pdf')
  @RequirePermissions(ContractPermission.READ)
  async generateContractPdf(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: any,
    @Res() res: Response
  ): Promise<void> {
    try {
      // Récupérer le contrat avec toutes les relations
      const contract = await this.contractService.findOneWithRelations(id);
      
      if (!contract) {
        res.status(HttpStatus.NOT_FOUND).json({ message: 'Contrat non trouvé' });
        return;
      }

      const user = request.user || request['user'];
      if (!user) {
        res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Utilisateur non authentifié' });
        return;
      }
      if (!this.isUserAdminOrManager(user) && contract.idAgency !== user.idAgency) {
        res.status(HttpStatus.FORBIDDEN).json({ message: 'Vous n\'êtes pas autorisé à consulter ce contrat' });
        return;
      }

      // Récupérer les données du client et de l'agence
      const customer = contract.customer;
      const agency = contract.agency;

      if (!customer || !agency) {
        res.status(HttpStatus.BAD_REQUEST).json({ 
          message: 'Données client ou agence manquantes' 
        });
        return;
      }

      // Générer le PDF
      const pdfBuffer = await this.pdfService.generateContractPdf(
        contract,
        customer,
        agency
      );

      // Configurer les headers pour le téléchargement
      // Générer un nom de fichier avec le nom du client, date et heure
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, ''); // HHMMSS
      const clientLastName = (contract.customer?.lastname || 'unknown').replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
      const clientFirstName = (contract.customer?.firstname || 'unknown').replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
      const filename = `CONTRACT_${clientLastName}_${clientFirstName}_${dateStr}_${timeStr}.pdf`;
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      });

      // Envoyer le PDF
      res.send(pdfBuffer);

    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Erreur lors de la génération du PDF',
        error: error.message
      });
    }
  }

  // Endpoint pour générer un PDF de cotation
  @Get('cotation/:id/pdf')
  @RequirePermissions(ContractPermission.READ)
  async generateCotationPdf(
    @Param('id') id: string,
    @Req() request: any,
    @Res() res: Response
  ): Promise<void> {
    try {
      // Récupérer la cotation avec toutes les relations
      const cotation = await this.cotationService.findOneWithRelations(id);
      
      if (!cotation) {
        res.status(HttpStatus.NOT_FOUND).json({ message: 'Cotation non trouvée' });
        return;
      }

      const user = request.user || request['user'];
      if (!user) {
        res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Utilisateur non authentifié' });
        return;
      }
      const userRole = (user.role?.libelle || user.role || '').toString().toUpperCase();
      const isAdminOrManager = ['ADMIN', 'MANAGER', 'SUPERADMIN', 'SUPER ADMIN', 'SUPER_ADMIN'].includes(userRole) || user.idRole === 1 || user.idRole === 5;
      if (!isAdminOrManager && cotation.idUser !== user.id && cotation.idAgency !== user.idAgency) {
        res.status(HttpStatus.FORBIDDEN).json({ message: 'Vous n\'êtes pas autorisé à consulter cette cotation' });
        return;
      }

      // Récupérer les données du client et de l'agence
      // customer peut être null pour les prospects (la template gère le fallback)
      const customer = cotation.customer || null;
      const agency   = cotation.agency   || null;

      if (!agency) {
        res.status(HttpStatus.BAD_REQUEST).json({
          message: 'Agence introuvable pour cette cotation'
        });
        return;
      }

      // Générer le PDF
      const pdfBuffer = await this.pdfService.generateCotationPdf(
        cotation,
        customer,
        agency
      );

      // Configurer les headers pour le téléchargement
      // Générer un nom de fichier avec la référence de la cotation, date et heure
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, ''); // HHMMSS
      const reference = (cotation.reference || 'unknown').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `COTATION_${reference}_${dateStr}_${timeStr}.pdf`;
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      });

      // Envoyer le PDF
      res.send(pdfBuffer);

    } catch (error) {
      console.error('Erreur lors de la génération du PDF de cotation:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Erreur lors de la génération du PDF de cotation',
        error: error.message
      });
    }
  }

  // Endpoint pour lister les templates disponibles
  @Get('templates/available')
  @RequirePermissions(ContractPermission.READ)
  async getAvailableTemplates(): Promise<{ message: string; templates: string[] }> {
    const templates = this.pdfService.getAvailableTemplates();
    return {
      message: `${templates.length} template(s) disponible(s)`,
      templates
    };
  }

  @Get('production-report/excel')
  @RequirePermissions(ContractPermission.READ)
  async generateProductionReportExcel(
    @Res() res: Response,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('idAgency') idAgency?: string,
    @Query('idUser') idUser?: string,
    @Query('idNatureCredit') idNatureCredit?: string,
    @Query('idNatureCredits') idNatureCredits?: string
  ): Promise<void> {
    try {
      const rawNatureParam = idNatureCredits || idNatureCredit;
      const natureIds = rawNatureParam
        ? rawNatureParam.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v))
        : undefined;

      console.log('📊 Génération du rapport de production Excel...');
      console.log('📅 Période:', startDate, 'au', endDate);
      console.log('🏢 Agence:', idAgency || 'Toutes');
      console.log('👤 Utilisateur:', idUser || 'Tous');
      console.log('💳 Natures de Crédit:', natureIds || 'Toutes');

      // Convertir les dates et ajouter des logs
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      console.log('📅 Date de début convertie:', startDateObj);
      console.log('📅 Date de fin convertie:', endDateObj);
      console.log('📅 Date de début ISO:', startDateObj.toISOString());
      console.log('📅 Date de fin ISO:', endDateObj.toISOString());

      // Récupérer les contrats selon les critères
      const contracts = await this.contractService.findByPeriodAndFilters(
        startDateObj,
        endDateObj,
        idAgency ? parseInt(idAgency) : undefined,
        idUser ? parseInt(idUser) : undefined,
        natureIds
      );

      // Récupérer les états des contrats
      const contractStates = await this.contractStateService.findAll();

      // Récupérer les utilisateurs uniques
      const userIds = [...new Set(contracts.map(c => c.user?.id).filter(Boolean))];
      const users = await this.contractService.findUsersByIds(userIds);

      // Préparer les données pour le rapport
      const reportData = {
        contracts,
        contractStates,
        users,
        period: {
          startDate: new Date(startDate).toLocaleDateString('fr-FR'),
          endDate: new Date(endDate).toLocaleDateString('fr-FR')
        }
      };

      // Générer le fichier Excel (sans sauvegarde pour téléchargement direct)
      const excelBuffer = await this.excelService.generateProductionReportBuffer(reportData);

      // Configurer les headers pour le téléchargement
      const filename = `Rapport_Production_${startDate}_${endDate}.xlsx`;
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length.toString(),
      });

      // Envoyer le fichier Excel
      res.send(excelBuffer);

      console.log('✅ Rapport Excel généré avec succès:', filename);
    } catch (error) {
      console.error('❌ Erreur lors de la génération du rapport Excel:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Erreur lors de la génération du rapport Excel',
        error: error.message
      });
    }
  }

  // Endpoint de test pour générer un PDF de démonstration (sans authentification pour le test)
  @Get('test/pdf')
  async generateTestPdf(@Res() res: Response): Promise<void> {
    try {
      // Données de test
      const testData = {
        contract: {
          police: 'POL-TEST-001',
          reference: 'REF-TEST-001',
          dateEff: new Date(),
          dateEch: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          capital: 25000000,
          duration: 60,
          garantieCompl: 'OUI',
          pd: 150000,
          pc: 200000,
          acc: 50000,
          surp: 25000,
          fm: 75000,
          puttc: 500000
        },
        customer: {
          nom: 'DUPONT',
          prenom: 'Jean',
          telephone: '+229 97 12 34 56',
          email: 'jean.dupont@email.com',
          birthdate: new Date('1985-05-15'),
          adresse: 'Cotonou, Bénin'
        },
        agency: {
          nom: 'Agence Cotonou Centre'
        },
        generatedAt: new Date().toLocaleDateString('fr-FR'),
        generatedTime: new Date().toLocaleTimeString('fr-FR')
      };

      // Générer le PDF de test
      const pdfBuffer = await this.pdfService.generatePdfFromTemplate('contract', testData);

      // Configurer les headers pour le téléchargement
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="test_contrat.pdf"',
        'Content-Length': pdfBuffer.length.toString(),
      });

      // Envoyer le PDF
      res.send(pdfBuffer);

    } catch (error) {
      console.error('Erreur lors de la génération du PDF de test:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Erreur lors de la génération du PDF de test',
        error: error.message
      });
    }
  }

  @Get(':id/history/pdf')
  @RequirePermissions(ContractPermission.READ)
  async exportHistoryToPdf(
    @Param('id') id: string,
    @Req() request: any,
    @Res() res: Response,
  ): Promise<void> {
    const user = request.user || request['user'];
    if (!user) {
      res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Utilisateur non authentifié' });
      return;
    }
    const contract = await this.contractService.findOneWithRelations(id);
    if (!contract) {
      res.status(404).json({ message: 'Contrat non trouvé' });
      return;
    }
    if (!this.isUserAdminOrManager(user) && contract.idAgency !== user.idAgency) {
      res.status(HttpStatus.FORBIDDEN).json({ message: 'Vous n\'êtes pas autorisé à consulter ce contrat' });
      return;
    }

    const history = await this.contractHistoryService.findByContractId(contract.id);
    
    if (history.length === 0) {
      res.status(404).json({ message: 'Aucun historique disponible pour ce contrat' });
      return;
    }

    try {
      const pdfBuffer = await this.contractHistoryService.generateHistoryPdf(contract, history);
      
      // Nettoyer les noms pour éviter les espaces et caractères spéciaux
      const cleanReference = (contract.reference || '').trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
      const filename = `historique_${cleanReference}_${Date.now()}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error('❌ Erreur lors de la génération du PDF:', error);
      res.status(500).json({ message: `Erreur lors de la génération du PDF: ${error.message}` });
    }
  }

  // Obtenir l'historique des modifications d'un contrat
  @Get(':id/history')
  @RequirePermissions(ContractPermission.READ)
  async getContractHistory(
    @Param('id') id: string,
    @Req() request: any,
  ): Promise<{ message: string; history: any[] }> {
    const user = request.user || request['user'];
    if (!user) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    const contract = await this.contractService.findOne(id);
    if (!contract) {
      throw new NotFoundException('Contrat non trouvé');
    }
    if (!this.isUserAdminOrManager(user) && contract.idAgency !== user.idAgency) {
      throw new ForbiddenException('Vous n\'êtes pas autorisé à consulter l\'historique de ce contrat');
    }

    const history = await this.contractHistoryService.findByContractId(contract.id);
    
    return {
      message: `Historique du contrat "${contract.reference}" récupéré avec succès`,
      history
    };
  }

  @Post('import/bulk-pdf')
  @UseGuards(JwtAuthGuard)
  async generateBulkContractPDF(
    @Body() body: { contractIds: number[] }, 
    @Req() request: any,
    @Res() res: Response
  ) {
    try {
      console.log('🔄 Génération PDF groupé pour les contrats:', body.contractIds);

      if (!body.contractIds || body.contractIds.length === 0) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          message: 'Aucun ID de contrat fourni'
        });
      }

      const user = request.user || request['user'];
      if (!user) {
        return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Utilisateur non authentifié' });
      }

      // Récupérer tous les contrats avec leurs relations
      let contracts = await this.contractService.findContractsByIds(body.contractIds);
      
      // Filtrer si non-admin
      if (user.idRole !== 1) {
        contracts = contracts.filter(c => c.idAgency === user.idAgency);
      }
      
      if (contracts.length === 0) {
        return res.status(HttpStatus.NOT_FOUND).json({
          message: 'Aucun contrat trouvé avec les IDs fournis'
        });
      }

      console.log(`📄 Génération de l'archive ZIP pour ${contracts.length} contrats`);

      // Générer l'archive ZIP contenant les PDFs des contrats
      const zipBuffer = await this.pdfService.generateBulkContractZip(contracts);

      // Configurer les en-têtes de réponse
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, ''); // HHMMSS
      const filename = `CONTRATS_IMPORT_${dateStr}_${timeStr}.zip`;
      
      res.set({
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': zipBuffer.length.toString()
      });

      // Envoyer l'archive ZIP
      res.send(zipBuffer);

    } catch (error) {
      console.error('Erreur lors de la génération du PDF groupé:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Erreur lors de la génération du PDF groupé',
        error: error.message
      });
    }
  }

  @Get('import/template')
  @UseGuards(JwtAuthGuard)
  async getImportTemplate(@Res() res: Response) {
    try {
      const buffer = await this.excelService.generateContractsImportTemplate();
      
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="Template_Import_Contrats.xlsx"',
        'Content-Length': buffer.length.toString()
      });

      res.send(buffer);
    } catch (err: any) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Erreur lors de la génération du modèle d\'import',
        error: err.message
      });
    }
  }

  @Post('import-excel')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async importExcel(
    @UploadedFile() file: any,
    @Req() req: any
  ) {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException("Utilisateur non authentifié.");
    }
    if (!file) {
      throw new BadRequestException("Veuillez fournir un fichier Excel.");
    }
    const result = await this.contractService.importContractsFromExcel(
      file,
      user
    );
    return {
      success: true,
      message: 'Fichier importé avec succès',
      data: result
    };
  }

  @Put('beneficiary/:id')
  @RequirePermissions(ContractPermission.UPDATE)
  async updateBeneficiary(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any
  ) {
    const result = await this.contractService.updateBeneficiary(id, body);
    return {
      success: true,
      message: 'Bénéficiaire mis à jour avec succès',
      data: result
    };
  }

  @Delete('beneficiary/:id')
  @RequirePermissions(ContractPermission.UPDATE)
  async deleteBeneficiary(
    @Param('id', ParseIntPipe) id: number
  ) {
    await this.contractService.deleteBeneficiary(id);
    return {
      success: true,
      message: 'Bénéficiaire supprimé avec succès'
    };
  }

  @Put('insured-member/:id')
  @RequirePermissions(ContractPermission.UPDATE)
  async updateInsuredMember(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any
  ) {
    const result = await this.contractService.updateInsuredMember(id, body);
    return {
      success: true,
      message: 'Membre assuré mis à jour avec succès',
      data: result
    };
  }

  @Delete('insured-member/:id')
  @RequirePermissions(ContractPermission.UPDATE)
  async deleteInsuredMember(
    @Param('id', ParseIntPipe) id: number
  ) {
    await this.contractService.deleteInsuredMember(id);
    return {
      success: true,
      message: 'Membre assuré supprimé avec succès'
    };
  }

  @Post(':id/beneficiary')
  @RequirePermissions(ContractPermission.UPDATE)
  async addBeneficiary(
    @Param('id') id: string,
    @Body() body: any
  ) {
    const result = await this.contractService.addBeneficiary(id, body);
    return {
      success: true,
      message: 'Bénéficiaire ajouté avec succès',
      data: result
    };
  }

  @Put(':id/beneficiaries')
  @RequirePermissions(ContractPermission.UPDATE)
  async updateContractBeneficiaries(
    @Param('id') id: string,
    @Body() body: { beneficiaries: any[] }
  ) {
    const result = await this.contractService.saveAllBeneficiaries(id, body.beneficiaries);
    return {
      success: true,
      message: 'Bénéficiaires mis à jour avec succès',
      data: result
    };
  }
}

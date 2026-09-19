import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query, UseGuards, UseInterceptors, NotFoundException } from '@nestjs/common';
import { ProductService } from '../service/product.service';
import { Product } from '../entity/product.entity';
import { CreateProductDto, UpdateProductDto } from '../dto';
import { ContractAuthGuard, RequirePermissions, ContractPermission } from '../guards/contract-auth.guard';
import { JwtAuthGuard } from '../../gestionUsers/guards/jwt-auth.guard';
import { AuthInterceptor } from '../interceptors/auth.interceptor';
import { ResponseTransformInterceptor } from '../interceptors/response-transform.interceptor';

@Controller('products')
@UseGuards(JwtAuthGuard, ContractAuthGuard)
@UseInterceptors(AuthInterceptor, ResponseTransformInterceptor)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @RequirePermissions(ContractPermission.READ)
  async findAll(): Promise<{ message: string; products: Product[] }> {
    const products = await this.productService.findAll();
    return {
      message: `Liste des ${products.length} produits récupérée avec succès`,
      products
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<{ message: string; product: Product }> {
    const product = await this.productService.findOne(id);
    if (!product) {
      throw new NotFoundException('Produit non trouvé');
    }
    return {
      message: `Produit "${product.name}" récupéré avec succès`,
      product
    };
  }

  @Get('search/name')
  async findByName(@Query('name') name: string): Promise<{ message: string; products: Product[] }> {
    const products = await this.productService.findByName(name);
    return {
      message: `${products.length} produit(s) trouvé(s) avec le nom "${name}"`,
      products
    };
  }

  @Get('search/code')
  async findByCode(@Query('code') code: string): Promise<{ message: string; product: Product | null }> {
    const product = await this.productService.findByCode(code);
    if (!product) {
      return {
        message: `Aucun produit trouvé avec le code "${code}"`,
        product: null
      };
    }
    return {
      message: `Produit trouvé avec le code "${code}"`,
      product
    };
  }

  @Post()
  @RequirePermissions(ContractPermission.MANAGE_PRODUCT)
  async create(@Body() productData: CreateProductDto): Promise<{ message: string; product: Product }> {
    const product = await this.productService.create(productData);
    return {
      message: `Produit "${product.name}" créé avec succès`,
      product
    };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() productData: UpdateProductDto,
  ): Promise<{ message: string; product: Product }> {
    const product = await this.productService.update(id, productData);
    if (!product) {
      throw new NotFoundException('Produit non trouvé');
    }
    return {
      message: `Produit "${product.name}" mis à jour avec succès`,
      product
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string; productId: number }> {
    const product = await this.productService.findOne(id);
    if (!product) {
      throw new NotFoundException('Produit non trouvé');
    }
    
    await this.productService.remove(id);
    return {
      message: `Produit "${product.name}" supprimé avec succès`,
      productId: id
    };
  }

  // Routes personnalisées
  @Get('statistics/summary')
  async getProductStatistics(): Promise<{ message: string; statistics: any }> {
    const products = await this.productService.findAll();
    
    const statistics = {
      totalProducts: products.length,
      activeProducts: products.filter(p => p.isActive !== false).length,
      productsByCategory: {
        insurance: products.filter(p => p.category === 'INSURANCE').length,
        investment: products.filter(p => p.category === 'INVESTMENT').length,
        banking: products.filter(p => p.category === 'BANKING').length
      }
    };
    
    return {
      message: 'Statistiques des produits récupérées avec succès',
      statistics
    };
  }

  // Obtenir les contrats d'un produit
  @Get(':id/contracts')
  async getProductContracts(@Param('id', ParseIntPipe) id: number): Promise<{ message: string; contracts: any[] }> {
    const product = await this.productService.findOne(id);
    if (!product) {
      throw new NotFoundException('Produit non trouvé');
    }

    // Ici vous pourriez appeler un service pour récupérer les contrats du produit
    // Pour l'instant, on retourne des données simulées
    const contracts = [
      {
        id: 1,
        reference: 'CON-001',
        police: 'POL-001',
        customer: 'Jean Dupont',
        dateEff: new Date(),
        dateEch: new Date(),
        capital: 100000
      }
    ];

    return {
      message: `Contrats du produit "${product.name}" récupérés avec succès`,
      contracts
    };
  }

  // Obtenir les performances d'un produit
  @Get(':id/performance')
  async getProductPerformance(@Param('id', ParseIntPipe) id: number): Promise<{ message: string; performance: any }> {
    const product = await this.productService.findOne(id);
    if (!product) {
      throw new NotFoundException('Produit non trouvé');
    }

    // Ici vous pourriez appeler un service pour récupérer les performances du produit
    // Pour l'instant, on retourne des données simulées
    const performance = {
      contractsThisMonth: 15,
      revenueThisMonth: 75000,
      customerSatisfaction: 4.3,
      growthRate: 8.7
    };

    return {
      message: `Performances du produit "${product.name}" récupérées avec succès`,
      performance
    };
  }
}

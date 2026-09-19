import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GestionUsersModule } from '../gestionUsers/gestion-users.module';
import { ContractController } from './controller/contract.controller';
import { CustomerController } from './controller/customer.controller';
import { AgencyController } from './controller/agency.controller';
import { ProductionStateController } from './controller/production-state.controller';
import { ProductController } from './controller/product.controller';
import { ContractStateController } from './controller/contract-state.controller';
import { CotationController } from './controller/cotation.controller';
import { QuotationController } from './controller/quotation.controller';
import { SubscriberController } from './controller/subscriber.controller';
import { TypeCustomerController } from './controller/type-customer.controller';
import { NatureCreditController } from './controller/nature-credit.controller';
import { PeriodiciteController } from './controller/periodicite.controller';
import { DashboardController } from './controller/dashboard.controller';
import { DashboardTestController } from './controller/dashboard-test.controller';
import { ContractAuthGuard } from './guards/contract-auth.guard';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { ResponseTransformInterceptor } from './interceptors/response-transform.interceptor';
import { AuditService } from './service/audit.service';
import { ContractService } from './service/contract.service';
import { CustomerService } from './service/customer.service';
import { AgencyService } from './service/agency.service';
import { ProductionStateService } from './service/production-state.service';
import { ContractStateService } from './service/contract-state.service';
import { CotationService } from './service/cotation.service';
import { QuotationService } from './service/quotation.service';
import { ProductService } from './service/product.service';
import { SubscriberService } from './service/subscriber.service';
import { TypeCustomerService } from './service/type-customer.service';
import { NatureCreditService } from './service/nature-credit.service';
import { DashboardService } from './service/dashboard.service';
import { PolicyNumberService } from './service/policy-number.service';
import { SeedService } from './service/seed.service';
import { PeriodiciteSeedService } from './service/periodicite-seed.service';
import { PeriodiciteService } from './service/periodicite.service';
import { OfficeSeedService } from './service/office-seed.service';
import { Contract } from './entity/contract.entity';
import { Customer } from './entity/customer.entity';
import { Agency } from './entity/agency.entity';
import { Product } from './entity/product.entity';
import { ContractState } from './entity/contract-state.entity';
import { ProductionState } from './entity/production-state.entity';
import { Cotation } from './entity/cotation.entity';
import { Quotation } from './entity/quotation.entity';
import { Subscriber } from './entity/subscriber.entity';
import { TypeCustomer } from './entity/type-customer.entity';
import { CreditType } from './entity/credit-type.entity';
import { NatureCredit } from './entity/nature-credit.entity';
import { Periodicite } from './entity/periodicite.entity';
import { Office } from './entity/office.entity';
import { User } from '../gestionUsers/entity/user.entity';
import { Role } from '../gestionUsers/entity/role.entity';
import { UserSeedService } from '../gestionUsers/service/user-seed.service';
import { CustomerHistory } from './entity/customer-history.entity';
import { CustomerHistoryService } from './service/customer-history.service';
import { ContractHistory } from './entity/contract-history.entity';
import { ContractHistoryService } from './service/contract-history.service';
import { PdfService } from '../../services/pdf.service';
import { ExcelService } from '../../services/excel.service';
import { AlertThreshold } from './entity/alert-threshold.entity';
import { BiController } from './controller/bi.controller';
import { BiService } from './service/bi.service';
import { Beneficiary } from './entity/beneficiary.entity';
import { ContractInsuredMember } from './entity/contract-insured-member.entity';
import { UuidInitializerService } from './service/uuid-initializer.service';
import { LienParente } from './entity/lien-parente.entity';
import { LienParenteService } from './service/lien-parente.service';
import { LienParenteController } from './controller/lien-parente.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Contract, 
      Customer, 
      Agency, 
      Product, 
      ContractState, 
      ProductionState, 
      Cotation, 
      Quotation, 
      Subscriber, 
      TypeCustomer, 
      CreditType, 
      NatureCredit, 
      Periodicite, 
      Office, 
      User, 
      Role, 
      CustomerHistory,
      ContractHistory,
      AlertThreshold,
      Beneficiary,
      ContractInsuredMember,
      LienParente
    ]),
    GestionUsersModule
  ],
  controllers: [
    ContractController,
    CustomerController,
    AgencyController,
    ProductionStateController,
    ProductController,
    ContractStateController,
    CotationController,
    QuotationController,
    SubscriberController,
    TypeCustomerController,
    NatureCreditController,
    PeriodiciteController,
    DashboardController,
    DashboardTestController,
    BiController,
    LienParenteController
  ],
  providers: [
    ContractService, 
    CustomerService,
    CustomerHistoryService,
    ContractHistoryService,
    AgencyService, 
    ProductionStateService,
    ContractStateService, 
    CotationService, 
    QuotationService,
    ProductService, 
    SubscriberService, 
    TypeCustomerService,
    NatureCreditService,
    DashboardService,
    ContractAuthGuard,
    AuthInterceptor,
    ResponseTransformInterceptor,
    AuditService,
    SeedService,
    PeriodiciteSeedService,
    PeriodiciteService,
    OfficeSeedService,
    UserSeedService,
    PdfService,
    ExcelService,
    PolicyNumberService,
    BiService,
    UuidInitializerService,
    LienParenteService
  ],
  exports: [ContractService, CustomerService, AgencyService, ContractStateService, CotationService, QuotationService, ProductService, SubscriberService, TypeCustomerService, NatureCreditService, BiService, LienParenteService],
})
export class GestionContractsModule {}

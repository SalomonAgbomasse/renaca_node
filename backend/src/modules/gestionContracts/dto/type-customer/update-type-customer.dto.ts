import { PartialType } from '@nestjs/mapped-types';
import { CreateTypeCustomerDto } from './create-type-customer.dto';

export class UpdateTypeCustomerDto extends PartialType(CreateTypeCustomerDto) {}

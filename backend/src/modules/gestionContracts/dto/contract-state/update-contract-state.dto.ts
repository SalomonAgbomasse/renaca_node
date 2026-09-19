import { PartialType } from '@nestjs/mapped-types';
import { CreateContractStateDto } from './create-contract-state.dto';

export class UpdateContractStateDto extends PartialType(CreateContractStateDto) {}

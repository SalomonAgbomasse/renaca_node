import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards, UseInterceptors } from '@nestjs/common';
import { GroupService } from '../service/group.service';
import { CreateGroupDto, UpdateGroupDto } from '../dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ResponseTransformInterceptor } from '../interceptors/response-transform.interceptor';

@Controller('groups')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ResponseTransformInterceptor)
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Get()
  async findAll() {
    const groups = await this.groupService.findAll();
    return {
      message: `Liste des ${groups.length} groupes récupérée avec succès`,
      groups,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const group = await this.groupService.findOne(id);
    return {
      message: `Groupe "${group.libelle}" récupéré avec succès`,
      group,
    };
  }

  @Post()
  async create(@Body() createGroupDto: CreateGroupDto) {
    const group = await this.groupService.create(createGroupDto);
    return {
      message: `Groupe "${group.libelle}" créé avec succès`,
      group,
    };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGroupDto: UpdateGroupDto,
  ) {
    const group = await this.groupService.update(id, updateGroupDto);
    return {
      message: `Groupe "${group.libelle}" mis à jour avec succès`,
      group,
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.groupService.remove(id);
    return {
      message: `Groupe #${id} supprimé avec succès`,
    };
  }
}

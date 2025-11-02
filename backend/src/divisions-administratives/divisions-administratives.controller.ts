import { Controller, Get, Post, Put, Delete, Query, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { DivisionsAdministrativesService } from './divisions-administratives.service';
import { CreateDivisionAdministrativeDto } from './dto/create-division.dto';
import { UpdateDivisionAdministrativeDto } from './dto/update-division.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RoleType } from '@prisma/client';

@ApiTags('Divisions Administratives')
@Controller('divisions-administratives')
export class DivisionsAdministrativesController {
  constructor(
    private readonly divisionsAdministrativesService: DivisionsAdministrativesService,
  ) {}

  @Get('regions')
  @ApiOperation({ summary: 'Récupérer toutes les régions' })
  @ApiResponse({ status: 200, description: 'Liste des régions' })
  async getRegions() {
    return this.divisionsAdministrativesService.getRegions();
  }

  @Get('departements')
  @ApiOperation({ summary: 'Récupérer les départements d\'une région' })
  @ApiQuery({ name: 'region', required: false, description: 'Nom de la région' })
  @ApiResponse({ status: 200, description: 'Liste des départements' })
  async getDepartements(@Query('region') region?: string) {
    if (region) {
      return this.divisionsAdministrativesService.getDepartementsByRegion(region);
    }
    // Si pas de région, retourner tous les départements
    const all = await this.divisionsAdministrativesService.findAll(1, 1000);
    const departements = new Set(
      all.items
        .map(item => item.departement)
        .filter((d): d is string => d !== null),
    );
    return Array.from(departements).sort();
  }

  @Get('chef-lieus')
  @ApiOperation({ summary: 'Récupérer les chef-lieux' })
  @ApiQuery({ name: 'departement', required: false, description: 'Nom du département' })
  @ApiQuery({ name: 'region', required: false, description: 'Nom de la région' })
  @ApiResponse({ status: 200, description: 'Liste des chef-lieux' })
  async getChefLieus(
    @Query('departement') departement?: string,
    @Query('region') region?: string,
  ) {
    if (departement) {
      return this.divisionsAdministrativesService.getChefLieusByDepartement(
        departement,
        region,
      );
    }
    // Si pas de département, retourner tous les chef-lieux
    const all = await this.divisionsAdministrativesService.findAll(1, 1000);
    const chefLieus = new Set(
      all.items
        .map(item => item.chefLieu)
        .filter((c): c is string => c !== null),
    );
    return Array.from(chefLieus).sort();
  }

  @Get('sous-prefectures')
  @ApiOperation({ summary: 'Récupérer les sous-préfectures' })
  @ApiQuery({ name: 'chefLieu', required: false, description: 'Nom du chef-lieu' })
  @ApiQuery({ name: 'departement', required: false, description: 'Nom du département' })
  @ApiResponse({ status: 200, description: 'Liste des sous-préfectures' })
  async getSousPrefectures(
    @Query('chefLieu') chefLieu?: string,
    @Query('departement') departement?: string,
  ) {
    if (chefLieu) {
      return this.divisionsAdministrativesService.getSousPrefecturesByChefLieu(
        chefLieu,
        departement,
      );
    }
    // Si pas de chef-lieu, retourner toutes les sous-préfectures
    const all = await this.divisionsAdministrativesService.findAll(1, 1000);
    const sousPrefectures = new Set(
      all.items
        .map(item => item.sousPrefecture)
        .filter((s): s is string => s !== null),
    );
    return Array.from(sousPrefectures).sort();
  }

  @Get('communes')
  @ApiOperation({ summary: 'Récupérer les communes' })
  @ApiQuery({ name: 'region', required: false, description: 'Nom de la région' })
  @ApiQuery({ name: 'departement', required: false, description: 'Nom du département' })
  @ApiQuery({ name: 'chefLieu', required: false, description: 'Nom du chef-lieu' })
  @ApiQuery({ name: 'sousPrefecture', required: false, description: 'Nom de la sous-préfecture' })
  @ApiResponse({ status: 200, description: 'Liste des communes' })
  async getCommunes(
    @Query('region') region?: string,
    @Query('departement') departement?: string,
    @Query('chefLieu') chefLieu?: string,
    @Query('sousPrefecture') sousPrefecture?: string,
  ) {
    return this.divisionsAdministrativesService.getCommunes({
      region,
      departement,
      chefLieu,
      sousPrefecture,
    });
  }

  @Get('autocomplete')
  @ApiOperation({ summary: 'Recherche pour auto-complétion' })
  @ApiQuery({ name: 'q', required: true, description: 'Terme de recherche' })
  @ApiQuery({ name: 'type', required: false, enum: ['region', 'departement', 'chefLieu', 'sousPrefecture', 'commune'] })
  @ApiResponse({ status: 200, description: 'Résultats de la recherche' })
  async autocomplete(
    @Query('q') query: string,
    @Query('type') type?: 'region' | 'departement' | 'chefLieu' | 'sousPrefecture' | 'commune',
  ) {
    return this.divisionsAdministrativesService.autocomplete(query, type);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Liste toutes les divisions administratives (gestion)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Liste paginée des divisions administratives' })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
  ) {
    return this.divisionsAdministrativesService.findAll(
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 50,
      search,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer une division administrative par ID' })
  @ApiParam({ name: 'id', description: 'ID de la division administrative' })
  @ApiResponse({ status: 200, description: 'Division administrative trouvée' })
  @ApiResponse({ status: 404, description: 'Division administrative introuvable' })
  async findOne(@Param('id') id: string) {
    return this.divisionsAdministrativesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une nouvelle division administrative' })
  @ApiResponse({ status: 201, description: 'Division administrative créée avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 409, description: 'Code déjà utilisé' })
  async create(@Body() createDto: CreateDivisionAdministrativeDto) {
    return this.divisionsAdministrativesService.create(createDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mettre à jour une division administrative' })
  @ApiParam({ name: 'id', description: 'ID de la division administrative' })
  @ApiResponse({ status: 200, description: 'Division administrative mise à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Division administrative introuvable' })
  @ApiResponse({ status: 409, description: 'Code déjà utilisé' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateDivisionAdministrativeDto,
  ) {
    return this.divisionsAdministrativesService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer une division administrative' })
  @ApiParam({ name: 'id', description: 'ID de la division administrative' })
  @ApiResponse({ status: 200, description: 'Division administrative supprimée avec succès' })
  @ApiResponse({ status: 404, description: 'Division administrative introuvable' })
  async delete(@Param('id') id: string) {
    return this.divisionsAdministrativesService.delete(id);
  }
}

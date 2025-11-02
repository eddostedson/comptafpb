import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CreateRegisseurDto } from './dto/create-regisseur.dto';
import { UpdateRegisseurDto } from './dto/update-regisseur.dto';
import { CreateCentreDto } from './dto/create-centre.dto';
import { UpdateCentreDto } from './dto/update-centre.dto';
import { CreateChefCentreDto } from './dto/create-chef-centre.dto';
import { UpdateChefCentreDto } from './dto/update-chef-centre.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RoleType } from '@prisma/client';

@ApiTags('Administration')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles(RoleType.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ========================================
  // GESTION DES RÉGISSEURS
  // ========================================

  @Post('regisseurs')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un nouveau régisseur' })
  @ApiResponse({ status: 201, description: 'Régisseur créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 409, description: 'Code ou email déjà utilisé' })
  async createRegisseur(@Body() createRegisseurDto: CreateRegisseurDto) {
    return this.adminService.createRegisseur(createRegisseurDto);
  }

  @Get('regisseurs')
  @ApiOperation({ summary: 'Récupérer tous les régisseurs' })
  @ApiResponse({ status: 200, description: 'Liste des régisseurs' })
  async getAllRegisseurs() {
    return this.adminService.getAllRegisseurs();
  }

  @Get('regisseurs/:id')
  @ApiOperation({ summary: 'Récupérer un régisseur par son ID' })
  @ApiResponse({ status: 200, description: 'Régisseur trouvé' })
  @ApiResponse({ status: 404, description: 'Régisseur introuvable' })
  async getRegisseurById(@Param('id') id: string) {
    return this.adminService.getRegisseurById(id);
  }

  @Put('regisseurs/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mettre à jour un régisseur' })
  @ApiResponse({ status: 200, description: 'Régisseur mis à jour avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 404, description: 'Régisseur introuvable' })
  @ApiResponse({ status: 409, description: 'Code ou email déjà utilisé' })
  async updateRegisseur(
    @Param('id') id: string,
    @Body() updateRegisseurDto: UpdateRegisseurDto,
  ) {
    return this.adminService.updateRegisseur(id, updateRegisseurDto);
  }

  @Delete('regisseurs/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer un régisseur' })
  @ApiResponse({ status: 200, description: 'Régisseur supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Régisseur introuvable' })
  @ApiResponse({ status: 409, description: 'Régisseur associé à des centres ou utilisateurs' })
  async deleteRegisseur(@Param('id') id: string) {
    return this.adminService.deleteRegisseur(id);
  }

  @Post('regisseurs/:regisseurId/associer-chefs-centres')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Associer un ou plusieurs chefs de centres à un régisseur' })
  @ApiResponse({ status: 200, description: 'Chefs de centres associés avec succès' })
  @ApiResponse({ status: 404, description: 'Régisseur ou chef(s) de centre introuvable(s)' })
  async associerChefsCentresRegisseur(
    @Param('regisseurId') regisseurId: string,
    @Body() body: { chefsCentresIds: string[] },
  ) {
    return this.adminService.associerChefsCentresRegisseur(regisseurId, body.chefsCentresIds);
  }

  @Post('centres/:centreId/dissocier-regisseur')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dissocier un centre de son régisseur' })
  @ApiResponse({ status: 200, description: 'Centre dissocié avec succès' })
  @ApiResponse({ status: 404, description: 'Centre introuvable' })
  @ApiResponse({ status: 409, description: "Le centre n'est pas associé à un régisseur" })
  async dissocierCentreRegisseur(@Param('centreId') centreId: string) {
    return this.adminService.dissocierCentreRegisseur(centreId);
  }

  @Get('users/connected')
  @ApiOperation({ summary: 'Récupérer les utilisateurs connectés (régisseurs et chefs de centres)' })
  @ApiResponse({ status: 200, description: 'Liste des utilisateurs connectés' })
  async getConnectedUsers() {
    return this.adminService.getConnectedUsers();
  }

  @Post('users/:userId/dissocier-regisseur')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dissocier un utilisateur de son régisseur' })
  @ApiResponse({ status: 200, description: 'Utilisateur dissocié avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable' })
  @ApiResponse({ status: 409, description: "L'utilisateur n'est pas associé à un régisseur" })
  async dissocierUtilisateurRegisseur(@Param('userId') userId: string) {
    return this.adminService.dissocierUtilisateurRegisseur(userId);
  }

  // ========================================
  // GESTION DES CENTRES
  // ========================================

  @Post('centres')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un nouveau centre de santé' })
  @ApiResponse({ status: 201, description: 'Centre créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 404, description: 'Régisseur introuvable' })
  @ApiResponse({ status: 409, description: 'Code centre déjà utilisé' })
  async createCentre(@Body() createCentreDto: CreateCentreDto) {
    return this.adminService.createCentre(createCentreDto);
  }

  @Get('centres')
  @ApiOperation({ summary: 'Récupérer tous les centres de santé' })
  @ApiResponse({ status: 200, description: 'Liste des centres' })
  @ApiResponse({ status: 500, description: 'Erreur serveur' })
  async getAllCentres() {
    try {
      return await this.adminService.getAllCentres();
    } catch (error) {
      console.error('Erreur lors de la récupération des centres:', error);
      throw error;
    }
  }

  @Get('centres/:id')
  @ApiOperation({ summary: 'Récupérer un centre par son ID' })
  @ApiResponse({ status: 200, description: 'Centre trouvé' })
  @ApiResponse({ status: 404, description: 'Centre introuvable' })
  async getCentreById(@Param('id') id: string) {
    return this.adminService.getCentreById(id);
  }

  @Put('centres/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mettre à jour un centre de santé' })
  @ApiResponse({ status: 200, description: 'Centre mis à jour avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 404, description: 'Centre ou régisseur introuvable' })
  async updateCentre(
    @Param('id') id: string,
    @Body() updateCentreDto: UpdateCentreDto,
  ) {
    return this.adminService.updateCentre(id, updateCentreDto);
  }

  @Delete('centres/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer un centre de santé' })
  @ApiResponse({ status: 200, description: 'Centre supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Centre introuvable' })
  @ApiResponse({ status: 409, description: 'Centre associé à des utilisateurs ou budgets' })
  async deleteCentre(@Param('id') id: string) {
    return this.adminService.deleteCentre(id);
  }

  // ========================================
  // GESTION DES CHEFS DE CENTRES
  // ========================================

  @Post('chefs-centres')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un nouveau chef de centre' })
  @ApiResponse({ status: 201, description: 'Chef de centre créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 404, description: 'Centre introuvable' })
  @ApiResponse({ status: 409, description: 'Email déjà utilisé' })
  async createChefCentre(@Body() createChefCentreDto: CreateChefCentreDto) {
    return this.adminService.createChefCentre(createChefCentreDto);
  }

  @Get('chefs-centres')
  @ApiOperation({ summary: 'Récupérer tous les chefs de centres' })
  @ApiResponse({ status: 200, description: 'Liste des chefs de centres' })
  async getAllChefsCentres() {
    return this.adminService.getAllChefsCentres();
  }

  @Get('chefs-centres/:id')
  @ApiOperation({ summary: 'Récupérer un chef de centre par son ID' })
  @ApiResponse({ status: 200, description: 'Chef de centre trouvé' })
  @ApiResponse({ status: 404, description: 'Chef de centre introuvable' })
  async getChefCentreById(@Param('id') id: string) {
    return this.adminService.getChefCentreById(id);
  }

  @Put('chefs-centres/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mettre à jour un chef de centre' })
  @ApiResponse({ status: 200, description: 'Chef de centre mis à jour avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 404, description: 'Chef de centre, centre ou régisseur introuvable' })
  @ApiResponse({ status: 409, description: 'Email déjà utilisé' })
  async updateChefCentre(
    @Param('id') id: string,
    @Body() updateChefCentreDto: UpdateChefCentreDto,
  ) {
    return this.adminService.updateChefCentre(id, updateChefCentreDto);
  }

  @Delete('chefs-centres/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer un chef de centre' })
  @ApiResponse({ status: 200, description: 'Chef de centre supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Chef de centre introuvable' })
  @ApiResponse({ status: 409, description: 'Chef de centre associé à des budgets' })
  async deleteChefCentre(@Param('id') id: string) {
    return this.adminService.deleteChefCentre(id);
  }

  // ========================================
  // GESTION DES DEMANDES DE RÉINITIALISATION DE MOT DE PASSE
  // ========================================

  @Get('password-reset-requests')
  @ApiOperation({ summary: 'Récupérer toutes les demandes de réinitialisation de mot de passe' })
  @ApiResponse({ status: 200, description: 'Liste des demandes de réinitialisation' })
  async getAllPasswordResetRequests() {
    return this.adminService.getAllPasswordResetRequests();
  }

  @Post('password-reset-requests/:requestId/generate-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Générer un nouveau mot de passe pour une demande de réinitialisation' })
  @ApiResponse({ status: 200, description: 'Nouveau mot de passe généré avec succès' })
  @ApiResponse({ status: 404, description: 'Demande introuvable' })
  @ApiResponse({ status: 409, description: 'Demande déjà traitée' })
  async generatePasswordForRequest(
    @Param('requestId') requestId: string,
    @Req() req: any,
  ) {
    const adminId = req.user?.id;
    return this.adminService.generatePasswordForRequest(requestId, adminId);
  }
}


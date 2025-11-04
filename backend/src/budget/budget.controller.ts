import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { SubmitBudgetDto } from './dto/submit-budget.dto';
import { CreateLigneBudgetaireDto } from './dto/create-ligne-budgetaire.dto';
import { UpdateLigneBudgetaireDto } from './dto/update-ligne-budgetaire.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleType } from '@prisma/client';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: RoleType;
    centreId?: string | null;
    regisseurId?: string | null;
  };
}

@Controller('budgets')
@UseGuards(JwtAuthGuard)
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Post()
  @Roles(RoleType.CHEF_CENTRE)
  async create(@Request() req: AuthenticatedRequest, @Body() dto: CreateBudgetDto) {
    try {
      const userId = req.user.id;
      const centreId = req.user.centreId;

      if (!centreId) {
        throw new Error('Utilisateur non associé à un centre');
      }

      console.log('[Budget Controller] Création budget:', {
        userId,
        centreId,
        nom: dto.nom,
        annee: dto.annee,
        type: dto.type,
        sourcesCount: dto.sourcesRecettes?.length || 0,
        lignesCount: dto.lignesBudgetaires?.length || 0,
      });
      
      // Log des données reçues pour debug
      console.log('[Budget Controller] DTO complet:', JSON.stringify(dto, null, 2));
      
      // Log détaillé des sources
      if (dto.sourcesRecettes) {
        console.log('[Budget Controller] Sources de recettes:', dto.sourcesRecettes.map(s => ({
          type: s.type,
          montant: s.montant,
          montantType: typeof s.montant,
          nature: s.nature,
        })));
      }

      const result = await this.budgetService.create(userId, centreId, dto);
      return result;
    } catch (error: any) {
      console.error('[Budget Controller] Erreur lors de la création:', error);
      console.error('[Budget Controller] Message:', error.message);
      console.error('[Budget Controller] Stack:', error.stack);
      console.error('[Budget Controller] Error name:', error.name);
      console.error('[Budget Controller] Error status:', error.status);
      
      // Si c'est une erreur HTTP déjà formatée, la re-lancer
      if (error instanceof HttpException) {
        throw error;
      }
      
      // Si c'est une erreur de validation (BadRequestException), la convertir en HttpException
      if (error.name === 'BadRequestException' || error.status === 400) {
        throw new HttpException(
          { message: error.message || 'Erreur de validation', error: 'Bad Request' },
          HttpStatus.BAD_REQUEST,
        );
      }
      
      // Pour les autres erreurs (Prisma, etc.), retourner une erreur 500 avec un message générique
      console.error('[Budget Controller] Erreur non gérée, conversion en 500');
      throw new HttpException(
        { 
          message: error.message || 'Erreur serveur lors de la création du budget', 
          error: 'Internal Server Error',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  async findAll(@Request() req: AuthenticatedRequest, @Query('centreId') centreId?: string) {
    const user = req.user;

    // Chef de centre : voir seulement ses budgets
    if (user.role === RoleType.CHEF_CENTRE) {
      const centreId: string | undefined = user.centreId !== null && user.centreId !== undefined ? user.centreId : undefined;
      return this.budgetService.findAll(centreId);
    }

    // Régisseur : voir budgets de ses centres
    if (user.role === RoleType.REGISSEUR) {
      const regisseurId: string | undefined = user.regisseurId !== null && user.regisseurId !== undefined ? user.regisseurId : undefined;
      return this.budgetService.findAll(undefined, regisseurId);
    }

    // Admin : voir tous les budgets
    return this.budgetService.findAll();
  }

  @Get('suggestions/activities')
  @Roles(RoleType.CHEF_CENTRE)
  async getActivitySuggestions(@Request() req: AuthenticatedRequest, @Query('q') query?: string) {
    const centreId = req.user.centreId;
    if (!centreId) {
      throw new Error('Utilisateur non associé à un centre');
    }
    return this.budgetService.getActivitySuggestions(centreId, query);
  }

  @Get('suggestions/activites-cles')
  @ApiOperation({ summary: 'Récupérer les suggestions d\'activités clés' })
  @ApiQuery({ name: 'q', required: false, description: 'Terme de recherche' })
  @ApiResponse({ status: 200, description: 'Liste des suggestions d\'activités clés' })
  async getActiviteCleSuggestions(@Query('q') query?: string) {
    return this.budgetService.getActiviteCleSuggestions(query);
  }

  @Get('suggestions/types-moyens')
  @ApiOperation({ summary: 'Récupérer les suggestions de types de moyens' })
  @ApiQuery({ name: 'q', required: false, description: 'Terme de recherche' })
  @ApiResponse({ status: 200, description: 'Liste des suggestions de types de moyens' })
  async getTypeMoyensSuggestions(@Query('q') query?: string) {
    return this.budgetService.getTypeMoyensSuggestions(query);
  }

  // Endpoints pour gérer les lignes budgétaires individuellement (doivent être avant les routes :id)
  @Post(':budgetId/lignes')
  @Roles(RoleType.CHEF_CENTRE)
  async createLigneBudgetaire(
    @Request() req: AuthenticatedRequest,
    @Param('budgetId') budgetId: string,
    @Body() dto: CreateLigneBudgetaireDto,
  ) {
    const userId = req.user.id;
    return this.budgetService.createLigneBudgetaire(budgetId, userId, dto);
  }

  @Get(':budgetId/lignes/:ligneId')
  @Roles(RoleType.CHEF_CENTRE)
  async getLigneBudgetaire(
    @Param('budgetId') budgetId: string,
    @Param('ligneId') ligneId: string,
  ) {
    return this.budgetService.getLigneBudgetaire(budgetId, ligneId);
  }

  @Put(':budgetId/lignes/:ligneId')
  @Roles(RoleType.CHEF_CENTRE)
  async updateLigneBudgetaire(
    @Request() req: AuthenticatedRequest,
    @Param('budgetId') budgetId: string,
    @Param('ligneId') ligneId: string,
    @Body() dto: UpdateLigneBudgetaireDto,
  ) {
    const userId = req.user.id;
    return this.budgetService.updateLigneBudgetaire(budgetId, ligneId, userId, dto);
  }

  @Delete(':budgetId/lignes/:ligneId')
  @Roles(RoleType.CHEF_CENTRE)
  async deleteLigneBudgetaire(
    @Request() req: AuthenticatedRequest,
    @Param('budgetId') budgetId: string,
    @Param('ligneId') ligneId: string,
  ) {
    const userId = req.user.id;
    return this.budgetService.deleteLigneBudgetaire(budgetId, ligneId, userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.budgetService.findOne(id);
  }

  @Get(':id/summary')
  async getSummary(@Param('id') id: string) {
    return this.budgetService.getSummary(id);
  }

  @Put(':id')
  @Roles(RoleType.CHEF_CENTRE)
  async update(@Request() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateBudgetDto) {
    try {
      const userId = req.user.id;
      return await this.budgetService.update(id, userId, dto);
    } catch (error: any) {
      console.error('[Budget Controller] Erreur lors de la mise à jour:', error);
      console.error('[Budget Controller] Message:', error.message);
      console.error('[Budget Controller] Stack:', error.stack);
      
      // Si c'est une erreur HTTP déjà formatée, la re-lancer
      if (error instanceof HttpException) {
        throw error;
      }
      
      // Si c'est une erreur de validation (BadRequestException), la convertir en HttpException
      if (error.name === 'BadRequestException' || error.status === 400) {
        throw new HttpException(
          { message: error.message || 'Erreur de validation', error: 'Bad Request' },
          HttpStatus.BAD_REQUEST,
        );
      }
      
      // Pour les autres erreurs (Prisma, etc.), retourner une erreur 500 avec un message générique
      throw new HttpException(
        { 
          message: error.message || 'Erreur serveur lors de la mise à jour du budget', 
          error: 'Internal Server Error',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/submit')
  @Roles(RoleType.CHEF_CENTRE)
  async submit(@Request() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto?: SubmitBudgetDto) {
    const userId = req.user.id;
    return this.budgetService.submit(id, userId);
  }

  @Post(':id/validate')
  @Roles(RoleType.REGISSEUR)
  async validate(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    const userId = req.user.id;
    return this.budgetService.validate(id, userId);
  }

  @Post(':id/reject')
  @Roles(RoleType.REGISSEUR)
  async reject(@Request() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: { raison?: string }) {
    const userId = req.user.id;
    return this.budgetService.reject(id, userId, dto.raison);
  }

  @Delete(':id')
  @Roles(RoleType.CHEF_CENTRE, RoleType.ADMIN)
  async delete(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    const userId = req.user.id;
    const userRole = req.user.role;
    return this.budgetService.delete(id, userId, userRole);
  }
}


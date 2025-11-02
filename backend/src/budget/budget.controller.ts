import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { SubmitBudgetDto } from './dto/submit-budget.dto';
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
    const userId = req.user.id;
    const centreId = req.user.centreId;

    if (!centreId) {
      throw new Error('Utilisateur non associé à un centre');
    }

    return this.budgetService.create(userId, centreId, dto);
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
    const userId = req.user.id;
    return this.budgetService.update(id, userId, dto);
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

  @Get('suggestions/activities')
  @Roles(RoleType.CHEF_CENTRE)
  async getActivitySuggestions(@Request() req: AuthenticatedRequest, @Query('q') query?: string) {
    const centreId = req.user.centreId;
    if (!centreId) {
      throw new Error('Utilisateur non associé à un centre');
    }
    return this.budgetService.getActivitySuggestions(centreId, query);
  }
}


import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AdminService } from '../admin/admin.service';
import { CreatePasswordResetRequestDto } from '../admin/dto/create-password-reset-request.dto';

@ApiTags('Authentification')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly adminService: AdminService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Créer un nouveau compte utilisateur' })
  @ApiResponse({ status: 201, description: 'Utilisateur créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 409, description: 'Email déjà utilisé' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Se connecter' })
  @ApiResponse({ status: 200, description: 'Connexion réussie' })
  @ApiResponse({ status: 401, description: 'Identifiants invalides' })
  async login(@Body() loginDto: LoginDto, @Request() req: any) {
    return this.authService.login(req.user);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtenir le profil utilisateur' })
  @ApiResponse({ status: 200, description: 'Profil récupéré' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.id);
  }

  @Post('password-reset-request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Créer une demande de réinitialisation de mot de passe (public)' })
  @ApiResponse({ status: 200, description: 'Demande créée avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable' })
  @ApiResponse({ status: 409, description: 'Demande déjà en attente' })
  async createPasswordResetRequest(@Body() createPasswordResetRequestDto: CreatePasswordResetRequestDto) {
    return this.adminService.createPasswordResetRequest(createPasswordResetRequestDto);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Changer le mot de passe (obligatoire après réinitialisation par admin)' })
  @ApiResponse({ status: 200, description: 'Mot de passe changé avec succès' })
  @ApiResponse({ status: 401, description: 'Non authentifié ou mot de passe actuel incorrect' })
  @ApiResponse({ status: 409, description: 'Le nouveau mot de passe doit être différent ou changement non requis' })
  async changePassword(@Request() req: any, @Body() changePasswordDto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.id, changePasswordDto.currentPassword, changePasswordDto.newPassword);
  }
}


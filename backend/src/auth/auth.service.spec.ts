import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { RoleType, StatutUser } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    centre: {
      findUnique: jest.fn(),
    },
    regisseur: {
      findUnique: jest.fn(),
    },
    auditAction: {
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should create a new user successfully', async () => {
      const registerDto = {
        email: 'test@cgcs.cg',
        password: 'password123',
        nom: 'Test',
        prenom: 'User',
        role: RoleType.CHEF_CENTRE,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: '1',
        email: registerDto.email,
        nom: registerDto.nom,
        prenom: registerDto.prenom,
        role: registerDto.role,
        statut: StatutUser.ACTIF,
      });

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('user');
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      const registerDto = {
        email: 'test@cgcs.cg',
        password: 'password123',
        nom: 'Test',
        prenom: 'User',
        role: RoleType.CHEF_CENTRE,
      };

      mockPrismaService.user.findUnique.mockResolvedValue({ id: '1' });

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('validateUser', () => {
    it('should validate user credentials successfully', async () => {
      const email = 'test@cgcs.cg';
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);

      const mockUser = {
        id: '1',
        email,
        password: hashedPassword,
        nom: 'Test',
        prenom: 'User',
        role: RoleType.CHEF_CENTRE,
        statut: StatutUser.ACTIF,
        centre: null,
        regisseur: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      const result = await service.validateUser(email, password);

      expect(result).toBeDefined();
      expect(result.email).toBe(email);
      expect(result).not.toHaveProperty('password');
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.validateUser('wrong@cgcs.cg', 'password')).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const mockUser = {
        id: '1',
        email: 'test@cgcs.cg',
        password: await bcrypt.hash('password123', 10),
        statut: StatutUser.INACTIF,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.validateUser('test@cgcs.cg', 'password123')).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('login', () => {
    it('should return access token and user info', async () => {
      const user = {
        id: '1',
        email: 'test@cgcs.cg',
        nom: 'Test',
        prenom: 'User',
        role: RoleType.CHEF_CENTRE,
        centreId: 'centre-1',
        regisseurId: 'regisseur-1',
      };

      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.login(user);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
      expect(result.access_token).toBe('mock-jwt-token');
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const userId = '1';
      const mockProfile = {
        id: userId,
        email: 'test@cgcs.cg',
        nom: 'Test',
        prenom: 'User',
        role: RoleType.CHEF_CENTRE,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockProfile);

      const result = await service.getProfile(userId);

      expect(result).toBeDefined();
      expect(result.id).toBe(userId);
    });
  });
});


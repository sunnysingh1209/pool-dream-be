import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleName } from '../../common/enums/role.enum';
import { RefreshTokenEntity } from '../../entities/refresh-token.entity';
import { UserIdentityEntity } from '../../entities/user-identity.entity';
import { PasswordHashService } from '../../infrastructure/common/password.service';
import { TokenHashService } from '../../infrastructure/common/token-hash.service';
import { RoleService } from '../role/role.service';
import { WalletService } from '../wallet/wallet.service';
import { AuthResponseDto, AuthUserDto } from './dto/auth-response.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserIdentityEntity)
    private readonly userRepository: Repository<UserIdentityEntity>,
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenRepository: Repository<RefreshTokenEntity>,
    private readonly roleService: RoleService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly walletService: WalletService,
  ) {}

  async signUp(dto: SignUpDto): Promise<AuthResponseDto> {
    if (dto.role && dto.role !== RoleName.USER) {
      throw new BadRequestException(
        'Only the "user" role can be self-assigned during sign-up',
      );
    }

    const existingUser = await this.userRepository.findOne({
      where: [{ email: dto.email }, { name: dto.name }],
    });
    if (existingUser) {
      throw new ConflictException(
        existingUser.email === dto.email
          ? 'Email is already registered'
          : 'Name is already taken',
      );
    }

    const user = this.userRepository.create({
      name: dto.name,
      email: dto.email,
      phoneNumber: dto.phoneNumber,
      passwordHash: PasswordHashService.hashPassword(dto.password),
      createdBy: dto.email,
    });
    const savedUser = await this.userRepository.save(user);
    await this.roleService.assignRole(savedUser.id, RoleName.USER, savedUser.email);
    await this.walletService.createWalletForUser(savedUser.id, savedUser.email);

    return this.buildAuthResponse(savedUser);
  }

  async signIn(dto: SignInDto): Promise<AuthResponseDto> {
    const user = await this.userRepository.findOne({
      where: [{ email: dto.email }, { name: dto.email }],
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!PasswordHashService.verifyPassword(user.passwordHash, dto.password)) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!user.isActive || user.isLocked) {
      throw new UnauthorizedException('Account is inactive or locked');
    }

    const isFirstLogin = !user.lastLoginAt;
    user.lastLoginAt = new Date();
    user.updatedBy = user.email;
    await this.userRepository.save(user);

    return this.buildAuthResponse(user, isFirstLogin);
  }

  async refreshToken(dto: RefreshTokenDto): Promise<AuthResponseDto> {
    const tokenHash = TokenHashService.hash(dto.refreshToken);
    const storedToken = await this.refreshTokenRepository.findOne({
      where: { tokenHash },
    });
    if (
      !storedToken ||
      storedToken.revokedAt ||
      storedToken.expiresAt.getTime() < Date.now()
    ) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.userRepository.findOne({
      where: { id: storedToken.userId },
    });
    if (!user || !user.isActive || user.isLocked) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    storedToken.revokedAt = new Date();
    await this.refreshTokenRepository.save(storedToken);

    return this.buildAuthResponse(user);
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Invalid session');
    }
    if (!PasswordHashService.verifyPassword(user.passwordHash, dto.oldPassword)) {
      throw new UnauthorizedException('Old password is incorrect');
    }

    user.passwordHash = PasswordHashService.hashPassword(dto.newPassword);
    user.updatedBy = user.email;
    await this.userRepository.save(user);

    return { message: 'Password updated successfully' };
  }

  async logout(dto: RefreshTokenDto): Promise<{ message: string }> {
    const tokenHash = TokenHashService.hash(dto.refreshToken);
    const storedToken = await this.refreshTokenRepository.findOne({
      where: { tokenHash },
    });
    if (storedToken && !storedToken.revokedAt) {
      storedToken.revokedAt = new Date();
      await this.refreshTokenRepository.save(storedToken);
    }
    return { message: 'Logged out successfully' };
  }

  private async buildAuthResponse(
    user: UserIdentityEntity,
    isFirstLogin = false,
  ): Promise<AuthResponseDto> {
    const roles = await this.roleService.getRoleNamesForUser(user.id);
    const payload: JwtPayload = { sub: user.id, email: user.email, roles };
    const authUser: AuthUserDto = {
      id: user.id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      roles,
    };
    return {
      user: authUser,
      accessToken: this.jwtService.sign(payload),
      refreshToken: await this.issueRefreshToken(user),
      isFirstLogin,
    };
  }

  private async issueRefreshToken(user: UserIdentityEntity): Promise<string> {
    const refreshTokenExpiresInDays = Number(
      this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN_DAYS') || 10,
    );
    const rawToken = TokenHashService.generateOpaqueToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshTokenExpiresInDays);

    const refreshToken = this.refreshTokenRepository.create({
      userId: user.id,
      tokenHash: TokenHashService.hash(rawToken),
      expiresAt,
      createdBy: user.email,
    });
    await this.refreshTokenRepository.save(refreshToken);

    return rawToken;
  }
}

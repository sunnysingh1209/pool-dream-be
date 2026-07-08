import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GameSubType } from '../../common/enums/game-sub-type.enum';
import { RoleName } from '../../common/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UpdateGameSubTypeDto } from './dto/game-sub-type.dto';
import { GameSubTypeService } from './game-sub-type.service';

@ApiTags('Game Sub Types')
@ApiBearerAuth('access-token')
@Controller('game/sub-types')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GameSubTypeController {
  constructor(private readonly gameSubTypeService: GameSubTypeService) {}

  @Get()
  listSubTypes() {
    return this.gameSubTypeService.listSubTypes();
  }

  @Get(':name')
  getSubType(@Param('name', new ParseEnumPipe(GameSubType)) name: GameSubType) {
    return this.gameSubTypeService.getSubType(name);
  }

  @Patch(':name')
  @Roles(RoleName.SUPER_ADMIN)
  updateSubType(
    @Param('name', new ParseEnumPipe(GameSubType)) name: GameSubType,
    @Body() dto: UpdateGameSubTypeDto,
    @CurrentUser() admin: CurrentUserPayload,
  ) {
    return this.gameSubTypeService.updateSubType(name, dto, admin.email);
  }
}

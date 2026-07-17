import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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

  @Get('results')
  getResultsBoard() {
    return this.gameSubTypeService.getResultsBoard();
  }

  @Get(':id')
  getSubType(@Param('id', ParseUUIDPipe) id: string) {
    return this.gameSubTypeService.getSubTypeById(id);
  }

  @Patch(':id')
  @Roles(RoleName.SUPER_ADMIN)
  updateSubType(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGameSubTypeDto,
    @CurrentUser() admin: CurrentUserPayload,
  ) {
    return this.gameSubTypeService.updateSubType(id, dto, admin.email);
  }
}

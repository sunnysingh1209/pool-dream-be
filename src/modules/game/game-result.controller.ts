import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { RoleName } from '../../common/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { DeclareResultDto } from './dto/declare-result.dto';
import { GameResultService } from './game-result.service';

@ApiTags('Game Results')
@ApiBearerAuth('access-token')
@Controller('game/results')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.SUPER_ADMIN)
export class GameResultController {
  constructor(private readonly gameResultService: GameResultService) {}

  @Post()
  declareResult(
    @CurrentUser() admin: CurrentUserPayload,
    @Body() dto: DeclareResultDto,
  ) {
    return this.gameResultService.declareResult(admin, dto);
  }

  @Get()
  listResults(@Query() pagination: PaginationQueryDto) {
    return this.gameResultService.listResults(pagination);
  }

  @Get(':id')
  getResult(@Param('id', ParseUUIDPipe) id: string) {
    return this.gameResultService.getResultById(id);
  }
}

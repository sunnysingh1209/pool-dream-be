import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RoleName } from '../../common/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { DeclareResultDto } from './dto/declare-result.dto';
import { ListResultsQueryDto } from './dto/list-results-query.dto';
import { UpdateResultDto } from './dto/update-result.dto';
import { GameResultService } from './game-result.service';

@ApiTags('Game Results')
@ApiBearerAuth('access-token')
@Controller('game/results')
@UseGuards(JwtAuthGuard)
export class GameResultController {
  constructor(private readonly gameResultService: GameResultService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleName.SUPER_ADMIN)
  declareResult(
    @CurrentUser() admin: CurrentUserPayload,
    @Body() dto: DeclareResultDto,
  ) {
    return this.gameResultService.declareResult(admin, dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleName.SUPER_ADMIN)
  updateResult(
    @CurrentUser() admin: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateResultDto,
  ) {
    return this.gameResultService.updateResult(admin, id, dto);
  }

  @Get()
  listResults(@Query() query: ListResultsQueryDto) {
    return this.gameResultService.listResults(query);
  }

  @Get(':id')
  getResult(@Param('id', ParseUUIDPipe) id: string) {
    return this.gameResultService.getResultById(id);
  }
}

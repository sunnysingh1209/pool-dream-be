import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ListBetsQueryDto } from './dto/list-bets-query.dto';
import { PlaceBetDto } from './dto/place-bet.dto';
import { GameService } from './game.service';

@ApiTags('Game')
@ApiBearerAuth('access-token')
@Controller('game/bets')
@UseGuards(JwtAuthGuard)
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post()
  placeBet(@CurrentUser() user: CurrentUserPayload, @Body() dto: PlaceBetDto) {
    return this.gameService.placeBet(user.id, user.email, dto);
  }

  @Get()
  listBets(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: ListBetsQueryDto,
  ) {
    return this.gameService.listBets(user, query, query.userId);
  }

  @Get(':id')
  getBet(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.gameService.getBetById(id, user);
  }
}

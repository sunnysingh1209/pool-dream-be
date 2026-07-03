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
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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
  @ApiQuery({
    name: 'userId',
    required: false,
    description: 'Superadmin-only filter; ignored for other roles.',
  })
  listBets(
    @CurrentUser() user: CurrentUserPayload,
    @Query() pagination: PaginationQueryDto,
    @Query('userId') userId?: string,
  ) {
    return this.gameService.listBets(user, pagination, userId);
  }

  @Get(':id')
  getBet(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.gameService.getBetById(id, user);
  }
}

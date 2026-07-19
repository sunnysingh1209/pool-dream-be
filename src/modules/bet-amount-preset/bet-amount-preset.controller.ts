import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BetAmountPresetService } from './bet-amount-preset.service';
import { AddBetAmountPresetDto } from './dto/add-bet-amount-preset.dto';

@ApiTags('Bet Amount Presets')
@ApiBearerAuth('access-token')
@Controller('game/bet-amount-presets')
@UseGuards(JwtAuthGuard)
export class BetAmountPresetController {
  constructor(private readonly betAmountPresetService: BetAmountPresetService) {}

  @Get('me')
  listMine(@CurrentUser() user: CurrentUserPayload) {
    return this.betAmountPresetService.listForUser(user.id);
  }

  @Post('me')
  addMine(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: AddBetAmountPresetDto,
  ) {
    return this.betAmountPresetService.addAmount(user.id, dto.amount, user.email);
  }

  @Delete('me/:id')
  deleteMine(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.betAmountPresetService.deleteAmount(user.id, id);
  }
}

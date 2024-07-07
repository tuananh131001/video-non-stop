import { Controller, Get, Param, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  root(@Res() res: Response) {
    return res.redirect(`/${randomUUID()}`);
  }

  @Get('/:roomId')
  createRoom(@Res() res: Response, @Param() params: any) {
    return res.render('room', { roomId: params.roomId });
  }
}

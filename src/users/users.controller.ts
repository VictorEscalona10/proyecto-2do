import { Controller, Query, Get, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersSearchDto } from './dto/usersSearch.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('search')
  @HttpCode(HttpStatus.OK)
  async searchUsers(@Query() query: UsersSearchDto) {
    return this.usersService.search(query);
  }

  @Delete('delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Query('email') email: string) {
    return this.usersService.delete(email);
  }

}

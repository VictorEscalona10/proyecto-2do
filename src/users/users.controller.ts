import { Controller, Query, Get, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersSearchDto } from './dto/usersSearch.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('search')
  async searchUsers(@Query() query: UsersSearchDto) {
    return this.usersService.search(query);
  }

  @Delete('delete')
  async deleteUser(@Query('email') email: string) {
    return this.usersService.delete(email);
  }

}

import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { NbeService, ListNbeQuery } from './nbe.service';

// Global prefix 'api' is set in main.ts, so the effective route is /api/nbe
@Controller('nbe')
export class NbeController {
  constructor(private readonly nbeService: NbeService) {}

  @Get()
  async list(
    @Query('q') q?: string,
    @Query('categorie') categorie?: string,
    @Query('sousCategorie') sousCategorie?: string,
    @Query('sort') sort: any = 'ligne',
    @Query('dir') dir: any = 'asc',
    @Query('page') page: any = '1',
    @Query('pageSize') pageSize: any = '50',
  ) {
    const query: ListNbeQuery = {
      q,
      categorie,
      sousCategorie,
      sort,
      dir,
      page: parseInt(String(page), 10) || 1,
      pageSize: parseInt(String(pageSize), 10) || 50,
    };
    return this.nbeService.list(query);
  }

  // Bootstrap endpoint (optional, for admin/dev use)
  @Post('bootstrap')
  async bootstrap(@Body() body: { lines: Array<any> }) {
    const lines = Array.isArray(body?.lines) ? body.lines : [];
    return this.nbeService.replaceAll(lines);
  }
}



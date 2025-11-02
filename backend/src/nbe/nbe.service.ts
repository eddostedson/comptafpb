import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ListNbeQuery {
  q?: string;
  categorie?: string;
  sousCategorie?: string;
  sort?: 'ligne' | 'libelle' | 'categorie' | 'sousCategorie';
  dir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

@Injectable()
export class NbeService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListNbeQuery) {
    const {
      q,
      categorie,
      sousCategorie,
      sort = 'ordre',
      dir = 'asc',
      page = 1,
      pageSize = 50,
    } = query;

    const where: any = {};
    if (q) {
      where.OR = [
        { libelle: { contains: q, mode: 'insensitive' } },
        { ligne: { contains: q, mode: 'insensitive' } },
        { objetDepense: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (categorie && categorie !== 'all') where.categorie = categorie;
    if (sousCategorie) where.sousCategorie = sousCategorie;

    const skip = (Math.max(1, page) - 1) * Math.max(1, pageSize);
    const take = Math.max(1, Math.min(500, pageSize));

    const [items, total] = await this.prisma.$transaction([
      this.prisma.nbeLine.findMany({
        where,
        orderBy: sort === 'ligne'
          ? [{ ligne: dir }, { ordre: 'asc' }]
          : [{ ordre: dir }, { ligne: 'asc' }],
        skip,
        take,
      }),
      this.prisma.nbeLine.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize: take,
      totalPages: Math.ceil(total / take),
    };
  }

  async replaceAll(lines: Array<any>) {
    // Clean then insert
    await this.prisma.$transaction([
      this.prisma.nbeLine.deleteMany({}),
    ]);

    if (!lines?.length) return { inserted: 0 };

    // Chunk inserts to avoid parameter limits
    const chunkSize = 500;
    let inserted = 0;
    for (let i = 0; i < lines.length; i += chunkSize) {
      const chunk = lines.slice(i, i + chunkSize);
      const res = await this.prisma.nbeLine.createMany({ data: chunk });
      inserted += res.count;
    }
    return { inserted };
  }
}



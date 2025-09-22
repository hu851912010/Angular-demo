import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of, firstValueFrom } from 'rxjs';
import { RegionRepository } from './region.repository';

type RegionDto = { code: string; name: string; parent?: string; level?: string };

@Injectable({ providedIn: 'root' })
export class RegionSyncService {
  private http = inject(HttpClient);
  private repo = inject(RegionRepository);

  // 首次种子：只拉省份，写入 IndexedDB
  async ensureSeed() {
    const provinces = await firstValueFrom(
      this.http.get<RegionDto[]>('/api/region', { params: { level: 'province' } })
        .pipe(
          catchError(() => of([] as RegionDto[])) // ← 兜底为空数组，永远不是 undefined
        )
    );

    if (!provinces.length) return; // 空就不写
    await this.repo.upsertRegions(
      provinces.map(p => ({
        code: p.code,
        name: p.name,
        parent: '',                    // 顶级规范为 ''
        level: 'province',
        updatedAt: Date.now(),
      }))
    );
  }

  // 按需加载某父级的子级（市/区）
  async ensureChildren(parentCode: string) {
    if (!parentCode) throw new Error('parentCode is required');

    const children = await firstValueFrom(
      this.http.get<RegionDto[]>('/api/region', { params: { parent: parentCode } })
        .pipe(
          catchError(() => of([] as RegionDto[])) // ← 同样兜底为空数组
        )
    );

    if (!children.length) return;
    await this.repo.upsertRegions(
      children.map(c => ({
        code: c.code,
        name: c.name,
        parent: parentCode,            // 子级的 parent 固定为调用入参
        level: c.level ?? undefined,   // 有就带上
        updatedAt: Date.now(),
      }))
    );
  }
}

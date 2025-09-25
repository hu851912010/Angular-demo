import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of, firstValueFrom,Observable, defer, from  } from 'rxjs';
import { RegionRepository } from './region.repository';
import { Region } from '../db/his-db';
import { startWith, switchMap, tap, shareReplay, map } from 'rxjs/operators';
type RegionDto = { code: string; name: string; parentCode?: string; level?: string };

@Injectable({ providedIn: 'root' })
export class RegionSyncService {
  private http = inject(HttpClient);
  private repo = inject(RegionRepository);
   apiurl = '/api/AdministrativeDivisions/children';
  // 首次种子：只拉省份，写入 IndexedDB
  async ensureSeed() {
     const hasProvinces = (await this.repo.getProvinces()).length > 0;
  if (hasProvinces) return;  // 已有数据就不请求
    const provinces = await firstValueFrom(
      this.http.get<RegionDto[]>(this.apiurl)
        .pipe(
          catchError(() => of([] as RegionDto[])) // ← 兜底为空数组，永远不是 undefined
        )
    );

    if (!provinces.length) return; // 空就不写
    await this.repo.upsertRegions(
      provinces.map(p => ({
        code: p.code,
        name: p.name,
        parentCode: '',                    // 顶级规范为 ''
        level: '1',
        updatedAt: Date.now(),
      }))
    );
  }

  loadChildren$(parentCode: string): Observable<Region[]> {
   parentCode = parentCode ?? '';
  // 先读本地，无则拉远端并回写，再返回
  return defer(() => this.repo.getChildren(parentCode)).pipe(
    switchMap(local => {
      if (local.length > 0) return of(local);

      return this.http.get<RegionDto[]>(this.apiurl, { params: { parentCode: parentCode } }).pipe(
        catchError(() => of([] as RegionDto[])),
        tap(children => {
          if (children.length) {
            this.repo.upsertRegions(children.map(c => ({
              code: c.code,
              name: c.name,
              parentCode,
              level: c.level ?? undefined,
              updatedAt: Date.now(),
            })));
          }
        }),
        map(children => children as Region[]) // 保持返回 Region[]
      );
    })
  );
}

}

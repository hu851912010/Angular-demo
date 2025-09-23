import { Injectable } from '@angular/core';
import { db, Region } from '../db/his-db';

@Injectable({ providedIn: 'root' })
export class RegionRepository {

  // 批量写入/更新（从后端拉回来的某一级列表）
  async upsertRegions(list: Region[]) {
    // （可选）顺便归一化，防止存入 undefined/null
    await db.regions.bulkPut(list.map(r => ({ ...r, parentCode: r.parentCode ?? '' })));
  }

  // 取省份（parent 为空或 '000000'）
  getProvinces() {
    return db.regions.where('parent').anyOf('', '000000').toArray(); // ✅ 不再传 undefined
  }

  // 取某父级的下级（市/区）
  getChildren(parentCode: string) {
    // 防御：避免把 ''/undefined 传进 equals
    if (!parentCode) throw new Error('parentCode is required');
    return db.regions.where('parent').equals(parentCode).toArray();
  }

  // 搜索（按名称前缀）
  searchByNamePrefix(prefix: string, limit = 20) {
    return db.regions.where('name').startsWith(prefix).limit(limit).toArray();
  }

  // 是否已初始化（例如是否有省份）
  async isSeeded() {
    return (await db.regions.count()) > 0;
  }
}

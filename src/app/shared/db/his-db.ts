import Dexie, { Table } from 'dexie';

export interface Region {
  code: string;      // 如 110000 / 110100 / 110101
  name: string;      // 名称
  parentCode?: string;   // 父级 code（省的 parent 可为空）
  updatedAt: number; // 时间戳，支持增量
}

export class HISDB extends Dexie {
  regions!: Table<Region, string>;  // 主键 code
  constructor() {
    
    super('his-db');
    this.version(1).stores({
      // 索引：按 parent 查询子级、按 name/updatedAt 检索
      regions: 'code, parentCode, name, updatedAt'
    })
    ;
  }
}
export const db = new HISDB();

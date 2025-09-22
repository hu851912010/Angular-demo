import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { shareReplay } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Ethnic, Country } from '../models/dict.model';

@Injectable({ providedIn: 'root' })
export class DictService {
  private http = inject(HttpClient);

  private ethnics$?: Observable<Ethnic[]>;
  private countries$?: Observable<Country[]>;

  getEthnics() {
    return this.ethnics$ ??= this.http
      .get<Ethnic[]>('/assets/dicts/ethnic.json')
      .pipe(shareReplay(1));
  }

  getCountries() {
    return this.countries$ ??= this.http
      .get<Country[]>('/assets/dicts/country_full_cn.json')
      .pipe(shareReplay(1));
  }
}

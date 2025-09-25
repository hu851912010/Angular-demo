import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { provideNativeDateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';



export const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'YYYY-MM-DD',  // 输入解析格式
  },
  display: {
    dateInput: 'YYYY-MM-DD',  // 输入框显示格式
    monthYearLabel: 'YYYY 年 MM 月',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'YYYY 年 MM 月',
  },
};
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
    providers: [
    provideNativeDateAdapter(),                   // 使用原生日期适配器
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'zh-CN' }
  ]
})
export class App {
  protected readonly title = signal('my-first-app');
}





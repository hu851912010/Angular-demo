import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection,APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations'; 
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { RegionSyncService } from './shared/services/region.sync.service';
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi()),
     {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [RegionSyncService],
      useFactory: (sync: RegionSyncService) => () => sync.ensureSeed(), // ← 启动拉省份
    }
  ]
};

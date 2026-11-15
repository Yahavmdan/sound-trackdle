import { ErrorHandler } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { version } from './environments/version';
import { prepareStorage, recoverFromStartupError } from './app/shared/utilities/storage-recovery';

prepareStorage(version);

/** An error in the first seconds usually means bad saved data: clear it and reload once. */
class StartupErrorHandler extends ErrorHandler {
  override handleError(error: unknown): void {
    super.handleError(error);
    recoverFromStartupError();
  }
}

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [...appConfig.providers, {provide: ErrorHandler, useClass: StartupErrorHandler}]
}).catch((err) => {
  console.error(err);
  recoverFromStartupError(true);
});

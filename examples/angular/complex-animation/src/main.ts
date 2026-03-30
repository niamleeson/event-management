import { bootstrapApplication } from '@angular/platform-browser'
import { AppComponent } from './app.component'
import { providePulse, PulseService } from '@pulse/angular'
import { engine } from './engine'

bootstrapApplication(AppComponent, {
  providers: [
    providePulse(engine),
    PulseService,
  ],
}).catch((err) => console.error(err))

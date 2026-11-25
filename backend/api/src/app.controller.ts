import { Controller, Get } from '@nestjs/common';
import { HealthCheckService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly healthCheckService: HealthCheckService) {}

  @Get()
  healthCheck() {
    return this.healthCheckService.execute({ cache: true });
  }
}

export enum HealthCheckServiceName {
  DATABASE = 'DATABASE',
  CACHE_MANAGER = 'CACHE_MANAGER',
  GATEWAY_1 = 'GATEWAY_1', // NOXPAY
  GATEWAY_2 = 'GATEWAY_2', // CRYPTOMUS
  GATEWAY_3 = 'GATEWAY_3', // STRIPE
  DATA_BREACH_MONITORING_PROVIDER_1 = 'DATA_BREACH_MONITORING_PROVIDER_1', // HIBP
  VISION = 'VISION', // HIBP
}

export enum HealthCheckStatus {
  UP = 'UP',
  DOWN = 'DOWN',
}

export interface IHealthCheck {
  cache: boolean;
}

export interface IHealthCheckResult {
  [key: string]: {
    status: HealthCheckStatus;
    response_time: string;
    message?: string;
  };
}

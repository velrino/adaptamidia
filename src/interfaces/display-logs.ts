export enum DisplayType {
  ADVERTISEMENT = "ADVERTISEMENT",
  NEWS = "NEWS",
}

export enum DisplayLogStatus {
  STARTED = "STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  FINISHED = "FINISHED",
}

export enum IApiDashboardDisplayLogType {
  TOTAL_BY_TYPE = "TOTAL_BY_TYPE",
}

export enum DisplayLogSortKey {
  local_unit_name = "local_unit.name",
  type = "type",
  status = "status",
  created_at = "created_at",
  updated_at = "updated_at",
}

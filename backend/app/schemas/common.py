from datetime import datetime
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


class ServiceCount(CamelModel):
    service: str
    count: int
    cost: float


class RegionCount(CamelModel):
    region: str
    count: int
    cost: float


class TrendPoint(CamelModel):
    date: str
    resources: int
    cost: float


class AwsAccountOut(CamelModel):
    id: str
    name: str
    aws_account_id: str
    role_arn: str
    external_id: str
    status: str
    regions: list[str]
    last_scan_at: datetime | None
    created_at: datetime


class AwsAccountCreate(CamelModel):
    name: str
    aws_account_id: str
    role_arn: str
    external_id: str
    regions: list[str] = []


class ResourceOut(CamelModel):
    id: str
    account_id: str
    service: str
    type: str
    name: str
    arn: str
    region: str
    state: str
    tags: dict[str, str]
    monthly_cost: float
    last_used_days: int | None
    owner: str
    environment: str
    risk_score: str
    unused: bool


class DashboardSummary(CamelModel):
    total_resources: int
    monthly_cost: float
    potential_savings: float
    risk_score: int
    by_service: list[ServiceCount]
    by_region: list[RegionCount]
    growth_trend: list[TrendPoint]
    recommendation_count: int


class DependencyNode(CamelModel):
    id: str
    label: str
    service: str


class DependencyEdgeOut(CamelModel):
    source: str
    target: str


class DependencyGraphOut(CamelModel):
    resource_id: str
    nodes: list[DependencyNode]
    edges: list[DependencyEdgeOut]
    risk: str
    affected: list[str]


class RecommendationOut(CamelModel):
    id: str
    resource_id: str
    resource_name: str
    service: str
    reason: str
    action: str
    confidence: int
    estimated_savings: float


class CleanupWarning(CamelModel):
    resource_name: str
    message: str
    risk: str


class CleanupPlanCreate(CamelModel):
    resource_ids: list[str]


class CleanupPlanOut(CamelModel):
    id: str
    resource_ids: list[str]
    resource_count_by_service: list[ServiceCount]
    total_count: int
    estimated_savings: float
    estimated_duration_minutes: int
    warnings: list[CleanupWarning]
    created_at: datetime


class CleanupHistoryOut(CamelModel):
    id: str
    user: str
    started_at: datetime
    finished_at: datetime | None
    status: str
    resources_deleted: int
    resources_failed: int
    savings: float


class CleanupTemplateOut(CamelModel):
    id: str
    name: str
    description: str
    filters: dict[str, str]


class CostAnalyticsOut(CamelModel):
    current_cost: float
    potential_savings: float
    by_service: list[ServiceCount]
    by_region: list[RegionCount]
    trend: list[TrendPoint]
    top_expensive: list[ResourceOut]


class AdminStatsOut(CamelModel):
    connected_accounts: int
    total_scans: int
    resources_managed: int
    savings_generated: float
    active_users: int


class LoginRequest(CamelModel):
    email: str
    password: str


class SignupRequest(CamelModel):
    name: str
    email: str
    password: str


class VerifyRequest(CamelModel):
    email: str
    code: str


class AuthResponse(CamelModel):
    token: str
    email: str
    name: str


class UserOut(CamelModel):
    email: str
    name: str


class MessageResponse(CamelModel):
    message: str

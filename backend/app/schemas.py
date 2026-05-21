from datetime import date, datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, EmailStr, Field

RoleType = Literal["ADMIN", "MANAGER", "DIRECTOR", "AGENT"]
SubscriptionPlan = Literal["basic", "pro"]
SubscriptionStatus = Literal["inactive", "active", "past_due"]
ApartmentStatus = Literal["AVAILABLE", "BOOKED", "MORTGAGE", "SOLD", "RESERVED"]
DealStage = Literal["LEAD", "SELECTION", "BOOKING", "MORTGAGE", "DDU", "CLOSED"]


class SubscriptionRead(BaseModel):
    plan: SubscriptionPlan
    status: SubscriptionStatus
    ai_scope: Literal["internal", "external"]
    started_at: Optional[datetime] = None
    renewal_at: Optional[datetime] = None
    last_payment_at: Optional[datetime] = None
    amount: Optional[float] = None

    class Config:
        from_attributes = True


class SubscriptionPlanRead(BaseModel):
    code: SubscriptionPlan
    title: str
    price: float
    period_days: int
    ai_scope: Literal["internal", "external"]
    features: List[str]


class SubscriptionCheckoutRequest(BaseModel):
    plan: SubscriptionPlan


class SubscriptionCheckoutResponse(BaseModel):
    payment_url: str
    message: str
    subscription: SubscriptionRead


class NotificationRead(BaseModel):
    id: int
    title: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserBase(BaseModel):
    login: str = Field(..., max_length=150)
    email: EmailStr
    phone: Optional[str] = None
    full_name: str = Field(..., max_length=255)


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    role: RoleType = "MANAGER"


class UserUpdate(BaseModel):
    login: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    full_name: Optional[str] = None


class UserRoleUpdate(BaseModel):
    role: RoleType


class UserRead(UserBase):
    id: int
    is_active: bool
    role: RoleType
    created_date: datetime

    class Config:
        from_attributes = True


class UserMe(UserRead):
    subscription: Optional[SubscriptionRead] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None


class ClientBase(BaseModel):
    full_name: str
    phone: str
    email: Optional[EmailStr] = None
    source: Optional[str] = None
    notes: Optional[str] = None


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    source: Optional[str] = None
    notes: Optional[str] = None


class ClientRead(ClientBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ApartmentBase(BaseModel):
    number: str
    district: Optional[str] = None
    floor: int
    area: float
    rooms: int
    price: float
    status: ApartmentStatus
    section_id: int


class ApartmentCreate(ApartmentBase):
    pass


class ApartmentStatusUpdate(BaseModel):
    status: ApartmentStatus


class ApartmentUpdate(BaseModel):
    number: Optional[str] = None
    district: Optional[str] = None
    floor: Optional[int] = None
    area: Optional[float] = None
    rooms: Optional[int] = None
    price: Optional[float] = None
    status: Optional[ApartmentStatus] = None
    section_id: Optional[int] = None


class ApartmentRead(ApartmentBase):
    id: int

    class Config:
        from_attributes = True


class DealBase(BaseModel):
    stage: DealStage
    amount: float = Field(default=0, ge=0)
    client_id: int
    manager_id: int
    apartment_id: Optional[int] = None
    expected_close_date: Optional[date] = None
    notes: Optional[str] = None


class DealCreate(DealBase):
    pass


class DealUpdate(BaseModel):
    amount: Optional[float] = Field(default=None, ge=0)
    apartment_id: Optional[int] = None
    expected_close_date: Optional[date] = None
    notes: Optional[str] = None


class DealAssign(BaseModel):
    manager_id: int


class DealStageUpdate(BaseModel):
    stage: DealStage


class DealRead(DealBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardSummary(BaseModel):
    total_clients: int
    active_deals: int
    closed_deals: int
    total_apartments: int
    sold_apartments: int
    reserved_apartments: int
    available_apartments: int
    total_revenue: float


class AISeriesPoint(BaseModel):
    label: str
    value: float


class AIDemandForecast(BaseModel):
    title: str
    points: List[AISeriesPoint]


class AIEnvironmentInsight(BaseModel):
    module: Literal["internal", "external"]
    summary: str
    factors: List[str]
    recommendations: List[str] = Field(default_factory=list)


class AIChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1, max_length=2000)


class AIChatRequest(BaseModel):
    messages: List[AIChatMessage] = Field(..., min_length=1, max_length=12)


class AIChatResponse(BaseModel):
    reply: str
    suggestions: List[str] = Field(default_factory=list)


class AnalyticsOverview(BaseModel):
    conversion_rate: float
    avg_sale_cycle_days: int
    project_rating: float
    repeat_contacts: float


class AnalyticsReport(BaseModel):
    report_period: str
    deals_total: int
    deals_closed: int
    conversion_rate: float
    revenue_total: float
    top_manager: Optional[str] = None


class AnalyticsRunCreate(BaseModel):
    scope: Literal["internal", "external"] = "internal"
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    notes: Optional[str] = None


class AnalyticsRunUpdate(BaseModel):
    notes: Optional[str] = None


class AnalyticsRunRead(BaseModel):
    id: int
    scope: Literal["internal", "external"]
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    summary: str
    payload: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class InteractionBase(BaseModel):
    type: str
    date: datetime
    description: str
    duration_minutes: Optional[int] = None
    client_id: int
    deal_id: Optional[int] = None


class InteractionCreate(InteractionBase):
    pass


class InteractionUpdate(BaseModel):
    type: Optional[str] = None
    date: Optional[datetime] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    deal_id: Optional[int] = None


class InteractionRead(InteractionBase):
    id: int
    user_id: Optional[int] = None
    created_date: datetime

    class Config:
        from_attributes = True

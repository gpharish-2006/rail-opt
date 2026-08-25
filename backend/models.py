from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# ── Auth Schemas ─────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str
    department: Optional[str] = "Engineering"
    role: Optional[str] = "engineer"


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    department: str


class AuthResponse(BaseModel):
    success: bool
    message: str
    user: Optional[UserOut] = None
    token: Optional[str] = None


# ── COA Train Timetable Schemas ─────────────────────────────────────────────
class TrainSchedule(BaseModel):
    id: int
    train_no: str
    name: str
    train_type: str  # Vande Bharat, Shatabdi, Rajdhani, Express, Goods/Freight
    corridor_id: int
    origin_station: str
    destination_station: str
    departure_time: str
    arrival_time: str
    days_of_week: str
    priority_score: float  # Vande Bharat = 10, Freight = 3
    avg_delay_min: float = 0.0


# ── Unified Departmental Defects (TMS, SMMS, TDMS) ───────────────────────────
class UnifiedDefect(BaseModel):
    id: int
    task_code: str
    title: str
    description: Optional[str] = ""
    department: str  # Engineering (TMS), S&T (SMMS), Traction (TDMS)
    defect_type: Optional[str] = None  # Rail Fracture, Point Machine Overhaul, Cantilever Alignment
    gear_or_mast_id: Optional[str] = None  # signal_gear_id or ohe_mast_id
    corridor_id: int
    km_start: float
    km_end: float
    required_duration_mins: float
    criticality: int = 5
    urgency: int = 5
    safety_risk: int = 5
    overdue_days: int = 0
    speed_impact_kmh: float = 0.0
    weather_risk: float = 0.0
    ai_risk_score: float = 0.0
    status: str = "Pending"


class MaintenanceTaskCreate(BaseModel):
    task_code: Optional[str] = None
    title: str
    description: Optional[str] = ""
    department: str
    asset_id: Optional[int] = None
    corridor_id: Optional[int] = None
    km_start: Optional[float] = None
    km_end: Optional[float] = None
    duration_hours: float
    criticality: int = 5
    urgency: int = 5
    safety_risk: int = 5
    overdue_days: int = 0
    train_impact: int = 5
    speed_impact_kmh: Optional[float] = 0.0
    weather_risk: Optional[float] = 0.0
    scheduled_date: Optional[str] = None
    requested_by: Optional[str] = None


# ── Optimizer Engine Requests & Responses ──────────────────────────────────────
class OptimizeRequest(BaseModel):
    target_date: Optional[str] = None
    corridor_id: Optional[int] = None
    time_window_start: Optional[str] = "00:00"
    time_window_end: Optional[str] = "23:59"
    task_ids: Optional[List[int]] = None
    max_simultaneous_blocks: Optional[int] = 3


class OptimizerPlanRequest(BaseModel):
    horizon: str = "weekly"  # "24h", "weekly", "monthly"
    corridor_id: Optional[int] = None
    target_date: Optional[str] = None
    max_simultaneous_blocks: int = 3


class RescheduleRequest(BaseModel):
    train_id: int
    delay_mins: float
    corridor_id: Optional[int] = None


class BlockRecommendation(BaseModel):
    corridor_code: str
    corridor_name: str
    start_time: str
    end_time: str
    duration_hours: float
    departments: List[str]
    tasks: list
    priority_score: float
    train_conflicts: int
    estimated_delay_min: float
    block_utilization: float
    explanation: List[str]
    time_slot_label: str
    is_mega_block: bool = True
    downtime_saved_mins: float = 0.0


class OptimizerPlanResponse(BaseModel):
    success: bool
    horizon: str
    mega_blocks_created: int
    total_hours_saved: float
    downtime_reduction_pct: float
    schedule_json: List[Dict[str, Any]]
    recommendations: List[BlockRecommendation]

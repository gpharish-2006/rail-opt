from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ── Auth ──────────────────────────────────────────────────────────────────────
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


# ── Maintenance ───────────────────────────────────────────────────────────────
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
    scheduled_date: Optional[str] = None
    requested_by: Optional[str] = None


# ── Block Optimization ────────────────────────────────────────────────────────
class OptimizeRequest(BaseModel):
    target_date: Optional[str] = None
    corridor_id: Optional[int] = None
    time_window_start: Optional[str] = "00:00"
    time_window_end: Optional[str] = "23:59"
    task_ids: Optional[List[int]] = None


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

from pydantic import AliasChoices, BaseModel, Field
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
    train_type: str  # Vande Bharat, Shatabdi, Rajdhani, Duronto, Superfast, Express, Mail, Goods/Freight
    corridor_id: int
    origin_station: str
    destination_station: str
    departure_time: str
    arrival_time: str
    days_of_week: str
    priority_score: float  # Vande Bharat=10, Shatabdi=9.5, Rajdhani=9, Duronto=8.5, Superfast=7.5, Express/Mail=6-7, Freight=3
    avg_delay_min: float = 0.0


# ── Unified Departmental Defects (TMS, SMMS, TDMS) ───────────────────────────
class UnifiedDefect(BaseModel):
    id: Optional[int] = None
    task_code: Optional[str] = None
    title: str
    description: Optional[str] = ""
    department: str              # Engineering (TMS), S&T (SMMS), Traction (TDMS)
    defect_type: Optional[str] = None  # Rail Fracture, Point Machine Overhaul, Cantilever Alignment …
    gear_or_mast_id: Optional[str] = None
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
    scheduled_date: Optional[str] = None
    requested_by: Optional[str] = None
    duration_adjusted_mins: Optional[float] = None  # Night/monsoon adjusted duration


# ── DefectLog — Spec §2 naming-compatible alias ───────────────────────────────
# Maps field names from the spec (section_km_start / section_km_end, etc.)
# while keeping full interoperability with UnifiedDefect.
class DefectLog(BaseModel):
    """
    Canonical defect record as specified in §2.
    Used by GET /api/maintenance/unified-defects response serialisation
    and the AI risk engine input.
    """
    defect_id: int
    department: str             # TMS | SMMS | TDMS
    section_km_start: float
    section_km_end: float
    defect_type: str
    estimated_duration_mins: float
    overdue_days: int = 0
    ai_risk_score: float = 0.0
    duration_adjusted_mins: Optional[float] = None

    @classmethod
    def from_unified_defect(cls, row: Dict[str, Any]) -> "DefectLog":
        """Convert a unified_defects DB row into a DefectLog."""
        return cls(
            defect_id=row.get("id", 0),
            department=row.get("department", "Engineering"),
            section_km_start=row.get("km_start", 0.0),
            section_km_end=row.get("km_end", 0.0),
            defect_type=row.get("defect_type", "General Maintenance"),
            estimated_duration_mins=row.get("required_duration_mins", 60.0),
            overdue_days=row.get("overdue_days", 0),
            ai_risk_score=row.get("ai_risk_score", 0.0),
            duration_adjusted_mins=row.get("duration_adjusted_mins"),
        )


# ── BlockPlan — Spec §2 naming-compatible schema ─────────────────────────────
class BlockPlan(BaseModel):
    """
    Mega-Block plan record as specified in §2.
    Mirrors the block_plans DB table with JSON-decoded list fields.
    """
    block_id: int
    section_id: int                          # corridor_id
    start_time: str
    end_time: str
    is_mega_block: bool = True
    merged_departments: List[str] = []       # e.g. ["TMS", "SMMS"]
    assigned_task_ids: List[str] = []        # e.g. ["TMS-101", "SMMS-201"]
    downtime_saved_mins: float = 0.0
    priority_score: float = 0.0
    status: str = "Proposed"


class MegaBlocksResponse(BaseModel):
    """Response model for GET /api/plans/mega-blocks."""
    success: bool
    total: int
    mega_blocks: List[BlockPlan]
    total_downtime_saved_mins: float


# ── Maintenance Task Schemas ──────────────────────────────────────────────────
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
    horizon: str = "weekly"   # "24h" | "weekly" | "monthly"
    corridor_id: Optional[int] = None
    target_date: Optional[str] = None
    max_simultaneous_blocks: int = 3


class RescheduleRequest(BaseModel):
    train_id: int
    delay_minutes: float = Field(
        validation_alias=AliasChoices("delay_minutes", "delay_mins"),
        gt=0,
    )
    section_id: Optional[str] = None
    corridor_id: Optional[int] = None

    @property
    def delay_mins(self) -> float:
        return self.delay_minutes


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
    schedule_timeline_json: List[Dict[str, Any]] = []
    recommendations: List[BlockRecommendation] = []

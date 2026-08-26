from fastapi import APIRouter, Header, HTTPException
from database import get_db, hash_password
from models import LoginRequest, SignupRequest, AuthResponse, UserOut
import hashlib

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest):
    db = get_db()
    try:
        hashed = hash_password(req.password)
        row = db.execute(
            "SELECT * FROM users WHERE email=? AND password=?", (req.email, hashed)
        ).fetchone()
        if not row:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        user = UserOut(
            id=row["id"],
            name=row["name"],
            email=row["email"],
            role=row["role"],
            department=row["department"],
        )
        return AuthResponse(
            success=True,
            message="Login successful",
            user=user,
            token=f"mock-jwt-{row['id']}-railopt",
        )
    finally:
        db.close()


@router.post("/signup", response_model=AuthResponse)
def signup(req: SignupRequest):
    db = get_db()
    try:
        existing = db.execute(
            "SELECT id FROM users WHERE email=?", (req.email,)
        ).fetchone()
        if existing:
            raise HTTPException(status_code=409, detail="Email already registered")
        hashed = hash_password(req.password)
        db.execute(
            "INSERT INTO users (name,email,password,role,department) VALUES (?,?,?,?,?)",
            (req.name, req.email, hashed, req.role, req.department),
        )
        db.commit()
        row = db.execute(
            "SELECT * FROM users WHERE email=?", (req.email,)
        ).fetchone()
        user = UserOut(
            id=row["id"],
            name=row["name"],
            email=row["email"],
            role=row["role"],
            department=row["department"],
        )
        return AuthResponse(
            success=True,
            message="Account created successfully",
            user=user,
            token=f"mock-jwt-{row['id']}-railopt",
        )
    finally:
        db.close()


@router.get("/session", response_model=AuthResponse)
def session(authorization: str = Header(default="")):
    """Return the user represented by the application's mock bearer token."""
    prefix = "Bearer mock-jwt-"
    if not authorization.startswith(prefix):
        raise HTTPException(status_code=401, detail="Authentication required")
    try:
        user_id = int(authorization[len(prefix):].split("-railopt", 1)[0])
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid session token")

    db = get_db()
    try:
        row = db.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=401, detail="Invalid session token")
        return AuthResponse(
            success=True,
            message="Session active",
            user=UserOut(
                id=row["id"], name=row["name"], email=row["email"],
                role=row["role"], department=row["department"],
            ),
            token=authorization.removeprefix("Bearer "),
        )
    finally:
        db.close()

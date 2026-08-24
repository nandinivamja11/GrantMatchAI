from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import io
import logging
import uuid
import bcrypt
import jwt
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Any, Dict
from datetime import datetime, timezone, timedelta

from schemes_data import SCHEMES_SEED

# ----- Setup -----
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = os.environ['MONGO_URL']
client = AsyncIOMotorClient(MONGO_URL)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get('JWT_SECRET', 'change-me')
JWT_ALG = 'HS256'
JWT_EXP_DAYS = 7
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

app = FastAPI(title="GrantMatch AI")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("grantmatch")


# ----- Helpers -----
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXP_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security)):
    if not creds:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def require_admin(user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user


# ----- Models -----
class SignupIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str
    phone: Optional[str] = None

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class BusinessProfileIn(BaseModel):
    business_name: str
    sector: str
    stage: str  # idea | dpiit | revenue
    state: str
    team_size: int
    annual_revenue_inr: int = 0
    women_led: bool = False
    tech_based: bool = False
    dpiit_recognized: bool = False
    udyam_registered: bool = False
    incorporation_year: Optional[int] = None
    has_pitch_deck: bool = False
    has_prototype: bool = False
    has_financials: bool = False
    description: Optional[str] = ""

class SchemeIn(BaseModel):
    code: str
    name_en: str
    name_hi: str
    category: str
    authority: str
    grant_amount_inr: int
    grant_amount_label_en: str
    grant_amount_label_hi: str
    summary_en: str
    summary_hi: str
    eligibility: Dict[str, Any]
    documents: List[str]
    timeline: str
    official_link: str

class BookingIn(BaseModel):
    name: str
    email: EmailStr
    phone: str
    date: str
    time_slot: str
    notes: Optional[str] = ""

class UpgradeIn(BaseModel):
    plan: str = "pro"  # pro


# ----- Startup: seed schemes + admin -----
@app.on_event("startup")
async def on_startup():
    # Seed schemes idempotently
    existing = await db.schemes.count_documents({})
    if existing == 0:
        docs = []
        now = datetime.now(timezone.utc).isoformat()
        for s in SCHEMES_SEED:
            docs.append({**s, "id": str(uuid.uuid4()), "created_at": now, "active": True})
        if docs:
            await db.schemes.insert_many(docs)
            logger.info(f"Seeded {len(docs)} schemes")

    # Seed admin idempotently
    admin_email = os.environ.get('ADMIN_EMAIL', 'admin@grantmatch.ai')
    admin_pw = os.environ.get('ADMIN_PASSWORD', 'Admin@GrantMatch2026')
    existing_admin = await db.users.find_one({"email": admin_email})
    if not existing_admin:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "password_hash": hash_password(admin_pw),
            "full_name": "Mahendra Kumar",
            "phone": None,
            "role": "admin",
            "plan": "pro",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Admin seeded: {admin_email}")


@app.on_event("shutdown")
async def on_shutdown():
    client.close()


# ----- Public routes -----
@api_router.get("/")
async def root():
    return {"app": "GrantMatch AI", "status": "ok"}


# ----- Auth -----
@api_router.post("/auth/signup")
async def signup(payload: SignupIn):
    existing = await db.users.find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    doc = {
        "id": user_id,
        "email": payload.email,
        "password_hash": hash_password(payload.password),
        "full_name": payload.full_name,
        "phone": payload.phone,
        "role": "user",
        "plan": "free",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)
    token = create_token(user_id, payload.email, "user")
    return {"token": token, "user": {"id": user_id, "email": payload.email, "full_name": payload.full_name, "role": "user", "plan": "free"}}

@api_router.post("/auth/login")
async def login(payload: LoginIn):
    u = await db.users.find_one({"email": payload.email})
    if not u or not verify_password(payload.password, u["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(u["id"], u["email"], u.get("role", "user"))
    return {"token": token, "user": {"id": u["id"], "email": u["email"], "full_name": u["full_name"], "role": u.get("role", "user"), "plan": u.get("plan", "free")}}

@api_router.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return user


# ----- Profile -----
@api_router.post("/profile")
async def save_profile(payload: BusinessProfileIn, user=Depends(get_current_user)):
    doc = payload.model_dump()
    doc["user_id"] = user["id"]
    doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.profiles.update_one({"user_id": user["id"]}, {"$set": doc}, upsert=True)
    return {"ok": True, "profile": doc}

@api_router.get("/profile")
async def get_profile(user=Depends(get_current_user)):
    p = await db.profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    return p or {}


# ----- Schemes -----
@api_router.get("/schemes")
async def list_schemes(q: Optional[str] = None, category: Optional[str] = None):
    query: Dict[str, Any] = {"active": True}
    if category:
        query["category"] = category
    if q:
        query["$or"] = [
            {"name_en": {"$regex": q, "$options": "i"}},
            {"name_hi": {"$regex": q, "$options": "i"}},
            {"summary_en": {"$regex": q, "$options": "i"}},
        ]
    schemes = await db.schemes.find(query, {"_id": 0}).to_list(500)
    return schemes

@api_router.get("/schemes/{scheme_id}")
async def get_scheme(scheme_id: str):
    s = await db.schemes.find_one({"id": scheme_id}, {"_id": 0})
    if not s:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return s


# ----- Matching engine -----
def score_scheme(profile: Dict[str, Any], scheme: Dict[str, Any]) -> Dict[str, Any]:
    """Rule-based scoring. Returns match_score (0-100) and reasons."""
    e = scheme.get("eligibility", {})
    score = 40  # baseline
    reasons: List[str] = []
    blockers: List[str] = []

    # Stage
    stages = e.get("stages", [])
    if not stages or profile.get("stage") in stages or "any" in stages:
        score += 15
        reasons.append(f"Stage '{profile.get('stage')}' matches")
    else:
        blockers.append(f"Requires stage: {', '.join(stages)}")
        score -= 15

    # DPIIT
    if e.get("dpiit_required"):
        if profile.get("dpiit_recognized"):
            score += 15
            reasons.append("DPIIT recognized ✓")
        else:
            blockers.append("DPIIT recognition required")
            score -= 20

    # Udyam
    if e.get("udyam_required"):
        if profile.get("udyam_registered"):
            score += 10
            reasons.append("Udyam registered ✓")
        else:
            blockers.append("Udyam registration required")
            score -= 15

    # Sector
    sectors = e.get("sectors", [])
    if sectors and "any" not in sectors:
        if profile.get("sector", "").lower() in [s.lower() for s in sectors]:
            score += 15
            reasons.append(f"Sector '{profile.get('sector')}' matches")
        else:
            score -= 10

    # State
    states = e.get("states", [])
    if states:
        if profile.get("state") in states:
            score += 15
            reasons.append(f"State scheme for {profile.get('state')}")
        else:
            blockers.append(f"Only for: {', '.join(states)}")
            score -= 30

    # Women-led
    if e.get("women_led_required"):
        if profile.get("women_led"):
            score += 10
            reasons.append("Women-led business ✓")
        else:
            blockers.append("Women-led business required")
            score -= 25
    elif e.get("women_led_bonus") and profile.get("women_led"):
        score += 5
        reasons.append("Women-led bonus")

    # Tech
    if e.get("tech_bonus") and profile.get("tech_based"):
        score += 5
        reasons.append("Tech-based bonus")

    # Revenue
    max_rev = e.get("max_revenue_inr")
    if max_rev and profile.get("annual_revenue_inr", 0) > max_rev:
        blockers.append(f"Revenue exceeds ₹{max_rev/100000:.0f}L cap")
        score -= 10
    min_rev = e.get("min_revenue_inr")
    if min_rev and profile.get("annual_revenue_inr", 0) < min_rev:
        blockers.append(f"Requires min revenue ₹{min_rev/100000:.0f}L")
        score -= 15

    score = max(0, min(100, score))
    return {"match_score": score, "reasons": reasons, "blockers": blockers}


async def get_ai_reasoning(profile: Dict[str, Any], top_schemes: List[Dict[str, Any]]) -> str:
    """Optional AI-generated summary using Claude Sonnet 5."""
    if not EMERGENT_LLM_KEY:
        return ""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"grantmatch-{profile.get('user_id','anon')}",
            system_message=(
                "You are GrantMatch AI, an expert consultant on Indian government schemes for startups and MSMEs. "
                "Given a founder's business profile and their top matched schemes, write a concise (3-4 short bullets) "
                "personalized recommendation in a warm, professional tone. Focus on WHY these schemes fit and any smart next step. "
                "Keep total under 120 words. Do not use markdown headings."
            ),
        ).with_model("anthropic", "claude-sonnet-5")

        schemes_brief = "\n".join([
            f"- {s['name_en']} ({s['match_score']}% match): {s.get('summary_en','')[:120]}"
            for s in top_schemes[:5]
        ])
        prompt = (
            f"Founder profile:\n"
            f"- Business: {profile.get('business_name')}\n"
            f"- Sector: {profile.get('sector')}, Stage: {profile.get('stage')}, State: {profile.get('state')}\n"
            f"- Team: {profile.get('team_size')}, Revenue: ₹{profile.get('annual_revenue_inr', 0)}\n"
            f"- DPIIT: {profile.get('dpiit_recognized')}, Udyam: {profile.get('udyam_registered')}, "
            f"Women-led: {profile.get('women_led')}, Tech: {profile.get('tech_based')}\n\n"
            f"Top matched schemes:\n{schemes_brief}\n\n"
            f"Write your recommendation now."
        )
        response = await chat.send_message(UserMessage(text=prompt))
        return str(response)
    except Exception as e:
        logger.warning(f"AI reasoning failed: {e}")
        return ""


@api_router.post("/match")
async def match_schemes(user=Depends(get_current_user)):
    profile = await db.profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=400, detail="Please complete your business profile first")

    schemes = await db.schemes.find({"active": True}, {"_id": 0}).to_list(500)
    ranked = []
    for s in schemes:
        rs = score_scheme(profile, s)
        ranked.append({**s, **rs})
    ranked.sort(key=lambda x: x["match_score"], reverse=True)

    # Free tier limit
    plan = user.get("plan", "free")
    limit = 3 if plan == "free" else 100
    top_visible = ranked[:limit]
    locked = max(0, len([r for r in ranked if r["match_score"] >= 40]) - limit)

    ai_summary = await get_ai_reasoning(profile, top_visible)

    # Save last match
    await db.matches.update_one(
        {"user_id": user["id"]},
        {"$set": {
            "user_id": user["id"],
            "top_scheme_ids": [r["id"] for r in top_visible],
            "created_at": datetime.now(timezone.utc).isoformat(),
        }},
        upsert=True,
    )

    return {
        "matches": top_visible,
        "locked_count": locked,
        "plan": plan,
        "ai_summary": ai_summary,
    }


# ----- Readiness score -----
@api_router.get("/readiness")
async def readiness(user=Depends(get_current_user)):
    p = await db.profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=400, detail="Complete profile first")

    score = 20  # baseline for having a profile
    tips = []

    if p.get("dpiit_recognized"):
        score += 20
    else:
        tips.append({"en": "Get DPIIT recognition to unlock Startup India benefits.", "hi": "स्टार्टअप इंडिया लाभ के लिए DPIIT मान्यता प्राप्त करें।"})
    if p.get("udyam_registered"):
        score += 15
    else:
        tips.append({"en": "Register on Udyam portal for MSME benefits.", "hi": "एमएसएमई लाभ के लिए उद्यम पर पंजीकरण करें।"})
    if p.get("has_pitch_deck"):
        score += 10
    else:
        tips.append({"en": "Prepare a 10-slide pitch deck.", "hi": "10-स्लाइड पिच डेक तैयार करें।"})
    if p.get("has_prototype"):
        score += 10
    else:
        tips.append({"en": "Build a minimum viable prototype.", "hi": "एक न्यूनतम प्रोटोटाइप बनाएं।"})
    if p.get("has_financials"):
        score += 10
    else:
        tips.append({"en": "Prepare audited financial statements.", "hi": "ऑडिटेड वित्तीय विवरण तैयार करें।"})
    if p.get("team_size", 0) >= 2:
        score += 5
    else:
        tips.append({"en": "Add at least one co-founder to strengthen your team.", "hi": "टीम मजबूत करने के लिए सह-संस्थापक जोड़ें।"})
    if p.get("annual_revenue_inr", 0) > 0:
        score += 10
    if p.get("tech_based"):
        score += 5

    score = min(100, score)
    if score >= 80:
        band = {"en": "Excellent — you're grant-ready!", "hi": "उत्कृष्ट — आप ग्रांट के लिए तैयार हैं!"}
    elif score >= 60:
        band = {"en": "Good — a few gaps to close.", "hi": "अच्छा — कुछ अंतराल बंद करने हैं।"}
    elif score >= 40:
        band = {"en": "Fair — some prep work needed.", "hi": "ठीक-ठाक — तैयारी की जरूरत है।"}
    else:
        band = {"en": "Early stage — let's build your foundation.", "hi": "प्रारंभिक चरण — नींव बनाएं।"}

    return {"score": score, "band": band, "tips": tips[:5]}


# ----- Bookmarks -----
@api_router.post("/bookmarks/{scheme_id}")
async def add_bookmark(scheme_id: str, user=Depends(get_current_user)):
    await db.bookmarks.update_one(
        {"user_id": user["id"], "scheme_id": scheme_id},
        {"$set": {"user_id": user["id"], "scheme_id": scheme_id, "created_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    return {"ok": True}

@api_router.delete("/bookmarks/{scheme_id}")
async def remove_bookmark(scheme_id: str, user=Depends(get_current_user)):
    await db.bookmarks.delete_one({"user_id": user["id"], "scheme_id": scheme_id})
    return {"ok": True}

@api_router.get("/bookmarks")
async def list_bookmarks(user=Depends(get_current_user)):
    bms = await db.bookmarks.find({"user_id": user["id"]}, {"_id": 0}).to_list(200)
    scheme_ids = [b["scheme_id"] for b in bms]
    schemes = await db.schemes.find({"id": {"$in": scheme_ids}}, {"_id": 0}).to_list(200)
    return schemes


# ----- PDF Checklist -----
@api_router.get("/schemes/{scheme_id}/checklist.pdf")
async def scheme_checklist_pdf(scheme_id: str):
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas
    from reportlab.lib.units import mm

    s = await db.schemes.find_one({"id": scheme_id}, {"_id": 0})
    if not s:
        raise HTTPException(status_code=404, detail="Scheme not found")

    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    w, h = A4

    # Header
    c.setFillColorRGB(0.043, 0.098, 0.173)  # navy #0B192C
    c.rect(0, h - 30 * mm, w, 30 * mm, fill=1, stroke=0)
    c.setFillColorRGB(1, 1, 1)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(20 * mm, h - 15 * mm, "GrantMatch AI")
    c.setFont("Helvetica", 10)
    c.drawString(20 * mm, h - 22 * mm, "Application Checklist")

    # Title
    c.setFillColorRGB(0.043, 0.098, 0.173)
    c.setFont("Helvetica-Bold", 14)
    y = h - 45 * mm
    c.drawString(20 * mm, y, s["name_en"][:70])

    c.setFillColorRGB(0.4, 0.45, 0.55)
    c.setFont("Helvetica", 10)
    y -= 7 * mm
    c.drawString(20 * mm, y, f"Category: {s['category']} | Authority: {s['authority']}")
    y -= 6 * mm
    c.drawString(20 * mm, y, f"Grant: {s['grant_amount_label_en']}")
    y -= 6 * mm
    c.drawString(20 * mm, y, f"Timeline: {s['timeline']}")

    # Summary
    y -= 10 * mm
    c.setFillColorRGB(0.043, 0.098, 0.173)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(20 * mm, y, "Overview")
    c.setFillColorRGB(0.2, 0.25, 0.32)
    c.setFont("Helvetica", 10)
    y -= 6 * mm
    summary = s.get("summary_en", "")
    for line in [summary[i:i+95] for i in range(0, len(summary), 95)]:
        c.drawString(20 * mm, y, line)
        y -= 5 * mm

    # Documents checklist
    y -= 6 * mm
    c.setFillColorRGB(0.043, 0.098, 0.173)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(20 * mm, y, "Documents Required")
    y -= 8 * mm

    c.setFillColorRGB(0.2, 0.25, 0.32)
    c.setFont("Helvetica", 11)
    for doc in s.get("documents", []):
        c.setFillColorRGB(1, 0.6, 0.2)  # saffron
        c.rect(20 * mm, y - 1 * mm, 4 * mm, 4 * mm, stroke=1, fill=0)
        c.setFillColorRGB(0.2, 0.25, 0.32)
        c.drawString(28 * mm, y, doc)
        y -= 8 * mm
        if y < 30 * mm:
            c.showPage()
            y = h - 20 * mm

    # Footer
    c.setFillColorRGB(0.4, 0.45, 0.55)
    c.setFont("Helvetica-Oblique", 8)
    c.drawString(20 * mm, 15 * mm, f"Official portal: {s.get('official_link','')}")
    c.drawString(20 * mm, 10 * mm, "Generated by GrantMatch AI — Book expert consulting at grantmatch.ai")

    c.save()
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{s["code"]}_checklist.pdf"'},
    )


# ----- Bookings (mocked) -----
@api_router.post("/bookings")
async def create_booking(payload: BookingIn, user=Depends(get_current_user)):
    doc = payload.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["user_id"] = user["id"]
    doc["status"] = "confirmed"
    doc["amount_inr"] = 999
    doc["payment_status"] = "mocked_paid"
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.bookings.insert_one(doc)
    # MOCKED email
    logger.info(f"[MOCKED EMAIL] Booking confirmed to {doc['email']} for {doc['date']} {doc['time_slot']}")
    doc.pop("_id", None)
    return doc

@api_router.get("/bookings")
async def my_bookings(user=Depends(get_current_user)):
    docs = await db.bookings.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    return docs


# ----- Subscription (mocked Razorpay) -----
@api_router.post("/subscription/upgrade")
async def upgrade(payload: UpgradeIn, user=Depends(get_current_user)):
    # MOCKED Razorpay flow
    order_id = f"order_MOCK_{uuid.uuid4().hex[:12]}"
    payment_id = f"pay_MOCK_{uuid.uuid4().hex[:12]}"
    await db.users.update_one({"id": user["id"]}, {"$set": {"plan": "pro"}})
    await db.payments.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "email": user["email"],
        "type": "subscription",
        "plan": "pro",
        "amount_inr": 499,
        "order_id": order_id,
        "payment_id": payment_id,
        "status": "mocked_paid",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    logger.info(f"[MOCKED PAYMENT] Pro upgrade for {user['email']} - {payment_id}")
    return {"ok": True, "plan": "pro", "order_id": order_id, "payment_id": payment_id}


# ----- Admin -----
@api_router.get("/admin/stats")
async def admin_stats(_=Depends(require_admin)):
    users = await db.users.count_documents({"role": {"$ne": "admin"}})
    pro_users = await db.users.count_documents({"plan": "pro", "role": {"$ne": "admin"}})
    schemes = await db.schemes.count_documents({"active": True})
    bookings = await db.bookings.count_documents({})
    revenue_sub = pro_users * 499
    revenue_book = bookings * 999
    return {
        "total_users": users,
        "pro_users": pro_users,
        "total_schemes": schemes,
        "total_bookings": bookings,
        "revenue_inr": revenue_sub + revenue_book,
    }

@api_router.get("/admin/leads")
async def admin_leads(_=Depends(require_admin)):
    users = await db.users.find({"role": {"$ne": "admin"}}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(500)
    for u in users:
        p = await db.profiles.find_one({"user_id": u["id"]}, {"_id": 0})
        u["profile"] = p
    return users

@api_router.get("/admin/bookings")
async def admin_bookings(_=Depends(require_admin)):
    return await db.bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)

@api_router.get("/admin/payments")
async def admin_payments(_=Depends(require_admin)):
    return await db.payments.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)

@api_router.post("/admin/schemes")
async def admin_add_scheme(payload: SchemeIn, _=Depends(require_admin)):
    doc = payload.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["active"] = True
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.schemes.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/admin/schemes/{scheme_id}")
async def admin_update_scheme(scheme_id: str, payload: SchemeIn, _=Depends(require_admin)):
    r = await db.schemes.update_one({"id": scheme_id}, {"$set": payload.model_dump()})
    if r.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}

@api_router.delete("/admin/schemes/{scheme_id}")
async def admin_delete_scheme(scheme_id: str, _=Depends(require_admin)):
    await db.schemes.update_one({"id": scheme_id}, {"$set": {"active": False}})
    return {"ok": True}


# ----- Finalize -----
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

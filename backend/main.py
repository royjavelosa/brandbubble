import os
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from supabase import create_client
import anthropic
from typing import Optional

load_dotenv()

app = FastAPI(title="BrandBubble API")

# CORS - only allow our frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://brandbubble.vercel.app",
        "https://brandbubble-one.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Clients
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_KEY')
)
anthropic_client = anthropic.Anthropic(
    api_key=os.getenv('ANTHROPIC_API_KEY')
)

API_SECRET_KEY = os.getenv('API_SECRET_KEY')

def verify_api_key(x_api_key: str = Header(None)):
    if x_api_key != API_SECRET_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return x_api_key


# --- Health check ---
@app.get("/")
def health():
    return {"status": "BrandBubble API is running"}


# --- GET /brands ---
# Returns all active brands with their latest snapshot
@app.get("/brands")
def get_brands(x_api_key: str = Header(None)):
    verify_api_key(x_api_key)
    try:
        brands_result = supabase.table('brands')\
            .select('*')\
            .eq('is_active', True)\
            .execute()

        brands = brands_result.data
        enriched = []

        for brand in brands:
            # Get latest snapshot
            snapshot_result = supabase.table('snapshots')\
                .select('*')\
                .eq('brand_id', brand['id'])\
                .order('snapshot_date', desc=True)\
                .order('period', desc=True)\
                .limit(1)\
                .execute()

            latest_snapshot = snapshot_result.data[0] if snapshot_result.data else None

            # Get brand_type from brand_properties
            props_result = supabase.table('brand_properties')\
                .select('key, value')\
                .eq('brand_id', brand['id'])\
                .execute()

            properties = {p['key']: p['value'] for p in props_result.data}

            enriched.append({
                'id': brand['id'],
                'name': brand['name'],
                'display_name': brand['display_name'],
                'brand_type': properties.get('brand_type', 'pmg_client'),
                'latest_snapshot': latest_snapshot
            })

        return {'brands': enriched}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- GET /brands/{brand_id}/history ---
# Returns full snapshot history for one brand
@app.get("/brands/{brand_id}/history")
def get_brand_history(brand_id: str, x_api_key: str = Header(None)):
    verify_api_key(x_api_key)
    try:
        result = supabase.table('snapshots')\
            .select('*')\
            .eq('brand_id', brand_id)\
            .order('snapshot_date', desc=False)\
            .order('period', desc=False)\
            .execute()

        return {'history': result.data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- GET /brands/{brand_id}/platforms ---
# Returns platform breakdown for latest snapshot
@app.get("/brands/{brand_id}/platforms")
def get_brand_platforms(brand_id: str, x_api_key: str = Header(None)):
    verify_api_key(x_api_key)
    try:
        # Get latest snapshot date and period
        latest = supabase.table('snapshots')\
            .select('snapshot_date, period')\
            .eq('brand_id', brand_id)\
            .order('snapshot_date', desc=True)\
            .order('period', desc=True)\
            .limit(1)\
            .execute()

        if not latest.data:
            return {'platforms': []}

        latest_date = latest.data[0]['snapshot_date']
        latest_period = latest.data[0]['period']

        # Get platform metrics for that snapshot
        metrics_result = supabase.table('platform_metrics')\
            .select('*, platforms(name, display_name)')\
            .eq('brand_id', brand_id)\
            .eq('snapshot_date', latest_date)\
            .eq('period', latest_period)\
            .execute()

        return {'platforms': metrics_result.data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- POST /narrative/global ---
# Generates Page 1 global narrative across all brands
@app.post("/narrative/global")
def get_global_narrative(x_api_key: str = Header(None)):
    verify_api_key(x_api_key)
    try:
        # Check if cached narrative exists for today
        from datetime import date
        today = date.today().isoformat()

        cached = supabase.table('snapshots')\
            .select('global_narrative, narrative_generated_at')\
            .eq('snapshot_date', today)\
            .not_.is_('global_narrative', 'null')\
            .limit(1)\
            .execute()

        if cached.data and cached.data[0]['global_narrative']:
            return {'narrative': cached.data[0]['global_narrative'], 'cached': True}

        # Build context for Claude
        brands_result = supabase.table('brands')\
            .select('*')\
            .eq('is_active', True)\
            .execute()

        brand_summaries = []
        for brand in brands_result.data:
            latest = supabase.table('snapshots')\
                .select('*')\
                .eq('brand_id', brand['id'])\
                .order('snapshot_date', desc=True)\
                .limit(2)\
                .execute()

            if latest.data:
                current = latest.data[0]
                previous = latest.data[1] if len(latest.data) > 1 else None
                volume_change = ''
                if previous:
                    change = current['total_volume'] - previous['total_volume']
                    pct = round((change / previous['total_volume']) * 100, 1)
                    volume_change = f"({'+' if pct > 0 else ''}{pct}% vs previous)"

                brand_summaries.append(
                    f"{brand['display_name']}: sentiment {current['sentiment_score']}, "
                    f"volume {current['total_volume']:,} mentions {volume_change}"
                )

        context = "\n".join(brand_summaries)

        message = anthropic_client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=300,
            messages=[{
                "role": "user",
                "content": f"""You are a brand intelligence analyst. 
                
Here is the latest sentiment data across 8 major brands:

{context}

Write a 2-3 sentence narrative for a marketing agency dashboard. 
Surface the most interesting pattern or contrast you see. 
Include both obvious trends and non-obvious ones if present.
Be specific about brand names and numbers.
Do not use generic filler. If nothing is interesting, return an empty string.
Do not use em dashes (—). Use commas, periods, or rewrite the sentence instead."""
            }]
        )

        narrative = message.content[0].text.strip()

        # Cache in first snapshot of today if exists
        if narrative:
            today_snapshot = supabase.table('snapshots')\
                .select('id')\
                .eq('snapshot_date', today)\
                .limit(1)\
                .execute()

            if today_snapshot.data:
                supabase.table('snapshots')\
                    .update({
                        'global_narrative': narrative,
                        'narrative_generated_at': 'now()'
                    })\
                    .eq('id', today_snapshot.data[0]['id'])\
                    .execute()

        return {'narrative': narrative, 'cached': False}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- POST /narrative/brand/{brand_id} ---
# Generates Page 2 brand specific narrative
@app.post("/narrative/brand/{brand_id}")
def get_brand_narrative(brand_id: str, x_api_key: str = Header(None)):
    verify_api_key(x_api_key)
    try:
        # Check cache first
        from datetime import date
        today = date.today().isoformat()

        cached = supabase.table('snapshots')\
            .select('brand_narrative, narrative_generated_at')\
            .eq('brand_id', brand_id)\
            .eq('snapshot_date', today)\
            .not_.is_('brand_narrative', 'null')\
            .limit(1)\
            .execute()

        if cached.data and cached.data[0]['brand_narrative']:
            return {'narrative': cached.data[0]['brand_narrative'], 'cached': True}

        # Get brand name
        brand_result = supabase.table('brands')\
            .select('display_name')\
            .eq('id', brand_id)\
            .single()\
            .execute()

        brand_name = brand_result.data['display_name']

        # Get last 14 days of history
        history = supabase.table('snapshots')\
            .select('*')\
            .eq('brand_id', brand_id)\
            .order('snapshot_date', desc=True)\
            .limit(28)\
            .execute()

        if not history.data:
            return {'narrative': '', 'cached': False}

        # Get latest platform breakdown
        latest = history.data[0]
        platforms = supabase.table('platform_metrics')\
            .select('*, platforms(display_name)')\
            .eq('brand_id', brand_id)\
            .eq('snapshot_date', latest['snapshot_date'])\
            .eq('period', latest['period'])\
            .execute()

        # Build history string
        history_lines = []
        for snap in reversed(history.data):
            history_lines.append(
                f"{snap['snapshot_date']} {snap['period']}: "
                f"sentiment {snap['sentiment_score']}, "
                f"volume {snap['total_volume']:,}"
            )

        # Build platform string
        platform_lines = []
        for p in platforms.data:
            platform_name = p['platforms']['display_name'] if p.get('platforms') else 'Unknown'
            platform_lines.append(
                f"{platform_name}: sentiment {p['platform_sentiment_score']}, "
                f"mentions {p['mention_count']:,}, "
                f"likes {p['like_count']:,}"
            )

        history_text = "\n".join(history_lines)
        platform_text = "\n".join(platform_lines)

        message = anthropic_client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=250,
            messages=[{
                "role": "user",
                "content": f"""You are a brand intelligence analyst reviewing {brand_name}.

14-day trend history (oldest to newest):
{history_text}

Current platform breakdown:
{platform_text}

Write 1-2 sentences describing the most meaningful pattern in this data.
Focus on: trend direction, peak moments, platform divergence, or unusual signals.
Be specific with dates and numbers.
Do not use em dashes (—). Use commas, periods, or rewrite the sentence instead.
If there is nothing meaningful to say, return exactly: EMPTY"""
            }]
        )

        narrative = message.content[0].text.strip()

        # Return empty if model says nothing meaningful
        if narrative == 'EMPTY' or len(narrative) < 20:
            narrative = ''

        # Cache it
        if narrative:
            latest_snapshot = supabase.table('snapshots')\
                .select('id')\
                .eq('brand_id', brand_id)\
                .eq('snapshot_date', today)\
                .limit(1)\
                .execute()

            if latest_snapshot.data:
                supabase.table('snapshots')\
                    .update({
                        'brand_narrative': narrative,
                        'narrative_generated_at': 'now()'
                    })\
                    .eq('id', latest_snapshot.data[0]['id'])\
                    .execute()

        return {'narrative': narrative, 'cached': False}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
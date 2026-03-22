import os
import random
from datetime import datetime, timedelta, date
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_KEY')
)

# --- Config ---
DAYS_BACK = 30
TODAY = date.today()

# Brand personality profiles
# Each brand has a base sentiment and volume profile
# This makes the mock data feel realistic and story-driven
BRAND_PROFILES = {
    'nike': {
        'base_sentiment': 0.65,
        'base_volume': 85000,
        'volatility': 0.15,
        'trend': 'spike',       # spikes mid-period then decays
        'spike_day': 18,
        'spike_multiplier': 2.8
    },
    'apple': {
        'base_sentiment': 0.72,
        'base_volume': 120000,
        'volatility': 0.08,
        'trend': 'stable',      # consistently high, slow growth
        'spike_day': None,
        'spike_multiplier': 1.0
    },
    'sephora': {
        'base_sentiment': 0.58,
        'base_volume': 45000,
        'volatility': 0.12,
        'trend': 'building',    # slowly building momentum
        'spike_day': None,
        'spike_multiplier': 1.0
    },
    'experian': {
        'base_sentiment': 0.41,
        'base_volume': 18000,
        'volatility': 0.10,
        'trend': 'backlash',    # negative trend, recovering
        'spike_day': 22,
        'spike_multiplier': 1.5
    },
    'therabody': {
        'base_sentiment': 0.78,
        'base_volume': 22000,
        'volatility': 0.09,
        'trend': 'building',
        'spike_day': None,
        'spike_multiplier': 1.0
    },
    'bestwestern': {
        'base_sentiment': 0.52,
        'base_volume': 15000,
        'volatility': 0.11,
        'trend': 'stable',
        'spike_day': None,
        'spike_multiplier': 1.0
    },
    'intuit': {
        'base_sentiment': 0.61,
        'base_volume': 28000,
        'volatility': 0.10,
        'trend': 'spike',
        'spike_day': 10,
        'spike_multiplier': 2.1
    },
    'wholefoods': {
        'base_sentiment': 0.69,
        'base_volume': 32000,
        'volatility': 0.13,
        'trend': 'decay',       # peaked early, slowly declining
        'spike_day': 28,
        'spike_multiplier': 2.0
    }
}

# Platform distribution percentages
# How each platform contributes to total volume
PLATFORM_DISTRIBUTION = {
    'youtube':   {'volume_pct': 0.20, 'sentiment_offset': 0.05},
    'tiktok':    {'volume_pct': 0.40, 'sentiment_offset': -0.03},
    'instagram': {'volume_pct': 0.30, 'sentiment_offset': 0.02},
    'news':      {'volume_pct': 0.10, 'sentiment_offset': 0.08},
}

def get_brands():
    result = supabase.table('brands').select('*').execute()
    return {b['name']: b['id'] for b in result.data}

def get_platforms():
    result = supabase.table('platforms').select('*').execute()
    return {p['name']: p['id'] for p in result.data}

def calculate_volume(profile, day_index, period):
    base = profile['base_volume']
    volatility = profile['volatility']
    trend = profile['trend']
    spike_day = profile['spike_day']
    spike_mult = profile['spike_multiplier']

    # Apply trend modifier
    if trend == 'building':
        trend_modifier = 1.0 + (day_index / DAYS_BACK) * 0.4
    elif trend == 'decay':
        trend_modifier = 1.0 + ((DAYS_BACK - day_index) / DAYS_BACK) * 0.4
    elif trend == 'backlash':
        trend_modifier = 1.3 if day_index < 15 else 1.0 - ((day_index - 15) / 15) * 0.2
    else:
        trend_modifier = 1.0

    # Apply spike if applicable
    spike_modifier = 1.0
    if spike_day:
        distance = abs(day_index - (DAYS_BACK - spike_day))
        if distance <= 3:
            spike_modifier = spike_mult - (distance * 0.4)

    # Evening is slightly higher than morning
    period_modifier = 1.0 if period == 'morning' else 1.12

    # Add randomness
    noise = 1.0 + random.uniform(-volatility, volatility)

    volume = int(base * trend_modifier * spike_modifier * period_modifier * noise)
    return max(volume, 1000)

def calculate_sentiment(profile, day_index, period):
    base = profile['base_sentiment']
    volatility = profile['volatility']
    trend = profile['trend']
    spike_day = profile['spike_day']

    # Backlash brands have lower sentiment early
    if trend == 'backlash':
        if day_index < 15:
            base = base - 0.15
        else:
            base = base + 0.05

    # Spike events can go either way
    if spike_day:
        distance = abs(day_index - (DAYS_BACK - spike_day))
        if distance <= 2:
            base = base + 0.08

    # Add small randomness
    noise = random.uniform(-volatility * 0.5, volatility * 0.5)
    sentiment = round(base + noise, 3)

    # Clamp between -1.0 and 1.0
    return max(-1.0, min(1.0, sentiment))

def seed_data():
    print("Fetching brands and platforms...")
    brands = get_brands()
    platforms = get_platforms()

    print(f"Found {len(brands)} brands and {len(platforms)} platforms")
    print("Generating 30 days of mock data...")

    snapshots_inserted = 0
    metrics_inserted = 0

    for day_index in range(DAYS_BACK):
        snapshot_date = TODAY - timedelta(days=(DAYS_BACK - day_index))

        for period in ['morning', 'evening']:
            for brand_name, brand_id in brands.items():
                profile = BRAND_PROFILES.get(brand_name)
                if not profile:
                    continue

                volume = calculate_volume(profile, day_index, period)
                sentiment = calculate_sentiment(profile, day_index, period)

                # Insert snapshot
                snapshot_result = supabase.table('snapshots').insert({
                    'brand_id': brand_id,
                    'snapshot_date': snapshot_date.isoformat(),
                    'period': period,
                    'total_volume': volume,
                    'sentiment_score': sentiment,
                    'source_type': 'mock'
                }).execute()

                snapshot_id = snapshot_result.data[0]['id']
                snapshots_inserted += 1

                # Insert platform metrics
                for platform_name, platform_id in platforms.items():
                    dist = PLATFORM_DISTRIBUTION.get(platform_name, {})
                    platform_volume = int(volume * dist.get('volume_pct', 0.25))
                    platform_sentiment = round(
                        sentiment + dist.get('sentiment_offset', 0) +
                        random.uniform(-0.05, 0.05), 3
                    )
                    platform_sentiment = max(-1.0, min(1.0, platform_sentiment))

                    # Simulate engagement metrics
                    like_count = int(platform_volume * random.uniform(0.08, 0.25))
                    share_count = int(platform_volume * random.uniform(0.02, 0.08))
                    comment_count = int(platform_volume * random.uniform(0.03, 0.10))
                    view_count = int(platform_volume * random.uniform(3.0, 8.0))

                    supabase.table('platform_metrics').insert({
                        'snapshot_id': snapshot_id,
                        'brand_id': brand_id,
                        'platform_id': platform_id,
                        'snapshot_date': snapshot_date.isoformat(),
                        'period': period,
                        'mention_count': platform_volume,
                        'like_count': like_count,
                        'share_count': share_count,
                        'comment_count': comment_count,
                        'view_count': view_count,
                        'platform_sentiment_score': platform_sentiment,
                        'source_type': 'mock'
                    }).execute()

                    metrics_inserted += 1

        print(f"Day {day_index + 1}/{DAYS_BACK} seeded ({snapshot_date})")

    print(f"\nDone!")
    print(f"Snapshots inserted: {snapshots_inserted}")
    print(f"Platform metrics inserted: {metrics_inserted}")

if __name__ == '__main__':
    seed_data()
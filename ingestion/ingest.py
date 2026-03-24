import os
import random
from datetime import date, datetime
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_KEY')
)

BRAND_PROFILES = {
    # PMG Clients
    'nike': {
        'base_sentiment': 0.65,
        'base_volume': 85000,
        'volatility': 0.15,
    },
    'apple': {
        'base_sentiment': 0.72,
        'base_volume': 120000,
        'volatility': 0.08,
    },
    'sephora': {
        'base_sentiment': 0.58,
        'base_volume': 45000,
        'volatility': 0.12,
    },
    'experian': {
        'base_sentiment': 0.41,
        'base_volume': 18000,
        'volatility': 0.10,
    },
    'therabody': {
        'base_sentiment': 0.78,
        'base_volume': 22000,
        'volatility': 0.09,
    },
    'bestwestern': {
        'base_sentiment': 0.52,
        'base_volume': 15000,
        'volatility': 0.11,
    },
    'intuit': {
        'base_sentiment': 0.61,
        'base_volume': 28000,
        'volatility': 0.10,
    },
    'wholefoods': {
        'base_sentiment': 0.69,
        'base_volume': 32000,
        'volatility': 0.13,
    },
    # Competitors
    'adidas': {
        'base_sentiment': 0.61,
        'base_volume': 72000,
        'volatility': 0.13,
    },
    'underarmour': {
        'base_sentiment': 0.48,
        'base_volume': 35000,
        'volatility': 0.14,
    },
    'samsung': {
        'base_sentiment': 0.59,
        'base_volume': 95000,
        'volatility': 0.11,
    },
    'google': {
        'base_sentiment': 0.63,
        'base_volume': 110000,
        'volatility': 0.09,
    },
    'ulta': {
        'base_sentiment': 0.66,
        'base_volume': 38000,
        'volatility': 0.12,
    },
    'traderjoes': {
        'base_sentiment': 0.74,
        'base_volume': 28000,
        'volatility': 0.10,
    },
    'hyperice': {
        'base_sentiment': 0.71,
        'base_volume': 14000,
        'volatility': 0.11,
    },
    'hrblock': {
        'base_sentiment': 0.44,
        'base_volume': 22000,
        'volatility': 0.13,
    },
    'marriott': {
        'base_sentiment': 0.57,
        'base_volume': 42000,
        'volatility': 0.12,
    },
    'equifax': {
        'base_sentiment': 0.35,
        'base_volume': 19000,
        'volatility': 0.14,
    },
    # Standalone
    'peloton': {
        'base_sentiment': -0.22,
        'base_volume': 38000,
        'volatility': 0.18,
    },
}

PLATFORM_DISTRIBUTION = {
    'youtube':   {'volume_pct': 0.20, 'sentiment_offset': 0.05},
    'tiktok':    {'volume_pct': 0.40, 'sentiment_offset': -0.03},
    'instagram': {'volume_pct': 0.30, 'sentiment_offset': 0.02},
    'news':      {'volume_pct': 0.10, 'sentiment_offset': 0.08},
}

def get_period():
    hour = datetime.now().hour
    return 'morning' if hour < 12 else 'evening'

def get_brands():
    result = supabase.table('brands').select('*').execute()
    return {b['name']: b['id'] for b in result.data}

def get_platforms():
    result = supabase.table('platforms').select('*').execute()
    return {p['name']: p['id'] for p in result.data}

def check_already_run(brand_id, snapshot_date, period):
    result = supabase.table('snapshots')\
        .select('id')\
        .eq('brand_id', brand_id)\
        .eq('snapshot_date', snapshot_date)\
        .eq('period', period)\
        .execute()
    return len(result.data) > 0

def run_ingest(period=None):
    today = date.today().isoformat()
    period = period or get_period()

    print(f"\nRunning ingest for {today} [{period}]")
    print("=" * 40)

    brands = get_brands()
    platforms = get_platforms()

    print(f"Brands: {len(brands)} | Platforms: {len(platforms)}\n")

    snapshots_inserted = 0
    skipped = 0

    for brand_name, brand_id in brands.items():
        profile = BRAND_PROFILES.get(brand_name)
        if not profile:
            print(f"  ⚠  {brand_name}: no profile, skipping")
            continue

        if check_already_run(brand_id, today, period):
            print(f"  ↩  {brand_name}: already run, skipping")
            skipped += 1
            continue

        volatility = profile['volatility']
        period_modifier = 1.0 if period == 'morning' else 1.12
        noise = 1.0 + random.uniform(-volatility, volatility)
        volume = int(profile['base_volume'] * period_modifier * noise)
        volume = max(volume, 1000)

        sentiment_noise = random.uniform(-volatility * 0.5, volatility * 0.5)
        sentiment = round(profile['base_sentiment'] + sentiment_noise, 3)
        sentiment = max(-1.0, min(1.0, sentiment))

        snapshot_result = supabase.table('snapshots').insert({
            'brand_id': brand_id,
            'snapshot_date': today,
            'period': period,
            'total_volume': volume,
            'sentiment_score': sentiment,
            'source_type': 'mock'
        }).execute()

        snapshot_id = snapshot_result.data[0]['id']
        snapshots_inserted += 1

        for platform_name, platform_id in platforms.items():
            dist = PLATFORM_DISTRIBUTION.get(platform_name, {})
            platform_volume = int(volume * dist.get('volume_pct', 0.25))
            platform_sentiment = round(
                sentiment + dist.get('sentiment_offset', 0) +
                random.uniform(-0.05, 0.05), 3
            )
            platform_sentiment = max(-1.0, min(1.0, platform_sentiment))

            like_count = int(platform_volume * random.uniform(0.08, 0.25))
            share_count = int(platform_volume * random.uniform(0.02, 0.08))
            comment_count = int(platform_volume * random.uniform(0.03, 0.10))
            view_count = int(platform_volume * random.uniform(3.0, 8.0))

            supabase.table('platform_metrics').insert({
                'snapshot_id': snapshot_id,
                'brand_id': brand_id,
                'platform_id': platform_id,
                'snapshot_date': today,
                'period': period,
                'mention_count': platform_volume,
                'like_count': like_count,
                'share_count': share_count,
                'comment_count': comment_count,
                'view_count': view_count,
                'platform_sentiment_score': platform_sentiment,
                'source_type': 'mock'
            }).execute()

        print(f"  ✓  {brand_name}: sentiment={sentiment}, volume={volume:,}")

    print(f"\n{'=' * 40}")
    print(f"Done! Inserted: {snapshots_inserted} | Skipped: {skipped}")

if __name__ == '__main__':
    run_ingest(period='morning')
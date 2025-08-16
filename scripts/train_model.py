import os
import pymongo
import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta, UTC
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import warnings
warnings.filterwarnings('ignore')

# ---------------- REALISTIC ZONE PATTERNS ----------------
ZONE_PATTERNS = {
    "it_corporate": {
        "peak_occupancy_times": {
            (9, 18): 0.85,   # High occupancy during work hours
            (7, 9): 0.6,     # Morning arrival
            (18, 20): 0.4    # Evening departure
        },
        "base_occupancy": 0.15,  # Very low outside work hours
        "weekend_factor": 0.1,   # Almost empty on weekends
        "night_occupancy": 0.05  # Nearly empty at night
    },
    "residential": {
        "peak_occupancy_times": {
            (8, 10): 0.6,    # Morning rush (people leaving for work)
            (17, 20): 0.7,   # Evening return (visitors, deliveries)
            (10, 17): 0.3    # Day time (low public parking usage)
        },
        "base_occupancy": 0.25,  # Low base for public parking
        "weekend_factor": 1.2,   # More visitors on weekends
        "night_occupancy": 0.15  # Very low at night (people at home, public spots free)
    },
    "commercial_high": {
        "peak_occupancy_times": {
            (10, 14): 0.7,   # Lunch time shopping
            (17, 21): 0.8,   # Evening shopping
            (11, 13): 0.6    # Late morning
        },
        "base_occupancy": 0.25,  # Low outside shopping hours
        "weekend_factor": 1.2,   # Busier on weekends
        "night_occupancy": 0.1   # Very low at night
    },
    "transport_hub": {
        "peak_occupancy_times": {
            (7, 10): 0.9,    # Morning rush
            (17, 20): 0.9,   # Evening rush
            (11, 16): 0.5    # Moderate during day
        },
        "base_occupancy": 0.3,   # Moderate base
        "weekend_factor": 0.6,   # Less busy on weekends
        "night_occupancy": 0.2   # Low at night
    },
    "traditional_market": {
        "peak_occupancy_times": {
            (8, 12): 0.8,    # Morning market
            (16, 19): 0.7,   # Evening market
            (6, 8): 0.4      # Early morning setup
        },
        "base_occupancy": 0.2,   # Low outside market hours
        "weekend_factor": 1.1,   # Slightly busier on weekends
        "night_occupancy": 0.05  # Nearly empty at night
    },
    "default": {
        "peak_occupancy_times": {
            (9, 17): 0.6,    # General business hours
            (17, 20): 0.5    # Evening
        },
        "base_occupancy": 0.3,
        "weekend_factor": 0.8,
        "night_occupancy": 0.2
    }
}

def categorize_zone(zone_id: str, zone_name: str = "", category: str = "") -> str:
    """Enhanced zone categorization"""
    if category and category.lower() in ZONE_PATTERNS:
        return category.lower()
    
    text_to_check = f"{zone_id} {zone_name}".lower()
    
    # Check for specific keywords
    if any(k in text_to_check for k in ["hinjewadi", "it_park", "cyber", "tech", "corporate", "office", "software", "wipro", "tcs", "infosys"]):
        return "it_corporate"
    if any(k in text_to_check for k in ["magarpatta", "society", "residential", "karve", "undri", "warje", "apartment", "housing", "residency"]):
        return "residential"
    if any(k in text_to_check for k in ["fc_road", "jm_road", "camp", "mall", "shopping", "commercial", "plaza", "center"]):
        return "commercial_high"
    if any(k in text_to_check for k in ["station", "railway", "swargate", "depot", "terminal", "bus_stand", "transport"]):
        return "transport_hub"
    if any(k in text_to_check for k in ["market", "bazaar", "laxmi", "traditional", "vendor"]):
        return "traditional_market"
    
    return "default"

# ---------------- REALISTIC AVAILABILITY CALCULATOR ----------------
def get_realistic_availability(hour: int, day_of_week: int, zone_category: str) -> float:
    """
    Calculate realistic availability based on time and zone type
    Returns availability score (0 = full, 1 = empty)
    """
    is_weekend = day_of_week >= 5
    
    # Define explicit hour-by-hour patterns for each zone type
    if zone_category == "residential":
        if hour >= 22 or hour <= 6:  # Night (10 PM - 6 AM)
            occupancy = 0.15  # Very low - people at home, public spots free
        elif 7 <= hour <= 9:  # Morning rush
            occupancy = 0.5   # Medium - people leaving for work, some visitors
        elif 10 <= hour <= 16:  # Day time
            occupancy = 0.25  # Low-medium - quiet residential
        elif 17 <= hour <= 20:  # Evening return
            occupancy = 0.6   # Higher - people returning, visitors, deliveries
        else:  # 21:00
            occupancy = 0.3   # Settling down for night
    
    elif zone_category == "it_corporate":
        if hour >= 20 or hour <= 7:  # Night/early morning
            occupancy = 0.05  # Nearly empty
        elif 8 <= hour <= 9:  # Morning arrival
            occupancy = 0.7   # High - people arriving
        elif 10 <= hour <= 17:  # Work hours
            occupancy = 0.85  # Very high - peak work time
        elif 18 <= hour <= 19:  # Evening departure
            occupancy = 0.5   # Medium - people leaving
        else:
            occupancy = 0.15  # Low
    
    elif zone_category == "commercial_high":
        if hour >= 23 or hour <= 8:  # Night/early morning
            occupancy = 0.1   # Very low - shops closed
        elif 9 <= hour <= 11:  # Late morning
            occupancy = 0.4   # Medium - shops opening
        elif 12 <= hour <= 14:  # Lunch time
            occupancy = 0.7   # High - lunch crowd
        elif 15 <= hour <= 17:  # Afternoon
            occupancy = 0.5   # Medium
        elif 18 <= hour <= 21:  # Evening shopping
            occupancy = 0.8   # Very high - peak shopping
        else:  # 22:00
            occupancy = 0.3   # Winding down
    
    elif zone_category == "transport_hub":
        if hour >= 22 or hour <= 5:  # Night
            occupancy = 0.2   # Low
        elif 6 <= hour <= 10:  # Morning rush
            occupancy = 0.9   # Very high
        elif 11 <= hour <= 16:  # Day time
            occupancy = 0.5   # Medium
        elif 17 <= hour <= 20:  # Evening rush
            occupancy = 0.9   # Very high
        else:  # 21:00
            occupancy = 0.4   # Medium
    
    elif zone_category == "traditional_market":
        if hour >= 21 or hour <= 5:  # Night/early morning
            occupancy = 0.05  # Nearly empty
        elif 6 <= hour <= 8:  # Early morning setup
            occupancy = 0.3   # Medium - vendors setting up
        elif 9 <= hour <= 12:  # Morning market peak
            occupancy = 0.8   # Very high
        elif 13 <= hour <= 15:  # Afternoon lull
            occupancy = 0.4   # Medium
        elif 16 <= hour <= 19:  # Evening market
            occupancy = 0.7   # High
        else:  # 20:00
            occupancy = 0.2   # Low - closing time
    
    else:  # default
        if hour >= 22 or hour <= 6:  # Night
            occupancy = 0.2
        elif 7 <= hour <= 9:  # Morning
            occupancy = 0.5
        elif 10 <= hour <= 17:  # Day
            occupancy = 0.6
        elif 18 <= hour <= 21:  # Evening
            occupancy = 0.5
        else:
            occupancy = 0.3
    
    # Apply weekend factor
    if is_weekend:
        if zone_category == "it_corporate":
            occupancy *= 0.2  # Much emptier on weekends
        elif zone_category in ["commercial_high", "traditional_market"]:
            occupancy *= 1.3  # Busier on weekends
        elif zone_category == "residential":
            occupancy *= 1.1  # Slightly busier (more visitors)
        else:
            occupancy *= 0.8
    
    # Ensure occupancy is within bounds
    occupancy = max(0.05, min(0.95, occupancy))
    
    # Convert occupancy to availability
    availability = 1 - occupancy
    
    # Ensure availability is within realistic bounds
    availability = max(0.05, min(0.95, availability))
    
    return availability

# ---------------- ENHANCED FEATURE CALCULATION ----------------
def calculate_occupancy_from_reports(reports_df: pd.DataFrame, zone_capacity: int, zone_category: str) -> pd.DataFrame:
    """
    Calculate more realistic occupancy patterns from user reports
    """
    print(f"    📊 Processing {len(reports_df)} reports for {zone_category} zone (capacity: {zone_capacity})")
    
    # Sort by timestamp
    reports_df = reports_df.sort_values('timestamp')
    
    # Analyze report distribution
    report_counts = reports_df['reportType'].value_counts()
    print(f"    📈 Report distribution: {dict(report_counts)}")
    
    # Create hourly buckets for the entire time range
    start_time = reports_df['timestamp'].min()
    end_time = reports_df['timestamp'].max()
    hourly_range = pd.date_range(start=start_time.floor('H'), end=end_time.ceil('H'), freq='H')
    
    occupancy_data = []
    
    for hour_start in hourly_range:
        hour_end = hour_start + timedelta(hours=1)
        
        # Get reports in this hour
        hour_reports = reports_df[
            (reports_df['timestamp'] >= hour_start) & 
            (reports_df['timestamp'] < hour_end)
        ]
        
        # Calculate realistic availability for this time
        realistic_availability = get_realistic_availability(
            hour_start.hour, 
            hour_start.weekday(), 
            zone_category
        )
        
        # If we have reports, adjust the realistic baseline
        if len(hour_reports) > 0:
            parked_count = len(hour_reports[hour_reports['reportType'] == 'parked'])
            left_count = len(hour_reports[hour_reports['reportType'] == 'left'])
            full_count = len(hour_reports[hour_reports['reportType'] == 'full'])
            empty_count = len(hour_reports[hour_reports['reportType'] == 'empty'])
            
            # Adjust availability based on reports
            if full_count > 0:
                # If someone reported "full", reduce availability
                realistic_availability = min(realistic_availability, 0.1)
            elif empty_count > 0:
                # If someone reported "empty", increase availability
                realistic_availability = max(realistic_availability, 0.8)
            else:
                # Adjust based on parking activity
                net_parking = parked_count - left_count
                if net_parking > 0:
                    # More people parked than left - reduce availability slightly
                    adjustment = min(0.2, net_parking * 0.05)
                    realistic_availability = max(0.05, realistic_availability - adjustment)
                elif net_parking < 0:
                    # More people left than parked - increase availability slightly
                    adjustment = min(0.2, abs(net_parking) * 0.05)
                    realistic_availability = min(0.95, realistic_availability + adjustment)
        
        # Add some random variation to make it more realistic
        noise = np.random.normal(0, 0.03)  # Small random variation
        realistic_availability = max(0.05, min(0.95, realistic_availability + noise))
        
        occupancy_data.append({
            'timestamp': hour_start,
            'availabilityScore': realistic_availability,
            'reportCount': len(hour_reports),
            'parkedReports': len(hour_reports[hour_reports['reportType'] == 'parked']) if len(hour_reports) > 0 else 0,
            'leftReports': len(hour_reports[hour_reports['reportType'] == 'left']) if len(hour_reports) > 0 else 0
        })
    
    result_df = pd.DataFrame(occupancy_data)
    result_df.set_index('timestamp', inplace=True)
    
    # Print statistics for debugging
    if len(result_df) > 0:
        print(f"    📈 Availability stats: min={result_df['availabilityScore'].min():.2f}, "
              f"max={result_df['availabilityScore'].max():.2f}, mean={result_df['availabilityScore'].mean():.2f}")
    
    return result_df

# ---------------- SIMPLE PREDICTION LOGIC ----------------
def generate_realistic_predictions(zone_category: str, historical_df: pd.DataFrame, start_time: datetime, hours: int = 24) -> list:
    """
    Generate realistic predictions based on zone patterns and historical data
    """
    predictions = []
    
    # Calculate average availability by hour from historical data if available
    hourly_averages = {}
    if len(historical_df) > 0:
        historical_df['hour'] = historical_df.index.hour
        hourly_averages = historical_df.groupby('hour')['availabilityScore'].mean().to_dict()
    
    for i in range(1, hours + 1):
        t = start_time + timedelta(hours=i)
        hour = t.hour
        day_of_week = t.weekday()
        
        # Get realistic baseline availability
        baseline_availability = get_realistic_availability(hour, day_of_week, zone_category)
        
        # If we have historical data for this hour, blend it with baseline
        if hour in hourly_averages and len(hourly_averages) > 5:
            historical_avg = hourly_averages[hour]
            # Blend 80% baseline with 20% historical average (prioritize realistic patterns)
            final_availability = 0.8 * baseline_availability + 0.2 * historical_avg
        else:
            final_availability = baseline_availability
        
        # Apply some external factors
        
        # Festival impact
        if t.month == 8 and t.day == 15:  # Independence Day
            final_availability *= 1.2  # Less busy
        elif t.month == 9 and 1 <= t.day <= 15:  # Ganesh festival period
            if zone_category in ['traditional_market', 'commercial_high']:
                final_availability *= 0.8  # More busy
        
        # Weather impact (simplified)
        if t.month in [6, 7, 8, 9]:  # Monsoon
            final_availability *= 1.1  # Slightly less busy due to rain
        
        # Ensure bounds
        final_availability = max(0.05, min(0.95, final_availability))
        
        # Add small random variation for realism
        final_availability += random.uniform(-0.05, 0.05)
        final_availability = max(0.05, min(0.95, final_availability))
        
        # Debug output for first few predictions
        if i <= 3:
            print(f"      {t.strftime('%H:%M')}: {final_availability:.0%} (baseline: {baseline_availability:.0%})")
        
        predictions.append({
            "timestamp": t.isoformat(),
            "availabilityScore": float(final_availability),
            "confidence": 0.8
        })
    
    return predictions

# ---------------- MAIN FUNCTION ----------------
def train_and_update_predictions():
    from dotenv import load_dotenv
    load_dotenv()
    
    MONGO_URI = os.getenv("MONGO_URI")
    client = pymongo.MongoClient(MONGO_URI)
    db = client.ParkWiseDB

    # Get zones with their metadata
    zones = list(db.parkingzones.find({}, {
        "zoneId": 1, "zoneName": 1, "category": 1, 
        "capacity": 1, "estimatedCapacity": 1
    }))
    
    print(f"Found {len(zones)} zones to process...")

    for zone_info in zones:
        zone_id = zone_info["zoneId"]
        zone_name = zone_info.get("zoneName", "")
        zone_category_db = zone_info.get("category", "")
        capacity = zone_info.get("capacity", zone_info.get("estimatedCapacity", 50))
        
        print(f"\n🔄 Processing zone: {zone_id}")
        
        # Categorize zone
        zone_category = categorize_zone(zone_id, zone_name, zone_category_db)
        print(f"   📍 Category: {zone_category}, Name: {zone_name}, Capacity: {capacity}")
        
        # Get user reports
        reports = list(db.userreports.find({"zoneId": zone_id}).sort("timestamp", 1))
        print(f"   📊 Found {len(reports)} user reports")
        
        if len(reports) < 10:
            print(f"   ⚠️  Limited data, using pure pattern-based predictions")
            historical_df = pd.DataFrame()
        else:
            # Process reports to get historical patterns
            df_reports = pd.DataFrame(reports)
            df_reports["timestamp"] = pd.to_datetime(df_reports["timestamp"], utc=True)
            
            # Calculate realistic occupancy patterns
            historical_df = calculate_occupancy_from_reports(df_reports, capacity, zone_category)
        
        # Generate predictions
        now = datetime.now(UTC)
        predictions = generate_realistic_predictions(zone_category, historical_df, now, 24)
        
        # Show sample predictions for debugging
        sample_predictions = predictions[:8]  # First 8 hours
        print(f"   🔮 Sample predictions:")
        for pred in sample_predictions:
            pred_time = datetime.fromisoformat(pred['timestamp'].replace('Z', '+00:00'))
            print(f"      {pred_time.strftime('%H:%M')}: {pred['availabilityScore']:.0%} available")
        
        # Update database
        update_data = {
            "predictions": predictions,
            "lastUpdated": datetime.now(UTC),
            "modelMetrics": {
                "category": zone_category,
                "historicalDataPoints": len(historical_df),
                "reportCount": len(reports),
                "usedRealisticModel": True
            }
        }
        
        db.parkingzones.update_one(
            {"zoneId": zone_id},
            {"$set": update_data}
        )
        
        print(f"   ✅ Updated {zone_id} with realistic predictions")

    print(f"\n🎉 Prediction update completed for all zones!")
    client.close()


if __name__ == "__main__":
    train_and_update_predictions()
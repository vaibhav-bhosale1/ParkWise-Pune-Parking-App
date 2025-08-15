# scripts/train_model.py (Improved)

import os
import pymongo
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestRegressor
from dotenv import load_dotenv

def train_and_predict():
    """
    Connects to MongoDB, processes historical data with enhanced features,
    trains a model, generates predictions, and saves them to the database.
    """
    # 1. SETUP
    load_dotenv()
    MONGO_URI = os.getenv('MONGO_URI')
    if not MONGO_URI:
        raise Exception("MONGO_URI environment variable not set!")

    client = pymongo.MongoClient(MONGO_URI)
    db = client.ParkWiseDB
    print("Successfully connected to MongoDB.")

    # 2. GET ZONES
    all_zones = db.parkingzones.find({}, {'zoneId': 1})
    zone_ids = [zone['zoneId'] for zone in all_zones]
    print(f"Found {len(zone_ids)} zones to process: {zone_ids}")

    # 3. PROCESS EACH ZONE
    for zone_id in zone_ids:
        print(f"\n--- Processing Zone: {zone_id} ---")
        reports = list(db.userreports.find({'zoneId': zone_id}))

        if len(reports) < 10:
            print(f"--> SKIPPING ZONE '{zone_id}': Insufficient data. Requires at least 10 reports, but found {len(reports)}.")
            continue

        # 4. FEATURE ENGINEERING
        df = pd.DataFrame(reports)
        df['timestamp'] = pd.to_datetime(df['timestamp'], utc=True)
        df.set_index('timestamp', inplace=True)

        # Create a full date range to handle hours with no reports
        full_range = pd.date_range(start=df.index.min(), end=df.index.max(), freq='h')
        hourly_counts = df.groupby(pd.Grouper(freq='h'))['reportType'].value_counts().unstack(fill_value=0)
        hourly_counts = hourly_counts.reindex(full_range, fill_value=0)

        for col in ['parked', 'left', 'full']:
            if col not in hourly_counts.columns:
                hourly_counts[col] = 0

        hourly_counts['availabilityScore'] = (
            hourly_counts['left'] / (hourly_counts['parked'] + hourly_counts['full'] + 1)
        ).clip(0, 1)

        # --- IMPROVEMENT: Add more advanced time-based features ---
        hourly_counts['hour'] = hourly_counts.index.hour
        hourly_counts['day_of_week'] = hourly_counts.index.dayofweek

        # Create cyclical features for the hour of the day
        hourly_counts['hour_sin'] = np.sin(2 * np.pi * hourly_counts['hour'] / 24.0)
        hourly_counts['hour_cos'] = np.cos(2 * np.pi * hourly_counts['hour'] / 24.0)

        # Create a feature for weekend vs. weekday
        hourly_counts['is_weekend'] = (hourly_counts['day_of_week'] >= 5).astype(int)

        # Prepare training data with the new features
        features = ['hour_sin', 'hour_cos', 'day_of_week', 'is_weekend']
        X = hourly_counts[features]
        y = hourly_counts['availabilityScore']

        # 5. MODEL TRAINING
        print(f"Training model on {len(X)} data points with features: {features}...")
        model = RandomForestRegressor(n_estimators=100, random_state=42, min_samples_leaf=2)
        model.fit(X, y)
        print("Model training complete.")

        # 6. GENERATE PREDICTIONS
        print("Generating predictions for the next 24 hours...")
        future_timestamps = pd.to_datetime([datetime.now() + timedelta(minutes=15 * i) for i in range(96)])
        future_df = pd.DataFrame(index=future_timestamps)
        future_df['hour'] = future_df.index.hour
        future_df['day_of_week'] = future_df.index.dayofweek
        future_df['hour_sin'] = np.sin(2 * np.pi * future_df['hour'] / 24.0)
        future_df['hour_cos'] = np.cos(2 * np.pi * future_df['hour'] / 24.0)
        future_df['is_weekend'] = (future_df['day_of_week'] >= 5).astype(int)
        
        future_predictions = model.predict(future_df[features])

        predictions_payload = [
            {"timestamp": ts.to_pydatetime(), "availabilityScore": float(score)}
            for ts, score in zip(future_timestamps, future_predictions)
        ]
        
        # 7. SAVE PREDICTIONS TO DATABASE
        print(f"Saving {len(predictions_payload)} predictions to the database...")
        db.parkingzones.update_one(
            {'zoneId': zone_id},
            {'$set': {'predictions': predictions_payload, 'lastUpdated': datetime.now()}}
        )
        print(f"Successfully updated predictions for {zone_id}.")

    client.close()
    print("\n--- All zones processed. Script finished. ---")

if __name__ == "__main__":
    train_and_predict()

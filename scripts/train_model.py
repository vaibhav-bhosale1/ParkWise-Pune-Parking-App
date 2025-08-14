# scripts/train_model.py

import os
import pymongo
import pandas as pd
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestRegressor
from dotenv import load_dotenv

def train_and_predict():
    """
    Connects to MongoDB, processes historical data for each parking zone,
    trains a model, generates predictions for the next 24 hours,
    and saves them back to the database.
    """
    # 1. SETUP: Load environment variables and connect to DB
    load_dotenv()
    MONGO_URI = os.getenv('MONGO_URI')
    if not MONGO_URI:
        raise Exception("MONGO_URI environment variable not set!")

    client = pymongo.MongoClient(MONGO_URI)
    db = client.ParkWiseDB

    print("Successfully connected to MongoDB.")

    # 2. GET ZONES: Fetch all unique zone IDs to process
    all_zones = db.parkingzones.find({}, {'zoneId': 1})
    zone_ids = [zone['zoneId'] for zone in all_zones]
    print(f"Found {len(zone_ids)} zones to process: {zone_ids}")

    # 3. PROCESS EACH ZONE
    for zone_id in zone_ids:
        print(f"\n--- Processing Zone: {zone_id} ---")

        # Fetch all historical reports for the current zone
        reports = list(db.userreports.find({'zoneId': zone_id}))

        if len(reports) < 10: # Need a minimum amount of data to train
            print(f"Skipping {zone_id}: Insufficient data ({len(reports)} reports).")
            continue

        # 4. FEATURE ENGINEERING: Convert raw reports into a trainable format
        df = pd.DataFrame(reports)
        df['timestamp'] = pd.to_datetime(df['timestamp'], utc=True)
        df.set_index('timestamp', inplace=True)

        # --- CHANGE: Updated to the most modern pandas syntax for this operation ---
        hourly_counts = df.groupby(pd.Grouper(freq='h'))['reportType'].value_counts().unstack(fill_value=0)
        
        # Ensure all possible columns exist
        for col in ['parked', 'left', 'full']:
            if col not in hourly_counts.columns:
                hourly_counts[col] = 0

        # Calculate the availability score
        hourly_counts['availabilityScore'] = (
            hourly_counts['left'] / (hourly_counts['parked'] + hourly_counts['full'] + 1)
        ).clip(0, 1)

        # Create time-based features for the model
        hourly_counts['hour_of_day'] = hourly_counts.index.hour
        hourly_counts['day_of_week'] = hourly_counts.index.dayofweek

        # Prepare training data
        X = hourly_counts[['hour_of_day', 'day_of_week']]
        y = hourly_counts['availabilityScore']

        # 5. MODEL TRAINING
        print(f"Training model on {len(X)} data points...")
        model = RandomForestRegressor(n_estimators=100, random_state=42, min_samples_leaf=2)
        model.fit(X, y)
        print("Model training complete.")

        # 6. GENERATE PREDICTIONS
        print("Generating predictions for the next 24 hours...")
        future_timestamps = pd.to_datetime([datetime.now() + timedelta(minutes=15 * i) for i in range(96)])
        future_df = pd.DataFrame(index=future_timestamps)
        future_df['hour_of_day'] = future_df.index.hour
        future_df['day_of_week'] = future_df.index.dayofweek
        
        future_predictions = model.predict(future_df[['hour_of_day', 'day_of_week']])

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

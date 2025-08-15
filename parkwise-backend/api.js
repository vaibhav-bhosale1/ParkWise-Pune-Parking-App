// parkwise-backend/api.js (Real-time with Pusher)
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import Pusher from 'pusher';
import { ParkingZone, UserReport } from './Model/models.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// --- Initialize Pusher ---
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true
});

const { MONGO_URI } = process.env;

const connectToDatabase = async () => {
  if (mongoose.connection.readyState >= 1) return;
  console.log('Creating new MongoDB connection...');
  await mongoose.connect(MONGO_URI);
};

// --- API Routes ---
app.get('/zones', async (req, res) => {
  try {
    await connectToDatabase();
    const zones = await ParkingZone.find({});
    res.status(200).json(zones);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not fetch zones.' });
  }
});

app.post('/report', async (req, res) => {
  try {
    const { zoneId, reportType } = req.body;
    if (!zoneId || !reportType) {
      return res.status(400).json({ error: 'zoneId and reportType are required.' });
    }

    await connectToDatabase();
    
    let updateOperation = {};
    if (reportType === 'parked') {
      updateOperation = { $inc: { currentOccupancy: 1 } };
    } else if (reportType === 'left') {
      updateOperation = { $inc: { currentOccupancy: -1 } };
    }
    
    // Find the zone, apply the update, and return the new document
    const updatedZone = await ParkingZone.findOneAndUpdate(
      { 
        zoneId, 
        ...(reportType === 'parked' && { $expr: { $lt: ["$currentOccupancy", "$capacity"] } }),
        ...(reportType === 'left' && { currentOccupancy: { $gt: 0 } })
      },
      updateOperation,
      { new: true }
    );

    if (!updatedZone) {
      // If the report was 'full', we don't need to update, just broadcast
      if (reportType === 'full') {
         const zone = await ParkingZone.findOne({ zoneId });
         if (zone) {
            await pusher.trigger('parking-updates', 'zone-update', { zoneId, currentOccupancy: zone.capacity, capacity: zone.capacity });
            return res.status(200).json({ message: 'Full report noted.' });
         }
      }
      return res.status(404).json({ error: "Zone not found, is full, or is empty." });
    }

    const newReport = new UserReport({ zoneId, reportType, timestamp: new Date() });
    await newReport.save();
    
    const payload = {
      zoneId: updatedZone.zoneId,
      currentOccupancy: updatedZone.currentOccupancy,
      capacity: updatedZone.capacity,
    };
    
    await pusher.trigger('parking-updates', 'zone-update', payload);
    console.log(`Broadcasted update for ${zoneId}:`, payload);

    res.status(201).json({ message: 'Report received and broadcasted.', data: payload });

  } catch (error) {
    console.error("Error in /report handler:", error);
    res.status(500).json({ error: 'Could not process report.' });
  }
});

// --- Server Start Logic ---
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running and listening on port ${PORT}`);
});
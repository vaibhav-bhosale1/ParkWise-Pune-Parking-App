// parkwise-backend/api.js for Render

import express from 'express';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import { ParkingZone, UserReport } from './Model/models.js';
import cors from 'cors'; 
import dotenv from 'dotenv';

// Load environment variables from .env file for local development
dotenv.config();

const app = express();

// It will add the 

app.use(cors());

// Use the standard express.json() middleware. This will work correctly in Render's environment.
app.use(express.json());

const { MONGO_URI, REDIS_URI } = process.env;

// --- Database & Cache Connections ---
let conn = null;
let redis = null;

const connectToDatabase = async () => {
  if (conn == null) {
    console.log('Creating new MongoDB connection...');
    conn = mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    }).then(() => mongoose);
    await conn;
  }
  return conn;
};

const connectToCache = () => {
  if (redis == null) {
    console.log('Creating new Redis connection...');
    redis = new Redis(REDIS_URI);
  }
  return redis;
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


// POST /report: Submits a new parking report
app.post('/report', async (req, res) => {
  try {
    // The request body is now automatically parsed by express.json()
    const { zoneId, reportType } = req.body;
    if (!zoneId || !reportType) {
      return res.status(400).json({ error: 'zoneId and reportType are required.' });
    }

    await connectToDatabase();
    const newReport = new UserReport({ zoneId, reportType, timestamp: new Date() });
    await newReport.save();

    // Re-enabled the Redis caching logic
    if (reportType === 'left') {
        const cache = connectToCache();
        await cache.set(`left:${zoneId}`, '1', 'EX', 120);
        console.log(`Cached 'left' report for zone: ${zoneId}`);
    }

    res.status(201).json({ message: 'Report received.', report: newReport });

  } catch (error) {
    console.error("Error in /report handler:", error);
    res.status(500).json({ error: 'Could not save report.' });
  }
});

// Generic error handler for routes that don't exist
app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

// --- Server Start Logic for Render ---
// Render provides the PORT environment variable automatically.
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is running and listening on port ${PORT}`);
});

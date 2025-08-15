// parkwise-backend/Model/models.js

// --- DIAGNOSTIC LINE ---
// If you see this message when your server starts, the file has been loaded correctly.
console.log("--- Loading models.js file - Version 2.0 ---");

import mongoose from 'mongoose';

// This schema is now updated to correctly handle the GeoJSON Polygon in your 'area' field.
const parkingZoneSchema = new mongoose.Schema({
  zoneId: { type: String, required: true, unique: true },
  zoneName: { type: String, required: true },
  description: String,
  category: String,
  // This now correctly defines the schema for a GeoJSON Polygon.
  area: {
    type: {
      type: String,
      enum: ['Polygon'],
      required: true
    },
    coordinates: {
      type: [[[Number]]], // Array of LinearRing coordinate arrays
      required: true
    }
  },
  estimatedCapacity: Number,
  capacity: { type: Number, required: true, default: 20 }, // Added
  currentOccupancy: { type: Number, required: true, default: 0 }, // Added
  peakHours: [String],
  predictions: Array,
  lastUpdated: Date
});

// This schema correctly matches your 'userreports' collection.
const userReportSchema = new mongoose.Schema({
  zoneId: { type: String, required: true },
  reportType: {
    type: String,
    enum: ['parked', 'left', 'full'],
    required: true
  },
  timestamp: { type: Date, default: Date.now }
});

// Adding a '2dsphere' index to the 'area' field is crucial for location-based queries.
parkingZoneSchema.index({ area: '2dsphere' });
userReportSchema.index({ zoneId: 1, timestamp: -1 });


// This export format prevents errors during hot-reloading in development.
// The third argument ('parkingzones') explicitly tells Mongoose to use your existing collection with that exact name.
export const ParkingZone = mongoose.models.ParkingZone || mongoose.model('ParkingZone', parkingZoneSchema, 'parkingzones');
export const UserReport = mongoose.models.UserReport || mongoose.model('UserReport', userReportSchema);

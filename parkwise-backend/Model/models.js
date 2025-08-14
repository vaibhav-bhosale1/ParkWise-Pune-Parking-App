// parkwise-backend/models.js

const mongoose = require('mongoose');

const parkingZoneSchema = new mongoose.Schema({
  zoneId: { type: String, required: true, unique: true },
  zoneName: { type: String, required: true },
  area: {
    type: {
      type: String,
      enum: ['Polygon'],
      required: true
    },
    coordinates: {
      type: [[[Number]]], 
      required: true
    }
  },
  
  predictions: [{
    timestamp: Date,
    availabilityScore: Number 
  }]
});


const userReportSchema = new mongoose.Schema({
  zoneId: { type: String, required: true },
  reportType: {
    type: String,
    enum: ['parked', 'left', 'full'],
    required: true
  },
  timestamp: { type: Date, default: Date.now }
});

parkingZoneSchema.index({ area: '2dsphere' });
userReportSchema.index({ zoneId: 1, timestamp: -1 });


const ParkingZone = mongoose.model('ParkingZone', parkingZoneSchema);
const UserReport = mongoose.model('UserReport', userReportSchema);

module.exports = { ParkingZone, UserReport };
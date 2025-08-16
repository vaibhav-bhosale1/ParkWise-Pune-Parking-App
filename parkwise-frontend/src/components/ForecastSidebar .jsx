// src/components/ForecastSidebar.jsx
'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Helper to find the prediction for a specific hour
const getPredictionForTime = (predictions, time) => {
  if (!predictions || predictions.length === 0) return { availabilityScore: 0.5 };
  return predictions.reduce((closest, current) => {
    const closestDiff = Math.abs(new Date(closest.timestamp).getTime() - time.getTime());
    const currentDiff = Math.abs(new Date(current.timestamp).getTime() - time.getTime());
    return currentDiff < closestDiff ? current : closest;
  });
};

// Helper to get a contextual tip
const getParkingTip = (selectedTime) => {
  const hour = selectedTime.getHours();
  if (hour >= 19 && hour <= 22) {
    return "Evening Rush: This is a peak time for dining and shopping. Plan for extra time to find a spot.";
  }
  if (hour >= 8 && hour <= 10) {
    return "Morning Commute: Office-goers are arriving. Parking may be challenging in business districts.";
  }
  if (hour >= 12 && hour <= 14) {
    return "Lunchtime Peak: Expect higher traffic around restaurants and commercial areas.";
  }
  if (hour < 6 || hour > 23) {
    return "Late Night/Early Morning: Parking is generally easy to find at this hour.";
  }
  return "Off-Peak Hours: Finding a parking spot should be relatively easy right now.";
};

// Helper to generate fact based on forecast
const getAvailabilityFact = (hourlyForecast) => {
  if (!hourlyForecast || hourlyForecast.length === 0) {
    return "No forecast data available right now.";
  }

  // Average availability across the forecast window
  const avgAvailability = hourlyForecast.reduce((sum, item) => sum + item.availability, 0) / hourlyForecast.length;

  if (avgAvailability > 70) {
    return `👍 Parking looks good! On average, ${Math.round(avgAvailability)}% of spots are likely available over the next few hours.`;
  }
  if (avgAvailability > 40) {
    return `⚠️ Moderate availability: About ${Math.round(avgAvailability)}% average availability forecasted. You might need a little extra time.`;
  }
  return `🚨 High demand! Average availability is only ${Math.round(avgAvailability)}%. Finding parking may be tough, consider alternatives.`;
};

const ForecastSidebar = ({ zones, selectedTime }) => {
  // 1. Calculate hourly forecast
  const hourlyForecast = React.useMemo(() => {
    const now = new Date(selectedTime);
    const data = [];
    for (let i = 0; i < 8; i++) {
      const forecastTime = new Date(now.getTime() + i * 60 * 60 * 1000);
      let totalScore = 0;
      let validZones = 0;

      zones.forEach(zone => {
        if (zone.predictions && zone.predictions.length > 0) {
          const prediction = getPredictionForTime(zone.predictions, forecastTime);
          totalScore += prediction.availabilityScore;
          validZones++;
        }
      });
      
      const avgScore = validZones > 0 ? totalScore / validZones : 0;
      data.push({
        time: forecastTime.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
        availability: Math.round(avgScore * 100),
      });
    }
    return data;
  }, [zones, selectedTime]);

  // 2. Get contextual tip
  const tip = getParkingTip(selectedTime);

  // 3. Get availability fact
  const availabilityFact = getAvailabilityFact(hourlyForecast);

  return (
    <div className="absolute top-0 left-0 h-full w-80 bg-white z-[1000] shadow-lg p-4 flex flex-col gap-6 overflow-y-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Hourly Availability Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={hourlyForecast} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis domain={[0, 100]}>
                <Label value="Availability (%)" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
              </YAxis>
              <Tooltip formatter={(value) => `${value}%`} />
              <Bar dataKey="availability" fill="#4F46E5" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Parking Insights & Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700">{tip}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📊 Availability Fact</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">{availabilityFact}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForecastSidebar;

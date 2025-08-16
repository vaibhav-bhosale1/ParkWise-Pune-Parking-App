"use client"

import { useState, useEffect } from "react"

// 1. Import your new, complete DateTimePicker
import { DateTimePicker } from "@/components/ui/date-picker-heroui";

// 2. Import the necessary functions from the new libraries
import {
  now,
  parseAbsoluteToLocal,
  getLocalTimeZone
} from "@internationalized/date";

const ForecastControl = ({ selectedTime, setSelectedTime }) => {
  // State for the picker, which uses the special `DateValue` object
  const [dateValue, setDateValue] = useState(
    selectedTime ? parseAbsoluteToLocal(selectedTime.toISOString()) : null
  );

  // When the picker's value changes, we convert it back to a normal JS Date
  const handlePickerChange = (newDateValue) => {
    setDateValue(newDateValue);
    if (newDateValue) {
      // This is the "bridge" back to the standard JS Date object for your app
      setSelectedTime(newDateValue.toDate(getLocalTimeZone()));
    } else {
      setSelectedTime(null);
    }
  };

  // Keep the internal dateValue in sync if the external selectedTime prop changes
  useEffect(() => {
    setDateValue(
      selectedTime ? parseAbsoluteToLocal(selectedTime.toISOString()) : null
    );
  }, [selectedTime]);

  return (
    <div
      style={{
        position: "absolute",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        width: '320px' // Give the component a defined width
      }}
    >
      <DateTimePicker
        label="Forecast for"
        value={dateValue}
        onChange={handlePickerChange}
        // This is the robust way to prevent selecting past dates and times
        minValue={now(getLocalTimeZone())}
        granularity="minute"
      />
    </div>
  )
}

export default ForecastControl;
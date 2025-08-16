"use client"

import React from "react"

const DateTimePicker = ({ initialTime, onOk, onCancel }) => {
  const [tempTime, setTempTime] = React.useState(() => {
    // Convert to local datetime string format for input
    const date = new Date(initialTime)
    return date.toISOString().slice(0, 16)
  })

  const handleOk = () => {
    onOk(new Date(tempTime))
  }

  const handleTimeChange = (e) => {
    setTempTime(e.target.value)
  }

  return (
    <div className="absolute top-5 left-1/2 transform -translate-x-1/2 z-[1001] bg-white rounded-xl shadow-2xl border border-gray-100 p-6 min-w-[320px]">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Select Date & Time</h3>
        <p className="text-sm text-gray-500">Choose your preferred forecast time</p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Date & Time</label>
        <input
          type="datetime-local"
          value={tempTime}
          onChange={handleTimeChange}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-gray-50 hover:bg-white"
        />
      </div>

      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200 font-medium"
        >
          Cancel
        </button>
        <button
          onClick={handleOk}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium shadow-sm"
        >
          Confirm
        </button>
      </div>
    </div>
  )
}

export default DateTimePicker

"use client";

import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import React, { useState, useMemo, useEffect } from "react";
import * as Popover from "@radix-ui/react-popover";
import {
  Button,
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridHeader,
  CalendarHeaderCell,
  CalendarGridBody,
  Dialog,
  Group,
  Heading,
  Label,
} from "react-aria-components";

import {
  Time,
  today,
  now,
  getLocalTimeZone,
  CalendarDate,
} from "@internationalized/date";
import { useDateFormatter } from "@react-aria/i18n";

export function DateTimePicker({ value, onChange, label }) {
  const tz = getLocalTimeZone();
  const [tempDate, setTempDate] = useState(null); // CalendarDate
  const [tempTime, setTempTime] = useState(null); // Time

  const currentDateTime = now(tz);
  const todayDate = today(tz);

  const timeFormatter = useDateFormatter({ timeStyle: "short" });

  // Initialize from parent value
  useEffect(() => {
    if (value) {
      setTempDate(new CalendarDate(value.year, value.month, value.day));
      setTempTime(new Time(value.hour, value.minute));
    } else {
      setTempDate(todayDate);
      setTempTime(new Time(currentDateTime.hour, currentDateTime.minute));
    }
  }, [value]);

  const handleApply = () => {
    if (tempDate && tempTime) {
      const combined = tempDate.toDate(tz);
      combined.setHours(tempTime.hour, tempTime.minute, 0, 0);
      const zoned = now(tz).set({
        year: combined.getFullYear(),
        month: combined.getMonth() + 1,
        day: combined.getDate(),
        hour: tempTime.hour,
        minute: tempTime.minute,
      });
      onChange(zoned);
    }
  };

  const handleCancel = () => {
    if (value) {
      setTempDate(new CalendarDate(value.year, value.month, value.day));
      setTempTime(new Time(value.hour, value.minute));
    } else {
      setTempDate(todayDate);
      setTempTime(new Time(currentDateTime.hour, currentDateTime.minute));
    }
  };

  // Time slots (30 min)
  const timeSlots = useMemo(() => {
    const slots = [];
    let t = new Time(0, 0);
    for (let i = 0; i < 48; i++) {
      slots.push(t);
      t = t.add({ minutes: 30 });
    }
    return slots;
  }, []);

  if (!tempDate || !tempTime) return null;

  return (
    <div className="group flex w-full flex-col gap-2">
      {label && (
        <Label className="text-sm font-medium text-gray-800">{label}</Label>
      )}

      <Popover.Root>
        <Popover.Trigger asChild>
          <Group className="flex h-10 w-full cursor-pointer items-center rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-800">
            <span>
              {value
                ? value
                    .toDate(tz)
                    .toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
                : "Select date & time"}
            </span>
            <CalendarIcon size={16} className="ml-auto text-gray-500" />
          </Group>
        </Popover.Trigger>

        <Popover.Content
          align="start"
          sideOffset={5}
          className="z-50 rounded-xl border bg-white shadow-lg ring-1 ring-black/10"
        >
          <Dialog className="p-0">
            <div className="flex rounded-xl bg-white">
              {/* Calendar */}
              <Calendar
                value={tempDate}
                onChange={setTempDate}
                minValue={todayDate} // disables past dates
              >
                <div className="flex items-center justify-between p-4 pb-0">
                  <Button slot="previous" className="p-1 rounded-full hover:bg-gray-100">
                    <ChevronLeft size={18} />
                  </Button>
                  <Heading className="text-lg font-semibold text-gray-900" />
                  <Button slot="next" className="p-1 rounded-full hover:bg-gray-100">
                    <ChevronRight size={18} />
                  </Button>
                </div>
                <CalendarGrid className="mt-2 px-4">
                  <CalendarGridHeader>
                    {(day) => (
                      <CalendarHeaderCell className="text-xs font-semibold text-gray-500">
                        {day}
                      </CalendarHeaderCell>
                    )}
                  </CalendarGridHeader>
                  <CalendarGridBody>
                    {(date) => (
                      <CalendarCell
                        date={date}
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm
                          hover:bg-gray-100
                          data-[disabled]:text-gray-300 data-[disabled]:cursor-not-allowed
                          ${
                            tempDate && date.compare(tempDate) === 0
                              ? "bg-blue-600 text-white"
                              : ""
                          }`}
                      />
                    )}
                  </CalendarGridBody>
                </CalendarGrid>
              </Calendar>

              {/* Time Picker */}
              <div className="border-l border-gray-200 p-4">
                <Label className="text-sm font-medium text-gray-800">Time</Label>
                <div className="mt-2 h-[240px] w-48 overflow-y-auto pr-2 grid grid-cols-2 gap-2">
                  {timeSlots.map((time) => {
                    const slotDateTime = now(tz).set({
                      year: tempDate.year,
                      month: tempDate.month,
                      day: tempDate.day,
                      hour: time.hour,
                      minute: time.minute,
                    });

                    // Disable past times if today
                    const isDisabled =
                      tempDate.compare(todayDate) === 0 &&
                      slotDateTime.compare(currentDateTime) < 0;

                    const isSelected =
                      tempTime.hour === time.hour && tempTime.minute === time.minute;

                    return (
                      <Button
                        key={time.toString()}
                        isDisabled={isDisabled}
                        onPress={() => setTempTime(time)}
                        className={`w-full rounded-md p-2 text-sm transition-colors ${
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                        } ${isDisabled ? "opacity-40 cursor-not-allowed" : ""}`}
                      >
                        {timeFormatter.format(slotDateTime.toDate(tz))}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 border-t border-gray-200 p-3">
              <Popover.Close asChild>
                <Button
                  variant="outline"
                  className="px-4 py-2 text-sm rounded-lg"
                  onPress={handleCancel}
                >
                  Cancel
                </Button>
              </Popover.Close>
              <Popover.Close asChild>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm rounded-lg"
                  onPress={handleApply}
                >
                  Apply
                </Button>
              </Popover.Close>
            </div>
          </Dialog>
        </Popover.Content>
      </Popover.Root>
    </div>
  );
}

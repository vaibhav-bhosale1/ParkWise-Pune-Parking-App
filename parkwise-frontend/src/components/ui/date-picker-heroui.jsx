"use client";

import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import React, { useState, useMemo, useEffect } from "react";
import {
  Button,
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridHeader,
  CalendarHeaderCell,
  CalendarGridBody,
  DateInput,
  DateSegment,
  Dialog,
  Group,
  Heading,
  Label,
  Popover,
  DatePicker as AriaDatePicker,
} from "react-aria-components";

import { Time, now, getLocalTimeZone } from "@internationalized/date";
import { useDateFormatter } from "@react-aria/i18n";

export function DateTimePicker({ value, onChange, ...props }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempValue, setTempValue] = useState(null);

  const today = now(getLocalTimeZone());

  useEffect(() => {
    setTempValue(value || today);
  }, [value]);

  const handleOpenChange = (open) => {
    if (open) {
      setTempValue(value || today);
    }
    setIsOpen(open);
  };

  const handleApply = () => {
    onChange(tempValue);
    setIsOpen(false);
  };

  const timeFormatter = useDateFormatter({ timeStyle: "short" });

  const timeSlots = useMemo(() => {
    const slots = [];
    let time = new Time(0, 0);
    for (let i = 0; i < 48; i++) {
      slots.push(time);
      time = time.add({ minutes: 30 });
    }
    return slots;
  }, []);

  const handleTimeSelect = (selectedTime) => {
    if (!tempValue) return;
    const newDateTime = tempValue.set({
      hour: selectedTime.hour,
      minute: selectedTime.minute,
    });
    setTempValue(newDateTime);
  };

  if (!tempValue) {
    return (
      <div className="group flex w-full flex-col gap-2">
        <Label className="text-sm font-medium text-gray-800">{props.label}</Label>
        <div className="flex h-10 w-full animate-pulse items-center rounded-md border border-gray-200 bg-gray-100 px-3" />
      </div>
    );
  }

  return (
    <AriaDatePicker
      value={value} // applied value
      onChange={() => {}} // disable auto-apply
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      {...props}
      className="group flex w-full flex-col gap-2"
    >
      <Label className="text-sm font-medium text-gray-800">{props.label}</Label>
      <Group className="flex h-10 w-full items-center rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-800 ring-offset-blue-500 focus-within:ring-2 focus-within:ring-blue-600 group-disabled:cursor-not-allowed group-disabled:opacity-50">
        <DateInput className="flex-1 py-0.5">
          {(segment) => <DateSegment segment={segment} className="focus:outline-none" />}
        </DateInput>
        <Button className="ml-2 rounded-full p-1.5 text-gray-500 transition-colors hover:bg-gray-100 pressed:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600">
          <CalendarIcon size={16} />
        </Button>
      </Group>
      <Popover>
        <Dialog className="z-50 max-h-[inherit] overflow-auto rounded-xl border bg-white p-0 shadow-lg ring-1 ring-black/10">
          <div className="flex rounded-xl bg-white">
            {/* Calendar */}
            <Calendar className="p-4" value={tempValue} onChange={() => {}}>
              <div className="flex items-center justify-between">
                <Button slot="previous" className="p-1 rounded-full hover:bg-gray-100 transition-colors">
                  <ChevronLeft size={18} />
                </Button>
                <Heading className="text-lg font-semibold text-gray-900" />
                <Button slot="next" className="p-1 rounded-full hover:bg-gray-100 transition-colors">
                  <ChevronRight size={18} />
                </Button>
              </div>
              <CalendarGrid className="mt-4">
                <CalendarGridHeader>
                  {(day) => (
                    <CalendarHeaderCell className="text-xs font-semibold text-gray-500">
                      {day}
                    </CalendarHeaderCell>
                  )}
                </CalendarGridHeader>
                <CalendarGridBody>
                  {(date) => {
                    const isToday =
                      date.year === today.year &&
                      date.month === today.month &&
                      date.day === today.day;

                    const isPastDate = date.compare(today) < 0;
                    const isApplied =
                      value &&
                      date.year === value.year &&
                      date.month === value.month &&
                      date.day === value.day;
                    const isTempSelected =
                      tempValue &&
                      date.year === tempValue.year &&
                      date.month === tempValue.month &&
                      date.day === tempValue.day;

                    return (
                      <CalendarCell
                        date={date}
                        isDisabled={isPastDate}
                        onPress={() =>
                          setTempValue(
                            date.set({ hour: tempValue.hour, minute: tempValue.minute })
                          )
                        }
                        className={`group relative flex h-9 w-9 items-center justify-center rounded-full text-sm
                          text-gray-900 data-[disabled]:text-gray-300 outside-month:text-gray-400 
                          hover:bg-gray-100 pressed:bg-gray-200 
                          ${isApplied ? "bg-blue-600 text-white" : ""}
                          ${isTempSelected && !isApplied ? "bg-blue-100 text-blue-800" : ""}
                          ${isToday ? "ring-2 ring-blue-400" : ""}`}
                      />
                    );
                  }}
                </CalendarGridBody>
              </CalendarGrid>
            </Calendar>

            {/* Time Picker */}
            <div className="border-l border-gray-200 p-4">
              <Label className="text-sm font-medium text-gray-800">Time</Label>
              <div className="mt-2 h-[240px] w-48 overflow-y-auto pr-2 grid grid-cols-2 gap-2">
                {timeSlots.map((time) => {
                  const nowTime = now(getLocalTimeZone());
                  const dateTimeSlot = tempValue.set({
                    hour: time.hour,
                    minute: time.minute,
                  });

                  const isDisabled =
                    dateTimeSlot.compare(nowTime) < 0 &&
                    dateTimeSlot.day === nowTime.day &&
                    dateTimeSlot.month === nowTime.month &&
                    dateTimeSlot.year === nowTime.year;

                  const isApplied =
                    value &&
                    value.hour === time.hour &&
                    value.minute === time.minute &&
                    value.day === tempValue.day &&
                    value.month === tempValue.month &&
                    value.year === tempValue.year;

                  const isTempSelected =
                    tempValue &&
                    tempValue.hour === time.hour &&
                    tempValue.minute === time.minute;

                  return (
                    <Button
                      key={time.toString()}
                      isDisabled={isDisabled}
                      onPress={() => handleTimeSelect(time)}
                      className={`w-full rounded-md p-2 text-sm transition-colors ${
                        isApplied
                          ? "bg-blue-600 text-white"
                          : isTempSelected && !isApplied
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                      } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {timeFormatter.format(
                        tempValue.set({ hour: time.hour, minute: time.minute }).toDate(getLocalTimeZone())
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t border-gray-200 p-3">
            <Button
              variant="outline"
              className="px-4 py-2 text-sm rounded-lg"
              onPress={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm rounded-lg"
              onPress={handleApply}
            >
              Apply
            </Button>
          </div>
        </Dialog>
      </Popover>
    </AriaDatePicker>
  );
}

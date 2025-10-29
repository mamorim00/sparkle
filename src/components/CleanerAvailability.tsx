"use client";

import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { db } from "../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

interface TimeSlot {
  start: string;
  end: string;
}

interface Exception extends TimeSlot {
  date: string;
}

interface CleanerScheduleProps {
  cleanerId: string;
}

export interface CleanerScheduleRef {
  saveSchedule: () => Promise<void>;
}

const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const CleanerSchedule = forwardRef<CleanerScheduleRef, CleanerScheduleProps>(({ cleanerId }, ref) => {
  const [schedule, setSchedule] = useState<Record<string, TimeSlot[]>>({});
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [loading, setLoading] = useState(true);
  const [newException, setNewException] = useState<Exception>({ date: "", start: "", end: "" });

  // Fetch existing schedule from Firestore
  useEffect(() => {
    const fetchSchedule = async () => {
      if (!cleanerId) return;

      try {
        const cleanerRef = doc(db, "cleaners", cleanerId);
        const docSnap = await getDoc(cleanerRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setSchedule(data.schedule || {});
          setExceptions(data.exceptions || []);
        } else {
          console.warn("Cleaner not found");
        }
      } catch (err) {
        console.error("Error fetching schedule:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [cleanerId]);

  // Handle time slot change
  const updateTimeSlot = (day: string, index: number, field: keyof TimeSlot, value: string) => {
    setSchedule((prev) => {
      const updated = [...(prev[day] || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, [day]: updated };
    });
  };

  // Add new time slot
  const addTimeSlot = (day: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: [...(prev[day] || []), { start: "", end: "" }],
    }));
  };

  // Remove time slot
  const removeTimeSlot = (day: string, index: number) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index),
    }));
  };

  // Add exception
  const addException = () => {
    if (!newException.date || !newException.start || !newException.end) return;
    setExceptions((prev) => [...prev, newException]);
    setNewException({ date: "", start: "", end: "" });
  };

  // Remove exception
  const removeException = (index: number) => {
    setExceptions((prev) => prev.filter((_, i) => i !== index));
  };

  // Save to Firestore
  const saveSchedule = async () => {
    try {
      const cleanerRef = doc(db, "cleaners", cleanerId);
      await updateDoc(cleanerRef, {
        schedule,
        exceptions,
      });
      alert("Schedule saved successfully!");
    } catch (err) {
      console.error("Error saving schedule:", err);
      alert("Failed to save schedule.");
    }
  };

  // Expose saveSchedule function to parent via ref
  useImperativeHandle(ref, () => ({
    saveSchedule,
  }));

  if (loading) return <p>Loading schedule...</p>;

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white shadow rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Manage Your Availability</h2>

      {/* Weekly Schedule */}
      <h3 className="text-lg font-semibold mb-2">Weekly Schedule</h3>
      {daysOfWeek.map((day) => (
        <div key={day} className="mb-4 border-b pb-4">
          <h4 className="capitalize font-medium">{day}</h4>
          {(schedule[day] || []).map((slot, index) => (
            <div key={index} className="flex gap-2 items-center mt-2">
              <input
                type="time"
                value={slot.start}
                onChange={(e) => updateTimeSlot(day, index, "start", e.target.value)}
                className="border p-2 rounded"
              />
              <span>to</span>
              <input
                type="time"
                value={slot.end}
                onChange={(e) => updateTimeSlot(day, index, "end", e.target.value)}
                className="border p-2 rounded"
              />
              <button
                onClick={() => removeTimeSlot(day, index)}
                className="text-red-500 text-sm ml-2"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={() => addTimeSlot(day)}
            className="mt-2 px-3 py-1 bg-green-500 text-white rounded"
          >
            + Add Time Slot
          </button>
        </div>
      ))}

      {/* Exceptions */}
      <h3 className="text-lg font-semibold mt-6 mb-2">Exceptions (Days Off or Extra Shifts)</h3>
      <div className="flex gap-2 items-center mb-4">
        <input
          type="date"
          value={newException.date}
          onChange={(e) => setNewException({ ...newException, date: e.target.value })}
          className="border p-2 rounded"
        />
        <input
          type="time"
          value={newException.start}
          onChange={(e) => setNewException({ ...newException, start: e.target.value })}
          className="border p-2 rounded"
        />
        <input
          type="time"
          value={newException.end}
          onChange={(e) => setNewException({ ...newException, end: e.target.value })}
          className="border p-2 rounded"
        />
        <button
          onClick={addException}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          Add
        </button>
      </div>

      {exceptions.map((ex, index) => (
        <div key={index} className="flex justify-between items-center mb-2 border p-2 rounded">
          <span>
            {ex.date}: {ex.start} - {ex.end}
          </span>
          <button
            onClick={() => removeException(index)}
            className="text-red-500 text-sm"
          >
            ✕
          </button>
        </div>
      ))}

      {/* Save Button */}
      <button
        onClick={saveSchedule}
        className="mt-6 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-semibold"
      >
        Save Schedule
      </button>
    </div>
  );
});

CleanerSchedule.displayName = "CleanerSchedule";

export default CleanerSchedule;

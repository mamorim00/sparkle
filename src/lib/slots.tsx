export type WorkingHours = {
    [day: string]: { start: string; end: string };
  };
  
  export function generateSlots(start: string, end: string, intervalMinutes = 60) {
    const slots: { start: string; end: string }[] = [];
    let current = new Date(`1970-01-01T${start}:00`);
    const endDate = new Date(`1970-01-01T${end}:00`);
  
    while (current < endDate) {
      const slotStart = current.toTimeString().slice(0, 5);
      current.setMinutes(current.getMinutes() + intervalMinutes);
      const slotEnd = current.toTimeString().slice(0, 5);
      if (current <= endDate) {
        slots.push({ start: slotStart, end: slotEnd });
      }
    }
    return slots;
  }
  
  // Get day of week in lowercase for Firestore workingHours
  export function getDayOfWeek(date: Date) {
    return ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][date.getDay()];
  }
  
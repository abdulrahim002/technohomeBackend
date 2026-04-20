const DEFAULT_TIME_ZONE = 'Africa/Tripoli';

const DEFAULT_WEEKLY_SCHEDULE = [
  { dayOfWeek: 0, isWorking: false, periods: [] },
  { dayOfWeek: 1, isWorking: true, periods: [{ start: '09:00', end: '17:00' }] },
  { dayOfWeek: 2, isWorking: true, periods: [{ start: '09:00', end: '17:00' }] },
  { dayOfWeek: 3, isWorking: true, periods: [{ start: '09:00', end: '17:00' }] },
  { dayOfWeek: 4, isWorking: true, periods: [{ start: '09:00', end: '17:00' }] },
  { dayOfWeek: 5, isWorking: true, periods: [{ start: '09:00', end: '17:00' }] },
  { dayOfWeek: 6, isWorking: true, periods: [{ start: '10:00', end: '14:00' }] }
];

const pad = (value) => String(value).padStart(2, '0');

const toDateObject = (date) => {
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return new Date(`${date}T12:00:00+02:00`);
  }

  return new Date(date);
};

const getLocalDateString = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: DEFAULT_TIME_ZONE });
  return formatter.format(toDateObject(date));
};

const getDayOfWeek = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat('en-US', { timeZone: DEFAULT_TIME_ZONE, weekday: 'short' });
  return formatter.format(toDateObject(date));
};

const DAY_MAP = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6
};

const dayIndexFor = (date = new Date()) => DAY_MAP[getDayOfWeek(date)] ?? toDateObject(date).getDay();

const buildDateTime = (dateString, timeString) => {
  return new Date(`${dateString}T${timeString}:00+02:00`);
};

const addMinutes = (date, minutes) => new Date(new Date(date).getTime() + minutes * 60000);

const overlaps = (startA, endA, startB, endB) => startA < endB && endA > startB;

const getScheduleForDay = (profile, dayIndex) => {
  const schedule = profile?.weeklySchedule?.find((item) => Number(item.dayOfWeek) === Number(dayIndex));
  if (schedule) {
    return schedule;
  }

  return DEFAULT_WEEKLY_SCHEDULE.find((item) => Number(item.dayOfWeek) === Number(dayIndex));
};

const extractBookedRanges = (requests = []) => {
  return requests
    .filter((request) => request.scheduledDate && request.status !== 'cancelled')
    .map((request) => ({
      start: new Date(request.scheduledDate),
      end: request.scheduledDate && request.bookingDurationMinutes
        ? addMinutes(request.scheduledDate, request.bookingDurationMinutes)
        : addMinutes(request.scheduledDate, 60)
    }));
};

const generateSlotsForDate = ({
  date,
  profile,
  bookedRanges = []
}) => {
  const dateString = typeof date === 'string' ? date : getLocalDateString(date);
  const dayIndex = dayIndexFor(dateString);
  const schedule = getScheduleForDay(profile, dayIndex);
  const slotDurationMinutes = profile?.slotDurationMinutes || 60;
  const bufferMinutes = profile?.bufferMinutes || 15;
  const slots = [];

  if (!schedule?.isWorking || !Array.isArray(schedule.periods)) {
    return slots;
  }

  schedule.periods.forEach((period) => {
    let cursor = buildDateTime(dateString, period.start);
    const periodEnd = buildDateTime(dateString, period.end);

    while (addMinutes(cursor, slotDurationMinutes) <= periodEnd) {
      const slotStart = new Date(cursor);
      const slotEnd = addMinutes(slotStart, slotDurationMinutes);
      const blocked = bookedRanges.some((range) => overlaps(
        addMinutes(range.start, -bufferMinutes),
        addMinutes(range.end, bufferMinutes),
        slotStart,
        slotEnd
      ));

      slots.push({
        startAt: slotStart,
        endAt: slotEnd,
        available: !blocked,
        label: `${pad(slotStart.getHours())}:${pad(slotStart.getMinutes())} - ${pad(slotEnd.getHours())}:${pad(slotEnd.getMinutes())}`
      });

      cursor = slotEnd;
    }
  });

  return slots;
};

const getNextAvailableSlot = ({
  profile,
  bookedRanges = [],
  startDate = new Date(),
  daysAhead = 14
}) => {
  for (let offset = 0; offset <= daysAhead; offset += 1) {
    const candidateDate = new Date(startDate);
    candidateDate.setDate(candidateDate.getDate() + offset);
    const dateString = getLocalDateString(candidateDate);
    const slots = generateSlotsForDate({
      date: dateString,
      profile,
      bookedRanges
    });

    const nextSlot = slots.find((slot) => slot.available);
    if (nextSlot) {
      return {
        date: dateString,
        ...nextSlot
      };
    }
  }

  return null;
};

module.exports = {
  DEFAULT_TIME_ZONE,
  generateSlotsForDate,
  getLocalDateString,
  getNextAvailableSlot,
  extractBookedRanges
};

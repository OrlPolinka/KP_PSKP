export const formatDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatTime = (timeString) => {
  if (!timeString) return '—';
  const str = String(timeString);
  // ISO datetime string: "1970-01-01T15:00:00.000Z" — extract UTC hours:minutes
  if (str.includes('T')) {
    // Parse as Date and get UTC hours/minutes to avoid timezone shift
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const h = String(d.getUTCHours()).padStart(2, '0');
      const m = String(d.getUTCMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    }
    // Fallback: just slice after T
    return str.split('T')[1].slice(0, 5);
  }
  // Already "HH:mm" or "HH:mm:ss"
  return str.slice(0, 5);
};

export const formatDateTime = (dateString, timeString) => {
  return `${formatDate(dateString)} ${formatTime(timeString)}`;
};

export const getWeekDays = () => {
  const today = new Date();
  const weekDays = [];
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1);
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    weekDays.push({
      date: day.toISOString().split('T')[0],
      dayName: day.toLocaleDateString('ru-RU', { weekday: 'short' }),
      dayNumber: day.getDate(),
    });
  }
  return weekDays;
};

export const isPastDate = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

export const isToday = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
};
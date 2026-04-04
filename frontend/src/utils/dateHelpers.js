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
  if (timeString.includes('T')) {
    return timeString.split('T')[1].slice(0, 5);
  }
  return timeString.slice(0, 5);
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
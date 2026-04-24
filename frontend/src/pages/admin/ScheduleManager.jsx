import React, { useState, useEffect } from 'react';
import { scheduleService } from '../../services/scheduleService';
import { userService } from '../../services/userService';
import { formatDate, formatTime, isPastDate, isToday } from '../../utils/dateHelpers';
import api from '../../services/api';

const statusConfig = {
  scheduled: { label: 'Запланировано', badge: 'badge-purple' },
  cancelled: { label: 'Отменено', badge: 'badge-danger' },
  completed: { label: 'Завершено', badge: 'badge-success' },
};

// Получаем массив специализаций тренера
const getTrainerSpecializations = (trainer) => {
  const spec = trainer.trainerInfo?.specialization;
  if (!spec) return [];
  return spec.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
};

// Проверяем совместимость тренера с направлением
// Тренер совместим если: у него нет специализации (берёт любое) ИЛИ его специализация включает это направление
const isTrainerCompatible = (trainer, danceStyleName) => {
  if (!danceStyleName) return true;
  const specs = getTrainerSpecializations(trainer);
  // Тренер без специализации — совместим с любым направлением
  if (specs.length === 0) return true;
  const style = danceStyleName.toLowerCase();
  return specs.some(s => s === style || s.includes(style) || style.includes(s));
};

// Проверяем совместимость направления с тренером
// Направление совместимо если: у тренера нет специализации ИЛИ его специализация включает это направление
const isStyleCompatibleWithTrainer = (danceStyleName, trainer) => {
  if (!trainer) return true;
  const specs = getTrainerSpecializations(trainer);
  if (specs.length === 0) return true; // тренер без специализации — берёт любое
  const style = danceStyleName.toLowerCase();
  return specs.some(s => s === style || s.includes(style) || style.includes(s));
};

const ScheduleManager = () => {
  const [schedule, setSchedule] = useState([]);
  const [halls, setHalls] = useState([]);
  const [danceStyles, setDanceStyles] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterTab, setFilterTab] = useState('upcoming');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState(null);
  const [formData, setFormData] = useState({
    danceStyleId: '', trainerId: '', hallId: '',
    date: '', startTime: '', endTime: '', maxCapacity: '',
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      // Auto-complete passed schedules on load
      try { await api.post('/schedule/complete-passed'); } catch {}
      const [scheduleData, hallsData, stylesData, trainersData] = await Promise.all([
        scheduleService.getSchedule(),
        scheduleService.getHalls(),
        scheduleService.getDanceStyles(),
        userService.getTrainers(),
      ]);
      setSchedule(scheduleData);
      setHalls(hallsData);
      setDanceStyles(stylesData);
      setTrainers(trainersData);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await scheduleService.updateSchedule(editingId, formData);
        showMsg('success', 'Занятие обновлено');
      } else {
        await scheduleService.createSchedule(formData);
        showMsg('success', 'Занятие создано');
      }
      closeModal();
      fetchData();
    } catch (error) {
      showMsg('error', error.response?.data?.error || 'Ошибка при сохранении');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить занятие?')) return;
    try {
      await scheduleService.deleteSchedule(id);
      fetchData();
      showMsg('success', 'Занятие удалено');
    } catch (error) {
      showMsg('error', 'Ошибка при удалении');
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      danceStyleId: item.danceStyleId || item.danceStyle?.id || '',
      trainerId: item.trainer?.userId || item.trainer?.id || '',
      hallId: item.hallId || item.hall?.id || '',
      date: item.date?.split('T')[0] || item.date || '',
      startTime: formatTime(item.startTime),
      endTime: formatTime(item.endTime),
      maxCapacity: item.maxCapacity || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ danceStyleId: '', trainerId: '', hallId: '', date: '', startTime: '', endTime: '', maxCapacity: '' });
  };

  // Get selected dance style name for trainer filtering
  const selectedStyleName = danceStyles.find(s => String(s.id) === String(formData.danceStyleId))?.name || '';
  // Get selected trainer for style filtering
  const selectedTrainer = trainers.find(t => String(t.id) === String(formData.trainerId)) || null;

  // Фильтрация тренеров:
  // Если выбрано направление → показываем совместимых (с этой специализацией или без специализации) первыми
  // Тренеры с другой специализацией — в отдельной группе
  const activeTrainers = trainers.filter(t => t.isActive);
  const compatibleTrainers = selectedStyleName
    ? activeTrainers.filter(t => isTrainerCompatible(t, selectedStyleName))
    : activeTrainers;
  const incompatibleTrainers = selectedStyleName
    ? activeTrainers.filter(t => !isTrainerCompatible(t, selectedStyleName))
    : [];

  // Фильтрация направлений:
  // Если выбран тренер с специализацией → показываем только его направления первыми
  const trainerSpecs = selectedTrainer ? getTrainerSpecializations(selectedTrainer) : [];
  const hasTrainerSpecs = trainerSpecs.length > 0;
  const compatibleStyles = danceStyles.filter(s => s.isActive && isStyleCompatibleWithTrainer(s.name, selectedTrainer));
  const incompatibleStyles = (selectedTrainer && hasTrainerSpecs)
    ? danceStyles.filter(s => s.isActive && !isStyleCompatibleWithTrainer(s.name, selectedTrainer))
    : [];

  // Filter schedule
  const filtered = schedule.filter(item => {
    const past = isPastDate(item.date);
    const today = isToday(item.date);
    const matchSearch = !search ||
      item.danceStyle?.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.trainer?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      item.hall?.name?.toLowerCase().includes(search.toLowerCase());
    if (filterTab === 'upcoming') return matchSearch && (!past || today);
    if (filterTab === 'past') return matchSearch && past && !today;
    return matchSearch;
  }).sort((a, b) => {
    if (filterTab === 'past') return new Date(b.date) - new Date(a.date);
    return new Date(a.date) - new Date(b.date);
  });

  if (loading) return (
    <div className="loading">
      <div className="spinner" />
      <span>Загрузка расписания...</span>
    </div>
  );

  const upcomingCount = schedule.filter(i => !isPastDate(i.date) || isToday(i.date)).length;
  const pastCount = schedule.filter(i => isPastDate(i.date) && !isToday(i.date)).length;

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Расписание</h1>
          <p className="page-subtitle">Управление занятиями студии</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Добавить занятие
        </button>
      </div>

      {message && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '20px' }}>
          {message.type === 'success' ? '✅' : '⚠️'} {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="filter-bar" style={{ marginBottom: '20px' }}>
        <div className="search-input" style={{ flex: 1, minWidth: '200px' }}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Поиск по направлению, тренеру, залу..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {[
          { key: 'upcoming', label: `🔜 Предстоящие (${upcomingCount})` },
          { key: 'past', label: `📚 Прошедшие (${pastCount})` },
          { key: 'all', label: `🗓️ Все (${schedule.length})` },
        ].map(f => (
          <button key={f.key} className={`filter-btn ${filterTab === f.key ? 'active' : ''}`}
            onClick={() => setFilterTab(f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Дата</th>
                <th>Время</th>
                <th>Направление</th>
                <th>Тренер</th>
                <th>Зал</th>
                <th>Мест</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>
                    Занятий не найдено
                  </td>
                </tr>
              ) : filtered.map(item => {
                const past = isPastDate(item.date);
                const today = isToday(item.date);
                const effectiveStatus = (item.status === 'scheduled' && isPastDate(item.date) && !isToday(item.date))
                  ? 'completed'
                  : item.status;
                const status = statusConfig[effectiveStatus] || statusConfig.scheduled;
                return (
                  <tr key={item.id} style={{ opacity: past && !today ? 0.7 : 1 }}>
                    <td>
                      <div style={{ fontWeight: '600', color: today ? '#A78BFA' : 'white' }}>
                        {formatDate(item.date)}
                        {today && <span className="badge badge-warning" style={{ marginLeft: '6px', fontSize: '10px' }}>Сегодня</span>}
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                      {formatTime(item.startTime)} — {formatTime(item.endTime)}
                    </td>
                    <td>
                      <span style={{ fontWeight: '500', color: 'white' }}>{item.danceStyle?.name}</span>
                    </td>
                    <td>{item.trainer?.fullName}</td>
                    <td>{item.hall?.name}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          fontWeight: '600',
                          color: item.currentBookings >= item.maxCapacity ? '#EF4444' : '#10B981',
                        }}>
                          {item.currentBookings}/{item.maxCapacity}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${status.badge}`} style={{ fontSize: '11px' }}>
                        {status.label}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(item)}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: '540px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingId ? 'Редактировать занятие' : 'Добавить занятие'}</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Направление *</label>
                  <select required value={formData.danceStyleId}
                    onChange={e => {
                      const newStyleId = e.target.value;
                      const newStyleName = danceStyles.find(s => String(s.id) === String(newStyleId))?.name || '';
                      const trainerIncompatible = selectedTrainer &&
                        getTrainerSpecializations(selectedTrainer).length > 0 &&
                        !isTrainerCompatible(selectedTrainer, newStyleName);
                      setFormData({ ...formData, danceStyleId: newStyleId, trainerId: trainerIncompatible ? '' : formData.trainerId });
                    }}>
                    <option value="" style={{ background: '#1A1A2E' }}>Выберите направление</option>
                    {!selectedTrainer || !hasTrainerSpecs ? (
                      danceStyles.filter(s => s.isActive).map(style => (
                        <option key={style.id} value={style.id} style={{ background: '#1A1A2E' }}>{style.name}</option>
                      ))
                    ) : (
                      <>
                        {compatibleStyles.map(style => (
                          <option key={style.id} value={style.id} style={{ background: '#1A1A2E' }}>{style.name}</option>
                        ))}
                        {incompatibleStyles.length > 0 && (
                          <>
                            <option disabled style={{ background: '#1A1A2E', color: 'rgba(255,255,255,0.2)', fontSize: '11px' }}>── другая специализация ──</option>
                            {incompatibleStyles.map(style => (
                              <option key={style.id} value={style.id} style={{ background: '#1A1A2E', color: '#94A3B8' }}>{style.name}</option>
                            ))}
                          </>
                        )}
                      </>
                    )}
                  </select>
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Тренер *</label>
                  <select required value={formData.trainerId}
                    onChange={e => {
                      const newTrainerId = e.target.value;
                      const newTrainer = trainers.find(t => String(t.id) === String(newTrainerId)) || null;
                      const styleIncompatible = newTrainer &&
                        getTrainerSpecializations(newTrainer).length > 0 &&
                        selectedStyleName &&
                        !isStyleCompatibleWithTrainer(selectedStyleName, newTrainer);
                      setFormData({ ...formData, trainerId: newTrainerId, danceStyleId: styleIncompatible ? '' : formData.danceStyleId });
                    }}
                    style={{ background: '#1A1A2E' }}>
                    <option value="" style={{ background: '#1A1A2E' }}>Выберите тренера</option>
                    {!selectedStyleName ? (
                      activeTrainers.map(t => (
                        <option key={t.id} value={t.id} style={{ background: '#1A1A2E', color: 'white' }}>
                          {t.fullName}{t.trainerInfo?.specialization ? ` — ${t.trainerInfo.specialization}` : ''}
                        </option>
                      ))
                    ) : (
                      <>
                        {compatibleTrainers.map(t => (
                          <option key={t.id} value={t.id} style={{ background: '#1A1A2E', color: 'white' }}>
                            {t.fullName}{t.trainerInfo?.specialization ? ` — ${t.trainerInfo.specialization}` : ''}
                          </option>
                        ))}
                        {incompatibleTrainers.length > 0 && (
                          <>
                            <option disabled style={{ background: '#1A1A2E', color: 'rgba(255,255,255,0.2)', fontSize: '11px' }}>── другая специализация ──</option>
                            {incompatibleTrainers.map(t => (
                              <option key={t.id} value={t.id} style={{ background: '#1A1A2E', color: '#94A3B8' }}>
                                {t.fullName}{t.trainerInfo?.specialization ? ` — ${t.trainerInfo.specialization}` : ''}
                              </option>
                            ))}
                          </>
                        )}
                      </>
                    )}
                  </select>
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Зал *</label>
                  <select required value={formData.hallId}
                    onChange={e => setFormData({ ...formData, hallId: e.target.value })}>
                    <option value="" style={{ background: '#1A1A2E' }}>Выберите зал</option>
                    {halls.filter(h => h.isActive).map(hall => (
                      <option key={hall.id} value={hall.id} style={{ background: '#1A1A2E' }}>
                        {hall.name} (вместимость: {hall.capacity})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Дата *</label>
                  <input type="date" required value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })} />
                </div>

                <div className="form-group">
                  <label>Макс. мест *</label>
                  <input type="number" required min="1" value={formData.maxCapacity}
                    onChange={e => setFormData({ ...formData, maxCapacity: e.target.value })}
                    placeholder="Кол-во мест" />
                </div>

                <div className="form-group">
                  <label>Начало *</label>
                  <input type="time" required value={formData.startTime}
                    onChange={e => setFormData({ ...formData, startTime: e.target.value })} />
                </div>

                <div className="form-group">
                  <label>Конец *</label>
                  <input type="time" required value={formData.endTime}
                    onChange={e => setFormData({ ...formData, endTime: e.target.value })} />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Отмена</button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? '💾 Сохранить' : '+ Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleManager;

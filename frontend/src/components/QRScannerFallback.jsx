import React, { useState } from 'react';
import { Card, Button, Alert } from 'react-bootstrap';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import api from '../services/api';

const QRScannerFallback = ({ onScanSuccess, onScanError }) => {
    const [qrCodeInput, setQrCodeInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [bookingData, setBookingData] = useState(null);

    const handleManualInput = async () => {
        if (!qrCodeInput.trim()) {
            setError('Пожалуйста, введите QR-код или ID бронирования');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            // Пробуем проверить как QR-код
            const response = await api.post('/bookings/verify-qrcode', { 
                qrCode: qrCodeInput.trim() 
            });
            
            if (response.data.success) {
                setBookingData(response.data.booking);
                onScanSuccess && onScanSuccess(response.data);
            } else {
                setError(response.data.error || 'Неверный QR-код');
            }
        } catch (err) {
            console.error('Manual input error:', err);
            setError(err.response?.data?.error || 'Ошибка при проверке QR-кода');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAttendance = async (attended = true) => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await api.post('/bookings/mark-attendance-by-qr', {
                qrCode: qrCodeInput.trim(),
                attended
            });

            if (response.data.success) {
                onScanSuccess && onScanSuccess(response.data);
                setBookingData(null);
                setQrCodeInput('');
            } else {
                setError(response.data.error || 'Ошибка при отметке посещения');
            }
        } catch (err) {
            console.error('Mark attendance error:', err);
            setError(err.response?.data?.error || 'Ошибка при отметке посещения');
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setQrCodeInput('');
        setBookingData(null);
        setError(null);
    };

    return (
        <Card>
            <Card.Header className="bg-warning text-dark">
                <h5 className="mb-0">
                    <AlertTriangle className="me-2" />
                    Ручной ввод QR-кода
                </h5>
            </Card.Header>
            <Card.Body>
                <Alert variant="info">
                    <strong>Внимание:</strong> Автоматическое сканирование QR-кода недоступно. 
                    Вы можете ввести QR-код или ID бронирования вручную.
                </Alert>

                {error && (
                    <Alert variant="danger" dismissible onClose={() => setError(null)}>
                        <AlertTriangle className="me-2" />
                        {error}
                    </Alert>
                )}

                {!bookingData ? (
                    <div>
                        <div className="mb-3">
                            <label htmlFor="qrCodeInput" className="form-label">
                                QR-код или ID бронирования:
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                id="qrCodeInput"
                                value={qrCodeInput}
                                onChange={(e) => setQrCodeInput(e.target.value)}
                                placeholder="Введите QR-код или ID бронирования"
                                disabled={loading}
                            />
                            <small className="text-muted">
                                Вы можете ввести как сам QR-код, так и ID бронирования
                            </small>
                        </div>

                        <Button 
                            variant="primary" 
                            onClick={handleManualInput}
                            disabled={loading || !qrCodeInput.trim()}
                            className="w-100"
                        >
                            {loading ? (
                                <>
                                    <div className="spinner-border spinner-border-sm me-2" role="status">
                                        <span className="visually-hidden">Загрузка...</span>
                                    </div>
                                    Проверка...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="me-2" />
                                    Проверить QR-код
                                </>
                            )}
                        </Button>
                    </div>
                ) : (
                    <div>
                        <div className="text-center mb-4">
                            <CheckCircle size={48} className="text-success mb-2" />
                            <h5 className="text-success">QR-код найден!</h5>
                        </div>
                        
                        <div className="card bg-light mb-4">
                            <div className="card-body">
                                <h6>Информация о клиенте:</h6>
                                <p><strong>Имя:</strong> {bookingData.client.fullName}</p>
                                {bookingData.client.phone && (
                                    <p><strong>Телефон:</strong> {bookingData.client.phone}</p>
                                )}
                                
                                <hr />
                                
                                <h6>Информация о занятии:</h6>
                                <p><strong>Стиль:</strong> {bookingData.schedule.danceStyle?.name || bookingData.schedule.danceStyle}</p>
                                <p><strong>Время:</strong> {bookingData.schedule.startTime} - {bookingData.schedule.endTime}</p>
                                <p><strong>Зал:</strong> {bookingData.schedule.hall?.name || bookingData.schedule.hall}</p>
                                
                                <div className="mt-3 text-center">
                                    <span className={`badge bg-${bookingData.checkedIn ? "success" : "primary"}`}>
                                        {bookingData.checkedIn ? 'Посещение уже отмечено' : 'Ожидает отметки'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="d-flex gap-2">
                            <Button 
                                variant="success" 
                                onClick={() => handleMarkAttendance(true)}
                                disabled={loading || bookingData.checkedIn}
                                className="flex-fill"
                            >
                                {loading ? (
                                    <>
                                        <div className="spinner-border spinner-border-sm me-2" role="status">
                                            <span className="visually-hidden">Загрузка...</span>
                                        </div>
                                        Обработка...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="me-2" />
                                        Отметить посещение
                                    </>
                                )}
                            </Button>
                            <Button 
                                variant="danger" 
                                onClick={() => handleMarkAttendance(false)}
                                disabled={loading || bookingData.checkedIn}
                                className="flex-fill"
                            >
                                {loading ? (
                                    <>
                                        <div className="spinner-border spinner-border-sm me-2" role="status">
                                            <span className="visually-hidden">Загрузка...</span>
                                        </div>
                                        Обработка...
                                    </>
                                ) : (
                                    <>
                                        <AlertTriangle className="me-2" />
                                        Не пришел
                                    </>
                                )}
                            </Button>
                        </div>

                        <Button 
                            variant="outline-secondary" 
                            onClick={reset}
                            className="w-100 mt-3"
                        >
                            Сбросить
                        </Button>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default QRScannerFallback;

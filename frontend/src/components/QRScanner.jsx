import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, StopCircle, RefreshCw } from 'lucide-react';
import api from '../services/api';
import './QRScanner.css';

const parseQrPayload = (qrData) => {
    const parts = qrData.split(':');
    if (parts.length < 3) return null;

    if (parts[0] === 'training' || parts[0] === 'service') {
        if (parts.length < 4) return null;
        return { type: parts[0], userId: parts[1], targetId: parts[2] };
    }

    return { type: 'training', userId: parts[0], targetId: parts[1] };
};

const QRScanner = ({ onScanSuccess, onScanError }) => {
    const [scanning, setScanning] = useState(false);
    const [message, setMessage] = useState(null);
    const [lastScanned, setLastScanned] = useState(null);
    const [loading, setLoading] = useState(false);
    const [bookingData, setBookingData] = useState(null);
    const html5QrcodeRef = useRef(null);

    useEffect(() => {
        return () => {
            if (html5QrcodeRef.current) {
                try {
                    html5QrcodeRef.current.stop().catch(() => {});
                } catch (e) {}
                html5QrcodeRef.current = null;
            }
        };
    }, []);

    const startScanning = async () => {
        setScanning(true);
        setMessage(null);
        setLastScanned(null);

        setTimeout(async () => {
            try {
                const element = document.getElementById('qr-reader');
                if (!element) {
                    setMessage('Элемент сканера не найден');
                    setScanning(false);
                    return;
                }

                const html5Qrcode = new Html5Qrcode('qr-reader');
                html5QrcodeRef.current = html5Qrcode;

                await html5Qrcode.start(
                    { facingMode: 'environment' },
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    async (decodedText) => {
                        await handleScan(decodedText);
                        try {
                            await html5Qrcode.stop();
                        } catch (e) {}
                        html5QrcodeRef.current = null;
                        setScanning(false);
                    },
                    () => {}
                );
            } catch (error) {
                console.error('Ошибка сканера:', error);
                setMessage('Не удалось запустить камеру: ' + error.message);
                setScanning(false);
            }
        }, 100);
    };

    const stopScanning = async () => {
        if (html5QrcodeRef.current) {
            try {
                await html5QrcodeRef.current.stop();
            } catch (e) {}
            html5QrcodeRef.current = null;
        }
        setScanning(false);
    };

    
    const handleScan = async (qrData) => {
        try {
            setLoading(true);
            setMessage(null);

            // Сначала пробуем распарсить как JSON
            let parsed;
            try {
                parsed = JSON.parse(qrData);
            } catch (parseErr) {
                // Если не JSON, пробуем как текстовый формат
                parsed = parseQrPayload(qrData);
            }

            if (!parsed) {
                // Если не удалось распарсить, отправляем как есть
                parsed = { qrCode: qrData };
            }

            setLastScanned(parsed.userId || parsed.qrCode);

            // Отправляем на сервер для проверки
            const response = await api.post('/bookings/verify-qrcode', { 
                qrCode: parsed.qrCode || qrData,
                bookingId: parsed.bookingId,
                scheduleId: parsed.scheduleId,
                clientId: parsed.clientId
            });

            if (response.data.success) {
                setBookingData(response.data.booking);
                setMessage('QR-код успешно распознан!');
                onScanSuccess && onScanSuccess(response.data);
            } else {
                setMessage(response.data.error || 'Неверный QR-код');
                onScanError && onScanError(response.data.error);
            }
        } catch (error) {
            console.error('Scan processing error:', error);
            setMessage(error.response?.data?.error || 'Ошибка при проверке QR-кода');
            onScanError && onScanError(error.response?.data?.error || 'Ошибка при проверке QR-кода');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAttendance = async (attended = true) => {
        try {
            setLoading(true);
            setMessage(null);
            
            const response = await api.post('/bookings/mark-attendance-by-qr', {
                qrCode: lastScanned,
                attended
            });

            if (response.data.success) {
                setMessage('Посещение успешно отмечено!');
                onScanSuccess && onScanSuccess(response.data);
                setBookingData(null);
                setLastScanned(null);
            } else {
                setMessage(response.data.error || 'Ошибка при отметке посещения');
            }
        } catch (error) {
            console.error('Mark attendance error:', error);
            setMessage(error.response?.data?.error || 'Ошибка при отметке посещения');
        } finally {
            setLoading(false);
        }
    };

    const resetScanner = () => {
        setLastScanned(null);
        setBookingData(null);
        setMessage(null);
        stopScanning();
    };

    return (
        <div className="qr-scanner-page">
            <div className="qr-header">
                <h1>Сканирование QR-кода</h1>
                <p>Наведите камеру на QR-код клиента</p>
            </div>

            <div className="scanner-container">
                {!scanning && !bookingData && (
                    <div className="scanner-initial">
                        <button className="scan-btn-primary" onClick={startScanning}>
                            <Camera size={20} />
                            Начать сканирование
                        </button>

                        <div className="scan-tips">
                            <small className="text-muted">
                                Убедитесь, что ваш браузер имеет доступ к камере
                            </small>
                        </div>
                    </div>
                )}

                {scanning && (
                    <div className="scanner-active">
                        <div id="qr-reader" className="qr-reader"></div>
                        <button className="scan-btn-danger" onClick={stopScanning}>
                            <StopCircle size={20} />
                            Остановить
                        </button>
                    </div>
                )}

                {bookingData && (
                    <div className="scan-result">
                        <div className="result-header">
                            <h3>QR-код распознан!</h3>
                        </div>

                        <div className="client-info">
                            <h4>Информация о клиенте:</h4>
                            <p><strong>Имя:</strong> {bookingData.client?.fullName}</p>
                            {bookingData.client?.phone && (
                                <p><strong>Телефон:</strong> {bookingData.client.phone}</p>
                            )}
                        </div>

                        <div className="schedule-info">
                            <h4>Информация о занятии:</h4>
                            <p><strong>Стиль:</strong> {bookingData.schedule?.danceStyle?.name || bookingData.schedule?.danceStyle}</p>
                            <p><strong>Время:</strong> {bookingData.schedule?.startTime} - {bookingData.schedule?.endTime}</p>
                            <p><strong>Зал:</strong> {bookingData.schedule?.hall?.name || bookingData.schedule?.hall}</p>
                        </div>

                        <div className="status-info">
                            <span className={`status-badge ${bookingData.checkedIn ? 'success' : 'primary'}`}>
                                {bookingData.checkedIn ? 'Посещение уже отмечено' : 'Ожидает отметки'}
                            </span>
                        </div>

                        <div className="action-buttons">
                            <button 
                                className="scan-btn-success"
                                onClick={() => handleMarkAttendance(true)}
                                disabled={loading || bookingData.checkedIn}
                            >
                                {loading ? 'Обработка...' : 'Отметить посещение'}
                            </button>
                            <button 
                                className="scan-btn-danger"
                                onClick={() => handleMarkAttendance(false)}
                                disabled={loading || bookingData.checkedIn}
                            >
                                {loading ? 'Обработка...' : 'Не пришел'}
                            </button>
                        </div>

                        <button className="scan-btn-secondary" onClick={resetScanner}>
                            <RefreshCw size={16} />
                            Сканировать следующий
                        </button>
                    </div>
                )}

                {message && (
                    <div className={`message ${message.includes('успешно') || message.includes('распознан') ? 'success' : 'error'}`}>
                        {message}
                    </div>
                )}

                {lastScanned && !bookingData && (
                    <div className="last-scanned">
                        Последний отсканированный: {lastScanned}
                    </div>
                )}

                {loading && (
                    <div className="loading">
                        <div className="spinner"></div>
                        <p>Обработка...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QRScanner;

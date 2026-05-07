import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, User, MapPin, CheckCircle, RefreshCw, AlertCircle, Info } from 'lucide-react';
import api from '../services/api';
import '../pages/client/QRCodesPage.css';

const QRCodeDisplay = ({ bookingId, onRefresh }) => {
    const [qrData, setQrData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const generateQRCode = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            console.log('Generating QR code for booking:', bookingId);
            const response = await api.get(`/bookings/${bookingId}/qrcode`);
            console.log('QR code response:', response.data);
            setQrData(response.data);
        } catch (err) {
            console.error('QR Code generation error:', err);
            console.error('Error response:', err.response?.data);
            const errorMessage = err.response?.data?.error || err.message || 'Ошибка при генерации QR-кода';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [bookingId]);

    useEffect(() => {
        if (bookingId) {
            generateQRCode();
        }
    }, [bookingId, generateQRCode]);

    if (loading) {
        return (
            <div className="qr-loading">
                <div className="qr-spinner"></div>
                <p>Генерация QR-кода...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-error">
                <div className="d-flex align-items-start">
                    <AlertCircle size={20} className="me-3 flex-shrink-0" />
                    <div className="flex-grow-1">
                        <strong>Ошибка генерации QR-кода</strong>
                        <p className="mb-3">{error}</p>
                        <button className="btn btn-danger" onClick={generateQRCode}>
                            <RefreshCw size={16} className="me-2" />
                            Попробовать снова
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!qrData) {
        return (
            <div className="card text-center p-4">
                <AlertCircle size={48} className="text-muted mb-3" />
                <p className="text-muted mb-3">Нет данных для отображения</p>
                <button className="btn btn-primary" onClick={generateQRCode}>
                    Сгенерировать QR-код
                </button>
            </div>
        );
    }

    const { qrImage, booking } = qrData;

    return (
        <div className="qr-display-modal">
            {/* Header */}
            <div className="qr-display-header">
                <h2 className="qr-display-title">QR-код для посещения</h2>
                <p className="qr-display-subtitle">
                    Покажите этот QR-код тренеру при приходе на занятие
                </p>
            </div>

            {/* QR Code */}
            <div className="qr-code-large">
                <img 
                    src={qrImage} 
                    alt="QR-код для посещения" 
                />
            </div>

            {/* Success indicator */}
            <div className="qr-success-checkmark">
                <CheckCircle />
            </div>

            {/* Booking Information */}
            <div className="qr-booking-info">
                <h6>Информация о занятии</h6>
                
                <div className="qr-booking-item">
                    <Calendar size={18} />
                    <span><strong>Дата:</strong> {new Date(booking.date).toLocaleDateString('ru-RU', { 
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}</span>
                </div>
                
                <div className="qr-booking-item">
                    <Clock size={18} />
                    <span><strong>Время:</strong> {booking.startTime} - {booking.endTime}</span>
                </div>
                
                <div className="qr-booking-item">
                    <User size={18} />
                    <span><strong>Стиль:</strong> {booking.danceStyle}</span>
                </div>
                
                <div className="qr-booking-item">
                    <User size={18} />
                    <span><strong>Тренер:</strong> {booking.trainer}</span>
                </div>
                
                <div className="qr-booking-item">
                    <MapPin size={18} />
                    <span><strong>Зал:</strong> {booking.hall}</span>
                </div>
            </div>

            {/* Instructions */}
            <div className="qr-instruction">
                <Info size={20} className="flex-shrink-0" />
                <span>
                    Этот QR-код действителен только для текущего занятия. 
                    Сохраняйте его в секрете и показывайте только тренеру.
                </span>
            </div>

            {/* Action buttons */}
            <div className="d-flex gap-3 justify-content-center mt-4">
                <button className="btn btn-primary" onClick={generateQRCode}>
                    <RefreshCw size={16} className="me-2" />
                    Обновить QR-код
                </button>
                {onRefresh && (
                    <button className="btn btn-outline" onClick={onRefresh}>
                        Закрыть
                    </button>
                )}
            </div>
        </div>
    );
};

export default QRCodeDisplay;

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, CheckCircle, Download, RefreshCw, QrCode } from 'lucide-react';
import api from '../services/api';

const AllQRCodes = () => {
    const [qrCodes, setQrCodes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchAllQRCodes = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await api.get('/bookings/all/qrcodes');
            setQrCodes(response.data.qrCodes || []);
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка при загрузке QR-кодов');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllQRCodes();
    }, []);

    const getStatusBadge = (status, checkedIn, canScan) => {
        if (checkedIn) {
            return (
                <div className="badge badge-success">
                    <CheckCircle size={12} className="me-1" />
                    Посещено
                </div>
            );
        }
        if (status === 'attended') {
            return (
                <div className="badge badge-success">
                    <CheckCircle size={12} className="me-1" />
                    Посещено
                </div>
            );
        }
        if (!canScan) {
            return (
                <div className="badge badge-warning">
                    <Clock size={12} className="me-1" />
                    Просрочен
                </div>
            );
        }
        if (status === 'booked') {
            return <div className="badge badge-purple">Активен</div>;
        }
        return <div className="badge badge-secondary">{status}</div>;
    };

    const downloadQRCode = async (bookingId, danceStyle) => {
        try {
            const response = await api.get(`/bookings/${bookingId}/qrcode/download`, {
                responseType: 'blob'
            });
            
            // Создаем blob и ссылку для скачивания
            const blob = new Blob([response.data], { type: 'image/png' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `QR-код_${danceStyle}_${new Date().toISOString().split('T')[0]}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download error:', err);
            setError('Ошибка при скачивании QR-кода');
        }
    };

    if (loading) {
        return (
            <div className="qr-loading">
                <div className="qr-spinner"></div>
                <p>Загрузка QR-кодов...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-error">
                <div>
                    <strong>Ошибка</strong>
                    <p>{error}</p>
                    <button className="btn btn-primary" onClick={fetchAllQRCodes}>
                        Попробовать снова
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header with refresh button */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="page-title mb-2">
                        <QrCode className="me-3" />
                        Все QR-коды
                    </h3>
                    <p className="page-subtitle">
                        Ваши QR-коды для всех активных занятий
                    </p>
                </div>
                <button 
                    className="btn btn-ghost"
                    onClick={fetchAllQRCodes}
                    disabled={loading}
                >
                    <RefreshCw size={18} className={loading ? 'spin' : ''} />
                </button>
            </div>

            {qrCodes.length === 0 ? (
                <div className="qr-empty-state">
                    <QrCode className="qr-empty-state-icon" />
                    <h3 className="qr-empty-state-title">Нет активных QR-кодов</h3>
                    <p className="qr-empty-state-text">
                        У вас нет активных занятий для которых доступны QR-коды
                    </p>
                </div>
            ) : (
                <div className="qr-grid">
                    {qrCodes.map((qrCode) => (
                        <div 
                            className="qr-card"
                            key={qrCode.bookingId}
                        >
                            <div className="qr-card-header">
                                <div>
                                    <div className="qr-dance-style">
                                        {qrCode.schedule.danceStyle}
                                    </div>
                                    <div className="qr-status">
                                        {getStatusBadge(qrCode.status, qrCode.checkedIn, qrCode.canScan)}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="qr-info">
                                <div className="qr-info-item">
                                    <Calendar size={16} />
                                    {new Date(qrCode.schedule.date).toLocaleDateString('ru-RU', {
                                        weekday: 'short',
                                        month: 'short',
                                        day: 'numeric'
                                    })}
                                </div>
                                
                                <div className="qr-info-item">
                                    <Clock size={16} />
                                    {qrCode.schedule.startTime} - {qrCode.schedule.endTime}
                                </div>
                                
                                <div className="qr-info-item">
                                    <User size={16} />
                                    {qrCode.schedule.trainer}
                                </div>
                                
                                <div className="qr-info-item">
                                    <MapPin size={16} />
                                    {qrCode.schedule.hall}
                                </div>
                            </div>
                            
                            <div className="qr-preview">
                                <img 
                                    src={qrCode.qrImage} 
                                    alt="QR-код" 
                                    style={{ 
                                        opacity: qrCode.checkedIn || !qrCode.canScan ? 0.5 : 1,
                                        filter: (qrCode.checkedIn || !qrCode.canScan) ? 'grayscale(100%)' : 'none'
                                    }}
                                />
                            </div>
                            
                            <div className="qr-download-btn">
                                <button 
                                    className="qr-action-btn"
                                    style={{
                                        background: 'linear-gradient(135deg, #10B981, #059669)',
                                        color: 'white',
                                        border: 'none'
                                    }}
                                    disabled={!qrCode.canScan || qrCode.checkedIn}
                                    onClick={() => downloadQRCode(qrCode.bookingId, qrCode.schedule.danceStyle)}
                                >
                                    {qrCode.checkedIn ? (
                                        <>
                                            <CheckCircle size={16} />
                                            Посещение отмечено
                                        </>
                                    ) : !qrCode.canScan ? (
                                        <>
                                            <Clock size={16} />
                                            QR-код недействителен
                                        </>
                                    ) : (
                                        <>
                                            <Download size={16} className="me-2" />
                                            Скачать QR-код
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AllQRCodes;

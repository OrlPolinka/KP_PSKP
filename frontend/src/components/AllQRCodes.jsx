import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, MapPin, User, CheckCircle, Download, RefreshCw, QrCode } from 'lucide-react';
import api from '../services/api';
import { formatTime } from '../utils/dateHelpers';
import Pagination from './common/Pagination';

const AllQRCodes = () => {
    const [qrCodes, setQrCodes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchAllQRCodes = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await api.get('/bookings/all/qrcodes', { 
                params: { page: currentPage, limit: 9 } 
            });
            setQrCodes(response.data.qrCodes || []);
            if (response.data.pagination) {
                setTotalPages(response.data.pagination.totalPages);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка при загрузке QR-кодов');
        } finally {
            setLoading(false);
        }
    }, [currentPage]);

    useEffect(() => {
        fetchAllQRCodes();
    }, [currentPage, fetchAllQRCodes]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

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
                                    {qrCode.schedule.date}
                                </div>
                                <div className="qr-info-item">
                                    <Clock size={16} />
                                    {formatTime(qrCode.schedule.startTime)} - {formatTime(qrCode.schedule.endTime)}
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
                                {qrCode.qrImage ? (
                                    <img 
                                        src={qrCode.qrImage} 
                                        alt="QR-код" 
                                        style={{ 
                                            opacity: qrCode.checkedIn || !qrCode.canScan ? 0.5 : 1,
                                            filter: (qrCode.checkedIn || !qrCode.canScan) ? 'grayscale(100%)' : 'none'
                                        }}
                                        onLoad={() => console.log('QR loaded for booking:', qrCode.bookingId)}
                                        onError={(e) => {
                                            console.error('QR load error:', e);
                                            console.log('QR src length:', qrCode.qrImage?.length);
                                        }}
                                    />
                                ) : (
                                    <div className="qr-error-placeholder">
                                        <QrCode size={24} />
                                        <span>QR-код недоступен</span>
                                    </div>
                                )}
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

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />
        </div>
    );
};

export default AllQRCodes;

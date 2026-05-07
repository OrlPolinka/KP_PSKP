import React, { useState } from 'react';
import { Card, Alert, Row, Col } from 'react-bootstrap';
import { Camera, CheckCircle, Clock } from 'lucide-react';
import QRScanner from '../../components/QRScanner';

const QRScannerPage = () => {
    const [scanHistory, setScanHistory] = useState([]);
    const [showSuccess, setShowSuccess] = useState(false);
    const [lastScanResult, setLastScanResult] = useState(null);

    const handleScanSuccess = (result) => {
        setLastScanResult(result);
        setScanHistory(prev => [result, ...prev.slice(0, 4)]); // Сохраняем последние 5 сканирований
        setShowSuccess(true);
        
        // Скрываем уведомление об успехе через 3 секунды
        setTimeout(() => setShowSuccess(false), 3000);
    };

    const handleScanError = (error) => {
        console.error('Scan error:', error);
    };

    return (
        <div className="qr-scanner-page">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>
                    <Camera className="me-2" />
                    Сканер QR-кодов
                </h2>
            </div>

            {showSuccess && lastScanResult && (
                <Alert variant="success" dismissible onClose={() => setShowSuccess(false)}>
                    <CheckCircle className="me-2" />
                    <strong>Успешно!</strong> {lastScanResult.message}
                </Alert>
            )}

            <Row>
                <Col lg={8}>
                    <QRScanner 
                        onScanSuccess={handleScanSuccess}
                        onScanError={handleScanError}
                    />
                </Col>
                
                <Col lg={4}>
                    <Card>
                        <Card.Header>
                            <h6 className="mb-0">
                                <Clock className="me-2" />
                                История сканирований
                            </h6>
                        </Card.Header>
                        <Card.Body>
                            {scanHistory.length === 0 ? (
                                <p className="text-muted text-center">
                                    Пока нет сканирований
                                </p>
                            ) : (
                                <div className="scan-history">
                                    {scanHistory.map((scan, index) => (
                                        <div key={index} className="border-bottom pb-2 mb-2">
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div>
                                                    <small className="text-muted">
                                                        {new Date().toLocaleTimeString('ru-RU')}
                                                    </small>
                                                    <div>
                                                        <strong>{scan.booking.client?.fullName}</strong>
                                                    </div>
                                                    <div className="text-muted small">
                                                        {scan.booking.schedule?.danceStyle?.name}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className={`badge bg-${
                                                        scan.booking.status === 'attended' ? 'success' : 'primary'
                                                    }`}>
                                                        {scan.booking.status === 'attended' ? 'Посещено' : 'Отмечено'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Card className="mt-4">
                <Card.Header>
                    <h6 className="mb-0">Инструкция по использованию</h6>
                </Card.Header>
                <Card.Body>
                    <ol>
                        <li>Нажмите "Начать сканирование" для активации камеры</li>
                        <li>Наведите камеру на QR-код клиента</li>
                        <li>Дождитесь автоматического распознавания QR-кода</li>
                        <li>Проверьте информацию о клиенте и занятии</li>
                        <li>Нажмите "Отметить посещение" или "Не пришел"</li>
                    </ol>
                    
                    <Alert variant="info" className="mt-3">
                        <strong>Важно:</strong> Убедитесь, что вы отмечаете посещение только для своих занятий.
                    </Alert>
                </Card.Body>
            </Card>
        </div>
    );
};

export default QRScannerPage;

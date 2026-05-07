import React, { useState } from 'react';
import { QrCode, Calendar } from 'lucide-react';
import TodayQRCodes from '../../components/TodayQRCodes';
import AllQRCodes from '../../components/AllQRCodes';
import './QRCodesPage.css';

const QRCodesPage = () => {
    const [activeTab, setActiveTab] = useState('today');

    return (
        <div className="qr-codes-page">
            {/* Header */}
            <div className="qr-header">
                <h1 className="qr-title">
                    <QrCode size={48} className="me-3" />
                    QR-коды для посещения
                </h1>
                <p className="qr-subtitle">
                    Управляйте вашими QR-кодами для удобного посещения занятий
                </p>
                
                {/* Custom Tabs */}
                <div className="qr-tabs">
                    <button 
                        className={`qr-tab ${activeTab === 'today' ? 'active' : ''}`}
                        onClick={() => setActiveTab('today')}
                    >
                        <Calendar size={18} />
                        На сегодня
                    </button>
                    <button 
                        className={`qr-tab ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveTab('all')}
                    >
                        <QrCode size={18} />
                        Все QR-коды
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="qr-content">
                {activeTab === 'today' ? (
                    <TodayQRCodes />
                ) : activeTab === 'all' ? (
                    <AllQRCodes />
                ) : null}
            </div>
        </div>
    );
};

export default QRCodesPage;

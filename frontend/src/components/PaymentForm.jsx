import React, { useState } from 'react';
import { paymentService } from '../services/paymentService';
import './PaymentForm.css';

const PaymentForm = ({ membershipId, amount, membershipName, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvc, setCvc] = useState('');
  const [zipCode, setZipCode] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    // Простая валидация
    if (!cardNumber || !expiryDate || !cvc || !zipCode) {
      setError('Заполните все поля');
      setLoading(false);
      return;
    }

    // Валидация тестовых карт
    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    
    if (cleanCardNumber === '4242424242424242') {
      // Успешная карта - продолжаем
    } else if (cleanCardNumber === '4000000000000002') {
      // Карта с отказом
      setError('Карта отклонена банком');
      setLoading(false);
      return;
    } else {
      // Другие номера карт считаем невалидными для теста
      setError('Используйте тестовые карты: 4242 4242 4242 4242 или 4000 0000 0000 0002');
      setLoading(false);
      return;
    }

    try {
      // Создаем платежную сессию
      const response = await paymentService.createPaymentSession(membershipId, amount);
      
      if (response.success) {
        // Эмулируем успешную оплату через 2 секунды
        setTimeout(() => {
          onSuccess({
            paymentId: response.payment.id,
            amount: amount,
            membershipName,
          });
        }, 2000);
      } else {
        setError(response.error || 'Ошибка при приобретении абонемента');
      }
    } catch (err) {
      setError(err.message || 'Ошибка при приобретении абонемента');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-form">
      <div className="payment-header">
        <h2>Оплата абонемента</h2>
        <div className="membership-info">
          <h3>{membershipName}</h3>
          <p className="amount">Сумма: {amount} BYN</p>
        </div>
      </div>

      <div className="test-cards">
        <h4>Тестовые карты:</h4>
        <div className="test-card">
          <strong>Visa (успешная оплата)</strong>
          <span>4242 4242 4242 4242</span>
        </div>
        <div className="test-card">
          <strong>Visa (отказ)</strong>
          <span>4000 0000 0000 0002</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="stripe-form">
        {error && (
          <div className="payment-error">
            {error}
          </div>
        )}

        <div className="form-group">
          <label>Номер карты</label>
          <input
            type="text"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            placeholder="4242 4242 4242 4242"
            className="card-input"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>ММ/ГГ</label>
            <input
              type="text"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              placeholder="12/25"
              className="expiry-input"
            />
          </div>
          <div className="form-group">
            <label>CVC</label>
            <input
              type="text"
              value={cvc}
              onChange={(e) => setCvc(e.target.value)}
              placeholder="123"
              className="cvc-input"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Индекс</label>
          <input
            type="text"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            placeholder="12345"
            className="zip-input"
          />
        </div>

        <div className="payment-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-ghost"
            disabled={loading}
          >
            Отмена
          </button>
          
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner-small"></div>
                Обработка...
              </>
            ) : (
              'Оплатить (тест)'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentForm;

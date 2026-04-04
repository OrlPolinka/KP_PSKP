import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await userService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
      alert('Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async (id, currentStatus) => {
    if (window.confirm(`Вы уверены, что хотите ${currentStatus ? 'заблокировать' : 'разблокировать'} пользователя?`)) {
      try {
        await userService.blockUser(id, !currentStatus);
        fetchUsers();
      } catch (error) {
        alert('Ошибка при изменении статуса');
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить пользователя? Это действие необратимо.')) {
      try {
        await userService.deleteUser(id);
        fetchUsers();
      } catch (error) {
        alert('Ошибка при удалении пользователя');
      }
    }
  };

  const getRoleName = (role) => {
    switch (role) {
      case 'admin': return 'Администратор';
      case 'trainer': return 'Тренер';
      case 'client': return 'Клиент';
      default: return role;
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="container">
      <h2>Управление пользователями</h2>
      <div className="card">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ddd', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>ФИО</th>
              <th style={{ padding: '12px' }}>Email</th>
              <th style={{ padding: '12px' }}>Телефон</th>
              <th style={{ padding: '12px' }}>Роль</th>
              <th style={{ padding: '12px' }}>Статус</th>
              <th style={{ padding: '12px' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px' }}>{user.fullName}</td>
                <td style={{ padding: '12px' }}>{user.email}</td>
                <td style={{ padding: '12px' }}>{user.phone || '—'}</td>
                <td style={{ padding: '12px' }}>{getRoleName(user.role)}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    color: user.isActive ? '#28a745' : '#dc3545',
                    fontWeight: 'bold',
                  }}>
                    {user.isActive ? 'Активен' : 'Заблокирован'}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <button
                    className="btn btn-primary"
                    style={{ marginRight: '10px' }}
                    onClick={() => handleBlock(user.id, user.isActive)}
                  >
                    {user.isActive ? 'Заблокировать' : 'Разблокировать'}
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(user.id)}
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersList;
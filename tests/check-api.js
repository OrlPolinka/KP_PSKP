const http = require('http');

async function checkAPI() {
  console.log('🔍 Проверка доступности API...\n');
  
  try {
    const response = await fetch('http://localhost:5000/api/health');
    if (response.ok) {
      console.log('✅ API сервер доступен на http://localhost:5000');
      return true;
    } else {
      console.log('❌ API сервер вернул ошибку:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ API сервер недоступен на http://localhost:5000');
    console.log('💡 Убедитесь, что backend сервер запущен:');
    console.log('   cd backend && npm start');
    console.log('   или используйте docker-compose up');
    return false;
  }
}

if (require.main === module) {
  checkAPI().then(available => {
    process.exit(available ? 0 : 1);
  });
}

module.exports = { checkAPI };

import ngrok from 'ngrok';

(async function() {
  try {
    console.log('Iniciando túneles de Ngrok...');
    
    // Conectar puerto 4000 (Backend)
    const serverUrl = await ngrok.connect({ addr: 4000 });
    
    // Conectar puerto 3000 (Frontend)
    const clientUrl = await ngrok.connect({ addr: 3000 });

    console.log('\n===================================================');
    console.log('🚀  NGROK DEPLOYMENT READY');
    console.log('===================================================');
    console.log(`\n📡  Server (Backend) URL:  ${serverUrl}`);
    console.log(`💻  Client (Frontend) URL: ${clientUrl}`);
    console.log('\n===================================================');
    console.log('⚠️  INSTRUCCIONES PARA EL CLIENTE:');
    console.log('1. Copia la URL del Server: ' + serverUrl);
    console.log('2. Detén el proceso del cliente (Ctrl+C) si está corriendo.');
    console.log('3. Reinicia el cliente configurando la URL del backend:');
    console.log('\n   En PowerShell:');
    console.log(`   $env:REACT_APP_BACKEND_URL="${serverUrl}"; npm start`);
    console.log('\n   En CMD:');
    console.log(`   set REACT_APP_BACKEND_URL=${serverUrl} && npm start`);
    console.log('\n   En Bash (Linux/Mac):');
    console.log(`   REACT_APP_BACKEND_URL=${serverUrl} npm start`);
    console.log('===================================================');
    
    // Mantener proceso vivo
    setInterval(() => {}, 1000 * 60 * 60);
  } catch (err) {
    console.error('Error iniciando ngrok:', err);
    console.log('Asegúrate de tener tu authtoken configurado: ngrok config add-authtoken <TOKEN>');
  }
})();

import axios from 'axios';

const API_URL = 'http://localhost:5000/api'; // Ajustar según el puerto real
const ENDPOINTS = [
  '/students?page=1&limit=10',
  '/careers',
  '/institutions',
  '/enrollments'
];

async function runLoadTest(concurrentRequests: number, totalRequests: number) {
  console.log(`--- Iniciando Prueba de Carga ---`);
  console.log(`Concurrencia: ${concurrentRequests}`);
  console.log(`Total de solicitudes: ${totalRequests}`);

  const start = Date.now();
  let completed = 0;
  const latencies: number[] = [];

  const executeRequest = async () => {
    const endpoint = ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)];
    const reqStart = Date.now();
    try {
      await axios.get(`${API_URL}${endpoint}`);
      const duration = Date.now() - reqStart;
      latencies.push(duration);
    } catch (error: any) {
      console.error(`Error en ${endpoint}: ${error.message}`);
    } finally {
      completed++;
    }
  };

  const batches = Math.ceil(totalRequests / concurrentRequests);
  for (let i = 0; i < batches; i++) {
    const promises = [];
    for (let j = 0; j < concurrentRequests && (i * concurrentRequests + j) < totalRequests; j++) {
      promises.push(executeRequest());
    }
    await Promise.all(promises);
    process.stdout.write(`Progreso: ${completed}/${totalRequests}\r`);
  }

  const totalDuration = Date.now() - start;
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const p95Latency = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)];

  console.log('\n--- Resultados de la Prueba ---');
  console.log(`Duración total: ${totalDuration}ms`);
  console.log(`Latencia Promedio: ${avgLatency.toFixed(2)}ms`);
  console.log(`Latencia P95: ${p95Latency}ms`);
  console.log(`Solicitudes por segundo: ${(totalRequests / (totalDuration / 1000)).toFixed(2)}`);
}

// Para ejecutar: ts-node load-test.ts
runLoadTest(5, 50).catch(console.error);

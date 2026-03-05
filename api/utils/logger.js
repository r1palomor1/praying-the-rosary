export function logAIRequest(endpoint, success, responseTime) {
  // Safe console logger ensuring NO PII
  console.log(`[AI Request] ${endpoint} | Success: ${success} | Time: ${responseTime}ms`);
}
export async function checkRateLimit(userId) {
  // Simple memory-based rate limiting for Serverless.
  // In a real production environment, you would use Redis/Upstash.
  // For Vercel Serverless free tier, this provides basic protection 
  // but resets on cold starts.
  
  // Return early right now while we stub this out
  return { allowed: true, remaining: 20 };
}
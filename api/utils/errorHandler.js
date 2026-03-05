export function handleAPIError(error) {
  const errMsg = error.message ? error.message : String(error);
  console.error("API Context Error Details: ", errMsg);
  // Log the stack trace natively to Vercel logs
  if (error.stack) {
    console.error("API Context Stack: ", error.stack);
  }
  
  return {
    error: true,
    message: "The AI companion is currently unavailable. Please try again later.",
    details: errMsg // Force it to always pass details to the frontend temporarily so we can debug on live staging
  };
}
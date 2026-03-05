export function handleAPIError(error) {
  console.error("API Error: ", error.message || error);
  return {
    error: true,
    message: "The AI companion is currently unavailable. Please try again later.",
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  };
}
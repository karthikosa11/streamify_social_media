export const getErrorMessage = (error) => {
  let message = "An unexpected error occurred. Please try again.";
  if (error) {
    if (error.response && error.response.data && error.response.data.message) {
      // Axios error with a specific message from the backend
      message = error.response.data.message;
    } else if (error.message) {
      // Generic JavaScript error
      message = error.message;
    }
  }
  return message;
}; 
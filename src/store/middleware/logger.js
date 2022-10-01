
// SNA
const logger = param => store => next => action => {
  // This 'next' function is the next middleware, so here when we call next(), we are calling the next middleware
  // which is toast.js . Then toast.js will call the next middleware which is api.js (next(action)) 
  return next(action);
}

export default logger;
 
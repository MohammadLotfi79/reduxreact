
const toast = state => next => action => {
  if (typeof action === "function") action();
  else if (action.type === "error") console.log('Tostify:', action.payload.message)
  else return next(action)
}

export default toast;

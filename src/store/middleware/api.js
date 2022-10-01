import axios from 'axios';
import * as actions from '../api';

// const action = {
//   type: 'apiCallBegan',
//   payload: { // payload has all the data that we need to make an api call
//     url: '/bugs',
//     method: 'get',
//     data: {},
//     onSuccess: 'bugsReceived',
//     onError: "bugsRequestFailed"
//   }
// }

const api = ({ dispatch }) => next => async action => {
  // if an action without the type 'apiCallBegan' comes to this middleware, we have nothing to do with it,
  // so we pass it to the next middleware and finish.
  // if (action.type !== "apiCallBegan") {
  //   next(action);
  //   return;
  // }
  if (action.type !== actions.apiCallBegan.type) return next(action);

  // If we get here, we are dealing with an 'action' for calling api endpoint
  // 1 -> make api call
  // 2 -> handle resolve and reject cases
  const { url, method, data, onStart, onSuccess, onError } = action.payload;

  if (onStart) dispatch({ type: onStart })

  // If we want the action with type 'apiCallBegan' to appear in the redux devtools,
  // we have to pass it to the next middleware function before making an api call
  next(action);

  try {
    const response = await axios.request({
      baseURL: "http://localhost:9001/api",
      url,  // /bugs
      method,
      data
    })

    // General success dispatch
    dispatch(actions.apiCallSuccess(response.data));

    // Specific
    if (onSuccess) dispatch({ type: onSuccess, payload: response.data })

  } catch (error) {
    // General error action
    dispatch(actions.apiCallFailed(error.message))

    // Specific error
    if (onError) dispatch({ type: onError, payload: error.message })
  }
}

export default api;
import { createSlice } from "@reduxjs/toolkit";
import { createSelector } from 'reselect';
import { apiCallBegan } from './api';
import moment from 'moment';
import axios from "axios";

const slice = createSlice({
  name: 'bugs',
  initialState: {
    list: [],
    loading: false, // UI components subscribe to show loading spinner
    lastFetch: null,
  },
  reducers: {
    bugsRequested: (bugs, action) => {
      bugs.loading = true;
    },

    // bugs/bugsReceived
    bugsReceived: (bugs, action) => {
      bugs.list = action.payload;
      bugs.loading = false;
      bugs.lastFetch = Date.now();
    },

    bugsRequestFailed: (bugs, action) => {
      bugs.loading = false;
    },

    // actions => action handlers
    bugAssignedToUser: (bugs, action) => {
      const { id: bugId, userId } = action.payload;
      const index = bugs.list.findIndex(bug => bug.id === bugId);
      bugs.list[index].userId = userId;
    },

    // command - event
    // addBug - bugAdded
    bugAdded: (bugs, action) => {
      bugs.list.push(action.payload)
    },

    // resolveBug(command) - bugResolved (event)
    bugResolved: (bugs, action) => {
      const index = bugs.list.findIndex(bug => bug.id === action.payload.id);
      bugs.list[index].resolved = true;
    }
  }
});

const { bugAdded, bugResolved, bugAssignedToUser, bugsReceived, bugsRequested, bugsRequestFailed } = slice.actions;

export default slice.reducer;

const url = "/bugs";

/*** Action Creators ***/
// () => fn(dispatch, getState)
// چون میدل ور "فانک" رو داریم، میتونیم به جای اکشن، فانکشن دیسپچ کنیم که ورودی های این فانکشن، دیسپچ و گت استیت هستند.
export const loadBugs = () => (dispatch, getState) => { // thunk middleware, let's us dispatch functions and pass 'dispatch' and 'getState' functions to the dispatched function
  const { lastFetch } = getState().entities.bugs;

  // moment() -> returns the current date time
  const diffInMinutes = moment().diff(moment(lastFetch), 'minutes') // returns the difference between the 'current date time' and 'lastFetch' in minutes.
  if (diffInMinutes < 10) return;

  return dispatch(apiCallBegan({ // we need to get the value of the 'lastFetch' property to implement caching, so in load bugs, we return a function that returns an action creator and with the help of the thunk middleware, we have access to 'getState' function to get the 'lastFetch'
    url,  // in this slice, it is ok to know what endpoint we should call (how to get the data from the server)
    onStart: bugsRequested.type,
    onSuccess: bugsReceived.type,
    onError: bugsRequestFailed.type
  }));
}

// Adding bug to the server (database I mean, but here we don't have one)
export const addBug = bug => apiCallBegan({
  url,
  method: "post",
  data: bug,
  onSuccess: bugAdded.type,
})

export const resolveBug = id => apiCallBegan({
  // /bugs
  // PATCH /bugs/1
  url: url + '/' + id,
  method: 'patch',
  data: { resolved: true },
  onSuccess: bugResolved.type,
});

export const assignBugToUser = (bugId, userId) => apiCallBegan({
  url: url + '/' + bugId,
  method: "patch",
  data: { userId },
  onSuccess: bugAssignedToUser.type
})

// export const loadBugs = () => apiCallBegan({ // we need to get the value of the 'lastFetch' property to implement caching, so in load bugs, we return a function that returns an action creator and with the help of the thunk middleware, we have access to 'getState' function to get the 'lastFetch'
//   url,  // in this slice, it is ok to know what endpoint we should call (how to get the data from the server)
//   onStart: bugsRequested.type,
//   onSuccess: bugsReceived.type,
//   onError: bugsRequestFailed.type
// });

// Memoization
// f(x) => y   { input: 1, output: 2 }
export const getUnresolvedBugs = createSelector(
  state => state.entities.bugs,
  state => state.entities.projects,
  (bugs, projects) => bugs.list.filter(bug => !bug.resolved)
)

export const getBugs = createSelector(
  state => state.entities.bugs,
  bugs => bugs.list
)

export const getBugsByUser = userId => createSelector(
  state => state.entities.bugs,
  bugs => bugs.filter(bug => bug.userId === userId)
)
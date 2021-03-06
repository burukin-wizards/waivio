import Cookie from 'js-cookie';
import { createAction } from 'redux-actions';
import { getAuthenticatedUserName, getIsAuthenticated, getIsLoaded } from '../reducers';
import { createAsyncActionType } from '../helpers/stateHelpers';
import { addNewNotification } from '../app/appActions';
import { getFollowing } from '../user/userActions';
import { BUSY_API_TYPES } from '../../common/constants/notifications';
import { setToken } from '../helpers/getToken';
import { updateGuestProfile } from '../../waivioApi/ApiClient';

export const LOGIN = '@auth/LOGIN';
export const LOGIN_START = '@auth/LOGIN_START';
export const LOGIN_SUCCESS = '@auth/LOGIN_SUCCESS';
export const LOGIN_ERROR = '@auth/LOGIN_ERROR';

export const UPDATE_PROFILE = '@auth/UPDATE_PROFILE';
export const UPDATE_PROFILE_START = '@auth/UPDATE_PROFILE_START';
export const UPDATE_PROFILE_SUCCESS = '@auth/UPDATE_PROFILE_SUCCESS';
export const UPDATE_PROFILE_ERROR = '@auth/UPDATE_PROFILE_ERROR';

export const RELOAD = '@auth/RELOAD';
export const RELOAD_START = '@auth/RELOAD_START';
export const RELOAD_SUCCESS = '@auth/RELOAD_SUCCESS';
export const RELOAD_ERROR = '@auth/RELOAD_ERROR';

export const LOGOUT = '@auth/LOGOUT';

export const BUSY_LOGIN = createAsyncActionType('@auth/BUSY_LOGIN');

const loginError = createAction(LOGIN_ERROR);

export const login = (accessToken = '', socialNetwork = '', regData = '') => async (
  dispatch,
  getState,
  { steemConnectAPI, waivioAPI },
) => {
  const state = getState();

  let promise = Promise.resolve(null);

  let isGuest = null;
  if (typeof localStorage !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    isGuest = token === 'null' ? false : Boolean(token);
  }

  if (getIsLoaded(state)) {
    promise = Promise.resolve(null);
  } else if (accessToken && socialNetwork) {
    promise = new Promise(async (resolve, reject) => {
      try {
        const tokenData = await setToken(accessToken, socialNetwork, regData);
        const userMetaData = await waivioAPI.getAuthenticatedUserMetadata(tokenData.userData.name);
        resolve({ account: tokenData.userData, userMetaData, socialNetwork, isGuestUser: true });
      } catch (e) {
        reject(e);
      }
    });
  } else if (!steemConnectAPI.options.accessToken && !isGuest) {
    promise = Promise.reject(new Error('There is not accessToken present'));
  } else if (isGuest || steemConnectAPI.options.accessToken) {
    promise = new Promise(async (resolve, reject) => {
      try {
        const scUserData = await steemConnectAPI.me();
        const userMetaData = await waivioAPI.getAuthenticatedUserMetadata(scUserData.name);
        resolve({ ...scUserData, userMetaData, isGuestUser: isGuest });
      } catch (e) {
        reject(e);
      }
    });
  }
  return dispatch({
    type: LOGIN,
    payload: {
      promise,
    },
    meta: {
      refresh: getIsLoaded(state),
    },
  }).catch(e => {
    console.warn(e);
    dispatch(loginError());
    return e;
  });
};

export const getCurrentUserFollowing = () => dispatch => dispatch(getFollowing());

export const reload = () => (dispatch, getState, { steemConnectAPI }) =>
  dispatch({
    type: RELOAD,
    payload: {
      promise: steemConnectAPI.me(getAuthenticatedUserName(getState())),
    },
  });

export const logout = () => (dispatch, getState, { busyAPI, steemConnectAPI }) => {
  const state = getState();
  if (state.auth.isGuestUser) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('accessTokenExpiration');
    localStorage.removeItem('socialName');
    localStorage.removeItem('guestName');
    if (window) {
      // eslint-disable-next-line no-unused-expressions
      window.FB && window.FB.logout();
      // eslint-disable-next-line no-unused-expressions
      window.gapi && window.gapi.auth2.getAuthInstance().signOut();
    }
  } else {
    steemConnectAPI.revokeToken();
    Cookie.remove('access_token');
  }
  busyAPI.close();
  dispatch({
    type: LOGOUT,
  });
};

export const busyLogin = () => (dispatch, getState, { busyAPI }) => {
  const accessToken = Cookie.get('access_token');
  const state = getState();

  if (!getIsAuthenticated(state)) {
    return dispatch({ type: BUSY_LOGIN.ERROR });
  }

  busyAPI.subscribe((response, message) => {
    const type = message && message.type;

    if (type === BUSY_API_TYPES.notification && message.notification) {
      dispatch(addNewNotification(message.notification));
    }
  });

  const targetUsername = getAuthenticatedUserName(state);

  return dispatch({
    type: BUSY_LOGIN.ACTION,
    meta: targetUsername,
    payload: {
      promise: busyAPI.sendAsync('login', [accessToken]),
    },
  });
};

export const updateProfile = (username, values) => (dispatch, getState) => {
  const state = getState();
  // eslint-disable-next-line camelcase
  const json_metadata = JSON.parse(state.auth.user.json_metadata);
  json_metadata.profile = { ...json_metadata.profile, ...values };
  return dispatch({
    type: UPDATE_PROFILE,
    payload: {
      promise: updateGuestProfile(username, json_metadata).then(data => {
        if (data.statuscode === 200) {
          return { isProfileUpdated: false };
        }
        return { isProfileUpdated: true };
      }),
    },
    meta: JSON.stringify(json_metadata),
  });
};

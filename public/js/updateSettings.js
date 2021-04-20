import axios from 'axios';
import { displayAlert } from './alert';

// type is either 'password' or 'data'
export const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? 'http://127.0.0.1:3000/api/v1/users/updatePassword'
        : 'http://127.0.0.1:3000/api/v1/users/updateCurrentUser';
    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });

    if (res.data.status === 'success') {
      displayAlert('success', `${type.toUpperCase()} updated successfully`);
    }
  } catch (err) {
      console.log('password error: ', err);
    displayAlert('error', err.response.data.message);
  }
};

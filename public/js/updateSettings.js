import axios from 'axios';
import { displayAlert } from './alert';

// type is either 'password' or 'data'
export const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? '/api/v1/users/updatePassword'
        : '/api/v1/users/updateCurrentUser';
    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });

    if (res.data.status === 'success') {
      displayAlert('success', `${type.toUpperCase()} updated successfully`);
    }
  } catch (err) {
    console.log('Update settings: ', err);
    displayAlert('error', err.response.data.message);
  }
};

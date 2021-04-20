const express = require('express');
const {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateCurrentUser,
  deleteCurrentUser,
  getCurrentUser,
  uploadUserPhoto,
  resizeUserPhoto,
} = require('../controllers/userController');

const {
  signup,
  login,
  logout,
  forgotPassword,
  resetPassword,
  updatePassword,
  protect,
  restrictTo,
} = require('../controllers/authController');

const router = express.Router();

router.route('/signup').post(signup);
router.route('/login').post(login);
router.route('/logout').get(logout);
router.route('/forgotPassword').post(forgotPassword);
router.route('/resetPassword/:token').patch(resetPassword);

// This middleware will ensure all the routes after this line are protected i.e. authenticated
router.use(protect);

router.route('/updatePassword').patch(updatePassword);
router.get('/currentUser', getCurrentUser, getUser);
router.patch('/updateCurrentUser', uploadUserPhoto, resizeUserPhoto, updateCurrentUser); // 'photo' here is name of the form field having related details
router.delete('/deleteCurrentUser', deleteCurrentUser);

router.use(restrictTo('admin'));

router.route('/').get(getAllUsers).post(createUser);
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;

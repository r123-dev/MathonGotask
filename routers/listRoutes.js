const express = require('express');
const multer = require('multer');
const listController = require('../controllers/listController');
const router = express.Router();

const upload = multer({ dest: 'uploads/' });

router.post('/', listController.createList);
router.post('/:listId/users', upload.single('file'), listController.addUsers);
router.post('/:listId/send-email', listController.sendEmail);
router.get('/:listId/unsubscribe/:email', listController.unsubscribeUser);

module.exports = router;

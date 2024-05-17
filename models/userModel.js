const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    listId: mongoose.Schema.Types.ObjectId,
    name: String,
    email: { type: String, unique: true },
    properties: Object
});

module.exports = mongoose.model('User', UserSchema);

const mongoose = require('mongoose');

const ListSchema = new mongoose.Schema({
    title: String,
    customProperties: Object,
    unsubscribedEmails: [String]
});

module.exports = mongoose.model('List', ListSchema);

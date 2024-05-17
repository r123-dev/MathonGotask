const List = require('../models/listModel');
const User = require('../models/userModel');
const csv = require('csv-parser');
const fs = require('fs');
const nodemailer = require('nodemailer');
require('dotenv').config();

const processCSV = async (filePath, customProperties) => {
    const users = [];
    const errors = [];
    const fallbackValues = customProperties;
    
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                if (!row.name || !row.email) {
                    errors.push({ ...row, error: 'Missing required fields' });
                    return;
                }

                const properties = { ...fallbackValues, ...row };
                delete properties.name;
                delete properties.email;

                users.push({
                    name: row.name,
                    email: row.email,
                    properties
                });
            })
            .on('end', () => resolve({ users, errors }))
            .on('error', (err) => reject(err));
    });
};

exports.createList = async (req, res) => {
    const { title, customProperties } = req.body;
    const list = new List({ title, customProperties, unsubscribedEmails: [] });
    await list.save();
    res.status(201).json(list);
};

exports.addUsers = async (req, res) => {
    const { listId } = req.params;
    const list = await List.findById(listId);
    if (!list) {
        return res.status(404).json({ error: 'List not found' });
    }

    const { path: filePath } = req.file;
    try {
        const { users, errors } = await processCSV(filePath, list.customProperties);
        const addedUsers = [];
        for (const user of users) {
            try {
                const newUser = new User({ ...user, listId });
                await newUser.save();
                addedUsers.push(newUser);
            } catch (err) {
                errors.push({ ...user, error: err.message });
            }
        }

        fs.unlinkSync(filePath);

        res.status(200).json({
            addedCount: addedUsers.length,
            errorCount: errors.length,
            currentTotalCount: await User.countDocuments({ listId }),
            errors
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.sendEmail = async (req, res) => {
    const { listId } = req.params;
    const { subject, body } = req.body;
    const list = await List.findById(listId);
    if (!list) {
        return res.status(404).json({ error: 'List not found' });
    }

    const users = await User.find({ listId });
    const unsubscribedEmails = list.unsubscribedEmails || [];
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const emailPromises = users.filter(user => !unsubscribedEmails.includes(user.email)).map(user => {
        const emailBody = body.replace(/\[([^\]]+)]/g, (_, property) => user[property] || '');
        return transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject,
            html: `${emailBody}<br><a href="http://localhost:${process.env.PORT}/lists/${listId}/unsubscribe/${user.email}">Unsubscribe</a>`
        });
    });

    await Promise.all(emailPromises);
    res.status(200).json({ message: 'Emails sent' });
};

exports.unsubscribeUser = async (req, res) => {
    const { listId, email } = req.params;
    const list = await List.findById(listId);
    if (!list) {
        return res.status(404).json({ error: 'List not found' });
    }

    if (!list.unsubscribedEmails.includes(email)) {
        list.unsubscribedEmails.push(email);
        await list.save();
    }

    res.status(200).json({ message: 'You have been unsubscribed' });
};


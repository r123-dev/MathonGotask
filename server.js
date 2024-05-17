const express = require('express');
const connectDB = require('./config/db');
const listRoutes = require('./routers/listRoutes');
require('dotenv').config();

const app = express();

app.use(express.json());
connectDB();

app.use('/lists', listRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

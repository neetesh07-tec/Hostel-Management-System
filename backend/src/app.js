const express = require('express');
const cors = require('cors');
const session = require('express-session');
require('dotenv').config();

const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const buildingRoutes = require('./routes/buildings');
const floorRoutes = require('./routes/floors');
const sectionRoutes = require('./routes/sections');
const roomRoutes = require('./routes/rooms');
const studentRoutes = require('./routes/students');
const bookingRoutes = require('./routes/bookings');
const feeRoutes = require('./routes/fees');
const paymentRoutes = require('./routes/payments');
const dashboardRoutes = require('./routes/dashboard');
const accountRoutes = require('./routes/account');
const studentPortalRoutes = require('./routes/studentPortal');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24,
  },
}));

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/buildings', buildingRoutes);
app.use('/api/floors', floorRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/student', studentPortalRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

module.exports = app;

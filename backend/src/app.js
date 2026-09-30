const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Routes (auth goes first)

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/visitors', require('./routes/visitorRoutes'));
app.use('/api/visits', require('./routes/visitRoutes'));

app.get('/', (req, res) => res.json({ message: 'VMS API running' }));

module.exports = app;
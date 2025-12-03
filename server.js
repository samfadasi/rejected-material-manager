const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const rejectionsRoutes = require('./routes/rejectionsRoutes');
const authRoutes = require('./routes/authRoutes');
const ncrAuthRoutes = require('./routes/ncrAuthRoutes');
const ncrRoutes = require('./routes/ncrRoutes');
const noCache = require('./middleware/noCache');
const { initDatabase } = require('./models/db');

const app = express();
const PORT = process.env.PORT || 5000;

const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true
};
app.use(cors(corsOptions));

app.use(noCache);

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/rejections', rejectionsRoutes);
app.use('/api/ncr-auth', ncrAuthRoutes);

app.use('/api/ncrs/export', (req, res, next) => {
  if (req.query.token && !req.headers['authorization']) {
    req.headers['authorization'] = 'Bearer ' + req.query.token;
  }
  next();
});
app.use('/api/ncrs', ncrRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/', (req, res) => {
  res.redirect('/login.html');
});

app.get('/list', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'list.html'));
});

const startServer = async () => {
  try {
    if (process.env.DATABASE_URL) {
      await initDatabase();
      console.log('PostgreSQL database initialized');
    } else {
      console.log('DATABASE_URL not set - NCR features will not work');
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on http://0.0.0.0:${PORT}`);
      console.log(`Open the app at http://localhost:${PORT}`);
      console.log(`Rejection Tracker available at /login.html`);
      console.log(`NCR Manager available at /ncr-login.html`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer();

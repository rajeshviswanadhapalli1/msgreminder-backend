const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const env = require('./config/env');
const apiRoutes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

const corsOptions =
  env.corsOrigin === '*'
    ? { origin: true }
    : { origin: env.corsOrigin.split(',').map((o) => o.trim()) };

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

app.get('/', (req, res) => {
  res.json({
    name: 'Message Reminder API',
    status: 'ok',
    docs: '/api/docs',
    health: '/health',
    api: '/api/v1',
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

try {
  const openapiPath = path.join(__dirname, 'docs', 'openapi.yaml');
  const swaggerDocument = YAML.load(openapiPath);
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (err) {
  console.warn('OpenAPI docs not loaded:', err.message);
}

app.use('/api/v1', apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

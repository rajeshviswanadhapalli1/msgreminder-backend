require('dotenv').config();

const app = require('./app');
const env = require('./config/env');
const { sequelize } = require('./models');

async function start() {
  try {
    await sequelize.authenticate();
    const dialect = sequelize.getDialect();
    console.log(`Database connected (${dialect})`);

    // The migrations use MySQL-specific SQL, so SQLite builds its schema from the models.
    if (dialect === 'sqlite') {
      await sequelize.sync();
      console.log('SQLite schema synced');
      console.log(
        'NOTE: DB_DIALECT=sqlite — registrations are stored on this Mac only (data/development.sqlite). They will NOT appear in phpMyAdmin until you use MySQL or import database/import-local-users.sql.'
      );
    } else {
      console.log(`MySQL database: ${env.db.name} @ ${env.db.host}`);
    }

    const server = app.listen(env.port, '0.0.0.0', () => {
      console.log(`Server running on port ${env.port}`);
      console.log(`API docs: /api/docs`);
    });

    const shutdown = async (signal) => {
      console.log(`${signal} received, shutting down...`);
      server.close(async () => {
        await sequelize.close();
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = { app, start };

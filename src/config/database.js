const path = require('path');
const fs = require('fs');
const { Sequelize } = require('sequelize');
const env = require('./env');

const commonDefine = {
  underscored: true,
  timestamps: true,
};

function createSqlite(storage) {
  if (storage !== ':memory:') {
    fs.mkdirSync(path.dirname(path.resolve(storage)), { recursive: true });
  }
  return new Sequelize({
    dialect: 'sqlite',
    storage,
    logging: false,
    define: commonDefine,
  });
}

let sequelize;

if (env.nodeEnv === 'test' && process.env.USE_MYSQL_TEST !== 'true') {
  sequelize = createSqlite(':memory:');
} else if (env.db.dialect === 'sqlite') {
  sequelize = createSqlite(env.db.storage);
} else {
  sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
    host: env.db.host,
    port: env.db.port,
    dialect: 'mysql',
    logging: env.nodeEnv === 'development' ? console.log : false,
    define: commonDefine,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
}

module.exports = sequelize;

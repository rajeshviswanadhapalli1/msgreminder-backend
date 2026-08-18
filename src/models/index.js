const sequelize = require('../config/database');
const User = require('./User');
const PasswordResetToken = require('./PasswordResetToken');
const Reminder = require('./Reminder');

User.initModel(sequelize);
PasswordResetToken.initModel(sequelize);
Reminder.initModel(sequelize);

const models = {
  User,
  PasswordResetToken,
  Reminder,
};

Object.values(models).forEach((model) => {
  if (model.associate) {
    model.associate(models);
  }
});

module.exports = {
  sequelize,
  User,
  PasswordResetToken,
  Reminder,
};

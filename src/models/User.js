const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const SALT_ROUNDS = 12;

class User extends Model {
  static initModel(sequelize) {
    User.init(
      {
        id: {
          type: DataTypes.UUID,
          primaryKey: true,
          defaultValue: () => uuidv4(),
        },
        fullName: {
          type: DataTypes.STRING(120),
          allowNull: false,
          field: 'full_name',
        },
        email: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: true,
        },
        country: {
          type: DataTypes.STRING(80),
          allowNull: false,
        },
        countryCode: {
          type: DataTypes.STRING(8),
          allowNull: false,
          field: 'country_code',
        },
        mobile: {
          type: DataTypes.STRING(20),
          allowNull: false,
        },
        passwordHash: {
          type: DataTypes.STRING(255),
          allowNull: false,
          field: 'password_hash',
        },
        timezone: {
          type: DataTypes.STRING(64),
          allowNull: false,
          defaultValue: 'UTC',
        },
        tokenVersion: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 0,
          field: 'token_version',
        },
      },
      {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        underscored: true,
      }
    );
  }

  static associate(models) {
    User.hasMany(models.Reminder, { foreignKey: 'userId', as: 'reminders' });
    User.hasMany(models.PasswordResetToken, { foreignKey: 'userId', as: 'resetTokens' });
  }

  async comparePassword(plainPassword) {
    return bcrypt.compare(plainPassword, this.passwordHash);
  }

  static async hashPassword(plainPassword) {
    return bcrypt.hash(plainPassword, SALT_ROUNDS);
  }

  toSafeJSON() {
    return {
      id: this.id,
      fullName: this.fullName,
      email: this.email,
      country: this.country,
      countryCode: this.countryCode,
      mobile: this.mobile,
      timezone: this.timezone,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = User;

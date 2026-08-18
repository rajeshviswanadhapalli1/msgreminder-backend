const { DataTypes, Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

class PasswordResetToken extends Model {
  static initModel(sequelize) {
    PasswordResetToken.init(
      {
        id: {
          type: DataTypes.UUID,
          primaryKey: true,
          defaultValue: () => uuidv4(),
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'user_id',
        },
        tokenHash: {
          type: DataTypes.STRING(64),
          allowNull: false,
          field: 'token_hash',
        },
        expiresAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: 'expires_at',
        },
        usedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'used_at',
        },
      },
      {
        sequelize,
        modelName: 'PasswordResetToken',
        tableName: 'password_reset_tokens',
        underscored: true,
      }
    );
  }

  static associate(models) {
    PasswordResetToken.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  }

  isExpired() {
    return new Date() > this.expiresAt;
  }

  isUsed() {
    return this.usedAt !== null;
  }
}

module.exports = PasswordResetToken;

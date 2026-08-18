const { DataTypes, Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

class Reminder extends Model {
  static initModel(sequelize) {
    Reminder.init(
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
        title: {
          type: DataTypes.STRING(120),
          allowNull: true,
        },
        message: {
          type: DataTypes.STRING(500),
          allowNull: false,
        },
        category: {
          type: DataTypes.ENUM('general', 'birthday', 'meeting', 'anniversary', 'other'),
          allowNull: false,
          defaultValue: 'general',
        },
        scheduledAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: 'scheduled_at',
        },
        timezone: {
          type: DataTypes.STRING(64),
          allowNull: false,
          defaultValue: 'UTC',
        },
        repeat: {
          type: DataTypes.ENUM('none', 'daily', 'weekly', 'monthly', 'yearly'),
          allowNull: false,
          defaultValue: 'none',
        },
        priority: {
          type: DataTypes.ENUM('low', 'medium', 'high'),
          allowNull: false,
          defaultValue: 'medium',
        },
        status: {
          type: DataTypes.ENUM('pending', 'completed'),
          allowNull: false,
          defaultValue: 'pending',
        },
        completedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'completed_at',
        },
        seriesId: {
          type: DataTypes.UUID,
          allowNull: true,
          field: 'series_id',
        },
      },
      {
        sequelize,
        modelName: 'Reminder',
        tableName: 'reminders',
        underscored: true,
      }
    );
  }

  static associate(models) {
    Reminder.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  }

  toJSON() {
    const values = { ...this.get() };
    return {
      id: values.id,
      userId: values.userId,
      title: values.title,
      message: values.message,
      category: values.category,
      scheduledAt: values.scheduledAt,
      timezone: values.timezone,
      repeat: values.repeat,
      priority: values.priority,
      status: values.status,
      completedAt: values.completedAt,
      seriesId: values.seriesId,
      createdAt: values.createdAt,
      updatedAt: values.updatedAt,
    };
  }
}

module.exports = Reminder;

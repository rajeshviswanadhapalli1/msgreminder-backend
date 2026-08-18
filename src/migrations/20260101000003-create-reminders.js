'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('reminders', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      title: {
        type: Sequelize.STRING(120),
        allowNull: true,
      },
      message: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      category: {
        type: Sequelize.ENUM('general', 'birthday', 'meeting', 'anniversary', 'other'),
        allowNull: false,
        defaultValue: 'general',
      },
      scheduled_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      timezone: {
        type: Sequelize.STRING(64),
        allowNull: false,
        defaultValue: 'UTC',
      },
      repeat: {
        type: Sequelize.ENUM('none', 'daily', 'weekly', 'monthly', 'yearly'),
        allowNull: false,
        defaultValue: 'none',
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high'),
        allowNull: false,
        defaultValue: 'medium',
      },
      status: {
        type: Sequelize.ENUM('pending', 'completed'),
        allowNull: false,
        defaultValue: 'pending',
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      series_id: {
        type: Sequelize.CHAR(36),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('reminders', ['user_id', 'status', 'scheduled_at'], {
      name: 'reminders_user_status_scheduled_idx',
    });
    await queryInterface.addIndex('reminders', ['user_id', 'completed_at'], {
      name: 'reminders_user_completed_idx',
    });
    await queryInterface.addIndex('reminders', ['series_id'], {
      name: 'reminders_series_id_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('reminders');
  },
};

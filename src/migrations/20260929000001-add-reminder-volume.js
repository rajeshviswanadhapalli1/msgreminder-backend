'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('reminders', 'volume', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 100,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('reminders', 'volume');
  },
};


exports.up = function(knex, Promise) {
  return knex.schema.createTable('room', t => {
    t.increments()
    t.string('title').notNullable().unique()
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('room')
};

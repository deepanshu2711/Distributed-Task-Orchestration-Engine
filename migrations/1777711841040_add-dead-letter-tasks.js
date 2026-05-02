/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.createExtension("pgcrypto", { ifNotExists: true });
  pgm.createTable("dead_letter_tasks", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    original_task_id: {
      type: "uuid",
      notNull: true,
      references: "tasks(id)",
      onDelete: "CASCADE",
    },

    type: {
      type: "text",
      notNull: true,
    },

    payload: {
      type: "jsonb",
      notNull: true,
      default: "{}",
    },

    failure_reason: {
      type: "text",
    },

    failed_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("NOW()"),
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable("dead_letter_tasks");
};

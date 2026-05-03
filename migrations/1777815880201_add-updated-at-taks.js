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
  pgm.addColumn("tasks", {
    updated_at: {
      type: "timestamptz",
      notNull: false,
      default: pgm.func("NOW()"),
    },
  });

  pgm.sql(`
  UPDATE tasks
  SET updated_at = created_at
  WHERE updated_at IS NULL;
`);

  pgm.alterColumn("tasks", "updated_at", {
    notNull: true,
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.alterColumn("tasks", "updated_at", {
    notNull: false,
  });

  pgm.dropColumn("tasks", "updated_at");
};

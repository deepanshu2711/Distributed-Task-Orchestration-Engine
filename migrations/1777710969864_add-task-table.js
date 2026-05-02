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
  pgm.createTable("tasks", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    idempotency_key: {
      type: "text",
      unique: true,
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
    status: {
      type: "text",
      notNull: true,
      default: "pending",
    },
    worker_id: {
      type: "uuid",
      references: "workers(id)",
      onDelete: "SET NULL",
    },
    lease_token: {
      type: "text",
    },
    lease_expires_at: {
      type: "timestamptz",
    },

    attempt_count: {
      type: "integer",
      notNull: true,
      default: 0,
    },

    max_attempts: {
      type: "integer",
      notNull: true,
      default: 3,
    },
    last_error: {
      type: "text",
    },
    created_at: {
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
  pgm.dropTable("tasks");
};

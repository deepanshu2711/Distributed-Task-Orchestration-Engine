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
  pgm.alterColumn("tasks", "status", {
    default: null,
  });

  pgm.sql(`
  UPDATE tasks SET status = UPPER(status);
`);

  pgm.createType("task_status", [
    "PENDING",
    "QUEUED",
    "RUNNING",
    "SUCCESS",
    "FAILED",
    "RETRYING",
    "DLQ",
  ]);
  pgm.alterColumn("tasks", "status", {
    type: "task_status",
    using: "status::task_status",
  });

  pgm.alterColumn("tasks", "status", {
    default: "PENDING",
  });

  pgm.sql(`
  CREATE OR REPLACE FUNCTION validate_task_transition()
  RETURNS TRIGGER AS $$
  BEGIN
    IF TG_OP = 'INSERT' THEN
      RETURN NEW;
    END IF;

    IF NEW.status = OLD.status THEN
      NEW.updated_at = now();
      RETURN NEW;
    END IF;

    IF OLD.status = 'PENDING' AND NEW.status = 'QUEUED' THEN
      NULL;

    ELSIF OLD.status = 'QUEUED' AND NEW.status = 'RUNNING' THEN
      NULL;

    ELSIF OLD.status = 'RUNNING' AND NEW.status IN ('SUCCESS', 'FAILED') THEN
      NULL;

    ELSIF OLD.status = 'FAILED' AND NEW.status IN ('RETRYING', 'DLQ') THEN
      NULL;

    ELSIF OLD.status = 'RETRYING' AND NEW.status = 'QUEUED' THEN
      NULL;

    ELSE
      RAISE EXCEPTION 
        'Invalid task state transition: % → %',
        OLD.status, NEW.status;
    END IF;

    -- retry handling
    IF NEW.status = 'RETRYING' THEN
      IF OLD.attempt_count >= OLD.max_attempts THEN
        RAISE EXCEPTION 'Max retry limit reached';
      END IF;

      NEW.attempt_count = OLD.attempt_count + 1;
    END IF;

    NEW.updated_at = now();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
`);

  pgm.sql(`
    CREATE TRIGGER task_state_guard
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION validate_task_transition();
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */

export const down = (pgm) => {
  pgm.sql(`
    DROP TRIGGER IF EXISTS task_state_guard ON tasks;
  `);
  pgm.sql(`
    DROP FUNCTION IF EXISTS validate_task_transition;
  `);
  pgm.alterColumn("tasks", "status", {
    type: "text",
    using: "status::text",
  });
  pgm.dropType("task_status");
};

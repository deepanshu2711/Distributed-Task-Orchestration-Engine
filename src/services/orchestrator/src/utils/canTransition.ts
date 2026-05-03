export type TaskStatus =
  | "PENDING"
  | "QUEUED"
  | "RUNNING"
  | "SUCCESS"
  | "FAILED"
  | "RETRYING"
  | "DLQ";

export const transitions: Record<TaskStatus, TaskStatus[]> = {
  PENDING: ["QUEUED"],
  QUEUED: ["RUNNING"],
  RUNNING: ["SUCCESS", "FAILED"],
  FAILED: ["RETRYING", "DLQ"],
  RETRYING: ["QUEUED"],
  SUCCESS: [],
  DLQ: [],
};

export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  return transitions[from].includes(to);
}

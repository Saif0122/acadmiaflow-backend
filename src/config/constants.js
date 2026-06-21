// ──────────────────────────────────────
// Application Constants
// ──────────────────────────────────────

const ROLES = {
  ADMIN: 'admin',
  STUDENT: 'student',
  INSTRUCTOR: 'instructor',
};

const ROLE_LIST = Object.values(ROLES);

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER: 500,
};

module.exports = {
  ROLES,
  ROLE_LIST,
  HTTP_STATUS,
};

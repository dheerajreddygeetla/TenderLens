import {
  listUsers,
  listRolesWithPermissions,
  createUser,
  updateUser,
} from "../services/users.service.js";

const meta = (req) => ({ ip: req.ip, userAgent: req.get("user-agent") || null });

export const getUsers = async (req, res, next) => {
  try {
    const rows = await listUsers();
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

export const getRoles = async (req, res, next) => {
  try {
    const rows = await listRolesWithPermissions();
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

export const postUser = async (req, res, next) => {
  try {
    const user = await createUser(req.body, req.user, meta(req));
    res.status(201).json({ success: true, data: user });
  } catch (err) { next(err); }
};

export const patchUser = async (req, res, next) => {
  try {
    const user = await updateUser(req.params.id, req.body, req.user, meta(req));
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

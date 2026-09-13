import React from "react";
import { Edit3, Search, Trash2, Users } from "lucide-react";

interface UserRoleAccountsSectionProps {
  userSearch: string;
  setUserSearch: (value: string) => void;
  usersLoading: boolean;
  usersError: string | null;
  filteredUsers: any[];
  getDisplayName: (user: any) => string;
  setEditingUser: (user: any) => void;
  handleDeleteUser: (id: any) => void;
}

export function UserRoleAccountsSection({
  userSearch,
  setUserSearch,
  usersLoading,
  usersError,
  filteredUsers,
  getDisplayName,
  setEditingUser,
  handleDeleteUser
}: UserRoleAccountsSectionProps) {
  return (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-5">
            <div>
              <h2 className="font-extrabold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                User Roles & Account Master Directory
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Users displayed here come directly from the MySQL database.
              </p>
            </div>

            <div className="relative w-72">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />

              <input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search user, email, role..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />
            </div>
          </div>

          {usersLoading && (
            <div className="py-10 text-center text-sm text-slate-500">
              Loading users from database...
            </div>
          )}

          {usersError && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
              {usersError}
            </div>
          )}

          {!usersLoading && !usersError && filteredUsers.length === 0 && (
            <div className="py-10 text-center text-sm text-slate-500">
              No users found in database.
            </div>
          )}

          {!usersLoading && !usersError && filteredUsers.length > 0 && (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="p-3">User & Email</th>

                    <th className="p-3">Designation & Department</th>

                    <th className="p-3">Assigned Roles</th>

                    <th className="p-3">Status</th>

                    <th className="p-3">Intercom</th>

                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">
                          {getDisplayName(user)}
                        </div>

                        <div className="text-[11px] text-slate-500">
                          {user.email || "—"}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-semibold">
                          {user.designation || "—"}
                        </div>

                        <div className="text-[11px] text-slate-500">
                          {user.department || "—"}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(user.roles) &&
                            user.roles.map((role) => (
                              <span
                                key={role.id}
                                className="px-2 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-800 font-bold"
                              >
                                {role.name}
                              </span>
                            ))}
                        </div>
                      </td>

                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded text-[10px] font-bold ${
                            String(user.status).toLowerCase() === "active"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {String(user.status || "inactive").toUpperCase()}
                        </span>
                      </td>

                      <td className="p-3 font-mono">
                        {user.intercomExtension || user.intercom || "—"}
                      </td>

                      <td className="p-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                            title="Edit User Roles"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
  );
}

/**
 * @file RecipientSelector.tsx
 * @description Componente para seleccionar destinatarios por rol y/o usuarios específicos.
 */

import { useState, useEffect } from 'react';
import { rolesService } from '../../../features/roles/services/rolesService';
import apiClient from '../../../api/apiClient';

// ─── Types ───────────────────────────────────────────────────────────────

export interface RecipientUser {
  id: number;
  name: string;
  email: string;
  roleName?: string;
}

export interface RecipientSelection {
  roles: string[];
  users: RecipientUser[];
}

interface RecipientSelectorProps {
  value: RecipientSelection;
  onChange: (value: RecipientSelection) => void;
  title?: string;
  description?: string;
}

// ─── Component ──────────────────────────────────────────────────────────

const formatRoleLabel = (name: string): string => {
  if (name === 'all') return 'Todos';
  return name
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

const AVAILABLE_ROLES = ['all', 'admin', 'asistente', 'tutor', 'estudiante'];

export const RecipientSelector = ({
  value,
  onChange,
  title = 'Destinatarios',
  description = 'Seleccioná a quiénes va dirigido el mensaje.',
}: RecipientSelectorProps) => {
  const [dbRoles, setDbRoles] = useState<Array<{ name: string }>>([]);
  const [users, setUsers] = useState<RecipientUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Fetch roles
  useEffect(() => {
    rolesService.getAll().then(res => {
      if (res?.success && Array.isArray(res.data)) {
        setDbRoles(res.data.map((r: any) => ({ name: r.name.toLowerCase() })));
      }
    }).catch(() => {});
  }, []);

  // Fetch users
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await apiClient.get('/users?limit=200');
      const data = res.data?.users ?? res.data?.data ?? [];
      setUsers(
        data.map((u: any) => ({
          id: u.id ?? u.USER_ID,
          name: `${u.name ?? u.NAME ?? ''} ${u.surname ?? u.SURNAME ?? ''}`.trim(),
          email: u.email ?? u.EMAIL ?? '',
          roleName: u.roleName ?? u.role_name ?? '',
        })).filter((u: RecipientUser) => u.email),
      );
    } catch {
      console.error('Error fetching users');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // Toggle role
  const toggleRole = (role: string) => {
    const current = value.roles;
    const next = current.includes(role)
      ? current.filter(r => r !== role)
      : [...current, role];
    onChange({ ...value, roles: next });
  };

  // Toggle user
  const toggleUser = (user: RecipientUser) => {
    const current = value.users;
    const exists = current.find(u => u.id === user.id);
    const next = exists
      ? current.filter(u => u.id !== user.id)
      : [...current, user];
    onChange({ ...value, users: next });
  };

  const removeUser = (userId: number) => {
    onChange({ ...value, users: value.users.filter(u => u.id !== userId) });
  };

  const filteredUsers = users.filter(u => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const allRoles = [...AVAILABLE_ROLES, ...dbRoles.map(r => r.name)];
  const uniqueRoles = [...new Set(allRoles)];

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
        )}
      </div>

      {/* Selected summary + edit button */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {value.roles.length === 0 && value.users.length === 0 && (
            <span className="text-gray-400">Sin destinatarios seleccionados</span>
          )}
          {value.roles.map(role => (
            <span
              key={role}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 font-medium"
            >
              {formatRoleLabel(role)}
              <button
                type="button"
                onClick={() => toggleRole(role)}
                className="hover:text-brand-800 dark:hover:text-brand-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </span>
          ))}
          {value.users.map(user => (
            <span
              key={user.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium"
            >
              {user.name}
              <button
                type="button"
                onClick={() => removeUser(user.id)}
                className="hover:text-blue-800 dark:hover:text-blue-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowUserPicker(!showUserPicker)}
          className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex-shrink-0"
        >
          {showUserPicker ? 'Cerrar' : 'Editar'}
        </button>
      </div>

      {/* Role selectors */}
      {showUserPicker && (
        <div className="space-y-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
          {/* By role */}
          <div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">Por grupo / rol</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => toggleRole('all')}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  value.roles.includes('all')
                    ? 'bg-brand-500 text-white border-brand-500'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-brand-300'
                }`}
              >
                Todos
              </button>
              {dbRoles.map(r => (
                <button
                  key={r.name}
                  type="button"
                  onClick={() => toggleRole(r.name)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    value.roles.includes(r.name)
                      ? 'bg-brand-500 text-white border-brand-500'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-brand-300'
                  }`}
                >
                  {formatRoleLabel(r.name)}
                </button>
              ))}
            </div>
          </div>

          {/* By individual */}
          <div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">Usuarios específicos</p>
            <div className="relative mb-2">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre o email..."
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-xs focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-gray-400"
              />
            </div>
            {loadingUsers ? (
              <p className="text-xs text-gray-400">Cargando usuarios...</p>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-1">
                {filteredUsers.length === 0 ? (
                  <p className="text-xs text-gray-400">No se encontraron usuarios.</p>
                ) : (
                  filteredUsers.slice(0, 30).map(u => {
                    const selected = value.users.some(us => us.id === u.id);
                    return (
                      <label
                        key={u.id}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-xs transition-colors ${
                          selected
                            ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleUser(u)}
                          className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                        />
                        <span className="flex-1 min-w-0 truncate">{u.name}</span>
                        <span className="text-gray-400 truncate max-w-[140px]">{u.email}</span>
                      </label>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipientSelector;

import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/skeleton";
import type { Role } from "@/features/roles/services/rolesService";
import type { Permission } from "@/features/permissions/services/permissionService";

interface RoleWithPermissions extends Role {
  permissionIds: number[];
}

interface RoleListTableProps {
  roles: RoleWithPermissions[];
  allPermissions: Permission[];
  loading: boolean;
  onEdit: (role: RoleWithPermissions) => void;
}

export default function RoleListTable({
  roles,
  allPermissions,
  loading,
  onEdit,
}: RoleListTableProps) {
  return (
    <>
      {loading ? (
        <TableSkeleton columns={5} rows={2} />
      ) : (
        <div className="hidden md:block overflow-hidden rounded-lg border border-border-default dark:border-border-dark">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader>Rol</TableCell>
                <TableCell isHeader>Descripción</TableCell>
                <TableCell isHeader>Usuarios</TableCell>
                <TableCell isHeader>Permisos</TableCell>
                <TableCell isHeader>Acciones</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow
                  key={role.id}
                  className="hover:bg-bg-subtle/50 dark:hover:bg-bg-dark-subtle/50"
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-primary dark:text-text-emphasis">
                        {role.name}
                      </span>
                      {role.isSystem && (
                        <Badge
                          color="primary"
                          variant="light"
                          shape="rounded"
                          className="text-[10px]"
                        >
                          Sistema
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-text-secondary dark:text-text-tertiary text-sm">
                    {role.description}
                  </TableCell>
                  <TableCell className="text-text-secondary dark:text-text-tertiary text-sm tabular-nums">
                    {role.userCount}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary dark:text-text-emphasis tabular-nums">
                        {role.permissionIds.length}
                      </span>
                      <span className="text-xs text-text-tertiary">
                        de {allPermissions.length}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(role)}
                    >
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="md:hidden flex flex-col gap-4">
        {roles.map((role) => (
          <div
            key={role.id}
            className="bg-bg-surface dark:bg-bg-dark-surface rounded-lg border border-border-default dark:border-border-dark p-4"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <span className="font-medium text-text-primary dark:text-text-emphasis">
                  {role.name}
                </span>
                {role.isSystem && (
                  <Badge
                    color="primary"
                    variant="light"
                    shape="rounded"
                    className="text-[10px]"
                  >
                    Sistema
                  </Badge>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(role)}
              >
                Editar
              </Button>
            </div>
            <p className="text-xs text-text-secondary dark:text-text-tertiary mb-2">
              {role.description}
            </p>
            <p className="text-xs text-text-tertiary">
              {role.permissionIds.length} permisos &bull; {role.userCount} usuarios
            </p>
          </div>
        ))}
      </div>
    </>
  );
}

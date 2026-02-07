import { Users as UsersIcon, Plus, Pencil, Shield, ShieldCheck, ShieldAlert, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useUsers } from "@/hooks/useApi";

const roleIcons: Record<string, React.ElementType> = {
  SUPER_ADMIN: ShieldAlert,
  ADMIN: ShieldCheck,
  MANAGER: Shield,
  SUPPORT: Headphones,
};

const roleBadgeColor: Record<string, string> = {
  SUPER_ADMIN: "status-badge-danger",
  ADMIN: "status-badge-warning",
  MANAGER: "status-badge-info",
  SUPPORT: "status-badge-neutral",
};

const AdminUsers = () => {
  const { data: usersData } = useUsers();
  const adminUsers = (usersData ?? []) as any[];
  return (
    <div>
      <PageHeader
        title="User Management"
        breadcrumbs={[
          { label: "Admin", to: "/admin" },
          { label: "Users" },
        ]}
        actions={
          <Button variant="accent" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add User
          </Button>
        }
      />

      <div className="grid gap-6 sm:grid-cols-4 mb-8">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Users</p>
          <p className="text-2xl font-bold text-foreground mt-1">{adminUsers.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {adminUsers.filter((u) => u.status === "ACTIVE").length}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Admins</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {adminUsers.filter((u) => u.role === "ADMIN" || u.role === "SUPER_ADMIN").length}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Departments</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {new Set(adminUsers.map((u) => u.department)).size}
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <table className="erp-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
              <th>Last Login</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {adminUsers.map((user) => {
              const RoleIcon = roleIcons[user.role] || Shield;
              return (
                <tr key={user.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10">
                        <span className="text-xs font-bold text-accent">
                          {user.name.split(" ").map((n) => n[0]).join("")}
                        </span>
                      </div>
                      <span className="font-medium text-foreground">{user.name}</span>
                    </div>
                  </td>
                  <td className="text-muted-foreground text-sm">{user.email}</td>
                  <td>
                    <span className={`status-badge ${roleBadgeColor[user.role]}`}>
                      <RoleIcon className="h-3 w-3 mr-1 inline" />
                      {user.role.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="text-muted-foreground">{user.department}</td>
                  <td className="text-muted-foreground text-sm">{user.lastLogin}</td>
                  <td>
                    <StatusBadge status={user.status} />
                  </td>
                  <td className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsers;

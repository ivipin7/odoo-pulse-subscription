import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TopNav } from "@/components/layout/TopNav";
import { PageHeader } from "@/components/shared/PageHeader";
import { useProfile, useUpdateProfile } from "@/hooks/useApi";
import { MapPin } from "lucide-react";

const Profile = () => {
  const { data: profileData } = useProfile();
  const updateProfile = useUpdateProfile();
  const userProfile = profileData as any;

  if (!userProfile) return null;

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6">
        <PageHeader
          title="My Profile"
          breadcrumbs={[{ label: "Home", to: "/" }, { label: "Profile" }]}
        />

        <div className="space-y-6">
          {/* Personal details */}
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="font-semibold text-foreground mb-4">Personal Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name" className="text-sm">Full Name</Label>
                <Input id="name" defaultValue={userProfile.name} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm">Email</Label>
                <Input id="email" defaultValue={userProfile.email} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="phone" className="text-sm">Phone</Label>
                <Input id="phone" defaultValue={userProfile.phone} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="company" className="text-sm">Company</Label>
                <Input id="company" defaultValue={userProfile.company} className="mt-1" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="gst" className="text-sm">GST Number</Label>
                <Input id="gst" defaultValue={userProfile.gst} className="mt-1 font-mono" />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="accent">Save Changes</Button>
            </div>
          </div>

          {/* Addresses */}
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="font-semibold text-foreground mb-4">Addresses</h3>
            <div className="space-y-3">
              {userProfile.addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="flex items-start gap-3 rounded-lg border p-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 shrink-0">
                    <MapPin className="h-5 w-5 text-accent" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{addr.label}</span>
                      {addr.isDefault && (
                        <span className="status-badge status-badge-success">Default</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {addr.line1}, {addr.line2}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {addr.city}, {addr.state} – {addr.pin}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">Edit</Button>
                </div>
              ))}
            </div>
            <button className="mt-3 w-full rounded-lg border border-dashed p-3 text-sm text-muted-foreground hover:text-foreground hover:border-accent transition-colors text-center">
              + Add New Address
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

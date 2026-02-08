import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserCircle, Mail, Phone, MapPin, Shield, ArrowLeft } from "lucide-react";

export default function ShopProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="max-w-lg mx-auto py-12 text-center">
        <UserCircle className="h-16 w-16 mx-auto text-muted-foreground/40 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Not logged in</h2>
        <p className="text-muted-foreground mb-6">Please log in to view your profile.</p>
        <Link to="/login"><Button>Login</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/shop" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Shop
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold">
              {user.first_name?.[0]}{user.last_name?.[0]}
            </div>
            <div>
              <CardTitle className="text-xl">{user.first_name} {user.last_name}</CardTitle>
              <Badge variant="outline" className="mt-1">{user.role}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{user.email}</span>
          </div>
          {user.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{user.phone}</span>
            </div>
          )}
          {user.address && (
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{user.address}</span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span>Member since {new Date(user.created_at).toLocaleDateString()}</span>
          </div>

          <div className="pt-4 border-t flex gap-3">
            <Link to="/dashboard"><Button variant="outline">Go to Dashboard</Button></Link>
            <Link to="/subscriptions"><Button variant="outline">My Subscriptions</Button></Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

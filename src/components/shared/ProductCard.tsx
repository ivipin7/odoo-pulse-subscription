import { Link } from "react-router-dom";
import { Layers, Users, UserCheck, Calculator, Package, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Product } from "@/data/mockData";

const categoryIcons: Record<string, React.ElementType> = {
  ERP: Layers,
  CRM: Users,
  HR: UserCheck,
  Accounting: Calculator,
  Inventory: Package,
  Marketing: Megaphone,
};

const categoryColors: Record<string, string> = {
  ERP: "from-primary to-primary/80",
  CRM: "from-accent to-accent/80",
  HR: "from-emerald-600 to-emerald-500",
  Accounting: "from-amber-600 to-amber-500",
  Inventory: "from-violet-600 to-violet-500",
  Marketing: "from-rose-600 to-rose-500",
};

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const Icon = categoryIcons[product.category] || Layers;
  const gradient = categoryColors[product.category] || "from-primary to-primary/80";

  return (
    <div className="group rounded-lg border bg-card shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className={`bg-gradient-to-br ${gradient} p-8 flex items-center justify-center`}>
        <Icon className="h-12 w-12 text-white/90" />
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {product.category}
          </span>
        </div>
        <h3 className="font-semibold text-foreground text-lg leading-tight">{product.name}</h3>
        <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{product.description}</p>
        <div className="mt-4 flex items-end justify-between">
          <div>
            <span className="text-2xl font-bold text-foreground">₹{product.price.toLocaleString()}</span>
            <span className="text-sm text-muted-foreground"> / {product.period}</span>
          </div>
          <Button variant="accent" size="sm" asChild>
            <Link to={`/shop/${product.id}`}>View</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export interface CartItem {
  product_id: string;
  product_name: string;
  product_type: string;
  variant_id?: string;
  variant_label?: string;
  plan_id?: string;
  plan_name?: string;
  plan_billing_period?: string;
  unit_price: number;          // base + variant extra + plan price
  quantity: number;
  monthly_equivalent: number;  // price normalised to monthly for display
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (product_id: string, variant_id?: string, plan_id?: string) => void;
  updateQuantity: (product_id: string, quantity: number, variant_id?: string, plan_id?: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function cartKey(item: { product_id: string; variant_id?: string; plan_id?: string }) {
  return `${item.product_id}|${item.variant_id || ""}|${item.plan_id || ""}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("cart");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);

  const addItem = (newItem: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    setItems((prev) => {
      const key = cartKey(newItem);
      const existing = prev.find((i) => cartKey(i) === key);
      if (existing) {
        return prev.map((i) =>
          cartKey(i) === key ? { ...i, quantity: i.quantity + (newItem.quantity || 1) } : i
        );
      }
      return [...prev, { ...newItem, quantity: newItem.quantity || 1 }];
    });
  };

  const removeItem = (product_id: string, variant_id?: string, plan_id?: string) => {
    const key = cartKey({ product_id, variant_id, plan_id });
    setItems((prev) => prev.filter((i) => cartKey(i) !== key));
  };

  const updateQuantity = (product_id: string, quantity: number, variant_id?: string, plan_id?: string) => {
    if (quantity < 1) return removeItem(product_id, variant_id, plan_id);
    const key = cartKey({ product_id, variant_id, plan_id });
    setItems((prev) => prev.map((i) => (cartKey(i) === key ? { ...i, quantity } : i)));
  };

  const clearCart = () => setItems([]);

  return (
    <CartContext.Provider value={{ items, totalItems, totalPrice, addItem, removeItem, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

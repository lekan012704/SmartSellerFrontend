export type OrderStatus = "new" | "processing" | "in_transit" | "delivered" | "cancelled";
export type DeliveryMethod = "manual" | "logistics";

export interface OrderItem {
  id: string;
  productName: string;
  description: string;
  price: number;
  quantity: number;
  packageLength: number;
  packageWidth: number;
  packageHeight: number;
  categoryId: number;
  weight: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  whatsAppNumber: string;
  deliveryAddress: string;
  orderItems: OrderItem[];
  deliveryFee: number;
  deliveryMethod: DeliveryMethod;
  status: OrderStatus;
  date: string;
  total: number;
}

export const statusConfig: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  new: { label: "New", color: "text-info", bg: "bg-info/10" },
  processing: { label: "Processing", color: "text-warning", bg: "bg-warning/10" },
  in_transit: { label: "In Transit", color: "text-accent", bg: "bg-accent/10" },
  delivered: { label: "Delivered", color: "text-success", bg: "bg-success/10" },
  cancelled: { label: "Cancelled", color: "text-destructive", bg: "bg-destructive/10" },
};

export const deliveryMethodConfig: Record<DeliveryMethod, { label: string; description: string }> = {
  manual: { label: "Manual Delivery", description: "Handle delivery yourself or use a personal courier" },
  logistics: { label: "Global Logistics", description: "Ship via logistics partners (DHL, FedEx, UPS, etc.)" },
};

let nextId = 11;
export const generateOrderId = () => `ORD-${String(nextId++).padStart(3, "0")}`;

export const initialOrders: Order[] = [
  {
    id: "ORD-001", customerName: "Alice Johnson", customerEmail: "alice@example.com", whatsAppNumber: "+1234567890",
    deliveryAddress: "123 Main St", deliveryFee: 5.00, deliveryMethod: "logistics", status: "new", date: "2026-04-15",
    total: 84.98,
    orderItems: [{ id: "i1", productName: "Wireless Earbuds", description: "Bluetooth 5.3 earbuds", price: 39.99, quantity: 2, packageLength: 12, packageWidth: 10, packageHeight: 10, categoryId: 1, weight: 0.3 }],
  },
  {
    id: "ORD-002", customerName: "Bob Smith", customerEmail: "bob@example.com", whatsAppNumber: "+1987654321",
    deliveryAddress: "456 Oak Ave", deliveryFee: 3.00, deliveryMethod: "manual", status: "processing", date: "2026-04-14",
    total: 27.99,
    orderItems: [{ id: "i2", productName: "Phone Case", description: "Silicone protective case", price: 24.99, quantity: 1, packageLength: 15, packageWidth: 8, packageHeight: 2, categoryId: 2, weight: 0.1 }],
  },
  {
    id: "ORD-003", customerName: "Carol Davis", customerEmail: "carol@example.com", whatsAppNumber: "+1122334455",
    deliveryAddress: "789 Pine Rd", deliveryFee: 4.00, deliveryMethod: "logistics", status: "in_transit", date: "2026-04-13",
    total: 39.97,
    orderItems: [{ id: "i3", productName: "USB-C Cable", description: "Fast charging cable 2m", price: 11.99, quantity: 3, packageLength: 20, packageWidth: 5, packageHeight: 3, categoryId: 3, weight: 0.2 }],
  },
  {
    id: "ORD-004", customerName: "Dan Wilson", customerEmail: "dan@example.com", whatsAppNumber: "+1555666777",
    deliveryAddress: "321 Elm St", deliveryFee: 0, deliveryMethod: "manual", status: "delivered", date: "2026-04-12",
    total: 19.98,
    orderItems: [{ id: "i4", productName: "Screen Protector", description: "Tempered glass", price: 9.99, quantity: 2, packageLength: 16, packageWidth: 8, packageHeight: 1, categoryId: 2, weight: 0.05 }],
  },
  {
    id: "ORD-005", customerName: "Eve Martinez", customerEmail: "eve@example.com", whatsAppNumber: "+1444333222",
    deliveryAddress: "654 Birch Ln", deliveryFee: 7.00, deliveryMethod: "logistics", status: "delivered", date: "2026-04-11",
    total: 56.99,
    orderItems: [{ id: "i5", productName: "Laptop Stand", description: "Adjustable aluminum stand", price: 49.99, quantity: 1, packageLength: 30, packageWidth: 25, packageHeight: 8, categoryId: 4, weight: 1.5 }],
  },
  {
    id: "ORD-006", customerName: "Frank Lee", customerEmail: "frank@example.com", whatsAppNumber: "+1666777888",
    deliveryAddress: "987 Cedar Dr", deliveryFee: 3.50, deliveryMethod: "manual", status: "new", date: "2026-04-15",
    total: 63.46,
    orderItems: [{ id: "i6", productName: "Mouse Pad", description: "XL gaming mousepad", price: 14.99, quantity: 4, packageLength: 40, packageWidth: 30, packageHeight: 2, categoryId: 5, weight: 0.4 }],
  },
  {
    id: "ORD-007", customerName: "Grace Kim", customerEmail: "grace@example.com", whatsAppNumber: "+1888999000",
    deliveryAddress: "147 Spruce Way", deliveryFee: 6.00, deliveryMethod: "logistics", status: "processing", date: "2026-04-14",
    total: 95.99,
    orderItems: [{ id: "i7", productName: "Webcam HD", description: "1080p USB webcam", price: 89.99, quantity: 1, packageLength: 12, packageWidth: 10, packageHeight: 10, categoryId: 1, weight: 0.3 }],
  },
  {
    id: "ORD-008", customerName: "Alice Johnson", customerEmail: "alice@example.com", whatsAppNumber: "+1234567890",
    deliveryAddress: "123 Main St", deliveryFee: 5.00, deliveryMethod: "logistics", status: "in_transit", date: "2026-04-13",
    total: 134.99,
    orderItems: [{ id: "i8", productName: "Keyboard", description: "Mechanical RGB keyboard", price: 129.99, quantity: 1, packageLength: 45, packageWidth: 15, packageHeight: 5, categoryId: 1, weight: 1.2 }],
  },
  {
    id: "ORD-009", customerName: "Ivy Chen", customerEmail: "ivy@example.com", whatsAppNumber: "+1333444555",
    deliveryAddress: "369 Walnut Pl", deliveryFee: 4.00, deliveryMethod: "manual", status: "cancelled", date: "2026-04-10",
    total: 73.98,
    orderItems: [{ id: "i9", productName: "Monitor Light", description: "LED screen light bar", price: 34.99, quantity: 2, packageLength: 50, packageWidth: 8, packageHeight: 6, categoryId: 4, weight: 0.8 }],
  },
  {
    id: "ORD-010", customerName: "Jack Taylor", customerEmail: "jack@example.com", whatsAppNumber: "+1222111000",
    deliveryAddress: "741 Ash Blvd", deliveryFee: 2.50, deliveryMethod: "manual", status: "new", date: "2026-04-15",
    total: 37.49,
    orderItems: [{ id: "i10", productName: "Desk Organizer", description: "Bamboo desk organizer", price: 34.99, quantity: 1, packageLength: 25, packageWidth: 15, packageHeight: 12, categoryId: 5, weight: 0.6 }],
  },
];

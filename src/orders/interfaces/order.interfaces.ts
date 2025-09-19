export interface OrderDetail {
  id: number;
  quantity: number;
  unitPrice: number;
  product: {
    id: number;
    name: string;
    price: number;
  };
}

export interface Order {
  id: number;
  userId: number;
  orderDate: Date;
  status: string;
  total: number;
  orderDetails: OrderDetail[];
  user: {
    id: number;
    name: string;
    email: string;
  };
  dolarValue: number; // Agregar el valor del dólar
}
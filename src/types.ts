export interface Product {
  id: string;
  CATEGORIA: string;
  PRODUCTO: string;
  CARACTERISTICAS: string;
  PRECIO: number;
  TALLE: string;
  STOCK: number;
  IMG: string;
  IMG2: string;
  IMG3: string;
  OFERTA?: number; // Porcentaje de descuento (0, 10, 20, etc.)
}

export interface AppSettings {
  shippingPrice: number;
  whatsappNumber: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface SaleSummary {
  totalSold: number;
  topProducts: { name: string; count: number }[];
}

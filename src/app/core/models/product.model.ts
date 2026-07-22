export type ProductSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL';

export interface ProductImage {
  id: number;
  imageUrl: string;
  primary: boolean;
  displayOrder: number;
}

export interface ProductVariant {
  id: number;
  size: ProductSize;
  fitType: string;
  stock: number;
  skuSuffix: string;
}

export interface ProductVariantRequest {
  size: ProductSize;
  fitType?: string;
  stock: number;
  skuSuffix?: string;
}

export interface ProductSummary {
  id: number;
  name: string;
  price: number;
  discountPercentage: number;
  finalPrice: number;
  brand: string;
  trending: boolean;
  codEnabled: boolean;
  codAdvanceAmount: number;
  shippingCharge: number;
  stock: number;
  averageRating: number;
  primaryImageUrl: string | null;
  categoryName: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  discountPercentage: number;
  finalPrice: number;
  stock: number;
  sku: string;
  brand: string;
  trending: boolean;
  active: boolean;
  codEnabled: boolean;
  codAdvanceAmount: number;
  shippingCharge: number;
  averageRating: number;
  categoryId: number;
  categoryName: string;
  categorySizeGuide: string | null;
  businessUserId: number;
  businessName: string;
  images: ProductImage[];
  videos?: string[];
  batWeight?: string;
  bladeType?: string;
  handleGrip?: string;
  sweetSpot?: string;
  willowGrade?: string;
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductRequest {
  name: string;
  description?: string;
  price: number;
  discountPercentage?: number;
  stock: number;
  sku?: string;
  brand?: string;
  trending?: boolean;
  active?: boolean;
  categoryId: number;
  codEnabled?: boolean;
  codAdvanceAmount?: number;
  shippingCharge?: number;
  imageUrls?: string[];
  videoUrls?: string[];
  variants?: ProductVariantRequest[];
  batWeight?: string;
  bladeType?: string;
  handleGrip?: string;
  sweetSpot?: string;
  willowGrade?: string;
}

export interface ProductSearchParams {
  categoryId?: number;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  keyword?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
}

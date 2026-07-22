export interface Review {
  id: number;
  userId: number;
  userName: string;
  productId: number;
  rating: number;
  comment: string;
  imageUrl?: string;
  createdAt: string;
}

export interface ReviewRequest {
  rating: number;
  comment?: string;
  imageUrl?: string;
}

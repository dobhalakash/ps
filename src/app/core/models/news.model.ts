export interface News {
  id: number;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishDate: string;
  category: string;
  active: boolean;
}

export interface NewsRequest {
  title: string;
  description?: string;
  thumbnailUrl?: string;
  publishDate?: string;
  category?: string;
  active?: boolean;
}

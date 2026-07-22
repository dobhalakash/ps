export type SportsCategory =
  | 'CRICKET'
  | 'FOOTBALL'
  | 'BASKETBALL'
  | 'CUSTOM_TEAM'
  | 'SCHOOL_COLLEGE'
  | 'CORPORATE'
  | 'TRAINING'
  | 'OTHER';

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  sizeGuide: string | null;
  categoryType: SportsCategory;
  active: boolean;
}

export interface CategoryRequest {
  name: string;
  description?: string;
  imageUrl?: string;
  sizeGuide?: string;
  categoryType?: SportsCategory;
  active?: boolean;
}

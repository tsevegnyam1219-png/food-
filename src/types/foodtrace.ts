export type Lang = 'mn' | 'en';

export type VerificationStatus = 'verified' | 'reference_standard' | 'needs_verification';

export interface AppUser {
  id: number;
  uid: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
}

export interface Category {
  id: number;
  slug: string;
  nameMn: string;
  nameEn: string;
  descriptionMn: string;
  descriptionEn: string;
  sortOrder: number;
}

export interface SourceItem {
  id: number;
  title: string;
  organization: string;
  year: string;
  url: string;
  citationType: string;
  notesMn: string;
  notesEn: string;
  verified: boolean;
}

export interface FlowchartNode {
  id: string;
  labelMn: string;
  labelEn: string;
  nextIds?: string[];
  branchNoteMn?: string;
  branchNoteEn?: string;
}

export interface Product {
  id: number;
  slug: string;
  categoryId: number;
  nameMn: string;
  nameEn: string;
  imageUrl: string;
  imageSource: string;
  overviewMn: string;
  overviewEn: string;
  mainRawMaterialMn: string;
  mainRawMaterialEn: string;
  rawMaterialPropertiesMn: string;
  rawMaterialPropertiesEn: string;
  processSequenceSummaryMn: string;
  processSequenceSummaryEn: string;
  flowchartJson: FlowchartNode[];
  equipmentSummaryMn: string;
  equipmentSummaryEn: string;
  processingRegimeMn: string;
  processingRegimeEn: string;
  qualityControlMn: string;
  qualityControlEn: string;
  foodSafetyMn: string;
  foodSafetyEn: string;
  packagingMn: string;
  packagingEn: string;
  storageMn: string;
  storageEn: string;
  transportMn: string;
  transportEn: string;
  verificationStatus: VerificationStatus;
  disclaimerMn: string;
  disclaimerEn: string;
  status: 'published' | 'draft';
  updatedAt: string;
}

export interface ProductionStage {
  id: number;
  productId: number;
  stepOrder: number;
  titleMn: string;
  titleEn: string;
  descriptionMn: string;
  descriptionEn: string;
  imageUrl: string;
  imageSource: string;
  videoUrl: string;
  videoSource: string;
  equipmentId: number | null;
  equipmentNameMn: string;
  equipmentNameEn: string;
  temperature: string;
  duration: string;
  operatingPrincipleMn: string;
  operatingPrincipleEn: string;
  qualityControlIndicatorMn: string;
  qualityControlIndicatorEn: string;
  sourceId: number | null;
  verificationStatus: VerificationStatus;
}

export interface EquipmentItem {
  id: number;
  slug: string;
  nameMn: string;
  nameEn: string;
  imageUrl: string;
  imageSource: string;
  purposeMn: string;
  purposeEn: string;
  structureMn: string;
  structureEn: string;
  mainPartsMn: string;
  mainPartsEn: string;
  operatingPrincipleMn: string;
  operatingPrincipleEn: string;
  technicalSpecsMn: string;
  technicalSpecsEn: string;
  sectorMn: string;
  sectorEn: string;
  relatedStageMn: string;
  relatedStageEn: string;
  sourceId: number | null;
  verificationStatus: VerificationStatus;
  status: string;
}

export interface FactoryItem {
  id: number;
  slug: string;
  nameMn: string;
  nameEn: string;
  locationMn: string;
  locationEn: string;
  descriptionMn: string;
  descriptionEn: string;
  productsProducedMn: string;
  productsProducedEn: string;
  imageUrl: string;
  imageSource: string;
  videoUrl: string;
  videoSource: string;
  technologiesUsedMn: string;
  technologiesUsedEn: string;
  equipmentUsedMn: string;
  equipmentUsedEn: string;
  officialWebsite: string;
  sourceId: number | null;
  verificationStatus: VerificationStatus;
  status: string;
}

export interface ArticleItem {
  id: number;
  slug: string;
  topic: string;
  titleMn: string;
  titleEn: string;
  summaryMn: string;
  summaryEn: string;
  contentMn: string;
  contentEn: string;
  imageUrl: string;
  imageSource: string;
  author: string;
  publishedDate: string;
  sourceId: number | null;
  verificationStatus: VerificationStatus;
  status: 'published' | 'draft';
}

export interface MediaItem {
  id: number;
  title: string;
  mediaType: 'image' | 'video';
  url: string;
  sourceAttribution: string;
  entityType: string;
  entityId: number | null;
  createdAt: string;
}

export interface CommentItem {
  id: number;
  content: string;
  createdAt: string;
  userId: number;
  authorName: string;
  authorEmail: string;
}

export interface FavoriteState {
  id: number;
  userId: number;
  productId: number;
  isFavorite: boolean;
  isStudied: boolean;
  notes: string;
  updatedAt: string;
}

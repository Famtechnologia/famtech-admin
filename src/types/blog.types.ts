// --- Image Structure (Matches your Crop/Livestock records) ---
export interface RecordImage {
    url: string;
    fileId: string;
    _id: string; 
}

// --- Author Structure ---
export interface Author {
    _id: string;
    firstName: string;
    lastName: string;
}

// --- Main Blog Interface ---
export interface Blog {
    _id: string;
    title: string;
    content: string;
    niche: 'Agro' | 'Agrotech' | 'Poultry' | 'Livestock' | 'Crop Science' | 'Sustainability' | 'Farm Machinery' | 'Fishery' | 'Agribusiness' | 'Food Security';
    author: Author | string;
    minuteRead: number;
    views: number;
    isTrending: boolean;
    blogImages: RecordImage[]; // Use this instead of 'images' to fix the error
    imageUrl?: string; 
    createdAt: string;
    updatedAt: string;
    __v: number;
}

// --- Form Data for UI State ---
export interface BlogFormData {
    title: string;
    content: string;
    niche: string;
    isTrending?: boolean;
}

// --- Missing API Response Types ---

/**
 * Standard response for messages (delete, etc)
 */
export interface ApiResponse {
    message: string;
}

/**
 * Response returned when adding/updating blog images
 */
export interface BlogImageResponse extends ApiResponse {
    blog: Blog;
}

/**
 * Response structure for paginated lists
 */
export interface BlogListResponse {
    blogs: Blog[];
    totalPages: number;
    currentPage: number;
}
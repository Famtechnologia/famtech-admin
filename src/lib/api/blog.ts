import apiClient from "../../lib/api/apiClient";
import { Blog, BlogFormData, ApiResponse, BlogImageResponse } from "@/types/blog.types";

// --- BLOG API FUNCTIONS ---

export const getAllBlogs = async (params?: Record<string, any>): Promise<{ blogs: Blog[], totalPages: number }> => {
    const response = await apiClient.get(`/api/v1/blogs`, { params });
    return response.data;
};

export const getBlogById = async (id: string): Promise<Blog> => {
    const response = await apiClient.get(`/api/v1/blogs/${id}`);
    return response.data;
};

export const createBlog = async (formData: FormData) => {
  const response = await apiClient.post("/api/v1/blogs/create", formData, {
    headers: {
      "Content-Type": "multipart/form-data", // Most Axios versions set this automatically for FormData
    },
  });
  return response.data;
};

export const updateBlog = async (id: string, data: FormData | Partial<BlogFormData>): Promise<Blog> => {
    const response = await apiClient.put(`/api/v1/blogs/edit/${id}`, data);
    return response.data;
};

export const deleteBlog = async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/api/v1/blogs/delete/${id}`);
    return response.data;
};

export const incrementBlogViews = async (id: string): Promise<{ views: number }> => {
    const response = await apiClient.patch(`/api/v1/blogs/${id}/view`);
    return response.data;
};

// Add images to blog
export const addBlogImages = async (id: string, formData: FormData): Promise<BlogImageResponse> => {
    const response = await apiClient.post(`/api/v1/blogs/${id}/images`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
};

// Delete specific images from blog
export const deleteBlogImages = async (id: string, fileIds: string[]): Promise<ApiResponse> => {
    const response = await apiClient.delete(`/api/v1/blogs/${id}/images`, {
        data: { fileIds }
    });
    return response.data;
};
import apiClient from "../../lib/api/apiClient";
import { Blog, BlogFormData } from "@/types/blog.types";

export const getAllBlogs = async (params?: Record<string, any>): Promise<Blog[]> => {
  const response = await apiClient.get("/api/blogs", { params });
  return response.data;
};

export const getBlogById = async (id: string): Promise<Blog> => {
  const response = await apiClient.get(`/api/blogs/${id}`);
  return response.data;
};


export const createBlog = async (data: BlogFormData): Promise<Blog> => {
  const response = await apiClient.post("/api/blogs/create", data);
  return response.data;
};


export const updateBlog = async (id: string, data: Partial<BlogFormData>): Promise<Blog> => {
  const response = await apiClient.put(`/api/blogs/edit/${id}`, data);
  return response.data;
};


export const deleteBlog = async (id: string): Promise<{ message: string }> => {
  const response = await apiClient.delete(`/api/blogs/delete/${id}`);
  return response.data;
};
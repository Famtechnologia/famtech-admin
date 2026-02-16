import { Blog } from "@/types/blog.types"; 

export const getBlogCover = (blog: Blog): string => {
  if (blog.blogImages && blog.blogImages.length > 0) {
    return blog.blogImages[0].url;
  }
  //default
  return 'https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&q=80&w=1000'; 
};
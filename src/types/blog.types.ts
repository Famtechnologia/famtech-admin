export interface Blog {
  _id: string;           
  title: string;           
  content: string;         
  imageUrl?: string;      
  niche: string;          
  author: string;        
  minuteRead: number;      
  views: string[];    
  createdAt: string;    
  __v?: number;            
}


export interface BlogFormData {
  title: string;
  content: string;
  niche: string;
  author: string;
  imageUrl?: string;
 
}
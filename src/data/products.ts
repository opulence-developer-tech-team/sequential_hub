import { Category } from '@/types'
import { ClothingCategory } from '@/types/enum'


export const categories: Category[] = [
  {
    id: '1',
    name: 'Packet Shirts',
    slug: ClothingCategory.Packet_Shirt,
    description: 'Premium packet shirts with elegant designs and comfortable fit',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=600&fit=crop&crop=center',
    subcategories: [
      { id: '1-1', name: 'Formal Packet Shirts', slug: 'formal-packet-shirts', categoryId: '1' },
      { id: '1-2', name: 'Casual Packet Shirts', slug: 'casual-packet-shirts', categoryId: '1' },
      { id: '1-3', name: 'Designer Packet Shirts', slug: 'designer-packet-shirts', categoryId: '1' },
    ]
  },
  {
    id: '2',
    name: 'Vintage Shirts',
    slug: ClothingCategory.Vintage_Shirt,
    description: 'Classic vintage shirts with timeless appeal and retro styling',
    image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=800&h=600&fit=crop&crop=center',
    subcategories: [
      { id: '2-1', name: 'Retro Vintage Shirts', slug: 'retro-vintage-shirts', categoryId: '2' },
      { id: '2-2', name: 'Classic Vintage Shirts', slug: 'classic-vintage-shirts', categoryId: '2' },
      { id: '2-3', name: 'Antique Vintage Shirts', slug: 'antique-vintage-shirts', categoryId: '2' },
    ]
  },
  {
    id: '3',
    name: 'Plain Pants',
    slug: ClothingCategory.Plain_Pant,
    description: 'Versatile plain pants perfect for any occasion',
    image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&h=600&fit=crop&crop=center',
    subcategories: [
      { id: '3-1', name: 'Formal Plain Pants', slug: 'formal-plain-pants', categoryId: '3' },
      { id: '3-2', name: 'Casual Plain Pants', slug: 'casual-plain-pants', categoryId: '3' },
      { id: '3-3', name: 'Office Plain Pants', slug: 'office-plain-pants', categoryId: '3' },
    ]
  },
  {
    id: '4',
    name: 'Joggers',
    slug: ClothingCategory.Jogger,
    description: 'Comfortable and stylish joggers for active lifestyle',
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&h=600&fit=crop&crop=center',
    subcategories: [
      { id: '4-1', name: 'Athletic Joggers', slug: 'athletic-joggers', categoryId: '4' },
      { id: '4-2', name: 'Casual Joggers', slug: 'casual-joggers', categoryId: '4' },
      { id: '4-3', name: 'Designer Joggers', slug: 'designer-joggers', categoryId: '4' },
    ]
  },
  {
    id: '5',
    name: 'Senators',
    slug: ClothingCategory.Senator,
    description: 'Elegant senator outfits for formal and ceremonial occasions',
    image: 'https://images.pexels.com/photos/7671032/pexels-photo-7671032.jpeg?auto=compress&cs=tinysrgb&w=800',
    subcategories: [
      { id: '5-1', name: 'Formal Senators', slug: 'formal-senators', categoryId: '5' },
      { id: '5-2', name: 'Ceremonial Senators', slug: 'ceremonial-senators', categoryId: '5' },
      { id: '5-3', name: 'Traditional Senators', slug: 'traditional-senators', categoryId: '5' },
    ]
  },
  {
    id: '6',
    name: 'Kaftan',
    slug: ClothingCategory.Kaftan,
    description: 'Traditional kaftan garments with modern elegance',
    image: 'https://images.pexels.com/photos/7671169/pexels-photo-7671169.jpeg?auto=compress&cs=tinysrgb&w=800',
    subcategories: [
      { id: '6-1', name: 'Traditional Kaftan', slug: 'traditional-kaftan', categoryId: '6' },
      { id: '6-2', name: 'Modern Kaftan', slug: 'modern-kaftan', categoryId: '6' },
      { id: '6-3', name: 'Designer Kaftan', slug: 'designer-kaftan', categoryId: '6' },
    ]
  },
  {
    id: '7',
    name: 'Agbada',
    slug: ClothingCategory.Agbada,
    description: 'Traditional Agbada outfits for special occasions and ceremonies',
    image: 'https://via.placeholder.com/800x600/E5E7EB/6B7280?text=Agbada',
    subcategories: [
      { id: '7-1', name: 'Traditional Agbada', slug: 'traditional-agbada', categoryId: '7' },
      { id: '7-2', name: 'Ceremonial Agbada', slug: 'ceremonial-agbada', categoryId: '7' },
      { id: '7-3', name: 'Designer Agbada', slug: 'designer-agbada', categoryId: '7' },
    ]
  }
]

export const products = []




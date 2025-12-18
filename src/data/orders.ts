import { Order } from '@/types'
import { products } from './products'

export const orders: Order[] = [
  {
    id: 'ORD-001',
    items: [
      {
        id: '1',
        product: products[0],
        quantity: 2,
        selectedSize: 'L',
        selectedColor: 'White',
        customMeasurements: {
          chest: 44,
          waist: 38,
          length: 32,
          sleeve: 26
        }
      }
    ],
    total: 179.98,
    status: 'processing',
    customerInfo: {
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '+1 (555) 123-4567',
      address: {
        street: '123 Main Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA'
      }
    },
    orderDate: new Date('2024-01-15'),
    estimatedDelivery: new Date('2024-01-22')
  },
  {
    id: 'ORD-002',
    items: [
      {
        id: '2',
        product: products[1],
        quantity: 1,
        selectedSize: 'M',
        selectedColor: 'Black',
        customMeasurements: {
          chest: 36,
          waist: 28,
          hips: 38,
          length: 45
        }
      }
    ],
    total: 199.99,
    status: 'shipped',
    customerInfo: {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '+1 (555) 234-5678',
      address: {
        street: '456 Oak Avenue',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90210',
        country: 'USA'
      }
    },
    orderDate: new Date('2024-01-12'),
    estimatedDelivery: new Date('2024-01-19'),
    trackingNumber: 'TRK123456789'
  },
  {
    id: 'ORD-003',
    items: [
      {
        id: '3',
        product: products[2],
        quantity: 1,
        selectedSize: 'L',
        selectedColor: 'Navy',
        customMeasurements: {
          chest: 44,
          waist: 38,
          length: 32,
          sleeve: 26
        }
      },
      {
        id: '4',
        product: products[6],
        quantity: 1,
        selectedSize: '34',
        selectedColor: 'Navy',
        customMeasurements: {
          waist: 34,
          inseam: 32,
          length: 42
        }
      }
    ],
    total: 469.98,
    status: 'delivered',
    customerInfo: {
      name: 'Michael Brown',
      email: 'michael.brown@email.com',
      phone: '+1 (555) 345-6789',
      address: {
        street: '789 Pine Street',
        city: 'Chicago',
        state: 'IL',
        zipCode: '60601',
        country: 'USA'
      }
    },
    orderDate: new Date('2024-01-08'),
    estimatedDelivery: new Date('2024-01-15')
  },
  {
    id: 'ORD-004',
    items: [
      {
        id: '5',
        product: products[4],
        quantity: 1,
        selectedSize: 'S',
        selectedColor: 'White',
        customMeasurements: {
          chest: 34,
          waist: 30,
          length: 28,
          sleeve: 22
        }
      }
    ],
    total: 129.99,
    status: 'pending',
    customerInfo: {
      name: 'Emily Davis',
      email: 'emily.davis@email.com',
      phone: '+1 (555) 456-7890',
      address: {
        street: '321 Elm Street',
        city: 'Houston',
        state: 'TX',
        zipCode: '77001',
        country: 'USA'
      }
    },
    orderDate: new Date('2024-01-18')
  },
  {
    id: 'ORD-005',
    items: [
      {
        id: '6',
        product: products[5],
        quantity: 1,
        selectedSize: 'One Size',
        selectedColor: 'Brown'
      }
    ],
    total: 159.99,
    status: 'cancelled',
    customerInfo: {
      name: 'David Wilson',
      email: 'david.wilson@email.com',
      phone: '+1 (555) 567-8901',
      address: {
        street: '654 Maple Drive',
        city: 'Phoenix',
        state: 'AZ',
        zipCode: '85001',
        country: 'USA'
      }
    },
    orderDate: new Date('2024-01-10')
  }
]


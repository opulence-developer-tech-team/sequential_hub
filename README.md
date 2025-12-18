# Sequential Hub - E-commerce Web Application

A modern, responsive e-commerce web application built with Next.js, TypeScript, and Tailwind CSS. Sequential Hub specializes in custom-tailored clothing with measurement submission capabilities and a comprehensive admin panel.

## Features

### Customer Features
- **Homepage**: Hero section, featured products, category browsing, and key features
- **Product Catalog**: Advanced filtering, sorting, and search functionality
- **Product Details**: Detailed product information with custom measurement forms
- **Shopping Cart**: Add/remove items, quantity management, and custom measurements
- **Checkout Process**: Multi-step checkout with shipping and payment information
- **Responsive Design**: Fully responsive across all devices

### Admin Features
- **Dashboard**: Overview of orders, revenue, and key metrics
- **Product Management**: Add, edit, delete, and manage product inventory
- **Order Management**: View, update order status, and track fulfillment
- **Customer Management**: View customer information and order history
- **Analytics**: Sales reports and performance metrics

### Key Capabilities
- **Custom Measurements**: Customers can submit custom measurements for tailored clothing
- **Product Filtering**: Filter by category, price, size, color, and availability
- **Order Tracking**: Real-time order status updates
- **Responsive UI**: Mobile-first design with excellent UX
- **Modern Stack**: Built with latest technologies and best practices

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React hooks and context
- **Image Handling**: Next.js Image component
- **Responsive Design**: Mobile-first approach

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sequential-hub
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin panel pages
│   ├── products/          # Product pages
│   ├── cart/              # Shopping cart
│   ├── checkout/          # Checkout process
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   ├── Header.tsx         # Main navigation
│   ├── Footer.tsx         # Site footer
│   ├── ProductCard.tsx    # Product display card
│   ├── ProductFilters.tsx # Product filtering
│   ├── MeasurementForm.tsx # Custom measurements
│   └── AdminSidebar.tsx   # Admin navigation
├── data/                  # Mock data
│   ├── products.ts        # Product data
│   └── orders.ts          # Order data
├── lib/                   # Utility functions
│   └── utils.ts           # Helper functions
└── types/                 # TypeScript type definitions
    └── index.ts           # Type definitions
```

## Key Components

### Product Management
- Product listing with advanced filtering
- Product detail pages with measurement forms
- Shopping cart with custom measurements
- Checkout process with order confirmation

### Admin Panel
- Dashboard with key metrics and recent orders
- Product management with CRUD operations
- Order management with status updates
- Customer information and order history

### Custom Measurements
- Measurement form for tailored clothing
- Support for chest, waist, hips, length, sleeve, and inseam
- Integration with product selection and cart

## Responsive Design

The application is built with a mobile-first approach and includes:
- Responsive navigation with mobile menu
- Adaptive product grids
- Mobile-optimized forms
- Touch-friendly interactions
- Optimized images and loading

## Customization

### Styling
- Tailwind CSS configuration in `tailwind.config.ts`
- Custom color palette and design tokens
- Responsive breakpoints and utilities

### Data
- Mock data in `src/data/` directory
- Easy to replace with real API endpoints
- TypeScript interfaces for type safety

## Future Enhancements

- User authentication and accounts
- Payment gateway integration
- Real-time inventory management
- Advanced analytics and reporting
- Multi-language support
- SEO optimization
- Performance monitoring

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please contact the development team or create an issue in the repository.
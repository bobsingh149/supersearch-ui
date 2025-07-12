import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import EcommerceHome from './EcommerceHome';
import ProductDetail from './ProductDetail';
import EcommerceOrders from './EcommerceOrders';
import RateLimitError from './RateLimitError';

const EcommerceDemoIndex: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<EcommerceHome />} />
      <Route path="/:productId" element={<ProductDetail />} />
      <Route path="/orders" element={<EcommerceOrders />} />
      <Route path="/rate-limit" element={<RateLimitError />} />
      <Route path="*" element={<Navigate to="/demo_site_ecommerce" replace />} />
    </Routes>
  );
};

export default EcommerceDemoIndex; 
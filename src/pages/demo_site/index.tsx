import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DemoEcommerce from './DemoEcommerce';
import ProductDetail from './ProductDetail';
import DemoOrders from './DemoOrders';

const DemoSiteIndex: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<DemoEcommerce />} />
      <Route path="/:productId" element={<ProductDetail />} />
      <Route path="/orders" element={<DemoOrders />} />
      <Route path="*" element={<Navigate to="/demo_site" replace />} />
    </Routes>
  );
};

export default DemoSiteIndex; 
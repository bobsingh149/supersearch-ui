import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DemoEcommerce from './DemoEcommerce';
import ProductDetail from './ProductDetail';
import DemoOrders from './DemoOrders';

const DemoSiteIndex: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<DemoEcommerce />} />
      <Route path="/orders" element={<DemoOrders />} />
      <Route path="/:productId" element={<ProductDetail />} />
      <Route path="*" element={<DemoEcommerce />} />
    </Routes>
  );
};

export default DemoSiteIndex; 
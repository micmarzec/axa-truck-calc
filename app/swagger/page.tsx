'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

// SwaggerUI react component can be heavy and uses browser APIs, so dynamic import with ssr: false is usually more robust in Next.js app router.
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function SwaggerPage() {
  return (
    <div className="container mx-auto p-4 bg-white min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 px-4">API Documentation</h1>
      <SwaggerUI url="/api/swagger" />
    </div>
  );
}

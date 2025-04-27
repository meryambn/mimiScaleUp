import React from 'react';
import { Button } from '@/components/ui/button';

const TestButton: React.FC = () => {
  return (
    <div className="p-4 flex flex-col gap-4">
      <h2 className="text-xl font-bold">Button Test</h2>

      <div className="flex gap-2">
        <button style={{ background: 'linear-gradient(135deg, #e43e32 0%, #0c4c80 100%)', color: 'white', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', border: 'none' }}>Default Button</button>
        <button style={{ backgroundColor: '#ef4444', color: 'white', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', border: 'none' }}>Destructive Button</button>
        <button style={{ border: '1px solid #e43e32', color: '#e43e32', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'white' }}>Outline Button</button>
        <button style={{ backgroundColor: '#f3f4f6', color: '#111827', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', border: 'none' }}>Secondary Button</button>
        <button style={{ color: '#e43e32', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'transparent', border: 'none' }}>Ghost Button</button>
        <button style={{ color: '#e43e32', padding: '8px 16px', cursor: 'pointer', textDecoration: 'underline', backgroundColor: 'transparent', border: 'none' }}>Link Button</button>
      </div>

      <div className="flex gap-2">
        <button style={{ background: 'linear-gradient(135deg, #e43e32 0%, #0c4c80 100%)', color: 'white', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', border: 'none' }}>Gradient Button</button>
        <button style={{ backgroundColor: '#e43e32', color: 'white', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', border: 'none' }}>Red Button</button>
        <button style={{ backgroundColor: '#0c4c80', color: 'white', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', border: 'none' }}>Blue Button</button>
        <button style={{ backgroundColor: '#2d2d34', color: 'white', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', border: 'none' }}>Dark Button</button>
      </div>

      <div className="flex gap-2">
        <button style={{ background: 'linear-gradient(135deg, #e43e32 0%, #0c4c80 100%)', color: 'white', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>HTML Gradient Button</button>
        <button style={{ backgroundColor: '#e43e32', color: 'white', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>HTML Red Button</button>
      </div>
    </div>
  );
};

export default TestButton;

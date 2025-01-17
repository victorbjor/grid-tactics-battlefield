import React from 'react';

const Legend = () => {
  const items = [
    { label: 'Ground', className: 'cell-ground' },
    { label: 'Hill', className: 'cell-hill' },
    { label: 'Forest', className: 'cell-forest' },
    { label: 'Water', className: 'cell-water' },
    { label: 'Command Base', className: 'cell-base' },
    { label: 'Friendly Unit', className: 'unit unit-friendly' },
    { label: 'Enemy Unit', className: 'unit unit-enemy' },
  ];

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="font-bold mb-3">Legend</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className={`w-6 h-6 ${item.className}`} />
            <span className="text-sm">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Legend;
import React from 'react';

interface InfoBoxProps {
  messages: string[];
}

const InfoBox: React.FC<InfoBoxProps> = ({ messages }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md h-48 overflow-y-auto">
      <h3 className="font-bold mb-3">Information</h3>
      <div className="space-y-2">
        {messages.map((message, index) => (
          <p key={index} className="text-sm animate-fade-in">
            {message}
          </p>
        ))}
      </div>
    </div>
  );
};

export default InfoBox;
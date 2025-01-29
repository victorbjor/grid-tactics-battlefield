import React from 'react';

interface InfoBoxProps {
  messages: string[];
}

const InfoBox: React.FC<InfoBoxProps> = ({ messages }) => {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
      window.scrollTo({
        top: window.scrollY,
        behavior: 'instant'
      });
    }
  }, [messages]);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md h-96 relative">
      <h3 className="font-bold mb-3 sticky top-0 bg-white z-10 border-b pb-2">Field history</h3>
      <div className="space-y-2 overflow-y-auto h-[calc(100%-3rem)]">
        {messages.map((message, index) => (
          <p key={index} className="text-sm animate-fade-in">
            {message}
          </p>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default InfoBox;
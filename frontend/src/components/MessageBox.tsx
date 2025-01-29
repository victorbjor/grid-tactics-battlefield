import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MessageBoxProps {
  onSendMessage: (message: string) => void;
}

const MessageBox: React.FC<MessageBoxProps> = ({ onSendMessage }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="bg-white p-4 rounded-lg shadow-md flex flex-col h-full w-full max-w-[48rem] mx-auto col-span-2"
    >
      <h3 className="font-bold mb-3">Order Lieutenant</h3>
  
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Enter command..."
        className="w-full flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />
  
      <Button 
        type="submit" 
        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Send Order
      </Button>
    </form>
  );
};

export default MessageBox;
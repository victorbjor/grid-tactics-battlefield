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
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="font-bold mb-3">Send Command</h3>
      <div className="flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter command..."
          className="flex-1"
        />
        <Button type="submit">Send</Button>
      </div>
    </form>
  );
};

export default MessageBox;
// Inbox.js
import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { FaArrowLeft, FaUser } from 'react-icons/fa';

export default function Inbox() {
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !token) {
      navigate("/login");
      return;
    }

    const fetchConversations = async () => {
      try {
        setLoading(true);
        console.log("Fetching conversations for user:", user._id);
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/chat/conversations/${user._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log("Conversations response:", res.data);

        // Fetch last message for each conversation
        const convosWithLastMsg = await Promise.all(
          res.data.map(async (conv) => {
            try {
              const msgsRes = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/chat/messages/${conv._id}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              console.log(`Messages for conversation ${conv._id}:`, msgsRes.data);
              const messages = msgsRes.data;
              const lastMsg = messages[messages.length - 1] || null;

              return {
                ...conv,
                lastMsg,
              };
            } catch (err) {
              console.error(`Failed to fetch messages for conversation ${conv._id}:`, err);
              return { ...conv, lastMsg: null };
            }
          })
        );

        setConversations(convosWithLastMsg);
      } catch (err) {
        console.error('❌ Error fetching conversations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [user, token, navigate]);

  const handleChatClick = (conversation) => {
    const recipient = conversation.participants?.find(p => p._id !== user._id);
    if (!recipient) return;

    const lastMsgText = conversation.lastMsg?.text || '';

    console.log("Navigating to chat with state:", {
      chatData: {
        recipientId: recipient._id,
        sender: recipient.name || recipient.email?.split('@')[0] || "Hôte",
        avatar: recipient.name?.[0]?.toUpperCase() || recipient.email?.[0]?.toUpperCase() || "A",
      },
      conversationId: conversation._id,
      guestMessage: lastMsgText.includes('Booking request for property') ? lastMsgText.split(': ').slice(1).join(': ') : lastMsgText,
    });

    navigate(`/chat/${recipient._id}`, {
      state: {
        chatData: {
          recipientId: recipient._id,
          sender: recipient.name || recipient.email?.split('@')[0] || "Hôte",
          avatar: recipient.name?.[0]?.toUpperCase() || recipient.email?.[0]?.toUpperCase() || "A",
        },
        conversationId: conversation._id,
        guestMessage: lastMsgText.includes('Booking request for property') ? lastMsgText.split(': ').slice(1).join(': ') : lastMsgText,
      },
    });
  };

  const formatTime = (date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours = (now - messageDate) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const truncateMessage = (text, maxLength = 50) => {
    if (!text) return 'No messages yet.';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <div className="sticky top-0 z-50 bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              {/* Left: Back Button */}
              <button
                onClick={() => navigate('/')}
                className="flex items-center justify-center w-10 h-10 text-green-700 hover:text-green-800 hover:bg-green-50 rounded-full transition-colors"
              >
                <FaArrowLeft className="w-5 h-5" />
              </button>

              {/* Center: Atlasia Branding */}
              <div className="text-center">
                <div className="font-bold text-green-700 text-2xl">
                  Atlasia
                </div>
              </div>

              {/* Right: Account Icon */}
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center justify-center w-10 h-10 bg-green-600 text-white hover:bg-green-700 rounded-full transition-colors font-semibold text-sm"
              >
                {user?.fullName ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="sticky top-0 z-50 bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Left: Back Button */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center w-10 h-10 text-green-700 hover:text-green-800 hover:bg-green-50 rounded-full transition-colors"
            >
              <FaArrowLeft className="w-5 h-5" />
            </button>

            {/* Center: Atlasia Branding */}
            <div className="text-center">
              <div className="font-bold text-green-700 text-2xl">
                Atlasia
              </div>
            </div>

            {/* Right: Account Icon */}
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center justify-center w-10 h-10 bg-green-600 text-white hover:bg-green-700 rounded-full transition-colors font-semibold text-sm"
            >
              {user?.fullName ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Section Title */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Messages</h1>
          <p className="text-gray-600">
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Conversations List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-100">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
            <p className="text-gray-500 text-center text-sm">
              Start a conversation to see your messages here
            </p>
          </div>
        ) : (
          conversations.map((conv) => {
            const recipient = conv.participants?.find(p => p._id !== user._id);
            if (!recipient) return null;

            const lastMsg = conv.lastMsg;
            const isFromCurrentUser = lastMsg?.sender?._id === user._id || lastMsg?.sender === user._id;

            return (
              <div
                key={conv._id}
                onClick={() => handleChatClick(conv)}
                className="flex items-center space-x-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-200 active:bg-gray-100"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white flex items-center justify-center font-semibold text-lg shadow-sm">
                    {recipient.name?.[0]?.toUpperCase() || recipient.email?.[0]?.toUpperCase() || "A"}
                  </div>
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full"></div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-gray-900 text-base truncate">
                      {recipient.name || recipient.email?.split('@')[0] || "Hôte"}
                    </h3>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                      {lastMsg ? formatTime(lastMsg.createdAt) : ''}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    {lastMsg && isFromCurrentUser && (
                      <span className="text-gray-400 text-xs">You:</span>
                    )}
                    <p className="text-sm text-gray-600 truncate">
                      {truncateMessage(lastMsg?.text)}
                    </p>
                  </div>
                </div>

                {/* Unread indicator */}
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            );
          })
        )}
        </div>
      </div>

      {/* Bottom spacing for mobile navigation */}
      <div className="h-20"></div>
    </div>
  );
}
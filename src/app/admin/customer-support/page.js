"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Send,
  Search,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  Circle,
  PanelLeft,
  X,
  RefreshCw,
} from "lucide-react";
import { getProfile } from "@/lib/api/profile";
import { useSocket } from "@/lib/hooks/useSocket";

export default function ChatPage() {
  const { user } = useAuth();
  const { reply, customers } = useSocket();
  const [customerList, setCustomerList] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  /** @type {[{id: number, text: string, sender: string, timestamp: string, status: string}[], Function]} */
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const [error, setError] = useState(null);

  const fetchChats = useCallback(async () => {
    try {
      if (!selectedCustomer) {
        setMessages([]);
        return;
      }

      const selectedUserId = selectedCustomer.userId || selectedCustomer._id;
      const currentChats = (customers || []).filter(
        (customer) => customer.userId === selectedUserId,
      );

      const customerMessages = currentChats.map((chat, index) => ({
        id: `${chat.userId}-${chat.timestamp}-${index}`,
        text: chat.message,
        sender: "customer",
        userId: chat.userId,
        timestamp: chat.timestamp,
        status: "read",
      }));

      setMessages((prev) => {
        const agentMessagesForSelectedUser = prev.filter(
          (message) =>
            message.sender === "agent" && message.userId === selectedUserId,
        );

        return [...customerMessages, ...agentMessagesForSelectedUser].sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        );
      });
    } catch (error) {
      console.error("Error fetching chats:", error);
      setError("Failed to load chats. Please try again later.");
    }
  }, [customers, selectedCustomer]);

  const fetchCustomersList = useCallback(async () => {
    try {
      setIsLoading(true);

      const uniqueCustomers = Array.from(
        new Map(
          (customers || []).map((customer) => [customer.userId, customer]),
        ).values(),
      );

      const customerArray = await Promise.all(
        uniqueCustomers.map(async (customer) => {
          try {
            const res = await getProfile(customer.userId);
            const profile = res?.data?.farmProfile || {};

            return {
              ...customer,
              ...profile,
              _id: profile?._id || customer.userId,
            };
          } catch (profileError) {
            console.error(
              `Failed to load profile for user ${customer.userId}:`,
              profileError,
            );
            setError(`Failed to load profile for user ${customer.userId}.`); // Set error for individual profile load failure
            return {
              ...customer,
              _id: customer.userId,
            };
          }
        }),
      );

      setCustomerList(customerArray);
    } catch (error) {
      console.error("Error fetching customers:", error);
      setError("Failed to load customers. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [customers]);

  useEffect(() => {
    fetchCustomersList();
  }, [fetchCustomersList]);

  useEffect(() => {
    if (selectedCustomer) {
      fetchChats();
    }
  }, [selectedCustomer, fetchChats]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!messageInput.trim() || !selectedCustomer) return;

    const newMessage = {
      id: `agent-${selectedCustomer.userId || selectedCustomer._id}-${Date.now()}`,
      text: messageInput,
      sender: "agent",
      userId: selectedCustomer.userId || selectedCustomer._id,
      timestamp: new Date().toISOString(),
      status: "sent",
    };

    const selectedUserId = selectedCustomer.userId || selectedCustomer._id;
    reply(messageInput, selectedUserId, user.firstName || "Agent");
    setMessages((prev) => [...prev, newMessage]);
    setMessageInput("");
  };

  const handleEndChat = () => {
    // Implement end chat logic here (e.g., notify backend, clear messages, etc.)
    setMessages([]);
    setSelectedCustomer(null);
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setIsSidebarOpen(false);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 86400000) {
      // Less than 24 hours
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diff < 604800000) {
      // Less than 7 days
      return date.toLocaleDateString("en-US", { weekday: "short" });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const getInitials = (email) => {
    return email?.slice(0, 2).toUpperCase() || "??";
  };

  const filteredCustomers = customerList.filter(
    (customer) =>
      customer.farmName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.state?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="h-full flex bg-gray-50 relative">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Customers List Sidebar */}
      <div
        className={`w-80 bg-white border-r border-gray-200 flex flex-col fixed md:relative inset-y-0 left-0 z-50 transform transition-transform duration-300 md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Search Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3 md:hidden">
            <h2 className="text-lg font-semibold text-gray-900">Customers</h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
            />
          </div>
        </div>

        {/* Customers List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw
                className="ml-2 text-green-600 animate-spin"
                size={24}
              />
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No customers found
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredCustomers.map((customer) => (
                <button
                  key={customer._id}
                  onClick={() => handleCustomerSelect(customer)}
                  className={`w-full p-4 hover:bg-gray-50 transition-colors text-left ${
                    selectedCustomer?._id === customer._id ? "bg-green-50" : ""
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold">
                        {getInitials(customer.farmName)}
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {customer.farmName}
                        </h3>
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {formatTime(customer.timestamp)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600 truncate capitalize">
                            {customer?.location?.state || "No State"},{" "}
                            {customer?.location?.country || "No Country"}
                          </p>
                          <span className="flex-shrink-0 ml-2 px-2 py-0.5 bg-green-600 text-white text-xs font-medium rounded-full">
                            online
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col h-[calc(100vh-118px)] overflow-hidden">
        {selectedCustomer ? (
          <>
            {/* Chat Header */}
            <div className="h-16 bg-white border-b border-gray-200 px-4 md:px-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Mobile PanelLeft Button */}
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors md:hidden"
                >
                  <PanelLeft className="h-6 w-6 text-gray-600" />
                </button>

                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold">
                    {getInitials(selectedCustomer.farmName)}
                  </div>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">
                    {selectedCustomer.farmName}
                  </h2>
                  <span className="flex-shrink-0 px-2 py-0.5 bg-green-600 text-white text-xs font-medium rounded-full">
                    online
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Phone className="h-5 w-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Video className="h-5 w-5 text-gray-600" />
                </button> */}
                <button
                  className="py-2 px-4 hover:bg-red-700 rounded-lg transition-colors bg-red-600 text-white"
                  onClick={handleEndChat}
                >
                  End Session
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "customer" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-md px-4 py-2 rounded-2xl ${
                      message.sender === "customer"
                        ? "bg-green-600 text-white"
                        : "bg-white text-gray-900 border border-gray-200"
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.sender === "customer"
                          ? "text-green-100"
                          : "text-gray-500"
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 px-6 py-4">
              <form
                onSubmit={handleSendMessage}
                className="flex items-center space-x-3"
              >
                {/* for sending files */}
                {/* <button
                  type="button"
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Paperclip className="h-5 w-5 text-gray-600" />
                </button> */}

                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 pr-12"
                  />
                  {/* for emojis */}
                  {/* <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <Smile className="h-5 w-5 text-gray-600" />
                  </button> */}
                </div>

                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="p-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col bg-gray-50">
            {/* Mobile Header with Menu Button */}
            <div className="h-16 bg-white border-b border-gray-200 px-4 flex items-center md:hidden">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <PanelLeft className="h-6 w-6 text-gray-600" />
              </button>
              <h2 className="ml-3 text-lg font-semibold text-gray-900">Chat</h2>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Select a conversation
                </h3>
                <p className="text-gray-600">
                  Choose a staff member from the list to start chatting
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { Ticket } from "../types/ticket";
import { AlertTriangle, Clock, CheckCircle, XCircle, MessageSquare } from "lucide-react";

interface TicketsTabProps {
  tickets: Ticket[];
  onUpdateStatus: (ticketId: string, status: string, priority?: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export default function TicketsTab({ tickets, onUpdateStatus, searchTerm }: TicketsTabProps) {
  // Filter tickets based on search
  const filteredTickets = tickets.filter(t =>
    t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "dispute":
        return <AlertTriangle className="w-4 h-4" />;
      case "refund":
        return <XCircle className="w-4 h-4" />;
      case "complaint":
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const openTickets = filteredTickets.filter(t => t.status === "open");
  const inProgressTickets = filteredTickets.filter(t => t.status === "in_progress");
  const resolvedTickets = filteredTickets.filter(t => t.status === "resolved" || t.status === "closed");

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Open Tickets</p>
              <p className="text-3xl font-bold text-red-600">{openTickets.length}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-red-600 opacity-80" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">In Progress</p>
              <p className="text-3xl font-bold text-yellow-600">{inProgressTickets.length}</p>
            </div>
            <Clock className="w-10 h-10 text-yellow-600 opacity-80" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Resolved</p>
              <p className="text-3xl font-bold text-green-600">{resolvedTickets.length}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600 opacity-80" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Tickets</p>
              <p className="text-3xl font-bold text-gray-900">{tickets.length}</p>
            </div>
            <MessageSquare className="w-10 h-10 text-gray-600 opacity-80" />
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">All Tickets</h2>

        {filteredTickets.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No tickets found</p>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getTypeIcon(ticket.type)}
                      <h3 className="text-lg font-semibold text-gray-900">{ticket.subject}</h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace("_", " ").toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{ticket.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>From: <span className="font-medium text-gray-700">{ticket.userName}</span> ({ticket.userEmail})</span>
                      <span>•</span>
                      <span>Type: <span className="font-medium text-gray-700">{ticket.type}</span></span>
                      {ticket.bookingId && (
                        <>
                          <span>•</span>
                          <span>Booking: <span className="font-mono text-xs">{ticket.bookingId.substring(0, 8)}...</span></span>
                        </>
                      )}
                      <span>•</span>
                      <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  {ticket.status === "open" && (
                    <button
                      onClick={() => onUpdateStatus(ticket.id, "in_progress")}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
                    >
                      Start Working
                    </button>
                  )}
                  {ticket.status === "in_progress" && (
                    <button
                      onClick={() => onUpdateStatus(ticket.id, "resolved")}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      Mark Resolved
                    </button>
                  )}
                  {(ticket.status === "open" || ticket.status === "in_progress") && (
                    <button
                      onClick={() => onUpdateStatus(ticket.id, "closed")}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                    >
                      Close Ticket
                    </button>
                  )}

                  {/* Priority Controls */}
                  <div className="ml-auto flex gap-2">
                    <select
                      value={ticket.priority}
                      onChange={(e) => onUpdateStatus(ticket.id, ticket.status, e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                {/* Messages Count */}
                {ticket.messages && ticket.messages.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MessageSquare className="w-4 h-4" />
                      <span>{ticket.messages.length} message{ticket.messages.length !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

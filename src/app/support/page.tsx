"use client";

import { useState, useEffect } from "react";
import { db, auth } from "../../lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { AlertTriangle, MessageSquare, Send, Loader2, CheckCircle, X } from "lucide-react";
import { TicketType, TicketPriority, Ticket } from "../../types/ticket";

export default function SupportPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [successModal, setSuccessModal] = useState<{ show: boolean; ticketId: string; priority: TicketPriority } | null>(null);

  // Form state
  const [type, setType] = useState<TicketType>("complaint");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [bookingId, setBookingId] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchMyTickets(currentUser.uid);
      } else {
        router.push("/auth/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const fetchMyTickets = async (userId: string) => {
    try {
      const ticketsRef = collection(db, "tickets");
      const q = query(
        ticketsRef,
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const tickets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Ticket[];
      setMyTickets(tickets);
    } catch (err) {
      console.error("Error fetching tickets:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert("You must be logged in to submit a ticket");
      return;
    }

    if (!subject.trim() || !description.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      const ticketsRef = collection(db, "tickets");
      const docRef = await addDoc(ticketsRef, {
        userId: user.uid,
        userName: user.displayName || user.email || "Anonymous",
        userEmail: user.email || "",
        type,
        subject: subject.trim(),
        description: description.trim(),
        status: "open",
        priority,
        bookingId: bookingId.trim() || null,
        messages: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Show success modal with ticket ID
      setSuccessModal({
        show: true,
        ticketId: docRef.id,
        priority: priority,
      });

      // Reset form
      setSubject("");
      setDescription("");
      setBookingId("");
      setType("complaint");
      setPriority("medium");

      // Refresh tickets
      await fetchMyTickets(user.uid);
    } catch (err) {
      console.error("Error submitting ticket:", err);
      alert("Failed to submit ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-red-100 text-red-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      case "resolved": return "bg-green-100 text-green-800";
      case "closed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getEstimatedResponseTime = (priority: TicketPriority): string => {
    switch (priority) {
      case "urgent":
        return "within 2-4 hours";
      case "high":
        return "within 6-12 hours";
      case "medium":
        return "within 24 hours";
      case "low":
        return "within 48 hours";
      default:
        return "within 24-48 hours";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="inline-block animate-spin h-12 w-12 text-blue-600 mb-4" />
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      {/* Success Modal */}
      {successModal?.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => setSuccessModal(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">Ticket Submitted!</h3>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-2">Your ticket number is:</p>
                <p className="text-2xl font-mono font-bold text-blue-600">
                  #{successModal.ticketId.slice(-8).toUpperCase()}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-1">Estimated Response Time</p>
                <p className="text-lg font-semibold text-gray-900">
                  {getEstimatedResponseTime(successModal.priority)}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Based on {successModal.priority} priority
                </p>
              </div>

              <p className="text-sm text-gray-600 mb-6">
                Our support team will review your ticket and get back to you as soon as possible.
                You&apos;ll receive an email notification when there&apos;s an update.
              </p>

              <button
                onClick={() => setSuccessModal(null)}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Got it, thanks!
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Support Center</h1>
          <p className="text-gray-600">Submit a ticket or view your existing support requests</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Submit New Ticket Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Submit a Ticket</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as TicketType)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="complaint">Complaint</option>
                  <option value="dispute">Dispute</option>
                  <option value="refund">Refund Request</option>
                  <option value="technical">Technical Issue</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority <span className="text-red-500">*</span>
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TicketPriority)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief summary of your issue"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  maxLength={100}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please provide detailed information about your issue"
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  required
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500 mt-1">{description.length}/1000 characters</p>
              </div>

              {/* Booking ID (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Related Booking ID (Optional)
                </label>
                <input
                  type="text"
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                  placeholder="If this is about a specific booking"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Ticket
                  </>
                )}
              </button>
            </form>
          </div>

          {/* My Tickets */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <MessageSquare className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">My Tickets</h2>
            </div>

            {myTickets.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No tickets yet</p>
                <p className="text-sm text-gray-400">Submit a ticket if you need help</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {myTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{ticket.subject}</h3>
                      <div className="flex gap-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace("_", " ").toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{ticket.description}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="font-medium text-gray-700">{ticket.type}</span>
                      <span>•</span>
                      <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                      {ticket.messages && ticket.messages.length > 0 && (
                        <>
                          <span>•</span>
                          <span>{ticket.messages.length} message{ticket.messages.length !== 1 ? "s" : ""}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

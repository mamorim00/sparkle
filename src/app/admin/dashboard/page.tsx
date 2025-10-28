"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../../../lib/firebase";
import { collection, getDocs, getDoc, doc, updateDoc, query, where, orderBy, serverTimestamp } from "firebase/firestore";
import { Calendar, DollarSign, Users, TrendingUp, Star, Search, AlertTriangle } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Ticket } from "../../../types/ticket";
import TicketsTab from "../../../components/TicketsTab";

interface Cleaner {
  id: string;
  username?: string;
  email?: string;
  status: string;
  rating?: number;
  businessId?: string;
  insuranceCertificateUrl?: string;
  otherDocsUrl?: string;
  pricePerHour?: number;
}

interface Booking {
  id: string;
  cleanerId: string;
  cleanerName: string;
  userId: string | null;
  customerName: string;
  customerEmail: string;
  date: string;
  start: string;
  end: string;
  cleaningType: string;
  amount: number;
  status: "confirmed" | "cancelled" | "completed";
  createdAt: string;
  duration: number;
  platformFee?: number;
  cleanerAmount?: number;
}

interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  createdAt?: { seconds: number };
  role?: "customer" | "cleaner" | "admin";
}

export default function AdminDashboard() {
  const [pendingCleaners, setPendingCleaners] = useState<Cleaner[]>([]);
  const [approvedCleaners, setApprovedCleaners] = useState<Cleaner[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "cleaners" | "bookings" | "users" | "tickets">("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch cleaners
      const cleanersRef = collection(db, "cleaners");
      const pendingQuery = query(cleanersRef, where("status", "==", "pending"));
      const pendingSnap = await getDocs(pendingQuery);
      const pendingData = pendingSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Cleaner[];
      setPendingCleaners(pendingData);

      const approvedQuery = query(cleanersRef, where("status", "==", "approved"));
      const approvedSnap = await getDocs(approvedQuery);
      const approvedData = approvedSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Cleaner[];
      setApprovedCleaners(approvedData);

      // Fetch all bookings
      const bookingsRef = collection(db, "bookings");
      const bookingsQuery = query(bookingsRef, orderBy("createdAt", "desc"));
      const bookingsSnap = await getDocs(bookingsQuery);
      const bookingsData = bookingsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Booking[];
      setBookings(bookingsData);

      // Fetch all users
      const usersRef = collection(db, "users");
      const usersSnap = await getDocs(usersRef);
      const usersData = usersSnap.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
      })) as UserData[];
      setUsers(usersData);

      // Fetch all tickets
      const ticketsRef = collection(db, "tickets");
      const ticketsQuery = query(ticketsRef, orderBy("createdAt", "desc"));
      const ticketsSnap = await getDocs(ticketsQuery);
      const ticketsData = ticketsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Ticket[];
      setTickets(ticketsData);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, status: string, priority?: string) => {
    try {
      const ticketRef = doc(db, "tickets", ticketId);
      const updateData: Record<string, string | object | undefined> = {
        status,
        updatedAt: serverTimestamp(),
      };

      if (priority) {
        updateData.priority = priority;
      }

      if (status === "resolved" || status === "closed") {
        updateData.resolvedAt = serverTimestamp();
        updateData.resolvedBy = auth.currentUser?.uid;
      }

      await updateDoc(ticketRef, updateData);
      await fetchAllData();
    } catch (err) {
      console.error("Error updating ticket:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check if user is admin
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.role === "admin") {
            setIsAdmin(true);
            setAuthLoading(false);
            await fetchAllData();
          } else {
            // Not an admin, redirect to home
            router.push("/");
          }
        } else {
          // User document doesn't exist, redirect to home
          router.push("/");
        }
      } else {
        // Not logged in, redirect to login
        router.push("/auth/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const approveCleaner = async (id: string) => {
    try {
      const cleanerRef = doc(db, "cleaners", id);
      await updateDoc(cleanerRef, { status: "approved" });
      await fetchAllData();
    } catch (err) {
      console.error("Error approving cleaner:", err);
    }
  };

  const revertCleaner = async (id: string) => {
    try {
      const cleanerRef = doc(db, "cleaners", id);
      await updateDoc(cleanerRef, { status: "pending" });
      await fetchAllData();
    } catch (err) {
      console.error("Error reverting cleaner:", err);
    }
  };

  // Calculate analytics
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.amount || 0), 0);
  const platformRevenue = bookings.reduce((sum, b) => sum + (b.platformFee || b.amount * 0.15), 0);
  const confirmedBookings = bookings.filter(b => b.status === "confirmed").length;
  const completedBookings = bookings.filter(b => b.status === "completed").length;
  const cancelledBookings = bookings.filter(b => b.status === "cancelled").length;

  // Get this month's data
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const thisMonthBookings = bookings.filter(b => {
    const bookingDate = new Date(b.createdAt);
    return bookingDate.getMonth() === thisMonth && bookingDate.getFullYear() === thisYear;
  });
  const thisMonthRevenue = thisMonthBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

  // Top cleaners by bookings
  const cleanerBookingsCount = bookings.reduce((acc, b) => {
    acc[b.cleanerId] = (acc[b.cleanerId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topCleaners = approvedCleaners
    .map(c => ({
      ...c,
      bookingCount: cleanerBookingsCount[c.id] || 0,
    }))
    .sort((a, b) => b.bookingCount - a.bookingCount)
    .slice(0, 5);

  // Filter bookings based on search
  const filteredBookings = bookings.filter(b =>
    b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.cleanerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.cleaningType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter users based on search
  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.displayName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderCleanerInfo = (cleaner: Cleaner) => (
    <div>
      <p className="font-semibold">{cleaner.username ?? "Unnamed Cleaner"}</p>
      <p className="text-sm text-gray-600">{cleaner.email}</p>

      {cleaner.businessId && (
        <p className="text-sm">Business ID: {cleaner.businessId}</p>
      )}

      {cleaner.insuranceCertificateUrl && (
        <p className="text-sm">
          <a
            href={cleaner.insuranceCertificateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            View Insurance Certificate
          </a>
        </p>
      )}

      {cleaner.otherDocsUrl && (
        <p className="text-sm">
          <a
            href={cleaner.otherDocsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            View Other Documents
          </a>
        </p>
      )}

      {cleaner.rating !== undefined && (
        <p className="text-sm text-gray-600">
          Rating: {cleaner.rating ?? "Not rated yet"}
        </p>
      )}
    </div>
  );

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
          <p className="text-lg mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // If not admin, don't render (will redirect)
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your marketplace</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { id: "overview", label: "Overview", icon: TrendingUp },
              { id: "cleaners", label: "Cleaners", icon: Users },
              { id: "bookings", label: "Bookings", icon: Calendar },
              { id: "users", label: "Users", icon: Users },
              { id: "tickets", label: "Tickets", icon: AlertTriangle, badge: tickets.filter(t => t.status === "open").length },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                  {tab.badge && tab.badge > 0 ? (
                    <span className="ml-1 px-2 py-0.5 text-xs font-bold rounded-full bg-red-500 text-white">
                      {tab.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
                    <p className="text-3xl font-bold text-gray-900">{bookings.length}</p>
                    <p className="text-xs text-gray-500 mt-1">{thisMonthBookings.length} this month</p>
                  </div>
                  <Calendar className="w-12 h-12 text-blue-600 opacity-80" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                    <p className="text-3xl font-bold text-green-600">€{totalRevenue.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-1">€{thisMonthRevenue.toFixed(2)} this month</p>
                  </div>
                  <DollarSign className="w-12 h-12 text-green-600 opacity-80" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Platform Revenue</p>
                    <p className="text-3xl font-bold text-purple-600">€{platformRevenue.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-1">15% commission</p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-purple-600 opacity-80" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Active Cleaners</p>
                    <p className="text-3xl font-bold text-blue-600">{approvedCleaners.length}</p>
                    <p className="text-xs text-gray-500 mt-1">{pendingCleaners.length} pending</p>
                  </div>
                  <Users className="w-12 h-12 text-blue-600 opacity-80" />
                </div>
              </div>
            </div>

            {/* Booking Status Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Confirmed</p>
                <p className="text-2xl font-bold text-blue-600">{confirmedBookings}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedBookings}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">{cancelledBookings}</p>
              </div>
            </div>

            {/* Top Cleaners */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Top Cleaners</h2>
              <div className="space-y-4">
                {topCleaners.length === 0 ? (
                  <p className="text-gray-500">No cleaner data yet</p>
                ) : (
                  topCleaners.map((cleaner, index) => (
                    <div key={cleaner.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{cleaner.username || "Unnamed"}</p>
                          <p className="text-sm text-gray-600">{cleaner.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">{cleaner.bookingCount} bookings</p>
                        {cleaner.rating && (
                          <div className="flex items-center gap-1 text-yellow-500">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="text-sm">{cleaner.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Cleaners Tab */}
        {activeTab === "cleaners" && (
          <div className="space-y-6">
            {/* Pending Cleaners */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Pending Cleaners ({pendingCleaners.length})</h2>
              {pendingCleaners.length === 0 ? (
                <p className="text-gray-500">No pending cleaners to approve.</p>
              ) : (
                <div className="space-y-4">
                  {pendingCleaners.map(cleaner => (
                    <div key={cleaner.id} className="p-4 border border-gray-200 rounded-lg flex justify-between items-center hover:border-blue-300 transition-colors">
                      {renderCleanerInfo(cleaner)}
                      <button
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                        onClick={() => approveCleaner(cleaner.id)}
                      >
                        Approve
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Approved Cleaners */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Approved Cleaners ({approvedCleaners.length})</h2>
              {approvedCleaners.length === 0 ? (
                <p className="text-gray-500">No approved cleaners yet.</p>
              ) : (
                <div className="space-y-4">
                  {approvedCleaners.map(cleaner => (
                    <div key={cleaner.id} className="p-4 border border-gray-200 rounded-lg flex justify-between items-center hover:border-yellow-300 transition-colors">
                      {renderCleanerInfo(cleaner)}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Bookings</p>
                          <p className="text-lg font-bold">{cleanerBookingsCount[cleaner.id] || 0}</p>
                        </div>
                        <button
                          className="bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600 transition-colors font-medium"
                          onClick={() => revertCleaner(cleaner.id)}
                        >
                          Revert
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <div className="space-y-6">
            {/* Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by customer, cleaner, or service type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Bookings List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cleaner</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                          No bookings found
                        </td>
                      </tr>
                    ) : (
                      filteredBookings.map(booking => (
                        <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                            {booking.id.substring(0, 8)}...
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{booking.customerName}</p>
                              <p className="text-xs text-gray-500">{booking.customerEmail}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {booking.cleanerName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {booking.cleaningType}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{booking.date}</div>
                            <div className="text-xs text-gray-500">{booking.start} - {booking.end}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            €{booking.amount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              booking.status === "confirmed" ? "bg-blue-100 text-blue-800" :
                              booking.status === "completed" ? "bg-green-100 text-green-800" :
                              "bg-red-100 text-red-800"
                            }`}>
                              {booking.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-6">
            {/* Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Users Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{users.length}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Customers</p>
                <p className="text-3xl font-bold text-blue-600">
                  {users.filter(u => u.role === "customer" || !u.role).length}
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Cleaners</p>
                <p className="text-3xl font-bold text-green-600">
                  {users.filter(u => u.role === "cleaner").length}
                </p>
              </div>
            </div>

            {/* Users List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Display Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(user => (
                        <tr key={user.uid} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.displayName || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              user.role === "cleaner" ? "bg-green-100 text-green-800" :
                              user.role === "admin" ? "bg-purple-100 text-purple-800" :
                              "bg-blue-100 text-blue-800"
                            }`}>
                              {user.role || "customer"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tickets Tab */}
        {activeTab === "tickets" && (
          <TicketsTab
            tickets={tickets}
            onUpdateStatus={updateTicketStatus}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        )}
      </div>
    </div>
  );
}

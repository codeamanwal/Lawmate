import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Clock, MapPin, CheckCircle2, Star, Loader2, Award, ShieldCheck, CreditCard, AlertCircle } from 'lucide-react';
import axios from 'axios';

const MyBookings = () => {
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [ratingCall, setRatingCall] = useState<any>(null);
  const [starRating, setStarRating] = useState<number>(5);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const location = useLocation();
  const highlightLeadId = location.state?.highlightLeadId;

  const fetchBookings = async () => {
    try {
      // We'll fetch from the leads endpoint which includes booking data
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/leads/my`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      // Filter only active leads (not cancelled)
      const activeBookings = response.data.filter((lead: any) => 
        lead.status !== 'CANCELLED'
      );
      setBookings(activeBookings);
    } catch (error) {
      console.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchBookings();
      // Poll every 5 seconds to show real-time SLA transitions, timeouts, re-assignments, and accepts!
      const interval = setInterval(fetchBookings, 5000);
      return () => clearInterval(interval);
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (bookings.length > 0 && highlightLeadId) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`booking-${highlightLeadId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [bookings, highlightLeadId]);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingCall) return;
    setSubmittingFeedback(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/leads/${ratingCall.id}/feedback`, {
        rating: starRating,
        feedback: feedbackText
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setRatingCall(null);
      setFeedbackText('');
      setStarRating(5);
      fetchBookings();
    } catch (error) {
      console.error('Feedback submit failed', error);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (authLoading || loading) return <div className="flex items-center justify-center min-h-[calc(100vh-76px)]"><div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <div className="mb-8 md:mb-12">
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2">My Bookings</h1>
        <p className="text-gray-500 font-medium text-sm sm:text-base">You have {bookings.length} confirmed legal consultations</p>
      </div>

      {bookings.length === 0 ? (
        <div className="space-y-12">
          <div className="bg-white border border-gray-100 rounded-[32px] p-8 sm:p-16 text-center shadow-lg shadow-gray-200/40">
            <div className="bg-indigo-50 w-20 h-20 rounded-[24px] flex items-center justify-center mx-auto mb-8 shadow-inner">
              <Calendar className="w-10 h-10 text-indigo-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4">No Active Bookings</h2>
            <p className="text-gray-500 mb-10 max-w-sm mx-auto font-medium">Ready to discuss your case? Start a new case intake form to connect with verified legal experts instantly.</p>
            <button 
              onClick={() => navigate('/get-started')}
              className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 cursor-pointer"
            >
              Start New Case
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {bookings.map((booking) => (
            <div 
              key={booking.id} 
              id={`booking-${booking.id}`}
              onClick={() => {
                const isPaid = booking.booking?.payment?.status === 'captured' || booking.booking?.status === 'CONFIRMED' || booking.status === 'ASSIGNED' || booking.status === 'COMPLETED';
                if (!isPaid) {
                  navigate('/payment', { state: { leadId: booking.id } });
                }
              }}
              className={`bg-white rounded-3xl border shadow-xl shadow-gray-200/40 overflow-hidden hover:shadow-2xl hover:border-gray-200/50 transition-all duration-300 ${booking.id === highlightLeadId ? 'ring-4 ring-indigo-600 ring-offset-2 border-indigo-200' : 'border-gray-100'} ${(() => {
                const isPaid = booking.booking?.payment?.status === 'captured' || booking.booking?.status === 'CONFIRMED' || booking.status === 'ASSIGNED' || booking.status === 'COMPLETED';
                return !isPaid ? 'cursor-pointer hover:border-indigo-100 hover:ring-2 hover:ring-indigo-100/50' : '';
              })()}`}
            >
              <div className="p-6 sm:p-8">
                
                {/* SLA Delay Apology Banner */}
                {booking.slaStatus === 'NOT_ATTENDED' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 mb-6 shadow-sm animate-pulse">
                    <span className="text-xl shrink-0">⏳</span>
                    <div>
                      <p className="text-xs font-black text-amber-800 uppercase tracking-widest mb-0.5">SLA Auto Reassignment</p>
                      <p className="text-sm font-bold text-amber-700">Sorry for the delay, we are assigning a new lawyer very soon.</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {(() => {
                        const isPaid = booking.booking?.payment?.status === 'captured' || booking.booking?.status === 'CONFIRMED' || booking.status === 'ASSIGNED' || booking.status === 'COMPLETED';
                        return isPaid ? (
                          <span className="px-2.5 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase rounded-full tracking-wider flex items-center gap-1 shadow-sm shadow-green-100">
                            <CheckCircle2 className="w-3 h-3" /> Booked
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase rounded-full tracking-wider flex items-center gap-1 shadow-sm shadow-amber-100">
                            <AlertCircle className="w-3 h-3" /> Payment Pending
                          </span>
                        );
                      })()}
                      <span className="text-[10px] font-bold text-gray-400">#{booking.id.slice(0, 8)}</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">{booking.category} Consultation</h3>
                  </div>
                  {(() => {
                    const isPaid = booking.booking?.payment?.status === 'captured' || booking.booking?.status === 'CONFIRMED' || booking.status === 'ASSIGNED' || booking.status === 'COMPLETED';
                    return isPaid ? (
                      <div className="text-left sm:text-right shrink-0">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fee Paid</p>
                        <p className="text-2xl font-black text-indigo-600">₹999</p>
                      </div>
                    ) : (
                      <div className="text-left sm:text-right shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/payment', { state: { leadId: booking.id } });
                          }}
                          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all text-xs cursor-pointer"
                        >
                          <CreditCard className="w-4 h-4" /> Pay ₹999
                        </button>
                      </div>
                    );
                  })()}
                </div>

                <div className="grid md:grid-cols-2 gap-6 items-center border-t border-gray-100 pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-gray-600">
                      <div className="w-10 h-10 bg-indigo-50/50 rounded-xl flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Duration</p>
                        <p className="text-sm font-black text-gray-900">60 Min Session</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <div className="w-10 h-10 bg-indigo-50/50 rounded-xl flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Jurisdiction</p>
                        <p className="text-sm font-black text-gray-900">{booking.city}</p>
                      </div>
                    </div>
                  </div>

                  {/* Real-time Matching State & Actions */}
                  <div className="bg-gray-50/70 rounded-2xl p-5 border border-gray-100">
                    {(() => {
                      const isPaid = booking.booking?.payment?.status === 'captured' || booking.booking?.status === 'CONFIRMED' || booking.status === 'ASSIGNED' || booking.status === 'COMPLETED';
                      
                      if (!isPaid) {
                        return (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                              <span className="text-xs font-black text-amber-500 uppercase tracking-widest">Payment Required</span>
                            </div>
                            <p className="text-sm font-bold text-gray-800">Consultation Unconfirmed</p>
                            <p className="text-xs text-gray-500 font-medium">Please complete your payment of ₹999 to start the SLA matching engine and assign an advocate.</p>
                          </div>
                        );
                      }

                      return (
                        <>
                          {booking.status === 'NEW' && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Matching Status</span>
                              </div>
                              {booking.lawyerId ? (
                                <div>
                                  <p className="text-sm font-bold text-gray-800">Connecting with Advocate...</p>
                                  <p className="text-xs text-gray-500 font-medium mt-1">An expert is currently accepting and preparing to call you. Please keep your phone line open.</p>
                                </div>
                              ) : (
                                <div>
                                  <p className="text-sm font-bold text-gray-800">Finding your expert lawyer...</p>
                                  <p className="text-xs text-gray-500 font-medium mt-1">Our SLA engine is checking for online available advocates specializing in {booking.category} law.</p>
                                </div>
                              )}
                            </div>
                          )}

                          {booking.status === 'ASSIGNED' && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Advocate Locked</span>
                              </div>
                              <p className="text-sm font-bold text-gray-800">Advocate Assigned & Calling</p>
                              <p className="text-xs text-gray-500 font-medium">Your request has been successfully accepted! The attorney is dialing your phone number now.</p>
                            </div>
                          )}

                          {booking.status === 'COMPLETED' && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                                <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">Consultation Finished</span>
                              </div>
                              <p className="text-sm font-bold text-gray-800">Session Completed</p>
                              {booking.feedbackRating !== null ? (
                                <div className="bg-white/80 rounded-xl p-3 border border-gray-100">
                                  <div className="flex items-center gap-1 mb-1">
                                    <span className="text-xs font-bold text-gray-400">Your Rating:</span>
                                    <span className="text-amber-500 font-black text-sm">★ {booking.feedbackRating}/5</span>
                                  </div>
                                  {booking.feedbackText && (
                                    <p className="text-xs text-gray-500 italic font-semibold">"{booking.feedbackText}"</p>
                                  )}
                                </div>
                              ) : (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRatingCall(booking);
                                  }}
                                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 transition-all text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-100 flex items-center justify-center gap-1.5"
                                >
                                  <Star className="w-3.5 h-3.5" /> Share Feedback & Rate
                                </button>
                              )}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Developer Sandbox Controls */}
                {(() => {
                  const isPaid = booking.booking?.payment?.status === 'captured' || booking.booking?.status === 'CONFIRMED' || booking.status === 'ASSIGNED' || booking.status === 'COMPLETED';
                  return isPaid && (booking.status === 'NEW' || booking.status === 'ASSIGNED') && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="mt-6 bg-indigo-50/30 border border-indigo-100 rounded-2xl p-4 text-left"
                    >
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        ⚙️ Developer SLA Sandbox
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={async () => {
                            try {
                              await axios.post(`${import.meta.env.VITE_API_URL}/api/leads/${booking.id}/simulate-accept-timeout`);
                              alert('SLA Acceptance Timeout triggered! Lead is reassigned immediately.');
                              fetchBookings();
                            } catch (e) {
                              alert('Simulation failed.');
                            }
                          }}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 transition-all text-white rounded-xl text-xs font-black cursor-pointer shadow-md shadow-indigo-100"
                        >
                          Simulate Scenario B (Acceptance Timeout)
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await axios.post(`${import.meta.env.VITE_API_URL}/api/leads/${booking.id}/simulate-attendance-timeout`);
                              alert('SLA Attendance Timeout triggered! Sorry delay banner activated & reassigning.');
                              fetchBookings();
                            } catch (e) {
                              alert('Simulation failed.');
                            }
                          }}
                          className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 transition-all text-white rounded-xl text-xs font-black cursor-pointer shadow-md shadow-rose-100"
                        >
                          Simulate Scenario C (Attendance Timeout)
                        </button>
                      </div>
                    </div>
                  );
                })()}

              </div>
            </div>
          ))}
        </div>
      )}

      {/* Customer Feedback Modal */}
      {ratingCall && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md p-6 sm:p-8 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-gray-900 mb-2">Rate Your Consultation</h3>
            <p className="text-sm font-medium text-gray-500 mb-6">How was your session for the <span className="text-indigo-600 font-bold">{ratingCall.category}</span> case? Help us maintain premium service standards.</p>

            <form onSubmit={handleFeedbackSubmit} className="space-y-6">
              {/* Star Rating Select */}
              <div className="space-y-2 text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 text-left">Your Rating</p>
                <div className="flex justify-center gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star}
                      type="button"
                      onClick={() => setStarRating(star)}
                      className="p-1 focus:outline-none transition-transform hover:scale-125"
                    >
                      <Star className={`w-8 h-8 ${star <= starRating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback text */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Review Comments (Optional)</label>
                <textarea 
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Share details of your experience with the lawyer..."
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm font-medium text-gray-800 placeholder-gray-400 resize-none transition-all"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setRatingCall(null)}
                  disabled={submittingFeedback}
                  className="flex-1 py-3.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all rounded-xl font-bold text-sm text-gray-600"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submittingFeedback}
                  className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 transition-all text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                >
                  {submittingFeedback ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;

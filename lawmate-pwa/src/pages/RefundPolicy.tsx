import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const RefundPolicy = () => {
  const navigate = useNavigate();
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold mb-8 cursor-pointer transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      
      <div className="prose prose-indigo max-w-none text-gray-600 space-y-5 text-left mb-12">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-4 text-gray-900 leading-tight">
          Refund and Cancellations Policy
        </h1>
        
        <p className="text-sm text-gray-400 italic mb-8 pb-4 border-b border-gray-100">
          Last Updated: 17 Jun 2026
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">
          User cancellation
        </h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-600">
          <li>
            <strong>Scheduled Consultation:</strong> cancellation at least 24 hours before the scheduled start time is eligible for a refund, less any non-recoverable payment-processing charge that was clearly disclosed before purchase, if permitted by law.
          </li>
          <li>
            <strong>On-demand or same-day Consultation:</strong> Once booked, an on-demand or same-day Consultation cannot be cancelled, and the payment made is non-refundable, regardless of whether an Advocate has accepted, prepared for, or commenced the Consultation.
          </li>
          <li>
            <strong>Late cancellation or no-show:</strong> where an Advocate reserved the slot and was available, the fee will be non-refundable, except where required by law or where the Platform states otherwise.
          </li>
        </ul>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">
          Advocate unavailability or verified technical failure
        </h2>
        <p className="text-gray-600">
          If a paid Consultation cannot take place because the assigned Advocate is unavailable, declines the engagement, identifies a conflict before substantive work begins, or a verified Platform failure prevents delivery, you may choose a:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-gray-600">
          <li>Reasonable reschedule,</li>
          <li>Replacement Advocate where appropriate, or</li>
          <li>Refund of the affected amount.</li>
        </ul>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">
          Completed or substantially performed services
        </h2>
        <p className="text-gray-600">
          A completed Consultation or substantially performed fixed-price service is non-refundable merely because you disagree with the advice or do not obtain the desired outcome. This does not limit any mandatory consumer right or remedy for deficiency in service, misrepresentation, fraud, or other liability that cannot lawfully be excluded.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">
          Refund requests and timing
        </h2>
        <p className="text-gray-600 font-medium">
          Send eligible refund requests to <a href="mailto:admin@shugendolabs.com" className="text-indigo-600 hover:underline">admin@shugendolabs.com</a> with your registered contact details, order number, transaction reference, and a brief explanation.
        </p>
        <p className="text-gray-600">
          Approved refunds will be initiated to the original payment method. <strong>Refunds will be processed by Platform within 14 days from the day the refund request has been placed.</strong> Bank or payment-provider settlement time is outside our control and may vary; the Platform will communicate the expected processing period applicable to the transaction.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">
          Duplicate or incorrect charges
        </h2>
        <p className="text-gray-600">
          Notify us promptly of a duplicate or incorrect charge. After verification, we will correct the transaction or initiate the appropriate refund. Nothing in these Terms prevents you from exercising rights available through your payment provider or under law, but we encourage you to contact billing support (<a href="mailto:admin@shugendolabs.com" className="text-indigo-600 hover:underline">admin@shugendolabs.com</a>) first so the issue can be investigated quickly.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">
          Displayed policy controls
        </h2>
        <p className="text-gray-600">
          The cancellation and refund terms displayed at checkout for a particular service form part of these Terms. Where no service-specific rule is displayed, the above default rules apply.
        </p>

        <div className="mt-12 pt-6 border-t border-gray-200 text-sm text-gray-500 space-y-1">
          <p><strong>Contact details:</strong></p>
          <p>Website: <a href="https://www.lawoncall.in" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">www.lawoncall.in</a></p>
          <p>Email: <a href="mailto:admin@shugendolabs.com" className="text-indigo-600 hover:underline">admin@shugendolabs.com</a></p>
          <p>Phone: +91-7292002026</p>
          <p className="text-gray-400 mt-2">LawOnCall is operated by Shugendo Labs Private Limited.</p>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-100 flex justify-start">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>
    </div>
  );
};

export default RefundPolicy;

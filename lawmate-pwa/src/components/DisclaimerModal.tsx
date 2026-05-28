import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const DisclaimerModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasAgreed = localStorage.getItem('lawoncall_disclaimer_agreed');
    if (!hasAgreed) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('lawoncall_disclaimer_agreed', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-6xl w-full shadow-2xl relative border border-gray-100 p-8 md:p-10 flex flex-col my-4">
        
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1 absolute right-6 top-6"
          aria-label="Close disclaimer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 font-serif text-center mb-6 tracking-wide">
          Disclaimer
        </h2>

        {/* Content */}
        <div className="space-y-4 text-xs md:text-sm text-gray-700 leading-relaxed text-justify">
          <p className="font-bold text-gray-900">
            The Bar Council of India prohibits the developing of the website for the advertisement by an Advocate.
          </p>
          
          <p>
            By clicking "I Agree" below, the user acknowledges the following:
          </p>
          
          <p>
            This website is meant only for information purposes and not for any advertisement, personal communication, invitation or inducement of any sort from us or any of our members to solicit or advert any work through this website.
          </p>
          
          <p>
            If you wish to get more information about us or would like to get in touch with <strong>LawOnCall</strong>, you may contact us on our registered email address: <a href="mailto:hello@lawoncall.in" className="text-indigo-600 hover:underline">hello@lawoncall.in</a>.
          </p>
          
          <p>
            As per the rules of the Bar Council of India, Advocates are not permitted to solicit or advertise their work. By clicking on "I Agree" below, the user (you) acknowledges the following:
          </p>

          <ul className="list-disc pl-5 space-y-2">
            <li>
              There exists no any sort of advertisement, personal communication, solicitation, invitation or inducement of any sort whatsoever from us or any of our members and we are not soliciting any work through this website.
            </li>
            <li>
              The user deliberates and wishes to get more information about us for his/her own information, use and voluntary will.
            </li>
            <li>
              The information, if any, that may be provided to the user by us would have been provided upon user's specific request and any such information obtained, retained or downloaded from this website is absolutely the act of volition of the user and any transmission, receipt or use of information or links to this site would not create any lawyer-client relationship.
            </li>
          </ul>

          <p>
            The information provided under this website is only available at your request for informational purposes rigidly, and should not be interpreted as soliciting or advertisement in any manner. We are neither privy nor responsible or liable for any consequence of any action taken by the user relying upon our material/information provided under this website. In case the user has any legal issues, the user must seek independent legal advice.
          </p>

          <p className="text-gray-900">
            Note: Access will only be granted once you confirm you have read and agree to the above.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex justify-center mt-6">
          <button
            onClick={handleClose}
            className="px-10 py-3 bg-[#9b7c53] hover:bg-[#86683d] text-white rounded-full font-medium text-sm transition-colors shadow-md"
          >
            I agree
          </button>
        </div>

      </div>
    </div>
  );
};

export default DisclaimerModal;

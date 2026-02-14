import { useState } from 'react';
import { ShieldCheck, Star, CheckCircle2, AlertCircle, KeyRound, Info } from 'lucide-react';
import { sellers } from '../store/data';

type Step = 'enter' | 'rate' | 'success';

export function VerifyPage() {
  const [step, setStep] = useState<Step>('enter');
  const [code, setCode] = useState(['', '', '', '']);
  const [selectedSeller, setSelectedSeller] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = () => {
    const fullCode = code.join('');
    if (fullCode.length !== 4) {
      setError('Please enter the complete 4-digit code');
      return;
    }
    if (!selectedSeller) {
      setError('Please select a seller');
      return;
    }
    // Simulate verification - accept any 4-digit code for demo
    setStep('rate');
  };

  const handleSubmitRating = () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    setStep('success');
  };

  const resetForm = () => {
    setStep('enter');
    setCode(['', '', '', '']);
    setSelectedSeller('');
    setRating(0);
    setComment('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white sticky top-0 z-40 border-b border-gray-100 px-4 pt-12 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={20} className="text-emerald-500" />
          <h1 className="text-lg font-bold text-gray-900">Verify & Rate</h1>
        </div>
      </div>

      <div className="p-4 animate-fade-in">
        {/* How it works */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-4 mb-4 border border-emerald-100">
          <div className="flex items-center gap-2 mb-2">
            <Info size={16} className="text-emerald-600" />
            <h3 className="text-sm font-bold text-emerald-800">How Verified Ratings Work</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
              <p className="text-xs text-emerald-700">Purchase a product via WhatsApp from any seller</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
              <p className="text-xs text-emerald-700">After receiving your order, ask the seller for a 4-digit voucher code</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
              <p className="text-xs text-emerald-700">Enter the code below to unlock the rating feature and leave a verified review</p>
            </div>
          </div>
        </div>

        {step === 'enter' && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-scale-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <KeyRound size={28} className="text-emerald-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Enter Voucher Code</h2>
              <p className="text-sm text-gray-500 mt-1">Enter the 4-digit code from your seller</p>
            </div>

            {/* Seller Select */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Select Seller</label>
              <select
                value={selectedSeller}
                onChange={(e) => { setSelectedSeller(e.target.value); setError(''); }}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-300 appearance-none"
              >
                <option value="">Choose a seller...</option>
                {sellers.map(seller => (
                  <option key={seller.id} value={seller.id}>
                    {seller.name} - {seller.locationAr}
                  </option>
                ))}
              </select>
            </div>

            {/* Code Input */}
            <div className="flex justify-center gap-3 mb-5">
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-14 h-14 text-center text-2xl font-bold bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
              ))}
            </div>

            {error && (
              <div className="flex items-center gap-1.5 text-red-500 text-xs mb-4 justify-center">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleVerify}
              className="w-full bg-emerald-500 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-600 transition-colors active:scale-[0.98] shadow-lg shadow-emerald-200"
            >
              Verify Code
            </button>

            <p className="text-center text-[11px] text-gray-400 mt-3">
              Demo: Enter any 4 digits (e.g., 1234) to test
            </p>
          </div>
        )}

        {step === 'rate' && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-scale-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Star size={28} className="text-amber-400" />
              </div>
              <div className="flex items-center justify-center gap-1 mb-1">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span className="text-xs text-emerald-600 font-semibold">Code Verified!</span>
              </div>
              <h2 className="text-lg font-bold text-gray-900">Rate Your Experience</h2>
              <p className="text-sm text-gray-500 mt-1">Your review will be marked as verified</p>
            </div>

            {/* Star Rating */}
            <div className="flex justify-center gap-2 mb-5">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => { setRating(star); setError(''); }}
                  className="p-1 transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    size={36}
                    className={`transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-200'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-gray-500 mb-4">
              {rating === 0 && 'Tap a star to rate'}
              {rating === 1 && '😞 Poor'}
              {rating === 2 && '😐 Fair'}
              {rating === 3 && '🙂 Good'}
              {rating === 4 && '😊 Very Good'}
              {rating === 5 && '🤩 Excellent!'}
            </p>

            {/* Comment */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Your Review (Optional)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with this seller..."
                rows={3}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-300 resize-none"
              />
            </div>

            {error && (
              <div className="flex items-center gap-1.5 text-red-500 text-xs mb-4 justify-center">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleSubmitRating}
              className="w-full bg-amber-500 text-white font-bold py-3.5 rounded-xl hover:bg-amber-600 transition-colors active:scale-[0.98] shadow-lg shadow-amber-200"
            >
              Submit Review
            </button>
          </div>
        )}

        {step === 'success' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-scale-in text-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={40} className="text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Thank You! 🎉</h2>
            <p className="text-sm text-gray-500 mb-1">
              Your verified review has been submitted successfully.
            </p>
            <div className="flex items-center justify-center gap-0.5 my-3">
              {[1, 2, 3, 4, 5].map(star => (
                <Star
                  key={star}
                  size={20}
                  className={star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
                />
              ))}
            </div>
            <div className="flex items-center justify-center gap-1 mb-6">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span className="text-xs text-emerald-600 font-semibold">Verified Purchase Review</span>
            </div>
            <button
              onClick={resetForm}
              className="bg-gray-100 text-gray-700 text-sm font-semibold px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors active:scale-[0.98]"
            >
              Rate Another Seller
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

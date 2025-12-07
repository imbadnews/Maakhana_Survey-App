import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import {
  ArrowRight,
  MapPin,
  Dumbbell,
  PlusCircle,
  CheckCircle2,
  Briefcase,
  GraduationCap,
  Home,
  Building2,
  Loader2,
  Flame,
  Gift,
  Truck,
  Clock,
  LogOut
} from 'lucide-react';

// --- Firebase Configuration ---

const firebaseConfig = {
  apiKey: "AIzaSyCxKxj-xizsm_5nYhhpzVIgPcDCxCERTeE",
  authDomain: "maakhana-survey.firebaseapp.com",
  projectId: "maakhana-survey",
  storageBucket: "maakhana-survey.firebasestorage.app",
  messagingSenderId: "666525989944",
  appId: "1:666525989944:web:361fc9633b3adeb901facd",
  measurementId: "G-ZD7JV8263B"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
const appId = 'maakhana-survey-v2';

// --- Custom Logo Component ---
const GenZLogo = ({ className }) => (
  <svg
    viewBox="0 0 100 100"
    className={`w-16 h-16 ${className}`}
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M20 80 V 20 L 50 50 L 80 20 V 80 H 65 V 45 L 50 60 L 35 45 V 80 H 20 Z" stroke="currentColor" strokeWidth="3" fill="none" strokeLinejoin="round" />
    <circle cx="85" cy="85" r="5" fill="currentColor" />
  </svg>
);

// --- Main Component ---
export default function MaakhanaApp() {
  // State
  const [user, setUser] = useState(null); // Stores logged-in user info
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [animating, setAnimating] = useState(false);

  const [formData, setFormData] = useState({
    userType: '',
    livingSituation: '',
    location: '',
    mealFrequency: '',
    needsProtein: false,
    needsExtraServing: false,
    isGymBro: false,
    budgetPerMeal: 110,
    name: '',
    contact: '',
    email: '',
    wantsTrial: false
  });

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Auto-fill form data from Google Profile
        setFormData(prev => ({
          ...prev,
          name: currentUser.displayName || '',
          email: currentUser.email || ''
        }));
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Google Login Handler
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      // Automatically move to next step upon successful login
      handleNext();
    } catch (error) {
      console.error("Login Failed:", error);
      alert("Login failed. Please try again.");
    }
  };

  // Calculate dynamic minimum price
  const basePrice = 110;
  const proteinSurge = 40;
  const servingSurge = 20;
  const gymBroSurge = 100; // Premium package price

  const currentMinPrice = basePrice +
    (formData.isGymBro ? gymBroSurge : (formData.needsProtein ? proteinSurge : 0)) +
    (formData.needsExtraServing ? servingSurge : 0);

  // Ensure budget doesn't drop below min if options change
  useEffect(() => {
    if (formData.budgetPerMeal < currentMinPrice) {
      setFormData(prev => ({ ...prev, budgetPerMeal: currentMinPrice }));
    }
  }, [formData.needsProtein, formData.needsExtraServing, formData.isGymBro, currentMinPrice]);

  const handleNext = () => {
    setAnimating(true);
    setTimeout(() => {
      setStep(prev => prev + 1);
      setAnimating(false);
    }, 300);
  };

  const handleBack = () => {
    setAnimating(true);
    setTimeout(() => {
      setStep(prev => prev - 1);
      setAnimating(false);
    }, 300);
  };

  const handleGymBroToggle = () => {
    const newState = !formData.isGymBro;
    setFormData(prev => ({
        ...prev,
        isGymBro: newState,
        needsProtein: newState ? false : prev.needsProtein
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (!user) {
        alert("Please sign in to submit.");
        setLoading(false);
        return;
      }

      // Save to Firebase
      await addDoc(collection(db, 'maakhana_responses'), {
        ...formData,
        minPriceCalculated: currentMinPrice,
        timestamp: serverTimestamp(),
        uid: user.uid,
        authProvider: 'google',
        appVersion: appId
      });

      setCompleted(true);
    } catch (error) {
      console.error("Error submitting:", error);
      alert("Something went wrong. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  const updateData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // --- Render Steps ---

  // Welcome Screen (With Google Login)
  if (step === 0) {
    return (
      <div className="min-h-screen bg-stone-50 text-stone-900 font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-orange-500"></div>
        <div className="max-w-md w-full text-center space-y-8 animate-fade-in">
          <div className="inline-flex items-center justify-center p-6 bg-stone-900 rounded-2xl mb-4 shadow-xl rotate-3 hover:rotate-0 transition-transform duration-500">
             <GenZLogo className="text-orange-500" />
          </div>
          <h1 className="text-6xl font-black tracking-tighter text-stone-900 lowercase">
            maakhana<span className="text-orange-500">.</span>
          </h1>
          <p className="text-xl text-stone-600 font-medium leading-relaxed">
            Home cooked meals. Zero hassle.<br/>
            Scheduled drops that fit your clock.
          </p>

          <div className="pt-8 space-y-4">
            {user ? (
              // If user is already logged in
              <div className="space-y-4">
                <div className="bg-green-100 text-green-800 p-3 rounded-xl font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 size={20} />
                  Signed in as {user.displayName}
                </div>
                <button
                  onClick={handleNext}
                  className="group relative w-full bg-stone-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-600 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1"
                >
                  Start the Vibe Check
                  <ArrowRight className="inline ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
                <button onClick={() => signOut(auth)} className="text-stone-400 text-sm font-bold hover:text-stone-600 underline">
                  Sign Out
                </button>
              </div>
            ) : (
              // If user is NOT logged in
              <button
                onClick={handleGoogleLogin}
                className="group relative w-full bg-white text-stone-900 border-2 border-stone-200 py-4 rounded-xl font-bold text-lg hover:border-orange-500 hover:text-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
              >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-6 h-6" />
                Sign in with Google
              </button>
            )}
          </div>
          <p className="text-xs text-stone-400 uppercase tracking-widest mt-8 font-bold">
            Delivering: Noida • Greater Noida • Delhi (Soon)
          </p>
        </div>
      </div>
    );
  }

  // Success Screen
  if (completed) {
    return (
      <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-md text-center space-y-6">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={48} className="text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-stone-900">You're on the list!</h2>
          <p className="text-stone-600 text-lg">
            Thanks for keeping it real. We are crafting the perfect meal plan based on your inputs.
          </p>
          <div className="p-6 bg-white rounded-2xl shadow-sm border border-stone-100 mt-8">
            <p className="font-semibold text-stone-800">Your Ideal Price</p>
            <p className="text-4xl font-black text-green-600 mt-2">₹{formData.budgetPerMeal}<span className="text-base text-stone-400 font-normal">/meal</span></p>
          </div>
        </div>
      </div>
    );
  }

  // --- Step Wizard Container ---
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-between font-sans">
      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-stone-200">
        <div
          className="h-full bg-orange-500 transition-all duration-500 ease-out"
          style={{ width: `${(step / 6) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8">
        <div className={`w-full max-w-lg transition-opacity duration-300 ${animating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>

          {/* Step 1: User Type */}
          {step === 1 && (
            <div className="space-y-8">
              <span className="text-orange-600 font-bold tracking-wider text-sm uppercase">Step 1/6</span>
              <h2 className="text-3xl font-bold text-stone-900">What describes you best?</h2>
              <p className="text-stone-500 font-medium italic">"Fueling your daily hustle."</p>
              <div className="grid grid-cols-1 gap-4">
                <SelectionCard
                  icon={<GraduationCap />}
                  label="Student"
                  sub="Classes, assignments, hungry."
                  selected={formData.userType === 'student'}
                  onClick={() => { updateData('userType', 'student'); handleNext(); }}
                />
                <SelectionCard
                  icon={<Briefcase />}
                  label="Professional"
                  sub="Work, meetings, chasing goals."
                  selected={formData.userType === 'professional'}
                  onClick={() => { updateData('userType', 'professional'); handleNext(); }}
                />
              </div>
            </div>
          )}

          {/* Step 2: Living Situation */}
          {step === 2 && (
            <div className="space-y-8">
              <span className="text-orange-600 font-bold tracking-wider text-sm uppercase">Step 2/6</span>
              <h2 className="text-3xl font-bold text-stone-900">Where do you stay?</h2>
              <p className="text-stone-500 font-medium italic">"Your address is our kitchen."</p>
              <div className="grid grid-cols-1 gap-4">
                <SelectionCard
                  icon={<Building2 />}
                  label="PG / Hostel"
                  sub="Need reliable daily food."
                  selected={formData.livingSituation === 'pg_hostel'}
                  onClick={() => { updateData('livingSituation', 'pg_hostel'); handleNext(); }}
                />
                <SelectionCard
                  icon={<Home />}
                  label="Flat / Apartment"
                  sub="Cooking is too much effort."
                  selected={formData.livingSituation === 'flat'}
                  onClick={() => { updateData('livingSituation', 'flat'); handleNext(); }}
                />
              </div>
            </div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <div className="space-y-8">
              <span className="text-orange-600 font-bold tracking-wider text-sm uppercase">Step 3/6</span>
              <h2 className="text-3xl font-bold text-stone-900">Pick your location.</h2>
              <p className="text-stone-500 font-medium italic">"Hyper-local delivery network."</p>
              <div className="grid grid-cols-1 gap-4">
                <SelectionCard
                  icon={<MapPin />}
                  label="Greater Noida"
                  selected={formData.location === 'greater_noida'}
                  onClick={() => { updateData('location', 'greater_noida'); handleNext(); }}
                />
                <SelectionCard
                  icon={<MapPin />}
                  label="Noida"
                  selected={formData.location === 'noida'}
                  onClick={() => { updateData('location', 'noida'); handleNext(); }}
                />
                <button disabled className="w-full p-6 rounded-2xl border border-stone-200 bg-stone-100 flex items-center justify-between opacity-60 cursor-not-allowed">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-stone-200 rounded-full text-stone-400">
                      <MapPin size={24} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-xl font-bold text-stone-500">Delhi</h3>
                      <p className="text-stone-400 font-medium">Coming Soon</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Meal Preferences & Add-ons */}
          {step === 4 && (
            <div className="space-y-8">
              <span className="text-orange-600 font-bold tracking-wider text-sm uppercase">Step 4/6</span>
              <h2 className="text-3xl font-bold text-stone-900">Customize your fuel.</h2>

              {/* Delivery Protocol Card */}
              <div className="bg-stone-100 p-4 rounded-xl border border-stone-200">
                <div className="flex items-center gap-2 mb-3 text-stone-900 font-bold">
                    <Truck size={18} className="text-orange-600" />
                    <span className="uppercase tracking-wide text-xs">The Delivery Protocol</span>
                </div>
                <div className="space-y-3 text-sm text-stone-600">
                    <div className="flex gap-3">
                        <Clock size={16} className="text-stone-400 shrink-0 mt-0.5" />
                        <p><strong className="text-stone-800">AM Drop:</strong> Breakfast lands before you leave for work.</p>
                    </div>
                    <div className="flex gap-3">
                        <MapPin size={16} className="text-stone-400 shrink-0 mt-0.5" />
                        <p><strong className="text-stone-800">Lunch Run:</strong> Hot delivery to your Office/College.</p>
                    </div>
                    <div className="flex gap-3">
                        <Home size={16} className="text-stone-400 shrink-0 mt-0.5" />
                        <p><strong className="text-stone-800">PM Chill:</strong> Dinner waits for you at home.</p>
                    </div>
                </div>
              </div>

               {/* Meal Frequency - Now separate so Gym Bros can choose too */}
               <div>
                  <label className="block text-stone-700 font-bold mb-3">How often?</label>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                      <button
                          onClick={() => updateData('mealFrequency', '2_meals')}
                          className={`p-4 rounded-xl border-2 font-bold transition-all ${formData.mealFrequency === '2_meals' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-stone-200 text-stone-600 hover:border-stone-300'}`}
                      >
                          2 Meals
                          <span className="block text-xs font-normal mt-1 opacity-70">Bfast/Dinner</span>
                      </button>
                      <button
                          onClick={() => updateData('mealFrequency', '3_meals')}
                          className={`p-4 rounded-xl border-2 font-bold transition-all ${formData.mealFrequency === '3_meals' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-stone-200 text-stone-600 hover:border-stone-300'}`}
                      >
                          3 Meals
                          <span className="block text-xs font-normal mt-1 opacity-70">All Day</span>
                      </button>
                  </div>
              </div>

              <div className="space-y-6">

                {/* Gym Bro Premium Package */}
                <div
                  onClick={handleGymBroToggle}
                  className={`relative overflow-hidden p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${formData.isGymBro ? 'border-orange-600 bg-stone-900 text-white shadow-xl scale-[1.02]' : 'border-stone-200 bg-white hover:border-orange-300'}`}
                >
                  {formData.isGymBro && <div className="absolute top-0 right-0 bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">SELECTED</div>}

                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-full ${formData.isGymBro ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-600'}`}>
                        <Flame size={28} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black italic uppercase tracking-wider">Gym Bro Package</h3>
                        <p className={`text-sm mt-1 mb-2 ${formData.isGymBro ? 'text-stone-300' : 'text-stone-500'}`}>
                          Quality & Quantity Assurance.
                        </p>
                        <div className="flex flex-wrap gap-2">
                           <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${formData.isGymBro ? 'bg-stone-800 text-orange-400' : 'bg-stone-100 text-stone-600'}`}>3x Protein Packed</span>
                           <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${formData.isGymBro ? 'bg-stone-800 text-orange-400' : 'bg-stone-100 text-stone-600'}`}>Lean & Good Oil</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                       <span className={`text-sm font-bold px-3 py-1.5 rounded-lg ${formData.isGymBro ? 'bg-white text-stone-900' : 'bg-stone-100 text-stone-600'}`}>
                          +₹100
                       </span>
                    </div>
                  </div>
                </div>

                {/* Standard Add-ons (Hidden if Gym Bro is selected) */}
                <div className={`transition-opacity duration-300 ${formData.isGymBro ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
                    <label className="block text-stone-700 font-bold mb-3">Add-ons</label>

                    {/* Standard Protein Toggle */}
                    <div
                        onClick={() => updateData('needsProtein', !formData.needsProtein)}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all mb-3 ${formData.needsProtein ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 hover:bg-stone-50'}`}
                    >
                        <div className="flex items-center gap-3">
                            <Dumbbell size={20} className={formData.needsProtein ? 'text-orange-400' : 'text-stone-400'} />
                            <div>
                                <p className="font-bold">Protein Boost</p>
                                <p className={`text-xs ${formData.needsProtein ? 'text-stone-400' : 'text-stone-500'}`}>More Chicken, Eggs & Paneer vs Standard.</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className={`text-xs font-bold px-2 py-1 rounded ${formData.needsProtein ? 'bg-orange-500 text-white' : 'bg-stone-200 text-stone-500'}`}>
                                +₹40
                            </span>
                        </div>
                    </div>
                </div>

                {/* Extra Serving Toggle (Always available) */}
                <div
                    onClick={() => updateData('needsExtraServing', !formData.needsExtraServing)}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.needsExtraServing ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 hover:bg-stone-50'}`}
                >
                    <div className="flex items-center gap-3">
                        <PlusCircle size={20} className={formData.needsExtraServing ? 'text-orange-400' : 'text-stone-400'} />
                        <div>
                            <p className="font-bold">Extra Servings</p>
                            <p className={`text-xs ${formData.needsExtraServing ? 'text-stone-400' : 'text-stone-500'}`}>Extra Rice, Roti & increased Sides.</p>
                        </div>
                    </div>
                        <div className="text-right">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${formData.needsExtraServing ? 'bg-orange-500 text-white' : 'bg-stone-200 text-stone-500'}`}>
                            +₹20
                        </span>
                    </div>
                </div>

              </div>

              <button
                onClick={handleNext}
                disabled={!formData.mealFrequency}
                className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold mt-6 disabled:opacity-50 hover:bg-orange-600 transition-colors"
              >
                Next Step
              </button>
            </div>
          )}

          {/* Step 5: Budget Slider */}
          {step === 5 && (
            <div className="space-y-8">
              <span className="text-orange-600 font-bold tracking-wider text-sm uppercase">Step 5/6</span>
              <h2 className="text-3xl font-bold text-stone-900">Set your daily budget.</h2>
              <p className="text-stone-500 font-medium italic">"Premium taste, pocket-friendly vibes."</p>

              <div className="bg-white p-8 rounded-2xl shadow-xl border border-stone-100">
                <div className="text-center mb-10">
                    <span className="text-6xl font-black text-orange-500 tracking-tight">
                        ₹{formData.budgetPerMeal}
                    </span>
                    <span className="text-stone-400 font-medium ml-2">/ meal</span>
                </div>

                <input
                    type="range"
                    min={currentMinPrice}
                    max={500}
                    step={10}
                    value={formData.budgetPerMeal}
                    onChange={(e) => updateData('budgetPerMeal', parseInt(e.target.value))}
                    className="w-full h-3 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />

                <div className="flex justify-between mt-4 text-xs font-bold text-stone-400 uppercase tracking-widest">
                    <span>Min: ₹{currentMinPrice}</span>
                    <span>Max: ₹500</span>
                </div>

                <div className="mt-8 p-4 bg-stone-50 rounded-xl border border-stone-100 text-sm text-stone-600">
                    <div className="flex justify-between mb-1">
                        <span>Base Price</span>
                        <span>₹{basePrice}</span>
                    </div>
                    {/* Conditional Price Breakdown */}
                    {formData.isGymBro ? (
                         <div className="flex justify-between mb-1 text-orange-600 font-bold">
                            <span>Gym Bro Premium</span>
                            <span>+₹{gymBroSurge}</span>
                        </div>
                    ) : (
                        formData.needsProtein && (
                            <div className="flex justify-between mb-1 text-orange-600">
                                <span>Protein Boost</span>
                                <span>+₹{proteinSurge}</span>
                            </div>
                        )
                    )}
                     {formData.needsExtraServing && (
                        <div className="flex justify-between text-orange-600">
                            <span>Extra Serving</span>
                            <span>+₹{servingSurge}</span>
                        </div>
                    )}
                </div>
              </div>

               <button
                onClick={handleNext}
                className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold mt-6 hover:bg-orange-600 transition-colors"
              >
                Looks Good
              </button>
            </div>
          )}

          {/* Step 6: Final Details */}
          {step === 6 && (
            <div className="space-y-8">
              <span className="text-orange-600 font-bold tracking-wider text-sm uppercase">Final Step</span>
              <h2 className="text-3xl font-bold text-stone-900">Confirm details.</h2>

              <div className="space-y-4">
                {/* Auto-filled Info from Google */}
                <div className="bg-stone-100 p-4 rounded-xl flex items-center gap-3 border border-stone-200">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-lg">
                    {formData.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-stone-900">{formData.name}</p>
                    <p className="text-xs text-stone-500">{formData.email}</p>
                  </div>
                  <CheckCircle2 className="ml-auto text-green-500" size={24} />
                </div>

                <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2 ml-1">WhatsApp / Phone</label>
                    <input
                        type="tel"
                        placeholder="98765 43210"
                        className="w-full p-4 bg-white border-2 border-stone-200 rounded-xl focus:border-orange-500 focus:outline-none transition-colors font-medium"
                        value={formData.contact}
                        onChange={(e) => updateData('contact', e.target.value)}
                    />
                </div>

                {/* Special Offer Section */}
                <div
                    onClick={() => updateData('wantsTrial', !formData.wantsTrial)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4 ${formData.wantsTrial ? 'border-orange-500 bg-orange-50 shadow-md scale-[1.01]' : 'border-stone-200 bg-white hover:border-orange-200'}`}
                >
                    <div className={`p-3 rounded-full transition-colors ${formData.wantsTrial ? 'bg-orange-500 text-white' : 'bg-stone-100 text-stone-400'}`}>
                        <Gift size={24} />
                    </div>
                    <div>
                        <p className={`font-bold ${formData.wantsTrial ? 'text-stone-900' : 'text-stone-600'}`}>Unlock Trial Offer</p>
                        <p className="text-xs text-stone-500 mt-0.5">Get discounted pricing when we launch.</p>
                    </div>
                    <div className="ml-auto">
                         <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${formData.wantsTrial ? 'border-orange-500 bg-white' : 'border-stone-200'}`}>
                            {formData.wantsTrial && <div className="w-3 h-3 rounded-full bg-orange-500" />}
                         </div>
                    </div>
                </div>
              </div>

               <button
                onClick={handleSubmit}
                disabled={!formData.contact || loading}
                className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold mt-6 flex items-center justify-center gap-2 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Send it'}
              </button>
              <p className="text-xs text-center text-stone-400 mt-4">We respect your privacy. No spam.</p>
            </div>
          )}

        </div>
      </div>

      {/* Navigation Footer (only if step > 0) */}
      {step > 0 && !completed && (
         <div className="p-6 flex justify-between items-center max-w-lg w-full mx-auto">
            <button
                onClick={handleBack}
                className="text-stone-400 font-bold text-sm hover:text-stone-800 transition-colors"
            >
                Back
            </button>
         </div>
      )}
    </div>
  );
}

// Helper Component for Selection Cards
function SelectionCard({ icon, label, sub, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-6 rounded-2xl border-2 text-left transition-all duration-200 flex items-center justify-between group
        ${selected 
          ? 'border-stone-900 bg-stone-50 shadow-md ring-1 ring-stone-900' 
          : 'border-stone-200 bg-white hover:border-orange-300 hover:shadow-lg hover:-translate-y-0.5'
        }`}
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-full transition-colors ${selected ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 group-hover:bg-orange-100 group-hover:text-orange-600'}`}>
          {React.cloneElement(icon, { size: 24 })}
        </div>
        <div>
          <h3 className={`text-lg font-bold ${selected ? 'text-stone-900' : 'text-stone-700'}`}>{label}</h3>
          {sub && <p className="text-sm text-stone-400 font-medium mt-0.5">{sub}</p>}
        </div>
      </div>
      {selected && <CheckCircle2 className="text-stone-900" size={24} />}
    </button>
  );
}
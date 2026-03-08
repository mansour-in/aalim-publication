import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import * as THREE from 'three'
import { 
  Heart, 
  BookOpen, 
  Users, 
  TrendingUp, 
  Shield, 
  Receipt, 
  LayoutDashboard,
  Check,
  X,
  ArrowRight,
  Minus,
  Plus,
  MessageCircle,
  Send,
  Twitter,
  Link2,
  Download,
  LogOut,
  Mail,
  Phone,
  User,
  AlertCircle,
  RefreshCw,
  CreditCard,
  Landmark,
  Smartphone,
  Globe,
  Loader2
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { donationApi, paymentApi, authApi, donorApi } from './services/api'
import './App.css'

// Razorpay type declaration
declare global {
  interface Window {
    Razorpay: any;
  }
}

// Starfield Component
function Starfield() {
  const starsRef = useRef<THREE.Points>(null)
  
  useFrame((state) => {
    if (starsRef.current) {
      starsRef.current.rotation.x = state.clock.elapsedTime * 0.02
      starsRef.current.rotation.y = state.clock.elapsedTime * 0.01
    }
  })
  
  return (
    <Stars
      ref={starsRef}
      radius={100}
      depth={50}
      count={3000}
      factor={4}
      saturation={0.5}
      fade
      speed={0.5}
    />
  )
}

// Types
interface DonationData {
  quantity: number
  amount: number
  name: string
  email: string
  phone: string
  dedication?: string
}

interface DonationRecord {
  id: string
  date: string
  quantity: number
  amount: number
  dedication?: string
  status: string
  receiptUrl?: string
}

// Translations
const translations = {
  en: {
    sadaqahJariyah: 'Sadaqatul Jariyah',
    heroTitle: 'Preserve the Words of the',
    prophet: 'Prophet ﷺ',
    heroSubtitle: 'Your sponsorship helps translate and publish authentic Hadiths, making sacred knowledge accessible to millions worldwide.',
    opportunityCloses: 'Opportunity closes in',
    days: 'Days',
    hours: 'Hours',
    minutes: 'Minutes',
    seconds: 'Seconds',
    startSponsoring: 'Start Sponsoring',
    learnMore: 'Learn More',
    hadithsRemaining: 'Hadiths Remaining',
    progress: 'Progress',
    sponsoredOf: 'of',
    hadithsSponsored: 'Hadiths sponsored',
    totalHadiths: 'Total Hadiths',
    donors: 'Donors',
    raised: 'Raised',
    liveUrgency: 'LIVE count is dropping as sponsors complete Hadiths. Claim your reward before it completes!',
    sponsorNow: 'Sponsor Now',
    selectHadiths: 'Select Hadiths to Sponsor',
    chooseQuantity: 'Choose how many Hadiths you want to sponsor',
    customAmount: 'Or choose custom amount',
    afterSponsorship: 'After your sponsorship, remaining will be',
    totalAmount: 'Total Amount',
    sponsorTip: 'Tip: Sponsoring multiple Hadiths completes the project faster — and multiplies ongoing reward.',
    continue: 'Continue',
    yourDetails: 'Your Details',
    fullName: 'Full Name',
    namePlaceholder: 'Enter your full name',
    email: 'Email Address *',
    emailPlaceholder: 'your@email.com',
    phone: 'Phone Number *',
    phonePlaceholder: '+91 XXXXX XXXXX',
    dedication: 'Dedication (Optional)',
    dedicationPlaceholder: 'For self, family, friends...',
    securePayment: 'Secure Payment via Razorpay',
    receiptSent: 'Receipt sent to your email',
    dashboardAccess: 'Access your dashboard anytime',
    formUrgency: 'The LIVE counter is moving — complete your sponsorship now so your Hadith is counted.',
    hadithsToSponsor: 'Hadiths to Sponsor',
    remainingAfter: 'Remaining After',
    completePayment: 'Complete Payment',
    processing: 'Processing...',
    poweredBy: 'Secure payment powered by Razorpay',
    jazakallah: 'JazakAllah Khair!',
    sponsorshipReceived: 'Your sponsorship has been received',
    amountPaid: 'Amount Paid',
    nowRemaining: 'Now Remaining',
    dua: 'May Allah accept your contribution and reward you abundantly in this world and the hereafter.',
    shareMessage: 'Earn even greater reward in this blessed month.',
    multiplyReward: 'Share this opportunity and multiply the reward up to',
    times70: '70x',
    viewDashboard: 'View Dashboard',
    sponsorMore: 'Sponsor More',
    paymentFailed: 'Payment Didn\'t Go Through',
    retryMessage: 'No worries — you can retry safely. Your details are saved in this session.',
    amount: 'Amount',
    hadiths: 'Hadiths',
    retryUrgency: 'Retry now — the LIVE counter keeps moving.',
    retryPayment: 'Retry Payment',
    manualPayment: 'Manual Payment Options',
    bankTransfer: 'Bank Transfer',
    account: 'Account',
    bank: 'Bank',
    upiMobile: 'UPI / Mobile',
    upi: 'UPI',
    needHelp: 'Need help? Contact us at',
    yourDashboard: 'Your Dashboard',
    totalHadithsSponsored: 'Total Hadiths Sponsored',
    totalContribution: 'Total Contribution',
    sponsorshipHistory: 'Sponsorship History',
    receipt: 'Receipt',
    keepGoing: 'Keep going — every additional Hadith sponsored helps the project complete sooner.',
    sponsorMoreHadiths: 'Sponsor More Hadiths',
    accessDashboard: 'Access Your Dashboard',
    loginMessage: 'Enter the email you used for your donation. We\'ll send you a verification link.',
    back: 'Back',
    live: 'LIVE',
    remaining: 'remaining'
  },
  ta: {
    sadaqahJariyah: 'சதக்கத்துல் ஜாரியா',
    heroTitle: 'திருத்தூதர் ﷺ அவர்களின்',
    prophet: 'வார்த்தைகளை பாதுகாப்போம்',
    heroSubtitle: 'உங்கள் ஸ்பான்சர்ஷிப் ஹதீஸ்களை மொழிபெயர்த்து வெளியிட உதவுகிறது, புனித அறிவை உலகெங்கும் மில்லியன்கணக்கான மக்களுக்கு அணுகக்கூடியதாக மாற்றுகிறது.',
    opportunityCloses: 'வாய்ப்பு முடிவடைகிறது',
    days: 'நாட்கள்',
    hours: 'மணி',
    minutes: 'நிமிடங்கள்',
    seconds: 'விநாடிகள்',
    startSponsoring: 'ஸ்பான்சர் செய்ய தொடங்குங்கள்',
    learnMore: 'மேலும் அறிய',
    hadithsRemaining: 'மீதமுள்ள ஹதீஸ்கள்',
    progress: 'முன்னேற்றம்',
    sponsoredOf: 'இல்',
    hadithsSponsored: 'ஹதீஸ்கள் ஸ்பான்சர் செய்யப்பட்டன',
    totalHadiths: 'மொத்த ஹதீஸ்கள்',
    donors: 'நன்கொடையாளர்கள்',
    raised: 'சேகரிக்கப்பட்டது',
    liveUrgency: 'ஸ்பான்சர்கள் ஹதீஸ்களை முடிக்கும்போது நேரடி எண்ணிக்கை குறைகிறது. அது முடிவடையும் முன் உங்கள் பரிசைப் பெறுங்கள்!',
    sponsorNow: 'இப்போது ஸ்பான்சர் செய்யுங்கள்',
    selectHadiths: 'ஸ்பான்சர் செய்ய ஹதீஸ்களைத் தேர்ந்தெடுக்கவும்',
    chooseQuantity: 'எத்தனை ஹதீஸ்களை ஸ்பான்சர் செய்ய விரும்புகிறீர்கள் என்பதைத் தேர்ந்தெடுக்கவும்',
    customAmount: 'அல்லது தனிப்பயன் தொகையைத் தேர்ந்தெடுக்கவும்',
    afterSponsorship: 'உங்கள் ஸ்பான்சர்ஷிப் பிறகு, மீதமுள்ளது',
    totalAmount: 'மொத்த தொகை',
    sponsorTip: 'குறிப்பு: பல ஹதீஸ்களை ஸ்பான்சர் செய்வது திட்டத்தை விரைவாக முடிக்கிறது — மேலும் தொடர்ச்சியான பரிசை பெருக்குகிறது.',
    continue: 'தொடரவும்',
    yourDetails: 'உங்கள் விவரங்கள்',
    fullName: 'முழு பெயர்',
    namePlaceholder: 'உங்கள் முழு பெயரை உள்ளிடவும்',
    email: 'மின்னஞ்சல் முகவரி *',
    emailPlaceholder: 'your@email.com',
    phone: 'தொலைபேசி எண் *',
    phonePlaceholder: '+91 XXXXX XXXXX',
    dedication: 'அர்ப்பணிப்பு (விருப்பம்)',
    dedicationPlaceholder: 'சுயம், குடும்பம், நண்பர்களுக்காக...',
    securePayment: 'Razorpay மூலம் பாதுகாப்பான கட்டணம்',
    receiptSent: 'உங்கள் மின்னஞ்சலுக்கு ரசீது அனுப்பப்பட்டது',
    dashboardAccess: 'எந்நேரமும் உங்கள் டாஷ்போர்டை அணுகவும்',
    formUrgency: 'நேரடி எண்ணிக்கை நகர்கிறது — உங்கள் ஹதீஸ் எண்ணப்பட இப்போதே உங்கள் ஸ்பான்சர்ஷிப் முடிக்கவும்.',
    hadithsToSponsor: 'ஸ்பான்சர் செய்ய ஹதீஸ்கள்',
    remainingAfter: 'பிறகு மீதமுள்ளது',
    completePayment: 'கட்டணத்தை முடிக்கவும்',
    processing: 'செயலாக்குகிறது...',
    poweredBy: 'Razorpay மூலம் பாதுகாப்பான கட்டணம்',
    jazakallah: 'ஜஸாகல்லாஹு கைர்!',
    sponsorshipReceived: 'உங்கள் ஸ்பான்சர்ஷிப் பெறப்பட்டது',
    amountPaid: 'செலுத்தப்பட்ட தொகை',
    nowRemaining: 'இப்போது மீதமுள்ளது',
    dua: 'அல்லாஹ் உங்கள் பங்களிப்பை ஏற்றுக்கொண்டு இந்த உலகிலும் மறுமையிலும் உங்களுக்கு ஏராளமான பரிசளிக்கட்டும்.',
    shareMessage: 'இந்த புனித மாதத்தில் இன்னும் பெரிய பரிசைப் பெறுங்கள்.',
    multiplyReward: 'இந்த வாய்ப்பைப் பகிர்ந்து பரிசை பெருக்கவும்',
    times70: '70 மடங்கு',
    viewDashboard: 'டாஷ்போர்டைக் காண்க',
    sponsorMore: 'மேலும் ஸ்பான்சர் செய்யுங்கள்',
    paymentFailed: 'கட்டணம் செலுத்த முடியவில்லை',
    retryMessage: 'கவலையில்லை — நீங்கள் பாதுகாப்பாக மீண்டும் முயற்சிக்கலாம். உங்கள் விவரங்கள் இந்த அமர்வில் சேமிக்கப்பட்டுள்ளன.',
    amount: 'தொகை',
    hadiths: 'ஹதீஸ்கள்',
    retryUrgency: 'இப்போதே மீண்டும் முயற்சிக்கவும் — நேரடி எண்ணிக்கை தொடர்ந்து நகர்கிறது.',
    retryPayment: 'கட்டணத்தை மீண்டும் முயற்சிக்கவும்',
    manualPayment: 'கைமுறை கட்டண விருப்பங்கள்',
    bankTransfer: 'வங்கி பரிமாற்றம்',
    account: 'கணக்கு',
    bank: 'வங்கி',
    upiMobile: 'UPI / மொபைல்',
    upi: 'UPI',
    needHelp: 'உதவி தேவையா? எங்களை தொடர்பு கொள்ளவும்',
    yourDashboard: 'உங்கள் டாஷ்போர்ட்',
    totalHadithsSponsored: 'மொத்தம் ஸ்பான்சர் செய்யப்பட்ட ஹதீஸ்கள்',
    totalContribution: 'மொத்த பங்களிப்பு',
    sponsorshipHistory: 'ஸ்பான்சர்ஷிப் வரலாறு',
    receipt: 'ரசீது',
    keepGoing: 'தொடருங்கள் — ஒவ்வொரு கூடுதல் ஹதீஸ் ஸ்பான்சர்ஷிப் திட்டத்தை விரைவாக முடிக்க உதவுகிறது.',
    sponsorMoreHadiths: 'மேலும் ஹதீஸ்களை ஸ்பான்சர் செய்யுங்கள்',
    accessDashboard: 'உங்கள் டாஷ்போர்டை அணுகவும்',
    loginMessage: 'உங்கள் நன்கொடைக்கு பயன்படுத்திய மின்னஞ்சலை உள்ளிடவும். உங்களுக்கு சரிபார்ப்பு இணைப்பை அனுப்புவோம்.',
    back: 'பின் செல்',
    live: 'நேரடி',
    remaining: 'மீதமுள்ள'
  }
}

type Language = 'en' | 'ta'

// Counter Animation Component
function AnimatedCounter({ value, duration = 2 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0)
  const counterRef = useRef<HTMLSpanElement>(null)
  
  useEffect(() => {
    const obj = { val: 0 }
    gsap.to(obj, {
      val: value,
      duration,
      ease: 'power2.out',
      onUpdate: () => setDisplayValue(Math.floor(obj.val)),
    })
  }, [value, duration])
  
  return <span ref={counterRef} className="counter-digit">{displayValue.toLocaleString()}</span>
}

// Main App Component
function App() {
  // State
  const [language, setLanguage] = useState<Language>('en')
  const [currentView, setCurrentView] = useState<'hero' | 'stats' | 'select' | 'form' | 'payment' | 'success' | 'failure' | 'dashboard'>('hero')
  const [selectedQuantity, setSelectedQuantity] = useState(1)
  const [customQuantity, setCustomQuantity] = useState(false)
  const [donationData, setDonationData] = useState<DonationData>({
    quantity: 1,
    amount: 3000,
    name: '',
    email: '',
    phone: '',
    dedication: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentDonationId, setCurrentDonationId] = useState<number | null>(null)
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null)
  const [razorpayKey, setRazorpayKey] = useState<string>('')
  
  // Stats from API
  const [stats, setStats] = useState({
    remaining: 1247,
    total: 5000,
    sponsored: 3753,
    donors: 892,
    raised: 11259000,
    hadithPrice: 3000
  })
  
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  
  // Donation history from API
  const [donationHistory, setDonationHistory] = useState<DonationRecord[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  
  // Refs
  const heroRef = useRef<HTMLDivElement>(null)
  
  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
    
    return () => {
      document.body.removeChild(script)
    }
  }, [])
  
  // Fetch stats on mount
  useEffect(() => {
    fetchStats()
  }, [])
  
  // Fetch donation history when logged in
  useEffect(() => {
    if (isLoggedIn) {
      fetchDonationHistory()
    }
  }, [isLoggedIn])
  
  const fetchStats = async () => {
    try {
      setIsLoadingStats(true)
      const response = await donationApi.getStats()
      if (response.success) {
        setStats({
          remaining: response.data.remaining,
          total: response.data.goal,
          sponsored: response.data.sponsored,
          donors: response.data.donors,
          raised: response.data.raised,
          hadithPrice: response.data.hadithPrice
        })
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setIsLoadingStats(false)
    }
  }
  
  const fetchDonationHistory = async () => {
    try {
      setIsLoadingHistory(true)
      const response = await donorApi.getDonations()
      if (response.success) {
        const history = response.data.map((d: any) => ({
          id: d.id.toString(),
          date: d.created_at.split('T')[0],
          quantity: d.quantity,
          amount: d.amount,
          dedication: d.dedication,
          status: d.status,
          receiptUrl: d.receiptUrl
        }))
        setDonationHistory(history)
      }
    } catch (error) {
      console.error('Failed to fetch donation history:', error)
    } finally {
      setIsLoadingHistory(false)
    }
  }
  
  // Scroll to view
  const scrollToView = (view: typeof currentView) => {
    setCurrentView(view)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  
  // Toggle language
  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ta' : 'en')
  }
  
  // Get translation
  const t = translations[language]
  
  // Handle quantity selection
  const handleQuantitySelect = (qty: number) => {
    setSelectedQuantity(qty)
    setCustomQuantity(false)
    setDonationData(prev => ({ ...prev, quantity: qty, amount: qty * stats.hadithPrice }))
  }
  
  // Handle custom quantity
  const handleCustomQtyChange = (delta: number) => {
    const newQty = Math.max(1, selectedQuantity + delta)
    setSelectedQuantity(newQty)
    setCustomQuantity(true)
    setDonationData(prev => ({ ...prev, quantity: newQty, amount: newQty * stats.hadithPrice }))
  }
  
  // Handle form input
  const handleInputChange = (field: keyof DonationData, value: string) => {
    setDonationData(prev => ({ ...prev, [field]: value }))
  }
  
  // Initialize Razorpay payment
  const initializeRazorpay = () => {
    if (!window.Razorpay) {
      alert('Payment system is loading. Please try again in a moment.')
      return
    }
    
    const options = {
      key: razorpayKey,
      amount: donationData.amount * 100, // in paise
      currency: 'INR',
      name: 'Aalim Foundation',
      description: `${donationData.quantity} Hadith Sponsorship`,
      order_id: currentOrderId,
      handler: async (response: any) => {
        // Payment successful - verify on backend
        try {
          setIsSubmitting(true)
          const verifyResponse = await paymentApi.verify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          })
          
          if (verifyResponse.success) {
            // Update stats
            await fetchStats()
            setIsSubmitting(false)
            scrollToView('success')
          } else {
            throw new Error('Verification failed')
          }
        } catch (error) {
          console.error('Payment verification failed:', error)
          setIsSubmitting(false)
          scrollToView('failure')
        }
      },
      prefill: {
        name: donationData.name,
        email: donationData.email,
        contact: donationData.phone
      },
      theme: {
        color: '#D4AF37'
      },
      modal: {
        ondismiss: async () => {
          // User closed the payment modal
          if (currentDonationId) {
            await paymentApi.markFailed(currentDonationId, 'User cancelled')
          }
          scrollToView('failure')
        }
      }
    }
    
    const razorpay = new window.Razorpay(options)
    razorpay.open()
  }
  
  // Submit donation
  const handleSubmitDonation = async () => {
    setIsSubmitting(true)
    
    try {
      // Create donation on backend
      const response = await donationApi.create({
        quantity: donationData.quantity,
        email: donationData.email,
        name: donationData.name,
        phone: donationData.phone,
        dedication: donationData.dedication
      })
      
      if (response.success) {
        setCurrentDonationId(response.data.donationId)
        setCurrentOrderId(response.data.orderId)
        setRazorpayKey(response.data.razorpayKey)
        
        // Open Razorpay checkout
        initializeRazorpay()
      }
    } catch (error) {
      console.error('Failed to create donation:', error)
      alert('Failed to initiate payment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Handle retry payment
  const handleRetryPayment = async () => {
    if (!currentDonationId) return
    
    setIsSubmitting(true)
    try {
      const response = await donationApi.retry(currentDonationId)
      if (response.success) {
        setCurrentOrderId(response.data.orderId)
        setRazorpayKey(response.data.razorpayKey)
        initializeRazorpay()
      }
    } catch (error) {
      console.error('Retry failed:', error)
      alert('Failed to retry payment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Handle login
  const handleLogin = async () => {
    if (!loginEmail) return
    
    try {
      // Request OTP
      await authApi.requestOTP(loginEmail)
      
      // For demo, we'll just simulate login
      // In production, show OTP input and verify
      const otp = prompt('Enter OTP sent to your email (demo: use any 6 digits):')
      if (otp) {
        const response = await authApi.verifyOTP(loginEmail, otp)
        if (response.success) {
          localStorage.setItem('donorToken', response.data.token)
          setIsLoggedIn(true)
          setShowLoginDialog(false)
          scrollToView('dashboard')
        }
      }
    } catch (error) {
      console.error('Login failed:', error)
      alert('Login failed. Please try again.')
    }
  }
  
  // Share functions
  const shareLinks = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent('Join me in sponsoring Hadiths this Ramadan! Earn Sadaqatul Jariyah: https://aalim.org')}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent('https://aalim.org')}&text=${encodeURIComponent('Join me in sponsoring Hadiths this Ramadan!')}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent('Join me in sponsoring Hadiths this Ramadan! Earn Sadaqatul Jariyah')}&url=${encodeURIComponent('https://aalim.org')}`
  }
  
  const copyLink = () => {
    navigator.clipboard.writeText('https://aalim.org')
    alert('Link copied to clipboard!')
  }
  
  // Progress percentage
  const progressPercent = ((stats.total - stats.remaining) / stats.total) * 100
  
  // Countdown timer
  const [timeLeft, setTimeLeft] = useState({ days: 15, hours: 8, minutes: 42, seconds: 15 })
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 }
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 }
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 }
        return prev
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-[#05101A] text-[#E0E6ED] overflow-x-hidden">
      {/* Background Starfield */}
      <div className="fixed inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 1] }}>
          <Starfield />
        </Canvas>
      </div>
      
      {/* Islamic Pattern Overlay */}
      <div 
        className="fixed inset-0 z-[1] opacity-5 pointer-events-none"
        style={{ 
          backgroundImage: 'url(/pattern_geo.png)', 
          backgroundSize: '400px',
          backgroundRepeat: 'repeat'
        }}
      />
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Aalim" className="h-10 w-auto" />
            <span className="text-xl font-bold text-gradient-gold">Aalim</span>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Live Counter Pill */}
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full glass-card">
              <span className="live-pulse" />
              <span className="text-sm font-medium">
                {isLoadingStats ? <Loader2 className="w-4 h-4 animate-spin" /> : <AnimatedCounter value={stats.remaining} />} {language === 'en' ? 'remaining' : 'மீதமுள்ள'}
              </span>
            </div>
            
            {/* Price Pill */}
            <div className="px-4 py-2 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#C59A2E] text-[#05101A] text-sm font-semibold">
              1 Hadith = ₹{stats.hadithPrice.toLocaleString()}
            </div>
            
            {/* Language Switch Button */}
            <button 
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-2 rounded-xl glass-card hover:bg-white/10 transition-colors"
              title={language === 'en' ? 'Switch to Tamil' : 'Switch to English'}
            >
              <Globe className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-sm font-medium">{language === 'en' ? 'EN' : 'தமிழ்'}</span>
            </button>
            
            {/* Dashboard Button */}
            <button 
              onClick={() => isLoggedIn ? scrollToView('dashboard') : setShowLoginDialog(true)}
              className="p-2 rounded-xl glass-card hover:bg-white/10 transition-colors"
            >
              <LayoutDashboard className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="relative z-10 pt-20">
        {/* HERO SECTION */}
        {currentView === 'hero' && (
          <section ref={heroRef} className="section-container min-h-screen">
            <div className="max-w-4xl mx-auto text-center">
              {/* Moon Image */}
              <div className="relative mb-8 float">
                <img 
                  src="/moon_glow.png" 
                  alt="Crescent Moon" 
                  className="w-32 h-32 sm:w-48 sm:h-48 mx-auto glow-pulse"
                />
              </div>
              
              {/* Sadaqah Tag */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6">
                <Heart className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-sm font-medium text-[#D4AF37]">{t.sadaqahJariyah}</span>
              </div>
              
              {/* Main Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                {language === 'en' ? (
                  <>{t.heroTitle} <span className="text-gradient-gold">{t.prophet}</span></>
                ) : (
                  <><span className="text-gradient-gold">{t.heroTitle}</span> {t.prophet}</>
                )}
              </h1>
              
              {/* Subtitle */}
              <p className="text-lg sm:text-xl text-[#8A9BA8] max-w-2xl mx-auto mb-10">
                {t.heroSubtitle}
              </p>
              
              {/* Countdown Timer */}
              <div className="glass-card rounded-2xl p-6 mb-10 max-w-lg mx-auto">
                <p className="text-sm text-[#8A9BA8] mb-4">{t.opportunityCloses}</p>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { value: timeLeft.days, label: t.days },
                    { value: timeLeft.hours, label: t.hours },
                    { value: timeLeft.minutes, label: t.minutes },
                    { value: timeLeft.seconds, label: t.seconds }
                  ].map((item, i) => (
                    <div key={i} className="text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-gradient-gold">
                        {String(item.value).padStart(2, '0')}
                      </div>
                      <div className="text-xs text-[#8A9BA8] mt-1">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => scrollToView('stats')}
                  className="btn-primary flex items-center justify-center gap-2"
                >
                  {t.startSponsoring}
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => scrollToView('stats')}
                  className="btn-secondary"
                >
                  {t.learnMore}
                </button>
              </div>
              
              {/* Mosque Silhouette */}
              <div className="mt-16 opacity-30">
                <img 
                  src="/mosque.png" 
                  alt="Mosque" 
                  className="w-full max-w-2xl mx-auto"
                />
              </div>
            </div>
          </section>
        )}
        
        {/* STATS SECTION */}
        {currentView === 'stats' && (
          <section className="section-container min-h-screen py-20">
            <div className="max-w-4xl mx-auto w-full">
              {/* Back Button */}
              <button 
                onClick={() => scrollToView('hero')}
                className="mb-6 flex items-center gap-2 text-[#8A9BA8] hover:text-[#D4AF37] transition-colors"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                {t.back}
              </button>
              
              {/* Main Stats Card */}
              <div className="glass-card rounded-3xl p-8 mb-6">
                {/* Live Indicator */}
                <div className="flex items-center justify-center gap-2 mb-6">
                  <span className="live-pulse" />
                  <span className="text-sm font-medium text-[#ef4444]">{t.live}</span>
                </div>
                
                {/* Big Counter */}
                <div className="text-center mb-8">
                  <div className="text-6xl sm:text-7xl lg:text-8xl font-bold text-gradient-gold mb-2">
                    {isLoadingStats ? <Loader2 className="w-16 h-16 animate-spin mx-auto" /> : <AnimatedCounter value={stats.remaining} />}
                  </div>
                  <p className="text-lg text-[#8A9BA8]">{t.hadithsRemaining}</p>
                </div>
                
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-[#8A9BA8]">{t.progress}</span>
                    <span className="text-[#D4AF37] font-semibold">{progressPercent.toFixed(1)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
                
                <p className="text-center text-sm text-[#8A9BA8]">
                  {stats.sponsored.toLocaleString()} {t.sponsoredOf} {stats.total.toLocaleString()} {t.hadithsSponsored}
                </p>
              </div>
              
              {/* Mini Stats Grid */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { icon: BookOpen, value: stats.total, label: t.totalHadiths },
                  { icon: Users, value: stats.donors, label: t.donors },
                  { icon: TrendingUp, value: `₹${(stats.raised / 1000000).toFixed(1)}M`, label: t.raised }
                ].map((stat, i) => (
                  <div key={i} className="glass-card rounded-2xl p-4 text-center card-hover">
                    <stat.icon className="w-6 h-6 mx-auto mb-2 text-[#D4AF37]" />
                    <div className="text-xl font-bold">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</div>
                    <div className="text-xs text-[#8A9BA8]">{stat.label}</div>
                  </div>
                ))}
              </div>
              
              {/* Urgency Banner */}
              <div className="urgency-banner mb-8 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{t.liveUrgency}</span>
              </div>
              
              {/* CTA */}
              <button 
                onClick={() => scrollToView('select')}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                {t.sponsorNow}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </section>
        )}
        
        {/* SELECTION SECTION */}
        {currentView === 'select' && (
          <section className="section-container min-h-screen py-20">
            <div className="max-w-2xl mx-auto w-full">
              {/* Back Button */}
              <button 
                onClick={() => scrollToView('stats')}
                className="mb-6 flex items-center gap-2 text-[#8A9BA8] hover:text-[#D4AF37] transition-colors"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                {t.back}
              </button>
              
              <h2 className="text-3xl font-bold text-center mb-2">{t.selectHadiths}</h2>
              <p className="text-[#8A9BA8] text-center mb-8">{t.chooseQuantity}</p>
              
              {/* Quantity Grid */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[1, 2, 3, 5, 10, 25].map((qty) => (
                  <button
                    key={qty}
                    onClick={() => handleQuantitySelect(qty)}
                    className={`chip text-lg ${selectedQuantity === qty && !customQuantity ? 'active' : ''}`}
                  >
                    {qty}
                  </button>
                ))}
              </div>
              
              {/* Custom Quantity */}
              <div className="text-center mb-6">
                <p className="text-sm text-[#8A9BA8] mb-4">{t.customAmount}</p>
                <div className="flex items-center justify-center gap-4">
                  <button 
                    onClick={() => handleCustomQtyChange(-1)}
                    className="w-12 h-12 rounded-full glass-card flex items-center justify-center hover:bg-white/10 transition-colors"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="text-4xl font-bold w-20 text-center">{selectedQuantity}</span>
                  <button 
                    onClick={() => handleCustomQtyChange(1)}
                    className="w-12 h-12 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#C59A2E] text-[#05101A] flex items-center justify-center hover:shadow-lg hover:shadow-[#D4AF37]/30 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Impact Bar */}
              <div className="glass-card rounded-2xl p-6 mb-6 text-center">
                <p className="text-[#8A9BA8] mb-2">{t.afterSponsorship}</p>
                <div className="text-4xl font-bold text-gradient-gold">
                  {(stats.remaining - selectedQuantity).toLocaleString()}
                </div>
              </div>
              
              {/* Amount Display */}
              <div className="glass-card rounded-2xl p-6 mb-6 flex items-center justify-between">
                <span className="text-[#8A9BA8]">{t.totalAmount}</span>
                <span className="text-3xl font-bold text-gradient-gold">
                  ₹{(selectedQuantity * stats.hadithPrice).toLocaleString()}
                </span>
              </div>
              
              {/* Urgency Tip */}
              <div className="urgency-banner mb-8">
                <span>{t.sponsorTip}</span>
              </div>
              
              {/* CTA */}
              <button 
                onClick={() => scrollToView('form')}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                {t.continue}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </section>
        )}
        
        {/* FORM SECTION */}
        {currentView === 'form' && (
          <section className="section-container min-h-screen py-20">
            <div className="max-w-xl mx-auto w-full">
              {/* Back Button */}
              <button 
                onClick={() => scrollToView('select')}
                className="mb-6 flex items-center gap-2 text-[#8A9BA8] hover:text-[#D4AF37] transition-colors"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                {t.back}
              </button>
              
              <h2 className="text-3xl font-bold text-center mb-8">{t.yourDetails}</h2>
              
              {/* Form */}
              <div className="space-y-6">
                {/* Name */}
                <div>
                  <Label className="text-sm text-[#8A9BA8] mb-2 block">{t.fullName}</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8A9BA8]" />
                    <Input
                      type="text"
                      placeholder={t.namePlaceholder}
                      value={donationData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="input-field pl-12"
                    />
                  </div>
                </div>
                
                {/* Email */}
                <div>
                  <Label className="text-sm text-[#8A9BA8] mb-2 block">{t.email}</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8A9BA8]" />
                    <Input
                      type="email"
                      placeholder={t.emailPlaceholder}
                      value={donationData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="input-field pl-12"
                      required
                    />
                  </div>
                </div>
                
                {/* Phone */}
                <div>
                  <Label className="text-sm text-[#8A9BA8] mb-2 block">{t.phone}</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8A9BA8]" />
                    <Input
                      type="tel"
                      placeholder={t.phonePlaceholder}
                      value={donationData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="input-field pl-12"
                      required
                    />
                  </div>
                </div>
                
                {/* Dedication */}
                <div>
                  <Label className="text-sm text-[#8A9BA8] mb-2 block">{t.dedication}</Label>
                  <div className="relative">
                    <Heart className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8A9BA8]" />
                    <Input
                      type="text"
                      placeholder={t.dedicationPlaceholder}
                      value={donationData.dedication}
                      onChange={(e) => handleInputChange('dedication', e.target.value)}
                      className="input-field pl-12"
                    />
                  </div>
                </div>
              </div>
              
              {/* Trust Box */}
              <div className="glass-card rounded-2xl p-6 mt-8 space-y-4">
                {[
                  { icon: Shield, text: t.securePayment },
                  { icon: Receipt, text: t.receiptSent },
                  { icon: LayoutDashboard, text: t.dashboardAccess }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0B3D3D]/50 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-[#D4AF37]" />
                    </div>
                    <span className="text-sm">{item.text}</span>
                  </div>
                ))}
              </div>
              
              {/* Urgency */}
              <div className="urgency-banner mt-6">
                <span>{t.formUrgency}</span>
              </div>
              
              {/* Summary */}
              <div className="glass-card rounded-2xl p-6 mt-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[#8A9BA8]">{t.hadithsToSponsor}</span>
                  <span className="font-bold">{donationData.quantity}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[#8A9BA8]">{t.totalAmount}</span>
                  <span className="font-bold text-gradient-gold">₹{donationData.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#8A9BA8]">{t.remainingAfter}</span>
                  <span className="font-bold">{(stats.remaining - donationData.quantity).toLocaleString()}</span>
                </div>
              </div>
              
              {/* CTA */}
              <button 
                onClick={handleSubmitDonation}
                disabled={!donationData.email || !donationData.phone || isSubmitting}
                className="w-full btn-primary flex items-center justify-center gap-2 mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-[#05101A] border-t-transparent rounded-full animate-spin" />
                    {t.processing}
                  </>
                ) : (
                  <>
                    {t.completePayment}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
              
              <p className="text-center text-xs text-[#8A9BA8] mt-4">
                {t.poweredBy}
              </p>
            </div>
          </section>
        )}
        
        {/* SUCCESS SECTION */}
        {currentView === 'success' && (
          <section className="section-container min-h-screen py-20">
            <div className="max-w-xl mx-auto w-full text-center">
              {/* Success Icon */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-[#0B3D3D] to-[#1A5F5F] flex items-center justify-center mx-auto mb-8 glow-teal">
                <Check className="w-12 h-12 text-[#D4AF37]" />
              </div>
              
              <h2 className="text-4xl font-bold mb-4">{t.jazakallah}</h2>
              <p className="text-[#8A9BA8] mb-8">{t.sponsorshipReceived}</p>
              
              {/* Summary */}
              <div className="glass-card rounded-2xl p-6 mb-8 text-left">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/10">
                  <span className="text-[#8A9BA8]">{t.amountPaid}</span>
                  <span className="font-bold text-gradient-gold text-xl">₹{donationData.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/10">
                  <span className="text-[#8A9BA8]">{t.hadithsSponsored}</span>
                  <span className="font-bold text-xl">{donationData.quantity}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#8A9BA8]">{t.nowRemaining}</span>
                  <span className="font-bold text-xl">{stats.remaining.toLocaleString()}</span>
                </div>
              </div>
              
              {/* Dua */}
              <div className="glass-card rounded-2xl p-6 mb-8">
                <p className="text-lg italic">
                  "{t.dua}"
                </p>
              </div>
              
              {/* Share Section */}
              <div className="mb-8">
                <p className="text-sm text-[#8A9BA8] mb-4">
                  {t.shareMessage}<br />
                  {t.multiplyReward} <span className="text-[#D4AF37] font-bold">{t.times70}</span>.
                </p>
                <div className="flex justify-center gap-3">
                  <a 
                    href={shareLinks.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-xl bg-[#25D366] flex items-center justify-center hover:scale-110 transition-transform"
                  >
                    <MessageCircle className="w-6 h-6 text-white" />
                  </a>
                  <a 
                    href={shareLinks.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-xl bg-[#0088cc] flex items-center justify-center hover:scale-110 transition-transform"
                  >
                    <Send className="w-6 h-6 text-white" />
                  </a>
                  <a 
                    href={shareLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-xl bg-[#1DA1F2] flex items-center justify-center hover:scale-110 transition-transform"
                  >
                    <Twitter className="w-6 h-6 text-white" />
                  </a>
                  <button 
                    onClick={copyLink}
                    className="w-12 h-12 rounded-xl glass-card flex items-center justify-center hover:bg-white/10 transition-colors"
                  >
                    <Link2 className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => scrollToView('dashboard')}
                  className="btn-secondary flex items-center justify-center gap-2"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  {t.viewDashboard}
                </button>
                <button 
                  onClick={() => scrollToView('hero')}
                  className="btn-primary flex items-center justify-center gap-2"
                >
                  {t.sponsorMore}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </section>
        )}
        
        {/* FAILURE SECTION */}
        {currentView === 'failure' && (
          <section className="section-container min-h-screen py-20">
            <div className="max-w-xl mx-auto w-full text-center">
              {/* Failure Icon */}
              <div className="w-24 h-24 rounded-full bg-[#ef4444]/20 flex items-center justify-center mx-auto mb-8">
                <X className="w-12 h-12 text-[#ef4444]" />
              </div>
              
              <h2 className="text-3xl font-bold mb-4">{t.paymentFailed}</h2>
              <p className="text-[#8A9BA8] mb-8">
                {t.retryMessage}
              </p>
              
              {/* Summary */}
              <div className="glass-card rounded-2xl p-6 mb-8 text-left">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/10">
                  <span className="text-[#8A9BA8]">{t.amount}</span>
                  <span className="font-bold text-xl">₹{donationData.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/10">
                  <span className="text-[#8A9BA8]">{t.hadiths}</span>
                  <span className="font-bold text-xl">{donationData.quantity}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#8A9BA8]">{t.remainingAfter}</span>
                  <span className="font-bold text-xl">{(stats.remaining - donationData.quantity).toLocaleString()}</span>
                </div>
              </div>
              
              {/* Urgency */}
              <div className="urgency-banner mb-8">
                <span>{t.retryUrgency}</span>
              </div>
              
              {/* Retry Button */}
              <button 
                onClick={handleRetryPayment}
                disabled={isSubmitting}
                className="w-full btn-primary flex items-center justify-center gap-2 mb-6 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                {t.retryPayment}
              </button>
              
              {/* Manual Payment Options */}
              <div className="glass-card rounded-2xl p-6 mb-6 text-left">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#D4AF37]" />
                  {t.manualPayment}
                </h3>
                
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Landmark className="w-4 h-4 text-[#8A9BA8]" />
                      <span className="text-sm font-medium">{t.bankTransfer}</span>
                    </div>
                    <p className="text-xs text-[#8A9BA8] font-mono">
                      {t.account}: Aalim Foundation<br />
                      IBAN: PK00AAAA0000000000000000<br />
                      {t.bank}: Islamic Bank
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Smartphone className="w-4 h-4 text-[#8A9BA8]" />
                      <span className="text-sm font-medium">{t.upiMobile}</span>
                    </div>
                    <p className="text-xs text-[#8A9BA8] font-mono">
                      {t.upi}: aalim@upi<br />
                      {t.phone}: +92-300-0000000
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Support */}
              <div className="text-sm text-[#8A9BA8]">
                {t.needHelp}{' '}
                <a href="mailto:support@aalim.org" className="text-[#D4AF37] hover:underline">
                  support@aalim.org
                </a>
                {' '}or{' '}
                <a href="tel:+923000000000" className="text-[#D4AF37] hover:underline">
                  +92-300-0000000
                </a>
              </div>
            </div>
          </section>
        )}
        
        {/* DASHBOARD SECTION */}
        {currentView === 'dashboard' && (
          <section className="section-container min-h-screen py-20">
            <div className="max-w-4xl mx-auto w-full">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold">{t.yourDashboard}</h2>
                  <p className="text-[#8A9BA8] flex items-center gap-2 mt-1">
                    <User className="w-4 h-4" />
                    {donationData.email || loginEmail || 'guest@example.com'}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    localStorage.removeItem('donorToken')
                    setIsLoggedIn(false)
                    scrollToView('hero')
                  }}
                  className="p-2 rounded-xl glass-card hover:bg-white/10 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-[#0B3D3D] to-[#1A5F5F]">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                    <BookOpen className="w-6 h-6 text-[#D4AF37]" />
                  </div>
                  <div className="text-4xl font-bold mb-1">
                    {isLoadingHistory ? <Loader2 className="w-8 h-8 animate-spin" /> : donationHistory.reduce((acc, d) => acc + d.quantity, 0)}
                  </div>
                  <div className="text-sm text-white/70">{t.totalHadithsSponsored}</div>
                </div>
                
                <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-[#D4AF37] to-[#C59A2E] text-[#05101A]">
                  <div className="w-12 h-12 rounded-xl bg-black/10 flex items-center justify-center mb-4">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div className="text-4xl font-bold mb-1">
                    ₹{donationHistory.reduce((acc, d) => acc + d.amount, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-black/60">{t.totalContribution}</div>
                </div>
              </div>
              
              {/* History */}
              <h3 className="text-xl font-bold mb-4">{t.sponsorshipHistory}</h3>
              {isLoadingHistory ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
                </div>
              ) : (
                <div className="space-y-4">
                  {donationHistory.length === 0 ? (
                    <p className="text-[#8A9BA8] text-center py-8">No donations yet</p>
                  ) : (
                    donationHistory.map((record) => (
                      <div key={record.id} className="glass-card rounded-2xl p-4 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-lg">{record.quantity} Hadiths</div>
                          <div className="text-sm text-[#8A9BA8] flex items-center gap-2">
                            <span>{record.date}</span>
                            {record.dedication && (
                              <span className="text-[#D4AF37]">• {record.dedication}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gradient-gold text-xl">
                            ₹{record.amount.toLocaleString()}
                          </div>
                          {record.receiptUrl && (
                            <a 
                              href={record.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-[#8A9BA8] hover:text-[#D4AF37] flex items-center gap-1 mt-1"
                            >
                              <Download className="w-3 h-3" />
                              {t.receipt}
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
              
              {/* Urgency */}
              <div className="urgency-banner mt-8">
                <span>{t.keepGoing}</span>
              </div>
              
              {/* CTA */}
              <button 
                onClick={() => scrollToView('select')}
                className="w-full btn-primary flex items-center justify-center gap-2 mt-8"
              >
                {t.sponsorMoreHadiths}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </section>
        )}
      </main>
      
      {/* Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="glass-card border-white/10 text-[#E0E6ED]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">{t.accessDashboard}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label className="text-sm text-[#8A9BA8] mb-2 block">{t.email.replace(' *', '')}</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8A9BA8]" />
                <Input
                  type="email"
                  placeholder={t.emailPlaceholder}
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="input-field pl-12"
                />
              </div>
            </div>
            <p className="text-xs text-[#8A9BA8] text-center">
              {t.loginMessage}
            </p>
            <Button 
              onClick={handleLogin}
              className="w-full btn-primary"
              disabled={!loginEmail}
            >
              {t.continue}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Footer */}
      <footer className="relative z-10 py-8 px-4 text-center text-sm text-[#8A9BA8]">
        <p>© 2025 Aalim Foundation. All rights reserved.</p>
        <p className="mt-2">
          <a href="#" className="hover:text-[#D4AF37] transition-colors">Privacy Policy</a>
          {' • '}
          <a href="#" className="hover:text-[#D4AF37] transition-colors">Terms of Service</a>
        </p>
      </footer>
    </div>
  )
}

export default App

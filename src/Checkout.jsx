import React, { useState } from 'react';
import { useCart } from './CartContext';
import { FlutterWaveButton, closePaymentModal } from 'flutterwave-react-v3';
// db import removed
import { ApiService } from './services/api';
import { useNavigate, Link } from 'react-router-dom';
import { Trash2, ShoppingBag, AlertCircle, Lock, ArrowLeft } from 'lucide-react';

export default function Checkout() {
    const { cart, total, clearCart, removeFromCart } = useCart();
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);
    const navigate = useNavigate();

    const validateForm = () => {
        const newErrors = {};
        if (!name.trim()) newErrors.name = 'Required';
        if (!email.trim()) newErrors.email = 'Required';
        else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email';
        if (!phone.trim()) newErrors.phone = 'Required';
        else if (!/^0\d{10}$/.test(phone.replace(/\s/g, ''))) {
            newErrors.phone = 'Invalid phone';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const config = {
        public_key: import.meta.env.VITE_FLW_PUBLIC_KEY,
        tx_ref: `ARIYO-${Date.now()}`,
        amount: total,
        currency: 'NGN',
        payment_options: 'card,mobilemoney,ussd,banktransfer',
        customer: { email, phone_number: phone, name },
        customizations: {
            title: 'Ariyo Home Of Fashion',
            description: 'Payment for fashion items',
            logo: '/ariyologo.png',
        },
    };

    const handleSuccess = async (response) => {
        setProcessing(true);
        try {
            // Create order via API (backend verifies payment)
            const orderResponse = await ApiService.createOrder({
                customer: { name, email, phone },
                items: cart,
                total,
                paymentRef: response.transaction_id,
                flwRef: response.flw_ref
            });

            closePaymentModal();
            clearCart();
            navigate(`/success/${orderResponse.data.orderId}`);
        } catch (error) {
            console.error("Order error:", error);
            alert("Order processing failed. Please contact support if payment was debited.");
        }
        setProcessing(false);
    };

    const fwConfig = {
        ...config,
        text: processing ? 'Processing...' : `Pay ₦${total.toLocaleString()}`,
        callback: handleSuccess,
        onClose: () => { },
    };

    const isFormValid = name && email && phone && cart.length > 0;

    // Empty Cart
    if (cart.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
                <ShoppingBag size={64} className="text-gray-700 mb-8" />
                <h2 className="font-display text-3xl text-white mb-4">Your Bag is Empty</h2>
                <p className="text-gray-500 mb-12 max-w-md">
                    Browse our collection and add items to your bag
                </p>
                <Link to="/shop" className="btn-elegant">
                    View Collection
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-ivory dark:bg-onyx-950 pt-24 pb-20 transition-colors duration-300">
            {/* Header */}
            <header className="text-center py-12 px-6">
                <p className="font-script text-gold-600 dark:text-gold-400 text-2xl mb-4">Checkout</p>
                <h1 className="font-display text-4xl md:text-5xl font-light text-onyx-900 dark:text-white mb-4 tracking-wide">
                    YOUR BAG
                </h1>
                <div className="divider-gold" />
            </header>

            <div className="max-w-5xl mx-auto px-6">
                <div className="grid lg:grid-cols-2 gap-16">
                    {/* Cart Items */}
                    <div>
                        <h2 className="font-display text-xl text-onyx-900 dark:text-white mb-8 tracking-wide">
                            ORDER SUMMARY
                        </h2>

                        <div className="space-y-6">
                            {cart.map((item, idx) => (
                                <div key={idx} className="flex gap-6 pb-6 border-b border-white/5">
                                    <img
                                        src={item.image_url}
                                        alt={item.name}
                                        className="w-24 h-32 object-cover"
                                    />
                                    <div className="flex-1">
                                        <h3 className="font-display text-lg text-white mb-1">
                                            {item.name}
                                        </h3>
                                        <p className="price-tag text-lg mb-4">
                                            ₦{Number(item.price).toLocaleString()}
                                        </p>
                                        <button
                                            onClick={() => removeFromCart(idx)}
                                            className="text-gray-500 hover:text-red-400 text-sm flex items-center gap-2 transition-colors"
                                        >
                                            <Trash2 size={14} /> Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Total */}
                        <div className="mt-8 pt-8 border-t border-onyx-900/10 dark:border-white/10">
                            <div className="flex justify-between items-center">
                                <span className="font-display text-lg text-gray-600 dark:text-gray-400">Total</span>
                                <span className="font-display text-3xl text-gold-600 dark:text-gold-400">
                                    ₦{total.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <Link to="/shop" className="inline-flex items-center gap-2 text-gray-500 hover:text-gold-400 mt-8 text-sm transition-colors">
                            <ArrowLeft size={16} /> Continue Shopping
                        </Link>
                    </div>

                    {/* Checkout Form */}
                    <div>
                        <h2 className="font-display text-xl text-onyx-900 dark:text-white mb-8 tracking-wide">
                            CUSTOMER DETAILS
                        </h2>

                        <div className="space-y-8 mb-12">
                            <div>
                                <input
                                    placeholder="FULL NAME"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className={`bg-transparent text-onyx-900 dark:text-white border-b border-gray-300 dark:border-gray-700 w-full py-2 outline-none ${errors.name ? 'border-b-red-500' : ''}`}
                                />
                                {errors.name && (
                                    <p className="text-red-400 text-xs mt-2">{errors.name}</p>
                                )}
                            </div>
                            <div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={`bg-transparent text-onyx-900 dark:text-white border-b border-gray-300 dark:border-gray-700 w-full py-2 outline-none ${errors.email ? 'border-b-red-500' : ''}`}
                                />
                                {errors.email && (
                                    <p className="text-red-400 text-xs mt-2">{errors.email}</p>
                                )}
                            </div>
                            <div>
                                <input
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className={`bg-transparent text-onyx-900 dark:text-white border-b border-gray-300 dark:border-gray-700 w-full py-2 outline-none ${errors.phone ? 'border-b-red-500' : ''}`}
                                />
                                {errors.phone && (
                                    <p className="text-red-400 text-xs mt-2">{errors.phone}</p>
                                )}
                            </div>
                        </div>

                        {/* Security Note */}
                        <div className="flex items-start gap-4 mb-8 p-6 border border-onyx-900/5 dark:border-white/5 bg-onyx-900/5 dark:bg-white/5">
                            <Lock size={18} className="text-gold-600 dark:text-gold-400 mt-1" />
                            <p className="text-gray-600 dark:text-gray-500 text-sm leading-relaxed">
                                Your payment is secured by Flutterwave. We never store your card details.
                            </p>
                        </div>

                        <FlutterWaveButton
                            {...fwConfig}
                            disabled={!isFormValid || processing}
                            onClick={() => validateForm()}
                            className={`w-full font-display text-sm tracking-[0.2em] uppercase py-5 transition-all ${isFormValid
                                ? 'bg-gold-600 dark:bg-gold-400 text-white dark:text-black hover:bg-gold-700 dark:hover:bg-gold-500'
                                : 'bg-gray-300 dark:bg-gray-800 text-gray-500 cursor-not-allowed'
                                }`}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
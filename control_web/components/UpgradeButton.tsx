"use client";

import React from 'react';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { useAuthStore } from '@/lib/store';
import { ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface UpgradeButtonProps {
  planName: string;
  amount: number;
  isPopular?: boolean;
  disabled?: boolean;
}

export default function UpgradeButton({ planName, amount, isPopular, disabled }: UpgradeButtonProps) {
  const { user } = useAuthStore();

  const config = {
    public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || '',
    tx_ref: `ctrl_${user?.id?.substring(0, 8)}_${Date.now()}`,
    amount: amount,
    currency: 'USD',
    payment_options: 'card,mobilemoney,ussd',
    customer: {
      email: user?.email || '',
      phone_number: '',
      name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'Customer',
    },
    customizations: {
      title: `Control ${planName} Plan`,
      description: `Upgrade to the ${planName} plan for enhanced agent compute.`,
      logo: 'https://assets.streamlinehq.com/image/private/w_300,h_300,ar_1/f_auto/v1/icons/c4/mac-command-a2vt7pg56bsgb88g0ccq.png/mac-command-4o0jizhxme58pxunu7xtec.png?_a=DATAiZiuZAA0',
    },
    meta: {
      userId: user?.id,
      plan: planName.toLowerCase()
    }
  };

  const handleFlutterPayment = useFlutterwave(config);

  const handleClick = () => {
    if (!user) {
      toast.error("Please log in to upgrade your plan.");
      return;
    }

    if (!config.public_key) {
      toast.error("Flutterwave configuration missing.");
      return;
    }

    handleFlutterPayment({
      callback: (response) => {
        console.log("Payment response:", response);
        if (response.status === "successful") {
          toast.success("Payment successful! Your plan will be updated shortly.");
          // Redirect to workspace with success param
          window.location.href = '/workspace?payment=success';
        } else {
          toast.error("Payment failed or was cancelled.");
        }
        closePaymentModal();
      },
      onClose: () => {
        console.log("Payment modal closed");
      },
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${isPopular
          ? "bg-black text-white hover:bg-zinc-800"
          : "bg-white text-black hover:bg-zinc-200"
        } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
    >
      {disabled ? "Current Plan" : (
        <>
          Upgrade Now
          <ArrowRight size={14} />
        </>
      )}
    </button>
  );
}

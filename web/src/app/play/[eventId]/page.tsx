"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { joinEvent } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Loader2, Phone, CheckCircle2 } from "lucide-react";
import PhoneInput from "react-phone-number-input";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import "react-phone-number-input/style.css";

export default function PlayPage() {
  const { eventId } = useParams() as { eventId: string };
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"joining" | "registered">("joining");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const normalizeName = (value: string) => value.trim().replace(/\s+/g, " ");
  const isValidName = (value: string) => /^[\p{L} ]+$/u.test(value);
  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const trimmedName = normalizeName(name);
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError("Name is required.");
      setLoading(false);
      return;
    }

    if (!isValidName(trimmedName)) {
      setError("Name can only contain letters and spaces.");
      setLoading(false);
      return;
    }

    if (!trimmedEmail) {
      setError("Email is required.");
      setLoading(false);
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    if (!phone) {
      setError("Phone number is required.");
      setLoading(false);
      return;
    }

    const phoneNumberObj = parsePhoneNumberFromString(phone);
    if (!phoneNumberObj || !phoneNumberObj.isPossible()) {
      setError(
        "Please enter a valid phone number with the correct number of digits for your country.",
      );
      setLoading(false);
      return;
    }
    try {
      setName(trimmedName);
      setEmail(trimmedEmail);
      await joinEvent(eventId, trimmedName, trimmedEmail, phone);
      setStatus("registered");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.05 },
  };

  if (status === "registered") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-white p-12 text-center overflow-hidden">
        <div className="scanline" />
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="z-10 bg-glass p-10 rounded-[40px] border-2 border-primary/30 shadow-2xl"
        >
          <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mb-8 mx-auto shadow-[0_0_30px_rgba(0,210,255,0.4)]">
            <CheckCircle2 size={48} className="text-black" strokeWidth={3} />
          </div>
          <h2 className="text-3xl font-black font-orbitron uppercase tracking-tighter mb-4 text-glow-blue">
            READY FOR BATTLE
          </h2>
          <p className="text-white font-medium mb-6 uppercase tracking-widest text-sm italic">
            You are registered, {name}!
          </p>
          <p className="text-primary/40 font-orbitron font-bold text-[10px] uppercase tracking-[0.3em] leading-relaxed">
            Please proceed to the main screen <br />
            to start your turn.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-white p-8 relative overflow-hidden">
      <div className="scanline" />
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full relative z-10"
      >
        <header className="mb-14">
          <h1 className="text-5xl font-black font-orbitron italic tracking-tighter uppercase leading-[0.8] mb-4">
            JOIN <br />
            <span className="text-primary text-glow-blue">ARENA</span>
          </h1>
          <p className="text-primary/40 font-orbitron font-bold text-[10px] uppercase tracking-[0.3em]">
            Initialize Combat Link
          </p>
        </header>

        <form onSubmit={handleJoin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-orbitron font-black uppercase text-primary/40 flex items-center gap-2">
              <User size={12} /> Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black/40 border-b-2 border-white/10 p-4 focus:border-primary focus:outline-none transition-all font-orbitron text-sm uppercase tracking-widest text-white"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-orbitron font-black uppercase text-primary/40 flex items-center gap-2">
              <Mail size={12} /> Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/40 border-b-2 border-white/10 p-4 focus:border-primary focus:outline-none transition-all font-orbitron text-sm text-white"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-orbitron font-black uppercase text-primary/40 flex items-center gap-2">
              <Phone size={12} /> Phone
            </label>
            <PhoneInput
              international
              defaultCountry="BE"
              value={phone}
              onChange={(val) => setPhone(val || "")}
              limitMaxLength={true}
              className="bg-black/40 border-b-2 border-white/10 p-4 focus-within:border-primary transition-all font-orbitron text-sm text-white phone-input-custom"
              numberInputProps={{
                className: "bg-transparent outline-none w-full ml-2",
                required: true,
              }}
            />
          </div>

          {error && (
            <p className="text-rose-500 text-[10px] font-orbitron uppercase tracking-widest font-black">
              Error: {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="cursor-pointer w-full mt-10 bg-primary text-black py-6 rounded-2xl font-black font-orbitron text-lg uppercase tracking-widest hover:bg-white transition-all shadow-2xl relative group overflow-hidden"
          >
            <div className="absolute inset-x-0 h-1 bg-white/20 top-0 group-hover:animate-pulse" />
            {loading ? (
              <Loader2 className="animate-spin mx-auto" />
            ) : (
              "REGISTER PLAYER"
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

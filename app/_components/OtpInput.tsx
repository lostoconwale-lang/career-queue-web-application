"use client";

import { useEffect, useRef, useState } from "react";
import type { ClipboardEvent, KeyboardEvent } from "react";
import { motion } from "framer-motion";

type Props = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  error?: boolean;
  disabled?: boolean;
};

const boxVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: 0.04 * i, duration: 0.25, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

// A 4-box OTP entry, not a single text field — auto-advances on digit entry,
// supports backspace/arrow-key navigation and pasting the whole code at once.
export function OtpInput({ value, onChange, length = 4, error, disabled }: Props) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const prevValueRef = useRef(value);
  const mountedRef = useRef(false);

  // Focus the first box on mount, and again whenever the value gets cleared
  // back to empty (e.g. the parent resets it after a wrong code) — but not
  // on every unrelated re-render while it's already empty.
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      inputRefs.current[0]?.focus();
    } else if (value === "" && prevValueRef.current !== "") {
      inputRefs.current[0]?.focus();
    }
    prevValueRef.current = value;
  }, [value]);

  // Adjusted during render, not in an effect: bumping shakeToken here (React's
  // documented pattern for "reset state when a prop changes") re-triggers the
  // shake animation each time the parent flips `error` to true, without an
  // effect-body setState.
  const isError = Boolean(error);
  const [prevError, setPrevError] = useState(isError);
  const [shakeToken, setShakeToken] = useState(0);
  if (isError !== prevError) {
    setPrevError(isError);
    if (isError) setShakeToken((t) => t + 1);
  }

  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  function setDigitAt(index: number, char: string) {
    const next = digits.slice();
    next[index] = char;
    onChange(next.join("").slice(0, length));
  }

  function handleChange(index: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    setDigitAt(index, digit);
    if (digit && index < length - 1) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      event.preventDefault();
      if (digits[index]) {
        setDigitAt(index, "");
      } else if (index > 0) {
        setDigitAt(index - 1, "");
        inputRefs.current[index - 1]?.focus();
      }
    } else if (event.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    event.preventDefault();
    onChange(pasted);
    inputRefs.current[Math.min(pasted.length, length - 1)]?.focus();
  }

  return (
    <motion.div
      animate={shakeToken ? { x: [0, -8, 8, -8, 8, 0] } : { x: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="flex justify-center gap-3"
    >
      {digits.map((digit, index) => (
        <motion.input
          key={index}
          custom={index}
          variants={boxVariants}
          initial="hidden"
          animate="visible"
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onFocus={(event) => event.target.select()}
          aria-label={`Digit ${index + 1} of ${length}`}
          className={`h-14 w-12 rounded-2xl border text-center text-2xl font-semibold outline-none transition-colors duration-150 sm:h-16 sm:w-14 ${
            error
              ? "border-coral bg-coral/5 text-coral focus:ring-coral/10"
              : "border-line bg-surface text-ink focus:border-brand focus:ring-brand/10"
          } focus:ring-4 disabled:opacity-60`}
        />
      ))}
    </motion.div>
  );
}

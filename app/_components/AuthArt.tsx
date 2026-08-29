"use client";

import type { PointerEvent } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";

import { Sparkle } from "./Icons";

const ART = {
  register: {
    src: "/images/auth-register.png",
    alt: "Illustration of a person setting up their job profile",
  },
  login: {
    src: "/images/auth-login.png",
    alt: "Illustration of a person searching for jobs at a laptop",
  },
} as const;

export default function AuthArt() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const art = pathname === "/register" ? ART.register : ART.login;

  // Pointer position within the panel, normalised to roughly -0.5..0.5.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 120, damping: 20 });
  const sy = useSpring(py, { stiffness: 120, damping: 20 });

  const imageX = useTransform(sx, (v) => v * 22);
  const imageY = useTransform(sy, (v) => v * 22);
  const rotateY = useTransform(sx, (v) => v * 7);
  const rotateX = useTransform(sy, (v) => v * -7);
  const accentX = useTransform(sx, (v) => v * -44);
  const accentY = useTransform(sy, (v) => v * -44);

  function handleMove(event: PointerEvent<HTMLDivElement>) {
    if (reduceMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    px.set((event.clientX - rect.left) / rect.width - 0.5);
    py.set((event.clientY - rect.top) / rect.height - 0.5);
  }

  function handleLeave() {
    px.set(0);
    py.set(0);
  }

  const float = (distance: number, duration: number) =>
    reduceMotion
      ? undefined
      : {
          animate: { y: [0, distance, 0] },
          transition: { duration, repeat: Infinity, ease: "easeInOut" as const },
        };

  return (
    <div
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      style={{ perspective: 1200 }}
      className="bg-cream border-line relative hidden items-center justify-center overflow-hidden border-l p-12 lg:flex"
    >
      <motion.div
        aria-hidden
        style={{ x: accentX, y: accentY }}
        className="pointer-events-none absolute inset-0"
      >
        <motion.span
          className="bg-brand-soft absolute top-[16%] left-[12%] h-28 w-28 rounded-full blur-2xl"
          {...float(-18, 7)}
        />
        <motion.span
          className="bg-coral/20 absolute right-[12%] bottom-[15%] h-32 w-32 rounded-full blur-2xl"
          {...float(20, 9)}
        />
        <motion.span
          className="border-brand/15 absolute top-[24%] right-[18%] h-16 w-16 rounded-2xl border-2"
          {...float(14, 6)}
        />
        <motion.span
          className="text-coral absolute bottom-[24%] left-[18%]"
          animate={reduceMotion ? undefined : { opacity: [0.4, 1, 0.4], scale: [0.9, 1, 0.9] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkle className="h-6 w-6" />
        </motion.span>
        <motion.span
          className="text-brand/40 absolute top-[20%] left-[42%]"
          animate={reduceMotion ? undefined : { opacity: [1, 0.4, 1], scale: [1, 0.85, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >
          <Sparkle className="h-4 w-4" />
        </motion.span>
      </motion.div>

      <motion.div
        style={{ x: imageX, y: imageY, rotateX, rotateY }}
        className="relative w-full max-w-md transform-3d"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={art.src}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image
              src={art.src}
              alt={art.alt}
              width={1216}
              height={1536}
              priority
              sizes="(min-width: 1024px) 45vw, 0px"
              className="h-auto w-full rounded-2xl object-cover object-center"
            />
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

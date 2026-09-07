"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

import type { ApiResponse } from "@/types/api";
import type { PublicFaqDTO } from "@/types/public-faq";
import { Chevron } from "./Icons";
import Reveal from "./Reveal";

export default function FAQ() {
  const [faqs, setFaqs] = useState<PublicFaqDTO[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  // Active FAQ entries — cached + tag-revalidated on the server
  // (/api/v1/public/faqs), so this is a cheap hit and refreshes whenever an
  // admin edits the FAQ list.
  useEffect(() => {
    let alive = true;
    fetch("/api/v1/public/faqs")
      .then((res) => res.json() as Promise<ApiResponse<PublicFaqDTO[]>>)
      .then((json) => {
        if (!alive || !json.success) return;
        setFaqs(json.data);
        setOpenId(json.data[0]?.id ?? null);
      })
      .catch(() => {
        // A failed fetch just leaves the section empty — nothing to surface.
      });
    return () => {
      alive = false;
    };
  }, []);

  if (faqs.length === 0) return null;

  return (
    <section id="faq" className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
      <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-16">
        {/* Fills the desktop whitespace beside the (narrow) accordion column. */}
        <div className="text-center lg:text-left">
          <p className="text-brand text-sm font-semibold tracking-[0.18em] uppercase">FAQ</p>
          <h2 className="font-display text-ink mt-6 text-4xl leading-[1.1] font-semibold tracking-tight sm:text-5xl">
            The usual <span className="text-brand font-light italic">questions</span>
          </h2>
          <p className="text-muted mx-auto mt-5 hidden max-w-sm text-lg leading-relaxed lg:mx-0 lg:block">
            The ones that come up most often — answered before you even ask.
          </p>
          <Image
            src="/images/faq-clay.webp"
            alt=""
            width={1200}
            height={1607}
            className="animate-float pointer-events-none mx-auto mt-10 hidden w-full max-w-xs select-none lg:mx-0 lg:block"
          />
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openId === faq.id;

            return (
              <Reveal key={faq.id} delay={index * 0.05}>
                <div
                  className={`rounded-card bg-surface border transition-colors duration-300 ${
                    isOpen
                      ? "border-brand/30 shadow-lift"
                      : "border-line shadow-soft hover:border-brand/20"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : faq.id)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${faq.id}`}
                    className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left"
                  >
                    <span
                      className={`font-semibold transition-colors duration-300 ${
                        isOpen ? "text-brand" : "text-ink"
                      }`}
                    >
                      {faq.question}
                    </span>
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors duration-300 ${
                        isOpen ? "bg-brand text-surface" : "bg-brand-soft text-brand"
                      }`}
                    >
                      <Chevron
                        className={`h-4 w-4 transition-transform duration-300 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`faq-answer-${faq.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="text-muted px-6 pb-6 leading-relaxed sm:pr-16">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

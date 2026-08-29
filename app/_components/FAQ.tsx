"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { faqs } from "../_data";
import { Chevron } from "./Icons";
import Reveal from "./Reveal";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="mx-auto max-w-3xl px-5 py-24 sm:px-8 sm:py-32">
      <Reveal className="text-center">
        <p className="text-brand text-sm font-semibold tracking-[0.18em] uppercase">FAQ</p>
        <h2 className="font-display text-ink mt-6 text-4xl leading-[1.1] font-semibold tracking-tight sm:text-5xl">
          The usual <span className="text-brand font-light italic">questions</span>
        </h2>
      </Reveal>

      <div className="mt-12 space-y-3">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;

          return (
            <Reveal key={faq.question} delay={index * 0.05}>
              <div
                className={`rounded-card bg-surface border transition-colors duration-300 ${
                  isOpen
                    ? "border-brand/30 shadow-lift"
                    : "border-line shadow-soft hover:border-brand/20"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
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
                      id={`faq-answer-${index}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="text-muted px-6 pb-6 leading-relaxed sm:pr-16">{faq.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { Mail, ChevronDown } from "lucide-react";
import { useState } from "react";
import type { StaticPageContent } from "@/lib/static-pages-content";

function FaqAccordionItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-white sm:text-base">{question}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm leading-relaxed text-gray-400">{answer}</div>
      )}
    </div>
  );
}

export default function StaticPageContentView({ content }: { content: StaticPageContent }) {
  return (
    <section className="min-h-[70vh] px-4 py-10 lg:px-6">
      <div className="mx-auto max-w-[900px]">
        <div className="mb-10">
          <p className="mb-2 text-sm font-semibold uppercase text-[#E50914]">Live Sports</p>
          <h1 className="font-heading text-3xl font-black text-white lg:text-5xl">{content.title}</h1>
          {content.subtitle && (
            <p className="mt-3 max-w-2xl text-sm text-gray-400 lg:text-base">{content.subtitle}</p>
          )}
          {content.lastUpdated && (
            <p className="mt-4 text-xs uppercase tracking-wide text-gray-500">{content.lastUpdated}</p>
          )}
        </div>

        {content.sections && (
          <div className="space-y-8">
            {content.sections.map((section, i) => (
              <div key={i}>
                {section.heading && (
                  <h2 className="mb-3 text-lg font-bold text-white lg:text-xl">{section.heading}</h2>
                )}
                <div className="space-y-3">
                  {section.body.map((paragraph, j) => (
                    <p key={j} className="text-sm leading-relaxed text-gray-400 lg:text-base">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {content.faqs && (
          <div className="space-y-3">
            {content.faqs.map((faq, i) => (
              <FaqAccordionItem key={i} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        )}

        {content.contactChannels && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {content.contactChannels.map((channel) => (
              <a
                key={channel.label}
                href={channel.href}
                className="flex items-center gap-3 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4 transition-colors hover:border-[#E50914]/50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E50914]/10 text-[#E50914]">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{channel.label}</p>
                  <p className="text-sm font-medium text-white">{channel.value}</p>
                </div>
              </a>
            ))}
          </div>
        )}

        <div className="mt-12 border-t border-[#2A2A2A] pt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-[#E50914] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#B00000]"
          >
            Voltar ao inicio
          </Link>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const QUESTIONS = [
  {
    question: "What is BizTrack?",
    answer:
      "BizTrack is a simple business workspace for recording money coming in and going out, keeping product stock, and seeing those records in one overview.",
  },
  {
    question: "Who can use BizTrack?",
    answer:
      "It is meant for small business owners, shopkeepers, retailers, and other people who want a straightforward record of daily business activity.",
  },
  {
    question: "Can I track both money and inventory?",
    answer:
      "Yes. You can record financial transactions and manage products, quantities, and inventory value in the same workspace.",
  },
  {
    question: "Is BizTrack suitable for small businesses?",
    answer:
      "Yes. It is built for small operations that need clear money and stock records without a large accounting system.",
  },
  {
    question: "Can I manage multiple businesses?",
    answer:
      "BizTrack is organized around a business workspace. Whether you can keep more than one business on an account depends on the current plan and what is available in the product today.",
  },
  {
    question: "Is my business information secure?",
    answer:
      "You sign in to open a workspace. Records are kept with that business, and changes to money and inventory are written to an audit history. BizTrack does not advertise a third-party security certification.",
  },
];

export function FaqList() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
      {QUESTIONS.map((item, index) => {
        const open = openIndex === index;
        const panelId = `faq-panel-${index}`;
        const buttonId = `faq-button-${index}`;

        return (
          <div key={item.question}>
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenIndex(open ? -1 : index)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-50 sm:px-6 sm:text-base"
              >
                {item.question}
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-slate-400 transition-transform duration-200 motion-reduce:transition-none",
                    open && "rotate-180",
                  )}
                  aria-hidden="true"
                />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!open}
              className="px-5 pb-5 text-sm leading-6 text-slate-600 sm:px-6"
            >
              {item.answer}
            </div>
          </div>
        );
      })}
    </div>
  );
}

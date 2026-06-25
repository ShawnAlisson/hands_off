"use client";

import { useState } from "react";
import type { SiteVariant } from "@/lib/site-templates";
import type { SiteContent } from "@/lib/types";

export function SiteShell({
  businessName,
  city,
  sector,
  accent,
  children,
  navCta,
}: {
  businessName: string;
  city: string;
  sector: string;
  accent: { from: string; to: string; ring: string };
  children: React.ReactNode;
  navCta?: string;
}) {
  const slug = businessName.split(" ")[0];
  return (
    <div className="bg-white text-gray-900">
      <nav className="flex items-center justify-between border-b border-gray-100 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${accent.from} ${accent.to} text-xs font-bold text-white`}>
            {slug.slice(0, 2).toUpperCase()}
          </div>
          <span className="text-sm font-semibold">{businessName}</span>
        </div>
        <div className="hidden items-center gap-4 text-xs text-gray-500 sm:flex">
          <span>Services</span>
          <span>About</span>
          <span>Contact</span>
        </div>
        {navCta && (
          <button type="button" className={`rounded-lg bg-gradient-to-r ${accent.from} ${accent.to} px-3 py-1.5 text-xs font-semibold text-white`}>
            {navCta}
          </button>
        )}
      </nav>

      <div className={`bg-gradient-to-br ${accent.from} ${accent.to} px-4 py-8 text-white sm:px-6 sm:py-10`}>
        <p className="text-[10px] font-medium uppercase tracking-widest text-white/70">{sector}</p>
        <h1 className="mt-1 text-xl font-bold sm:text-2xl">{businessName}</h1>
        <p className="mt-1 text-sm text-white/80">{city} · Trusted local business</p>
      </div>

      <div className="px-4 py-6 sm:px-6">{children}</div>

      <footer className="border-t border-gray-100 bg-gray-50 px-4 py-4 text-center text-[10px] text-gray-400 sm:px-6">
        © {new Date().getFullYear()} {businessName} · {city} · Mon–Sat 9am–6pm
      </footer>
    </div>
  );
}

export function SiteFixWidget({
  variant,
  fixed,
  businessName,
  content,
}: {
  variant: SiteVariant;
  fixed: boolean;
  businessName: string;
  content?: SiteContent;
}) {
  switch (variant) {
    case "booking":
      return <BookingWidget fixed={fixed} businessName={businessName} content={content} />;
    case "portal":
      return <PortalWidget fixed={fixed} businessName={businessName} />;
    case "payments":
      return <PaymentsWidget fixed={fixed} content={content} />;
    case "reviews":
      return <ReviewsWidget fixed={fixed} businessName={businessName} />;
    case "delivery":
      return <DeliveryWidget fixed={fixed} businessName={businessName} />;
    case "loyalty":
      return <LoyaltyWidget fixed={fixed} />;
    case "ecommerce":
      return <ShopWidget fixed={fixed} businessName={businessName} />;
    case "website":
      return <WebsiteRedesignWidget fixed={fixed} businessName={businessName} content={content} />;
    default:
      return <ContactWidget fixed={fixed} businessName={businessName} content={content} />;
  }
}

function Field({ label, placeholder, disabled }: { label: string; placeholder: string; disabled?: boolean }) {
  return (
    <label className="block">
      <span className="text-[10px] font-medium text-gray-500">{label}</span>
      <input
        type="text"
        placeholder={placeholder}
        disabled={disabled}
        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs disabled:bg-gray-100 disabled:text-gray-400"
      />
    </label>
  );
}

function BookingWidget({ fixed, businessName, content }: { fixed: boolean; businessName: string; content?: SiteContent }) {
  const [slot, setSlot] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);
  const slots = ["09:30", "11:00", "14:30", "16:00"];

  if (!fixed) {
    return (
      <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/40 p-5">
        <p className="text-sm font-semibold text-amber-900">Book an appointment</p>
        <p className="mt-2 text-xs text-amber-800">Online booking is not available on this site.</p>
        <div className="mt-4 grid grid-cols-7 gap-1 opacity-40">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="aspect-square rounded bg-gray-200 text-[8px] flex items-center justify-center text-gray-400">
              {i + 1}
            </div>
          ))}
        </div>
        <p className="mt-4 rounded-lg bg-white p-3 text-center text-sm font-medium text-gray-600">
          📞 Call us to book: 020 7946 0958
        </p>
      </div>
    );
  }

  if (booked) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center">
        <p className="text-lg">✓</p>
        <p className="mt-1 text-sm font-semibold text-green-900">Booking confirmed</p>
        <p className="mt-1 text-xs text-green-700">{slot} · SMS confirmation sent</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold">{content?.featureTitle ?? "Book online"}</p>
      <p className="mt-1 text-xs text-gray-500">{content?.featureDescription ?? `Pick a slot at ${businessName}`}</p>
      <p className="mt-4 text-[10px] font-medium text-gray-500">Select a time — Thursday</p>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {slots.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSlot(s)}
            className={`rounded-lg border py-2 text-xs font-medium transition ${
              slot === s ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 hover:border-gray-300"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Your name" placeholder="Jane Smith" />
        <Field label="Mobile" placeholder="07xxx xxxxxx" />
      </div>
      <button
        type="button"
        onClick={() => slot && setBooked(true)}
        disabled={!slot}
        className="mt-4 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
      >
        {content?.featureButtonText ?? "Confirm booking"}
      </button>
    </div>
  );
}

function PortalWidget({ fixed, businessName }: { fixed: boolean; businessName: string }) {
  const [loggedIn, setLoggedIn] = useState(false);

  if (!fixed) {
    return (
      <div className="rounded-xl border-2 border-dashed border-amber-300 bg-gray-50 p-5">
        <p className="text-sm font-semibold text-gray-700">Client portal</p>
        <p className="mt-2 text-xs text-gray-500">Case updates are not available online.</p>
        <div className="mt-4 space-y-2 opacity-50">
          <Field label="Email" placeholder="you@email.com" disabled />
          <Field label="Password" placeholder="••••••••" disabled />
        </div>
        <p className="mt-3 text-center text-xs text-amber-700">Please call the office for case status</p>
      </div>
    );
  }

  if (loggedIn) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-medium text-gray-500">Welcome back</p>
        <p className="mt-1 text-sm font-semibold">Case #LD-2847 · {businessName}</p>
        <div className="mt-4 space-y-2">
          <div className="flex justify-between rounded-lg bg-green-50 px-3 py-2 text-xs">
            <span className="text-gray-600">Status</span>
            <span className="font-semibold text-green-700">Documents received</span>
          </div>
          <div className="flex justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs">
            <span className="text-gray-600">Last update</span>
            <span className="font-medium">Today, 10:42</span>
          </div>
          <div className="flex justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs">
            <span className="text-gray-600">Next step</span>
            <span className="font-medium">Review draft — 2 days</span>
          </div>
        </div>
        <button type="button" className="mt-4 w-full rounded-lg border border-gray-200 py-2 text-xs font-medium">
          Download case summary (PDF)
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold">Client portal</p>
      <p className="mt-1 text-xs text-gray-500">Secure access to your case files and updates</p>
      <div className="mt-4 space-y-3">
        <Field label="Email" placeholder="you@email.com" />
        <Field label="Password" placeholder="••••••••" />
      </div>
      <button
        type="button"
        onClick={() => setLoggedIn(true)}
        className="mt-4 w-full rounded-lg bg-slate-700 py-2.5 text-sm font-semibold text-white"
      >
        Sign in
      </button>
    </div>
  );
}

function PaymentsWidget({ fixed, content }: { fixed: boolean; content?: SiteContent }) {
  const [paid, setPaid] = useState(false);

  if (!fixed) {
    return (
      <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/40 p-5 text-center">
        <p className="text-sm font-semibold text-amber-900">Pay online</p>
        <p className="mt-2 text-xs text-amber-800">Card payments not accepted on this website.</p>
        <p className="mt-4 text-2xl opacity-30">💳</p>
        <p className="mt-2 text-sm text-gray-600">Cash or card in person only</p>
      </div>
    );
  }

  if (paid) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center">
        <p className="text-sm font-semibold text-green-900">Payment successful</p>
        <p className="mt-1 text-xs text-green-700">Receipt sent to your email</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{content?.featureTitle ?? "Pay securely"}</p>
        <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">Stripe</span>
      </div>
      <p className="mt-3 text-2xl font-bold">£45.00</p>
      <div className="mt-4 space-y-3">
        <Field label="Card number" placeholder="4242 4242 4242 4242" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Expiry" placeholder="MM/YY" />
          <Field label="CVC" placeholder="123" />
        </div>
      </div>
      <button
        type="button"
        onClick={() => setPaid(true)}
        className="mt-4 w-full rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white"
      >
        {content?.featureButtonText ?? "Pay now"}
      </button>
    </div>
  );
}

function ReviewsWidget({ fixed, businessName }: { fixed: boolean; businessName: string }) {
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  if (!fixed) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
        <p className="text-sm font-medium text-gray-500">Google Reviews</p>
        <div className="mt-2 flex gap-0.5 text-gray-300">
          {"★★★☆☆".split("").map((s, i) => (
            <span key={i} className="text-lg">{s}</span>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-400">3.2 average · 12 reviews</p>
        <p className="mt-4 text-xs text-amber-700">No way for happy customers to leave reviews online</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center">
        <p className="text-sm font-semibold text-green-900">Thank you for your review!</p>
        <p className="mt-1 text-xs text-green-700">Redirecting to Google…</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold">How was your visit at {businessName}?</p>
      <div className="mt-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className={`text-2xl ${n <= rating ? "text-yellow-400" : "text-gray-200"}`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        placeholder="Tell others about your experience…"
        className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs"
        rows={3}
      />
      <button
        type="button"
        onClick={() => rating > 0 && setSubmitted(true)}
        disabled={rating === 0}
        className="mt-3 w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white disabled:opacity-40"
      >
        Post to Google
      </button>
    </div>
  );
}

function DeliveryWidget({ fixed, businessName }: { fixed: boolean; businessName: string }) {
  const [ordered, setOrdered] = useState(false);

  if (!fixed) {
    return (
      <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/40 p-5">
        <p className="text-sm font-semibold text-amber-900">Order for delivery</p>
        <p className="mt-2 text-xs text-amber-800">Delivery not available — collection in store only.</p>
        <div className="mt-4 grid grid-cols-2 gap-2 opacity-40">
          {["Sourdough", "Croissant", "Cinnamon bun"].map((item) => (
            <div key={item} className="rounded-lg border border-gray-200 p-2 text-center text-xs">{item}</div>
          ))}
        </div>
      </div>
    );
  }

  if (ordered) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-5">
        <p className="text-sm font-semibold text-green-900">Order confirmed · £18.50</p>
        <p className="mt-1 text-xs text-green-700">Delivery today 4–6pm · tracking link sent</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold">Order from {businessName}</p>
      <div className="mt-3 space-y-2">
        {[
          { name: "Sourdough loaf", price: "£4.50" },
          { name: "Pain au chocolat", price: "£3.20" },
          { name: "Seasonal box", price: "£18.50" },
        ].map((item) => (
          <div key={item.name} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs">
            <span>{item.name}</span>
            <button type="button" className="rounded bg-white px-2 py-0.5 font-medium text-blue-600 border border-gray-200">
              + Add {item.price}
            </button>
          </div>
        ))}
      </div>
      <Field label="Delivery address" placeholder="12 High Street, Edinburgh" />
      <button type="button" onClick={() => setOrdered(true)} className="mt-4 w-full rounded-lg bg-amber-600 py-2.5 text-sm font-semibold text-white">
        Checkout · £18.50
      </button>
    </div>
  );
}

function LoyaltyWidget({ fixed }: { fixed: boolean }) {
  const [stamps, setStamps] = useState(0);

  if (!fixed) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-center opacity-70">
        <p className="text-sm text-gray-500">Loyalty programme</p>
        <p className="mt-2 text-xs text-gray-400">Paper stamp cards only — easy to lose</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold">Your digital stamp card</p>
      <div className="mt-3 flex justify-center gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setStamps(Math.min(8, stamps + 1))}
            className={`h-8 w-8 rounded-full border-2 text-xs ${
              i < stamps ? "border-amber-500 bg-amber-100 text-amber-700" : "border-gray-200 text-gray-300"
            }`}
          >
            {i < stamps ? "☕" : ""}
          </button>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-gray-500">
        {stamps >= 8 ? "Free drink unlocked! 🎉" : `${8 - stamps} stamps until free drink`}
      </p>
    </div>
  );
}

function ShopWidget({ fixed, businessName }: { fixed: boolean; businessName: string }) {
  if (!fixed) {
    return (
      <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/40 p-5">
        <p className="text-sm font-semibold text-amber-900">Shop online</p>
        <p className="mt-2 text-xs text-amber-800">No product catalogue — visit in person to browse.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold">{businessName} — Shop</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {[
          { title: "First Edition", price: "£24.99" },
          { title: "Local History", price: "£18.50" },
          { title: "Poetry Collection", price: "£12.00" },
          { title: "Children's Set", price: "£29.99" },
        ].map((p) => (
          <div key={p.title} className="rounded-lg border border-gray-100 overflow-hidden">
            <div className="aspect-[4/3] bg-gradient-to-br from-amber-100 to-orange-50" />
            <div className="p-2">
              <p className="text-[10px] font-medium truncate">{p.title}</p>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs font-bold">{p.price}</span>
                <button type="button" className="rounded bg-blue-600 px-2 py-0.5 text-[10px] text-white">Buy</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WebsiteRedesignWidget({
  fixed,
  businessName,
  content,
}: {
  fixed: boolean;
  businessName: string;
  content?: SiteContent;
}) {
  if (!fixed) {
    return (
      <div className="rounded-xl border border-gray-300 bg-[#f0f0f0] p-4 font-serif">
        <table className="w-full text-[10px] text-gray-600">
          <tbody>
            <tr>
              <td className="bg-[#003366] p-2 text-white" colSpan={2}>{businessName}</td>
            </tr>
            <tr>
              <td className="p-2 w-1/4 align-top bg-gray-200">Home<br />About<br />Contact</td>
              <td className="p-2">
                <span className="animate-pulse font-bold">Welcome!!!</span>
                <br />
                <span className="text-red-600">Best services in town since 1998</span>
                <br />
                <small>Site last updated 2014</small>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {["Emergency call-out", "Free quotes", "24/7 support"].map((s) => (
          <div key={s} className="rounded-lg bg-gray-50 p-3 text-center text-[10px] font-medium">{s}</div>
        ))}
      </div>
      <p className="text-sm leading-relaxed text-gray-600">{content?.heroSubtitle ?? "Professional services you can trust."}</p>
      <div className="rounded-xl bg-gray-50 p-4">
        <p className="text-xs font-semibold">Get a free quote</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <Field label="Name" placeholder="Your name" />
          <Field label="Postcode" placeholder="M1 1AA" />
        </div>
        <button type="button" className="mt-3 w-full rounded-lg bg-blue-600 py-2 text-xs font-semibold text-white">
          {content?.ctaText ?? "Request callback"}
        </button>
      </div>
    </div>
  );
}

function ContactWidget({
  fixed,
  businessName,
  content,
}: {
  fixed: boolean;
  businessName: string;
  content?: SiteContent;
}) {
  const [sent, setSent] = useState(false);

  if (!fixed) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-5 text-center">
        <p className="text-sm text-gray-500">Contact form not connected</p>
        <p className="mt-2 text-xs text-gray-400">Email info@{businessName.toLowerCase().replace(/\s/g, "")}.co.uk</p>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center text-sm text-green-800">
        Message sent — we&apos;ll reply within 2 hours
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold">{content?.featureTitle ?? "Get in touch"}</p>
      <div className="mt-3 space-y-2">
        <Field label="Name" placeholder="Your name" />
        <Field label="Email" placeholder="you@email.com" />
        <label className="block">
          <span className="text-[10px] font-medium text-gray-500">Message</span>
          <textarea className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs" rows={3} placeholder="How can we help?" />
        </label>
      </div>
      <button type="button" onClick={() => setSent(true)} className="mt-3 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white">
        {content?.featureButtonText ?? "Send message"}
      </button>
    </div>
  );
}

import React from 'react';
import { motion } from 'motion/react';
import { Phone, Mail, MapPin, Send, MessageSquare } from 'lucide-react';

export default function Contact() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Thank you for contacting us! We will get back to you shortly.');
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold text-neutral-900 sm:text-6xl"
          >
            Get in <span className="text-orange-600">Touch</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600"
          >
            Have questions about a property or our services? Our team is here to help you 24/7.
          </motion.p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          {/* Contact Information */}
          <div className="space-y-8">
            <div className="grid gap-6">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="flex items-start gap-5 rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-900">Call Us</h3>
                  <p className="mt-1 text-neutral-600">+91 7017460028</p>
                  <p className="text-sm text-neutral-500">Mon-Sun, 9am to 9pm</p>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="flex items-start gap-5 rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-900">Email Us</h3>
                  <p className="mt-1 text-neutral-600">Roomzy@gmail.com</p>
                  <p className="text-sm text-neutral-500">Expect a response within 2 hours</p>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="flex items-start gap-5 rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-green-600">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-900">Visit Us</h3>
                  <p className="mt-1 text-neutral-600">Greater Noida, Uttar Pradesh, India</p>
                  <p className="text-sm text-neutral-500">Corporate Office</p>
                </div>
              </motion.div>
            </div>

            <div className="rounded-3xl bg-neutral-900 p-8 text-white">
              <h3 className="flex items-center gap-2 text-xl font-bold">
                <MessageSquare className="h-6 w-6 text-orange-500" />
                Chat Support
              </h3>
              <p className="mt-4 text-neutral-400">
                Prefer messaging? Our AI assistant and support staff are available on WhatsApp and our in-app chat for instant help.
              </p>
              <button className="mt-6 rounded-xl bg-orange-600 px-6 py-3 font-bold transition-all hover:bg-orange-700">
                Start Live Chat
              </button>
            </div>
          </div>

          {/* Contact Form */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-3xl border border-neutral-100 bg-white p-8 shadow-sm lg:p-12"
          >
            <h2 className="text-2xl font-bold text-neutral-900">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">First Name</label>
                  <input required type="text" className="w-full rounded-xl border border-neutral-200 p-4 outline-none focus:border-orange-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">Last Name</label>
                  <input required type="text" className="w-full rounded-xl border border-neutral-200 p-4 outline-none focus:border-orange-500" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">Email Address</label>
                <input required type="email" className="w-full rounded-xl border border-neutral-200 p-4 outline-none focus:border-orange-500" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">Subject</label>
                <select className="w-full rounded-xl border border-neutral-200 p-4 outline-none focus:border-orange-500">
                  <option>General Inquiry</option>
                  <option>Property Listing</option>
                  <option>Booking Issue</option>
                  <option>Feedback</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-700">Message</label>
                <textarea required rows={4} className="w-full rounded-xl border border-neutral-200 p-4 outline-none focus:border-orange-500"></textarea>
              </div>
              <button 
                type="submit" 
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 py-4 font-bold text-white transition-all hover:bg-orange-700 shadow-lg shadow-orange-200"
              >
                <Send className="h-5 w-5" />
                Send Message
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

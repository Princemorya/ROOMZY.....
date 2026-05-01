import React from 'react';
import { motion } from 'motion/react';
import { Info, Target, Users, Shield } from 'lucide-react';

export default function About() {
  const stats = [
    { label: 'Properties', value: '10,000+' },
    { label: 'Happy Tenants', value: '50,000+' },
    { label: 'Cities', value: '50+' },
    { label: 'Trust Rating', value: '4.9/5' },
  ];

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold text-neutral-900 sm:text-6xl"
          >
            Redefining Your <span className="text-orange-600">Living Experience</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600"
          >
            Roomzy is India's leading managed home rental platform, providing a seamless and transparent living experience for students and professionals.
          </motion.p>
        </div>

        {/* Stats Section */}
        <div className="mt-16 grid grid-cols-2 gap-8 rounded-3xl bg-neutral-900 p-8 sm:grid-cols-4 sm:p-12">
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center">
              <p className="text-3xl font-bold text-white">{stat.value}</p>
              <p className="mt-2 text-sm text-neutral-400">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Mission & Vision */}
        <div className="mt-24 grid gap-16 lg:grid-cols-2">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
              <Target className="h-6 w-6" />
            </div>
            <h2 className="text-3xl font-bold text-neutral-900">Our Mission</h2>
            <p className="text-neutral-600">
              Our mission is to simplify the rental process through technology and trust. We believe that finding a home should be as easy as ordering a meal, and living in one should be completely stress-free.
            </p>
            <ul className="space-y-4">
              {[
                'Transparent pricing with no hidden costs',
                'Verified properties and background-checked owners',
                'End-to-end management for ultimate convenience',
                'Community-focused living environments'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-neutral-700">
                  <Shield className="h-5 w-5 text-green-500" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-orange-50 p-8 lg:p-12"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-orange-600 shadow-sm">
              <Users className="h-6 w-6" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-neutral-900">Our Culture</h2>
            <p className="mt-4 text-neutral-600">
              At Roomzy, we foster a culture of innovation, empathy, and integrity. Our team is dedicated to building solutions that make a real difference in people's lives every single day.
            </p>
            <div className="mt-8 flex gap-4">
              <div className="h-40 w-1/2 rounded-2xl bg-orange-200">
                <img 
                  src="https://c8.alamy.com/comp/K35531/happy-team-group-people-K35531.jpg"
                  className="h-full w-full rounded-2xl object-cover" 
                  alt="Team" 
                />
              </div>
              <div className="h-40 w-1/2 rounded-2xl bg-orange-300">
                <img 
                  src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&q=80&w=600" 
                  className="h-full w-full rounded-2xl object-cover" 
                  alt="Office" 
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IoShieldCheckmarkSharp } from "react-icons/io5";

const countries = [
  "United States",
  "Malaysia",
  "United Kingdom",
  "India",
  "Australia",
  "Chile",
  "South Korea",
  "Italy",
  "France",
  "Germany",
  "Canada",
  "Netherlands",
  "Japan",
  "Singapore",
  "Philippines",
  "Brazil",
  "Mexico",
  "Argentina",
  "New Zealand",
  "Indonesia",
  "Thailand",
  "Vietnam",
  "Hong Kong",
  "Taiwan",
  "South Africa",
  "Qatar",
  "Slovakia",
  "Macedonia",
  "Romania",
  "Estonia",
];

const getRandomCountry = () => {
  const index = Math.floor(Math.random() * countries.length);
  return countries[index];
};

const getRandomHoursAgo = () => Math.floor(Math.random() * 22) + 3;

export const SalesNotifications = () => {
  const [country, setCountry] = useState(getRandomCountry);
  const [hoursAgo, setHoursAgo] = useState(getRandomHoursAgo);
  const [isVisible, setVisible] = useState(false);

  useEffect(() => {
    const countryInterval = setInterval(() => {
      setCountry(getRandomCountry());
      setHoursAgo(getRandomHoursAgo());
    }, 10000);

    const visibilityInterval = setInterval(() => {
      setVisible((prev) => !prev);
    }, 5000);

    return () => {
      clearInterval(countryInterval);
      clearInterval(visibilityInterval);
    };
  }, []);

  return (
    <div className="fixed left-4 bottom-4 z-50">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, x: -200 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -200 }}
            className="p-4 bg-white border border-gray-200 shadow-md rounded-lg flex flex-col gap-1"
          >
            <p className="text-sm text-brand-600">
              Someone in <b>{country}</b> purchased
            </p>
            <div className="flex items-center text-xs text-gray-500">
              <span>{hoursAgo} hours ago</span>
              <span className="mx-1">•</span>
              <div className="flex items-center gap-1 text-brand-600">
                <IoShieldCheckmarkSharp />
                <span>Verified</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

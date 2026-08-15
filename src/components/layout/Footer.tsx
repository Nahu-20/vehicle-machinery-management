import React from 'react';
import { FarmerSupportBanner } from './footer/FarmerSupportBanner';
import { FooterBrand } from './footer/FooterBrand';
import { FooterContact } from './footer/FooterContact';
import { FooterSocial } from './footer/FooterSocial';
import { FooterNewsletter } from './footer/FooterNewsletter';
import { FooterLegal } from './footer/FooterLegal';
import {
  WheatLeftIllustration,
  WheatRightIllustration,
  RollingHillsLandscape,
  FloatingGrainsScattered,
} from './footer/WheatArtwork';

export const Footer: React.FC = () => {
  return (
    <footer
      id="main-site-footer"
      className="bg-[#F8FAF7] dark:bg-[#081710] py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8 border-t border-[#E8EFE5] dark:border-[#142C20] transition-colors duration-200"
    >
      <div className="max-w-[1380px] mx-auto">
        {/* Section 1: Farmer Assistance & Hotline CTA Banner */}
        <FarmerSupportBanner />

        {/* Section 2: Main Bureau Footer Card */}
        <div
          id="bureau-main-footer-card"
          className="relative overflow-hidden rounded-[28px] sm:rounded-[36px] bg-white dark:bg-[#0E241A] border border-[#E5EFE2] dark:border-[#1C3E2D] shadow-[0_15px_45px_rgba(0,0,0,0.04)] dark:shadow-[0_15px_45px_rgba(0,0,0,0.35)] transition-colors duration-200"
        >
          {/* Subtle rolling hills cultivation landscape background */}
          <div className="absolute inset-x-0 bottom-0 pointer-events-none opacity-35 dark:opacity-10 overflow-hidden">
            <RollingHillsLandscape className="w-full h-24 sm:h-36" />
          </div>

          {/* Floating grain kernels */}
          <FloatingGrainsScattered className="opacity-25 dark:opacity-10" />

          {/* Decorative Wheat Stalks Bottom Left Corner */}
          <div className="absolute -left-8 sm:-left-4 -bottom-8 sm:-bottom-4 pointer-events-none z-0 opacity-75 dark:opacity-30 hidden xs:block sm:block">
            <WheatLeftIllustration className="w-32 sm:w-44 md:w-56 h-auto" />
          </div>

          {/* Decorative Wheat Stalks Bottom Right Corner */}
          <div className="absolute -right-8 sm:-right-4 -bottom-8 sm:-bottom-4 pointer-events-none z-0 opacity-75 dark:opacity-30 hidden sm:block">
            <WheatRightIllustration className="w-40 sm:w-52 md:w-68 h-auto" />
          </div>

          {/* Content Wrapper */}
          <div className="relative z-10 p-6 sm:p-10 md:p-12 lg:p-14 space-y-8 sm:space-y-10">
            {/* Top Row: 2-Column Spacious Layout (Identity & Contact) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* Column 1: Bureau Identity & Mission Statement */}
              <div className="lg:col-span-7">
                <FooterBrand />
              </div>

              {/* Column 2: Contact Information & Helpline */}
              <div className="lg:col-span-5">
                <FooterContact />
              </div>
            </div>

            {/* Middle Divider */}
            <div className="border-b border-[#E8EFE5] dark:border-[#1E3E2E]" />

            {/* Middle Row: Social Media + Newsletter Subscription */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* Social Channels */}
              <div className="md:col-span-5 lg:col-span-4">
                <FooterSocial />
              </div>

              {/* Newsletter Subscription */}
              <div className="md:col-span-7 lg:col-span-8">
                <FooterNewsletter />
              </div>
            </div>

            {/* Bottom Divider */}
            <div className="border-b border-[#E8EFE5] dark:border-[#1E3E2E]" />

            {/* Bottom Row: Legal Links, Copyright, and Language Selector */}
            <FooterLegal />
          </div>
        </div>
      </div>
    </footer>
  );
};
